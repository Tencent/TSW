/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


process.on('uncaughtException', function(e) {
    logger.error(e && e.stack);
});


const logger = require('logger');
const lang = require('i18n/lang.js');
const http = require('http');
const https = require('https');
const util = require('util');
const fs = require('fs');
const cp = require('child_process');
const parseGet = require('util/http/parseGet.js');
const tnm2 = require('api/tnm2');
const cpuUtil = require('util/cpu.js');
const isProbe = require('util/isProbe.js');
const TEReport = require('util/auto-report/TEReport.js');
const mail = require('util/mail/mail.js');
const websocket = require('./websocket.js');
const packageJSON = require('../../package.json');
const headerServer = `TSW/${packageJSON.version}`;
const methodMap = {};
const { isWin32Like } = require('util/isWindows.js');
const serverInfo = {
    intranetIp: require('serverInfo.js').intranetIp,
    cpu: 'X'
};

process.serverInfo = serverInfo;

let config = require('./config.js');
let routeCache = null;
let cleanCacheTid = null;
let isStartHeartBeat = false;
let heartBeatCount = 0;
let serverHttps;
const server = http.createServer(requestHandler);
const serverThis = http.createServer(requestHandler);

server.timeout = Math.max(config.timeout.upload || config.timeout.socket, 0);
serverThis.timeout = Math.max(config.timeout.upload || config.timeout.socket, 0);
server.keepAliveTimeout = Math.max(config.timeout.keepAlive, 0);
serverThis.keepAliveTimeout = Math.max(config.timeout.keepAlive, 0);

if (config.httpsOptions) {
    serverHttps = https.createServer(config.httpsOptions, function(req, res) {
        req.headers['x-client-proto'] = 'https';
        requestHandler(req, res);
    });

    serverHttps.on('clientError', function(err, socket) {   // eslint-disable-line handle-callback-err
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    serverHttps.timeout = Math.max(config.timeout.upload || config.timeout.socket, 0);
    serverHttps.keepAliveTimeout = Math.max(config.timeout.keepAlive, 0);
}

global.TSW_HTTP_SERVER = server;
global.TSW_HTTPS_SERVER = serverHttps;

logger.info('pid:${pid} createServer ok', {
    pid: process.pid
});

// start RPC server
require('webapp/Server.js').startServer();

// 分发父进程发送来的消息
process.on('message', function(message) {
    if (!message) {
        return;
    }
    if (!message.cmd) {
        return;
    }
    if (!methodMap[message.cmd]) {
        return;
    }

    logger.info(`receive message, cmd: ${message.cmd}`);
    methodMap[message.cmd](message);
});

// restart
methodMap.restart = function() {
    process.emit('restart');
};

// reload
methodMap.reload = function() {
    process.emit('reload');
};

// heapdump
methodMap.heapdump = function(message) {
    process.emit('heapdump', message.GET);
};

// profiler
methodMap.profiler = function(message) {
    process.emit('profiler', message.GET);
};

// globaldump
methodMap.globaldump = function(message) {
    process.emit('globaldump', message.GET);
};

// top100
methodMap.top100 = function(message) {
    process.emit('top100', message.GET);
};

// 监听端口
methodMap.listen = function(message) {
    listen(message.cpu || 0);
};

process.on('top100', function(e) {
    global.top100 = [];
});


process.on('heapdump', function(e) {
    if (isWin32Like) {
        return;
    }

    require('heapdump').writeSnapshot(__dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.heapsnapshot', function(err, filename) {
        if (err) {
            logger.error(`dump heap error ${err.message}`);
            return;
        }
        logger.info('dump written to ${filename}', {
            filename: filename
        });
    });
});


process.on('profiler', function(data = {}) {
    logger.info('profiler time: ${time}', data);
    if (isWin32Like) {
        return;
    }

    require('util/v8-profiler.js').writeProfilerOpt(__dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.cpuprofile', {
        recordTime: data.time || 5000
    }, function(filename) {
        logger.info('dump written to ${filename}', {
            filename: filename
        });
    });
});

