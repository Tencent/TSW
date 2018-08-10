/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const logger = require('logger');
const lang = require('i18n/lang.js');
const config = require('./config.js');
const cluster = require('cluster');
const cpuUtil = require('util/cpu.js');
const fs = require('fs');
const serverOS = require('util/isWindows.js');
const mail = require('util/mail/mail.js');
const { debugOptions } = process.binding('config');
const methodMap = {};
const workerMap = {};
const cpuMap = [];
const tnm2 = require('api/tnm2');
const network = require('util/network.js');
const serverInfo = require('serverInfo.js');

process.on('uncaughtException', function(e) {

    if (/\blisten EACCES\b/.test(e.message) && config.httpPort < 1024 && (serverOS.isOSX || serverOS.isLinux)) {
        logger.error('This is OSX/Linux, you may need to use "sudo" prefix to start server.\n');
    }

    logger.error(e && e.stack);
});


process.on('warning', function(warning) {
    const key = String(warning);
    const errStr = warning && warning.stack || String(warning);
    const content = `<p><strong>stack</strong></p><p><pre><code>${errStr}</code></pre></p>`;

    if (warning.message && warning.message.indexOf('N-API') > -1) {
        logger.warn(warning.message);
        return;
    }

    if (warning.message && warning.message.indexOf('http2') > -1) {
        logger.warn(warning.message);
        return;
    }

    logger.warn(errStr);

    setImmediate(function() {
        require('util/mail/mail.js').SendMail(key, 'js', 600, {
            'title': key,
            'content': content
        });
    });
});


process.on('unhandledRejection', (errorOrReason, currPromise) => {
    const errStr = String(errorOrReason && errorOrReason.stack || JSON.stringify(errorOrReason));
    const key = String(errorOrReason && errorOrReason.message);
    const content = `<p><strong>${lang.__('mail.errorStack')}</strong></p><p><pre><code>${errStr}</code></pre></p>`;

    // 恢复上下文
    if (currPromise && currPromise.domain) {
        currPromise.domain.run(function() {
            logger.error(`unhandledRejection reason: ${errStr}`);
            setImmediate(function() {
                require('util/mail/mail.js').SendMail(key, 'js', 600, {
                    'title': key,
                    'runtimeType': 'unhandledRejection',
                    'content': content
                });
            });
        });
    } else {
        logger.error(`unhandledRejection reason: ${errStr}`);
    }
});


startServer();


// 通过cluster启动master && worker
function startServer() {

    let useWorker = true;

    if (debugOptions.inspectorEnabled) {
        useWorker = false;
    }

    // windows下需要使用RR
    cluster.schedulingPolicy = cluster.SCHED_RR;

    if (cluster.isMaster && useWorker) {

        global.cpuUsed = cpuUtil.getCpuUsed();
        setInterval(function() {
            global.cpuUsed = cpuUtil.getCpuUsed();
        }, 3000);

        logger.info('start master....');
        logger.info('version node: ${node}, modules: ${modules}', process.versions);

        if (serverOS.isLinux) {
            // 当前目录777，为heapsnapshot文件创建提供权限
            fs.chmodSync(__dirname, 0x1ff);  // 0777
        }

        // 根据cpu数来初始化并启动子进程
        if (config.runAtThisCpu === 'auto') {
            cpuUtil.cpus().forEach(function(v, i) {
                cpuMap.push(0);
                cluster.fork(process.env).cpuid = i;
            });
        } else {
            config.runAtThisCpu.forEach(function(v, i) {
                cpuMap.push(0);
                cluster.fork(process.env).cpuid = v;
            });
        }

        masterEventHandler();
        checkWorkerAlive();
        startAdmin();

        Object.defineProperty(process, 'title', Object.assign(Object.create(null), {
            value: 'TSW',
            enumerable: true,
            writable: false,
            configurable: false
        }));
    } else {

        process.title = 'TSW/worker/node';
        logger.info('start worker....');
        require('./http.proxy.js');
        require('runtime/jank.watcher.js');

        // 30分钟后开始算
        !config.isTest && !config.devMode &&
        setTimeout(function() {
            require('runtime/md5.checker.js').check();
        }, 30 * 60000);

        if (cluster.isMaster && debugOptions.inspectorEnabled) {
            logger.setLogLevel('debug');
            logger.info('inspectorEnabled, start listening');
            process.emit('message', {
                cmd: 'listen', cpu: 0
            });
        }
    }
}


// 处理子进程的心跳消息
methodMap.heartBeat = function(m) {

    const worker = this;
    const now = new Date().getTime();

    worker.lastMessage = m;
    worker.lastLiveTime = now;
};

