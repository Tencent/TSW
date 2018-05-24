/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

process.on('uncaughtException',function(e){
    logger.error(e && e.stack);
});


const logger	= require('logger');
const http		= require('http');
const https		= require('https');
const cluster	= require('cluster');
const util		= require('util');
const fs		= require('fs');
const cp		= require('child_process');
const parseGet	= require('util/http/parseGet.js');
const tnm2	 	= require('api/tnm2');
const cpuUtil	= require('util/cpu.js');
const httpUtil	= require('util/http.js');
const TEReport	= require('util/auto-report/TEReport.js');
const mail		= require('util/mail/mail.js');
const websocket 		= require('./websocket.js');
const packageJSON		= require('../../package.json');
const headerServer		= `TSW/${packageJSON.version}`;
const methodMap			= {};
const {isWindows}		= require('util/isWindows.js');
const {debugOptions}	= process.binding('config');
const serverInfo		= {
    intranetIp: require('serverInfo.js').intranetIp,
    cpu: 'X'
};
var server;
var serverThis;
var serverHttps;
var config				= require('./config.js');
var routeCache			= null;
var cleanCacheTid		= null;
var isStartHeartBeat	= false;
var heartBeatCount		= 0;



function doRoute(req,res){

    if(routeCache === null){
        routeCache = require('./http.route.js');
        config = require('./config.js');
    }

    if(req.headers['user-agent'] === 'nws' && req.headers.host === serverInfo.intranetIp){
        //nws探测请求
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end('hello nws');

        return;
    }

    if(req.headers['user-agent'] === 'TgwProbe'){
        //stgw探测请求
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end('hello TgwProbe');

        return;
    }

    if(req.headers['user-agent'] === 'StgwProbe'){
        //stgw探测请求
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end('hello StgwProbe');

        return;
    }

    if(req.headers['user-agent'] === 'TgwProbe'){
        //stgw探测请求
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end('hello TgwProbe');

        return;
    }

    if(req.REQUEST.pathname === '/' && !req.headers['user-agent']){

        if(httpUtil.isInnerIP(httpUtil.getUserIp(req))){
            //l7探测请求
            res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
            res.end('hello l7');
            return;
        }

    }

    routeCache(req,res);
}

process.serverInfo	= serverInfo;

/**
 * 清除缓存
 */
function cleanCache(){

    clearTimeout(cleanCacheTid);

    cleanCacheTid = setTimeout(function(){
        require('util/cache.cleaner.js').clear('/');
        routeCache = null;

    },5000);
}

process.on('top100',function(e){
    logger.info('top100');
    global.top100 = [];
});


process.on('heapdump',function(e){
    logger.info('heapdump');

    if(!isWindows){

        require('heapdump').writeSnapshot(__dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.heapsnapshot',function(err, filename) {
            logger.info('dump written to ${filename}', {
                filename: filename
            });
        });

    }

});


process.on('profiler',function(data = {}){
    logger.info('profiler time: ${time}', data);

    if(!isWindows){

        require('util/v8-profiler.js').writeProfilerOpt(__dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.cpuprofile', {
            recordTime: data.time || 5000
        }, function(filename) {
            logger.info('dump written to ${filename}', {
                filename: filename
            });
        });

    }

});

//process.emit('globaldump',m.GET);
process.on('globaldump',function(GET){

    var cpu		= GET.cpu || 0;
    var depth	= GET.depth || 6;

    if(cpu != serverInfo.cpu){
        return;
    }

    var filename = __dirname + '/cpu' + serverInfo.cpu + '.' + Date.now() + '.globaldump';

    logger.info('globaldump');
    logger.info(GET);
    logger.info(filename);


    var str = util.inspect(global,{
        depth: depth
    });

    fs.writeFile(filename,str,'UTF-8',function(){
        logger.info('globaldump finish');
    });

});

function requestHandler(req, res){
    if(server.keepAliveTimeout > 0) {
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', `timeout=${parseInt(server.keepAliveTimeout / 1000)}`);
    }else{
        res.setHeader('Connection', 'close');
    }

    res.setHeader('X-Powered-By', 'TSW/Node.js');
    res.setHeader('Server', headerServer);
    res.setHeader('Cache-Control', 'no-cache');

    if(config.devMode){
        //发者模式清除缓存
        cleanCache();
    }

    if('upgrade' === req.headers.connection && 'websocket' === req.headers.upgrade) {
        //websocket
        return;
    }

    res.flush = res.flush || function(){return true;};

    //解析get参数
    parseGet(req);

    //HTTP路由
    doRoute(req,res);
}