process.on('globaldump', function(GET) {
    const cpu = parseInt(GET.cpu, 10) || 0;
    const depth = GET.depth || 6;
    if (cpu !== serverInfo.cpu) {
        return;
    }

    const filename = __dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.globaldump';
    logger.info('globaldump');
    logger.info(GET);
    logger.info(filename);
    const str = util.inspect(global, {
        depth: depth
    });

    fs.writeFile(filename, str, 'UTF-8', function() {
        logger.info('globaldump finish');
    });
});

function empty() {}

function requestHandler(req, res) {
    if (server.keepAliveTimeout > 0) {
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', `timeout=${parseInt(server.keepAliveTimeout / 1000, 10)}`);
    } else {
        res.setHeader('Connection', 'close');
    }
    res.setHeader('X-Powered-By', 'TSW/Node.js');
    res.setHeader('Server', headerServer);
    res.setHeader('Cache-Control', 'no-cache');

    if (config.devMode) {
        // 发者模式清除缓存
        cleanCache();
    }
    res.flush = res.flush || empty;
    parseGet(req);  // 解析get参数
    doRoute(req, res); // HTTP路由
}


function doRoute(req, res) {
    if (routeCache === null) {
        routeCache = require('./http.route.js');
        config = require('./config.js');
    }

    if (isProbe.isProbe(req)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end();
        return;
    }

    routeCache(req, res);
}

// 清除缓存
function cleanCache() {
    clearTimeout(cleanCacheTid);
    cleanCacheTid = setTimeout(function() {
        require('util/cache.cleaner.js').clear('/');
        routeCache = null;
    }, 5000);
}

function listen(cpu) {
    const wokerUid = config.workerUid || 'user_00';
    serverInfo.cpu = cpu || 0;
    global.cpuUsed = cpuUtil.getCpuUsed(serverInfo.cpu);

    process.title = 'TSW/worker/' + serverInfo.cpu;
    global.TSW_HTTP_WORKER_PORT = config.workerPortBase + serverInfo.cpu;

    logger.info('cpu: ${cpu}, beforeStartup...', serverInfo);

    if (typeof config.beforeStartup === 'function') {
        config.beforeStartup(serverInfo.cpu);
    }

    logger.info('cpu: ${cpu}, listen...', serverInfo);

    // 直接根据配置启动，无需拿到_handle
    server.listen({
        host: config.httpAddress,
        port: config.httpPort,
        exclusive: false
    }, function(err) {
        if (err) {
            logger.info('cpu: ${cpu}, listen http error ${address}:${port}', {
                cpu: serverInfo.cpu,
                address: config.httpAddress,
                port: config.httpPort
            });

            return;
        }

        logger.info('cpu: ${cpu}, listen http ok ${address}:${port}', {
            cpu: serverInfo.cpu,
            address: config.httpAddress,
            port: config.httpPort
        });

        const finish = function() {

            logger.info('start heartbeat');

            startHeartBeat();

            if (!isWin32Like) {
                try {
                    process.setuid(wokerUid);
                } catch (err) {
                    logger.error(`switch to uid: ${wokerUid} fail!`);
                    logger.error(err.stack);
                }

                logger.info('switch to uid: ${uid}', {
                    uid: wokerUid
                });
            }

            websocket.start_listen();

            logger.info('cpu: ${cpu}, afterStartup...', serverInfo);

            if (typeof config.afterStartup === 'function') {
                logger.info('cpu: ${cpu}, config.afterStartup fired', serverInfo);
                config.afterStartup(serverInfo.cpu);
            }
        };

        // 监听私有端口
        serverThis.listen({
            host: config.httpAddress,
            port: global.TSW_HTTP_WORKER_PORT,
            exclusive: false
        }, function(err) {
            if (err) {
                logger.info('cpu: ${cpu}, listen http error ${address}:${port}', {
                    cpu: serverInfo.cpu,
                    address: config.httpAddress,
                    port: global.TSW_HTTP_WORKER_PORT
                });

                return;
            }

            logger.info('cpu: ${cpu}, listen http ok ${address}:${port}', {
                cpu: serverInfo.cpu,
                address: config.httpAddress,
                port: global.TSW_HTTP_WORKER_PORT
            });


            if (serverHttps) {

                // 启动https
                serverHttps.listen(config.httpsPort, config.httpsAddress, function(err) {
                    if (err) {
                        logger.info('cpu: ${cpu}, listen https error ${address}:${port}', {
                            cpu: serverInfo.cpu,
                            address: config.httpsPort,
                            port: config.httpsAddress
                        });

                        return;
                    }

                    logger.info('cpu: ${cpu}, listen https ok ${address}:${port}', {
                        cpu: serverInfo.cpu,
                        address: config.httpsAddress,
                        port: config.httpsPort
                    });

                    finish();
                });
            } else {
                finish();
            }
        });

    });
}