// 关闭一个worker
function closeWorker(worker) {
    const cpu = worker.cpuid;
    let closeTimeWait = 10000;

    closeTimeWait = Math.max(closeTimeWait, config.timeout.socket);
    closeTimeWait = Math.max(closeTimeWait, config.timeout.post);
    closeTimeWait = Math.max(closeTimeWait, config.timeout.get);
    closeTimeWait = Math.max(closeTimeWait, config.timeout.keepAlive);
    closeTimeWait = Math.min(60000, closeTimeWait) || 10000;

    if (worker.isClosing) {
        return;
    }

    worker.isClosing = true;

    if (workerMap[cpu] === worker) {
        delete workerMap[cpu];
    }

    const closeFn = (function(worker) {
        let closed = false;
        const pid = worker.process.pid;

        return function() {
            if (closed) {
                return;
            }
            try {
                process.kill(pid, 9);
            } catch (e) {
                logger.info(`kill worker message: ${e.message}`);
            }

            closed = true;
            worker.destroy();
        };
    })(worker);

    setTimeout(closeFn, closeTimeWait);

    try {
        worker.disconnect(closeFn);
    } catch (e) {
        logger.info(e.stack);
    }
}

// 重启worker
function restartWorker(worker) {
    if (worker.hasRestart) {
        return;
    }

    worker.hasRestart = true;
    const cpu = getToBindCpu(worker);

    cpuMap[cpu] = 0;

    logger.info('worker${cpu} pid=${pid} closed. restart new worker again.', {
        pid: worker.process.pid,
        cpu: cpu
    });

    cluster.fork(process.env).cpuid = cpu;

    closeWorker(worker);
}

// 定时检测子进程存活，15秒未响应的采取措施
function checkWorkerAlive() {
    const checkWorkerAliveTimeout = 5000;
    let checkWorkerAliveCount = 0;

    setInterval(function() {
        checkWorkerAliveCount += 1;
        const nowDate = new Date();
        const now = nowDate.getTime();

        let key;
        for (key in workerMap) {
            const worker = workerMap[key];
            const cpuid = worker.cpuid;

            worker.lastLiveTime = worker.lastLiveTime || now;
            if (!worker.startTime) {
                worker.startTime = now;
            }

            // 无响应进程处理
            if (now - worker.lastLiveTime > checkWorkerAliveTimeout * 3 && cpuMap[cpuid] === 1) {

                logger.error('worker${cpu} pid=${pid} miss heartBeat, kill it', {
                    pid: worker.process.pid,
                    cpu: cpuid
                });

                restartWorker(worker);
                continue;
            }

            // 内存超限进程处理
            if (worker.lastMessage) {
                const currMemory = worker.lastMessage.memoryUsage;
                const key = `memoryLimit.v1:${serverInfo.intranetIp}`;

                if (currMemory && currMemory.rss > config.memoryLimit) {
                    logger.error('worker${cpu} pid=${pid} memoryUsage ${memoryUsage}, hit memoryLimit: ${memoryLimit}, kill it', {
                        memoryUsage: currMemory.rss,
                        memoryLimit: config.memoryLimit,
                        pid: worker.process.pid,
                        cpu: cpuid
                    });

                    logger.error(worker.lastMessage);

                    mail.SendMail(key, 'js', 600, {
                        'to': config.mailTo,
                        'cc': config.mailCC,
                        'runtimeType': 'Memory',
                        'msgInfo': `${serverInfo.intranetIp} ${lang.__('mail.memoryExceedingTips')}`,
                        'title': `${serverInfo.intranetIp} ${lang.__('mail.memoryExceedingWaring')}`,
                        'content': `<p><strong>${serverInfo.intranetIp} ${lang.__('mail.memoryExceedingTips')}</strong></p>`
                    });

                    restartWorker(worker);
                }
            }
        }

        if (
            true
            && (nowDate.getHours() % 8 === 0)
            && nowDate.getMinutes() === 1
            && nowDate.getSeconds() <= 10
        ) {
            // 8小时一次
            require('api/keyman/runtimeAdd.js').hello();
        }

        // after 1 minute
        if (checkWorkerAliveCount % 12 === 0) {
            const info = network.getNetInfo();

            // network report
            tnm2.Attr_API('SUM_TSW_NET_EXTERNAL_RXBIT', info.external.receive.bytes);
            tnm2.Attr_API('SUM_TSW_NET_EXTERNAL_RXPCK', info.external.receive.packets);
            tnm2.Attr_API('SUM_TSW_NET_EXTERNAL_TXBIT', info.external.transmit.bytes);
            tnm2.Attr_API('SUM_TSW_NET_EXTERNAL_TXPCK', info.external.transmit.packets);
            tnm2.Attr_API('SUM_TSW_NET_INTERNAL_RXBIT', info.internal.receive.bytes);
            tnm2.Attr_API('SUM_TSW_NET_INTERNAL_RXPCK', info.internal.receive.packets);
            tnm2.Attr_API('SUM_TSW_NET_INTERNAL_TXBIT', info.internal.transmit.bytes);
            tnm2.Attr_API('SUM_TSW_NET_INTERNAL_TXPCK', info.internal.transmit.packets);
            tnm2.Attr_API('SUM_TSW_NET_LOCAL_RXBIT', info.local.receive.bytes);
            tnm2.Attr_API('SUM_TSW_NET_LOCAL_RXPCK', info.local.receive.packets);
            tnm2.Attr_API('SUM_TSW_NET_LOCAL_TXBIT', info.local.transmit.bytes);
            tnm2.Attr_API('SUM_TSW_NET_LOCAL_TXPCK', info.local.transmit.packets);

            // cpu load report
            cpuUtil.getCpuLoadAsync().then(function(data) {
                if (!data) {
                    return;
                }

                tnm2.Attr_API_Set('AVG_TSW_CPU_LOAD_1', data.L1);
                tnm2.Attr_API_Set('AVG_TSW_CPU_LOAD_5', data.L5);
                tnm2.Attr_API_Set('AVG_TSW_CPU_LOAD_15', data.L15);
            });
        }

        tnm2.Attr_API_Set('AVG_TSW_CPU_USED', global.cpuUsed);
    }, checkWorkerAliveTimeout);
}