server		= http.createServer(requestHandler);
serverThis	= http.createServer(requestHandler);

server.timeout 				= Math.max(config.timeout.upload || config.timeout.socket,0);
serverThis.timeout 			= Math.max(config.timeout.upload || config.timeout.socket,0);
server.keepAliveTimeout		= Math.max(config.timeout.keepAlive,0);
serverThis.keepAliveTimeout = Math.max(config.timeout.keepAlive,0);

global.TSW_HTTP_SERVER = server;

if(config.httpsOptions){
    serverHttps = https.createServer(config.httpsOptions,function(req,res){
        req.headers['x-client-proto'] = 'https';

        requestHandler(req,res);
    });

    serverHttps.on('clientError', function(err, socket){
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    serverHttps.timeout 			= Math.max(config.timeout.upload || config.timeout.socket,0);
    serverHttps.keepAliveTimeout	= Math.max(config.timeout.keepAlive,0);

    global.TSW_HTTPS_SERVER = serverHttps;
}


logger.info('pid:${pid} createServer ok',{
    pid: process.pid
});


//分发父进程发送来的消息
process.on('message',function(m){
    if(m && methodMap[m.cmd]){
        methodMap[m.cmd].apply(this,arguments);
    }
});

function startHeartBeat(){

    if(isStartHeartBeat){
        return;
    }

    isStartHeartBeat = true;

    global.cpuUsed			= 0;

    //定时给父进程发送心跳包
    setInterval(function(){

        heartBeatCount += 1;

        process.connected && process.send && process.send({
            cmd: 'heartBeat',
            memoryUsage: process.memoryUsage()
        });

        if(serverInfo.cpu === 0){
            //测试环境1分钟上报一次
            if(heartBeatCount % 12 === 0){
                TEReport.report();
            }
        }

        global.cpuUsed = cpuUtil.getCpuUsed(serverInfo.cpu);

        tnm2.Attr_API_Set('AVG_TSW_CPU_USED', global.cpuUsed);

        if(global.cpuUsed >= 80) {
            global.cpuUsed80 = ~~global.cpuUsed80 + 1;
        }else{
            global.cpuUsed80 = 0;
        }

        var cpuUsed = global.cpuUsed;

        //高负载告警
        if (
            global.cpuUsed80 === 4 &&
			!config.isTest &&
			!isWindows
        ) {
            //取进程快照
            //ps aux --sort=-pcpu
            cp.exec('top -bcn1',{
                env: {
                    COLUMNS: 200
                },
                timeout: 5000
            },function(err,data,errData) {
                var key		= ['cpu80.v4',serverInfo.intranetIp].join(':');
                var Content = [
                    '<strong>单核CPU' + serverInfo.cpu + '使用率为：' + cpuUsed + '，超过80%, 最近5秒钟CPU Profiler见附件</strong>'
                ].join('<br>');

                var str = '';

                if (data) {
                    str = data.toString('utf-8');
                    str = str.replace(/</g, '&gt;');
                    str = str.replace(/\r\n|\r|\n/g, '<br>');

                    Content += '<p><strong>进程快照：</strong></p><pre style="font-size:12px">' + str + '</pre>';
                }


                //获取本机信息，用来分组
                require('api/cmdb').GetDeviceThisServer().done(function(data){
                    data            = data || {};
                    var business    = data.business && data.business[0] || {};
                    var owner       = '';

                    if(data.ownerMain){
                        owner = [owner,data.ownerMain].join(';');
                    }

                    if(data.ownerBack){
                        owner = [owner,data.ownerBack].join(';');
                    }

                    //再抓一份CPU Profiler
                    require('util/v8-profiler.js').getProfiler({
                        recordTime: 5000
                    }, result => {
                        mail.SendMail(key, 'js', 600, {
                            'To'		: config.mailTo,
                            'CC'		: owner,
                            'MsgInfo'	: business.module + '[CPU]' + serverInfo.intranetIp + '单核CPU' + serverInfo.cpu + '使用率为：' + cpuUsed + '，超过80%',
                            'Title'		: business.module + '[CPU]' + serverInfo.intranetIp + '单核CPU' + serverInfo.cpu + '使用率为：' + cpuUsed + '，超过80%',
                            'Content'	: Content,
                            'attachment': result ? {
                                fileType       : true,
                                dispositionType: 'attachment',
                                fileName       : 'cpu-profiler.cpuprofile',
                                content        : result
                            } : ''
                        });
                    });
                });
            });
        }

        let currMemory		= process.memoryUsage();

        tnm2.Attr_API_Set('AVG_TSW_MEMORY_RSS',			currMemory.rss);
        tnm2.Attr_API_Set('AVG_TSW_MEMORY_HEAP',		currMemory.heapTotal);
        tnm2.Attr_API_Set('AVG_TSW_MEMORY_EXTERNAL',	currMemory.external);

    },5000);

}



//restart
methodMap.restart = function(){

    logger.info('cpu: ${cpu} restart',serverInfo);

    process.emit('restart');
};

//reload
methodMap.reload = function(){

    logger.info('cpu: ${cpu} reload',serverInfo);

    process.emit('reload');
};

//heapdump
methodMap.heapdump = function(m){

    logger.info('cpu: ${cpu} heapdump',serverInfo);

    process.emit('heapdump',m.GET);
};

//profiler
methodMap.profiler = function(m){

    logger.info('cpu: ${cpu} profiler',serverInfo);

    process.emit('profiler',m.GET);
};

//globaldump
methodMap.globaldump = function(m){

    logger.info('cpu: ${cpu} globaldump',serverInfo);

    process.emit('globaldump',m.GET);
};

//top100
methodMap.top100 = function(m){

    logger.info('cpu: ${cpu} top100',serverInfo);

    process.emit('top100',m.GET);
};

//监听端口
methodMap.listen = function(message){

    var user_00				= config.workerUid || 'user_00';
    serverInfo.cpu			= message.cpu || 0;
    global.cpuUsed			= cpuUtil.getCpuUsed(serverInfo.cpu);

    process.title = 'TSW/worker/' + serverInfo.cpu;
    global.TSW_HTTP_WORKER_PORT = config.workerPortBase + serverInfo.cpu;

    logger.info('cpu: ${cpu}, beforeStartup...',serverInfo);

    if(typeof config.beforeStartup === 'function'){
        config.beforeStartup(serverInfo.cpu);
    }

    logger.info('cpu: ${cpu}, listen...',serverInfo);

    //直接根据配置启动，无需拿到_handle
    server.listen({
        host: config.httpAddress,
        port: config.httpPort,
        exclusive: false
    },function(err){
        if(err){
            logger.info('cpu: ${cpu}, listen http error ${address}:${port}',{
                cpu:serverInfo.cpu,
                address: config.httpAddress,
                port: config.httpPort
            });

            return;
        }

        logger.info('cpu: ${cpu}, listen http ok ${address}:${port}',{
            cpu:serverInfo.cpu,
            address: config.httpAddress,
            port: config.httpPort
        });

        var finish = function(){

            //开始发送心跳
            logger.info('start heart beat');

            startHeartBeat();

            if(!isWindows){
                try{
                    process.setuid(user_00);
                }catch(err){
                    logger.error(`switch to uid: ${user_00} fail!`);
                    logger.error(err.stack);
                }

                logger.info('switch to uid: ${uid}',{
                    uid:user_00
                });
            }
            websocket.start_listen();

            logger.info('cpu: ${cpu}, afterStartup...',serverInfo);

            if(typeof config.afterStartup === 'function'){
                config.afterStartup(serverInfo.cpu);
            }
        };

        //监听私有端口
        serverThis.listen({
            host: config.httpAddress,
            port: global.TSW_HTTP_WORKER_PORT,
            exclusive: false
        },function(err) {
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


            if(serverHttps){

                //启动https
                serverHttps.listen(config.httpsPort,config.httpsAddress,function(err){
                    if(err){
                        logger.info('cpu: ${cpu}, listen https error ${address}:${port}',{
                            cpu:serverInfo.cpu,
                            address: config.httpsPort,
                            port: config.httpsAddress
                        });

                        return;
                    }

                    logger.info('cpu: ${cpu}, listen https ok ${address}:${port}',{
                        cpu:serverInfo.cpu,
                        address: config.httpsAddress,
                        port: config.httpsPort
                    });

                    finish();
                });
            }else{
                finish();
            }
        });

    });


};

if(cluster.isMaster){
    if(isWindows){
        logger.info('isWindows, start listening');
        methodMap.listen({cpu : 0});
    }else if(debugOptions && debugOptions.inspectorEnabled){
        logger.setLogLevel('debug');
        logger.info('inspectorEnabled, start listening');
        methodMap.listen({cpu : 0});
    }
}


require('webapp/Server.js').startServer();