function startHeartBeat() {
    if (isStartHeartBeat) {
        return;
    }
    isStartHeartBeat = true;
    global.cpuUsed = 0;

    // 定时给父进程发送心跳包
    setInterval(heartBeat, 5000);
}

function heartBeat() {
    heartBeatCount += 1;
    process.connected && process.send && process.send({
        cmd: 'heartBeat',
        memoryUsage: process.memoryUsage()
    });

    if (serverInfo.cpu === 0) {
        // 测试环境1分钟上报一次
        if (heartBeatCount % 12 === 0) {
            TEReport.report();
        }
    }

    global.cpuUsed = cpuUtil.getCpuUsed(serverInfo.cpu);

    if (global.cpuUsed >= 80) {
        global.cpuUsed80 = ~~global.cpuUsed80 + 1;
    } else {
        global.cpuUsed80 = 0;
    }

    // 高负载告警
    if (global.cpuUsed80 === 4 && !config.isTest && !isWin32Like) {
        afterCpu80(global.cpuUsed);
    }

    const currMemory = process.memoryUsage();

    tnm2.Attr_API_Set('AVG_TSW_MEMORY_RSS', currMemory.rss);
    tnm2.Attr_API_Set('AVG_TSW_MEMORY_HEAP', currMemory.heapTotal);
    tnm2.Attr_API_Set('AVG_TSW_MEMORY_EXTERNAL', currMemory.external);
}


function afterCpu80(cpuUsed) {
    // 取进程快照
    cp.exec('top -bcn1', {
        env: {
            COLUMNS: 200
        },
        encoding: 'utf8',
        timeout: 5000
    }, function(err, data, errData) {   // eslint-disable-line handle-callback-err
        const key = `cpu80.v4:${serverInfo.intranetIp}`;
        let content = `<strong>${lang.__('mail.singleCoreCpu')}${serverInfo.cpu}，${lang.__('mail.CPUUsageRate')}：${cpuUsed}，${lang.__('mail.UsageRateGreaterThan80')}，${lang.__('mail.fiveSecondsCpuProfiler')}</strong>`;
        let str = '';

        if (data) {
            str = data;
            str = str.replace(/</g, '&gt;');
            str = str.replace(/\r\n|\r|\n/g, '<br>');

            content += `<p><strong>${lang.__('mail.processSnapshot')}：</strong></p><pre style="font-size:12px">${str}</pre>`;
        }


        // 获取本机信息，用来分组
        require('api/cmdb').GetDeviceThisServer().done(function(data) {
            data = data || {};
            const business = data.business && data.business[0] || {};
            const profCallback = (result) => {
                mail.SendMail(key, 'js', 600, {
                    'to': config.mailTo,
                    'cc': config.mailCC,
                    'runtimeType': 'CPU',
                    'msgInfo': `${business.module}[CPU]${serverInfo.intranetIp}${lang.__('mail.singleCoreCpu')}${serverInfo.cpu}，${lang.__('mail.CPUUsageRate')}：${cpuUsed}，${lang.__('mail.UsageRateGreaterThan80%')}`,
                    'title': `${business.module}[CPU]${serverInfo.intranetIp}${lang.__('mail.singleCoreCpu')}${serverInfo.cpu}，${lang.__('mail.CPUUsageRate')}：${cpuUsed}，${lang.__('mail.UsageRateGreaterThan80%')}`,
                    'content': content,
                    'attachment': result ? {
                        fileType: true,
                        dispositionType: 'attachment',
                        fileName: 'cpu-profiler.cpuprofile',
                        content: result
                    } : ''
                });
            };

            // 再抓一份CPU Profiler
            let profiler;
            try {
                profiler = require('util/v8-profiler.js');
            } catch (err) {
                logger.info(err.stack);
            }

            if (profiler) {
                profiler.getProfiler({ recordTime: 5000 }, profCallback);
            } else {
                profCallback();
            }
        });
    });
}