// 获取需要绑定的CPU编号
function getToBindCpu(worker) {
    if (typeof worker.cpuid !== 'undefined') {
        return worker.cpuid;
    }

    for (const cpu of cpuMap) {
        if (cpuMap[cpu] === 0) {
            worker.cpuid = cpu;
            cpuMap[cpu] = 1;
            return cpu;
        }
    }
}


function startAdmin() {
    // 启动管理进程
    require('./admin.js').start();

    // log管理
    require('api/logman').start({
        delay: 'H' // 按小时归类log
    });
}


function masterEventHandler() {

    if (!cluster.isMaster) {
        return;
    }

    // 监听子进程是否fork成功
    cluster.on('fork', function(currWorker) {

        const cpu = getToBindCpu(currWorker);

        logger.info('worker fork success! pid:${pid} cpu: ${cpu}', {
            pid: currWorker.process.pid,
            cpu: cpu
        });

        tnm2.Attr_API('SUM_TSW_WORKER_FORK', 1);

        // 绑定cpu
        cpuUtil.taskset(cpu, currWorker.process.pid);

        if (workerMap[cpu]) {
            closeWorker(workerMap[cpu]);
        }

        workerMap[cpu] = currWorker;
        cpuMap[cpu] = 1;

        // 监听子进程发来的消息并处理
        currWorker.on('message', function(...args) {
            const m = args[0];
            if (m && methodMap[m.cmd]) {
                methodMap[m.cmd].apply(this, args);
            }
        });

        // 给子进程发送消息，启动http服务
        currWorker.send({
            from: 'master',
            cmd: 'listen',
            cpu: cpu
        });

    });

    // 子进程退出时做下处理
    cluster.on('disconnect', function(worker) {
        const cpu = getToBindCpu(worker);

        if (worker.hasRestart) {
            return;
        }

        logger.info('worker${cpu} pid=${pid} disconnect event fired. restart new worker again.', {
            pid: worker.process.pid,
            cpu: cpu
        });

        restartWorker(worker);
    });

    // 子进程被杀死的时候做下处理，原地复活
    cluster.on('exit', function(worker) {

        const cpu = getToBindCpu(worker);

        if (worker.hasRestart) {
            return;
        }

        logger.info('worker${cpu} pid=${pid} exit event fired. restart new worker again.', {
            pid: worker.process.pid,
            cpu: cpu
        });

        restartWorker(worker);
    });

    process.on('reload', function(GET) {
        logger.info('reload');
        tnm2.Attr_API('SUM_TSW_WORKER_RELOAD', 1);

        for (const key in workerMap) {
            const worker = workerMap[key];
            const cpu = getToBindCpu(worker);
            let timeout = 1000;

            if (config.isTest || config.devMode) {
                timeout = (cpu % 8) * 1000;
            } else {
                timeout = (cpu % 8) * 3000;
            }

            setTimeout((function(worker, cpu) {
                return function() {
                    if (!worker.exitedAfterDisconnect) {
                        logger.info('cpu${cpu} send restart message', {
                            cpu: cpu
                        });
                        worker.send({ from: 'master', cmd: 'restart' });
                    }
                    restartWorker(worker);
                };
            })(worker, cpu), timeout);

            logger.info('cpu${cpu} reload after ${timeout}ms', {
                cpu: cpu,
                timeout: timeout
            });
        }
    });

    process.on('sendCmd2workerOnce', function(data) {

        let key,
            worker;
        const CMD = data.CMD;
        const GET = data.GET;

        logger.info('sendCmd2workerOnce CMD: ${CMD}', {
            CMD
        });

        const targetCpu = parseInt(GET.cpu, 10) || 0;

        for (key in workerMap) {
            worker = workerMap[key];
            try {
                if (targetCpu === getToBindCpu(worker)) {
                    if (!worker.exitedAfterDisconnect) {
                        worker.send({ from: 'master', cmd: CMD, GET: GET });
                    }
                    break;
                }
            } catch (e) {
                logger.error(e.stack);
            }
        }
    });
}
