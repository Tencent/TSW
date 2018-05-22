/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const logger		= require('logger');
const domain		= require('domain');
const serverInfo 	= require('serverInfo.js');
const config		= require('./config.js');
const dcapi			= require('api/libdcapi/dcapi.js');
const {isWindows}	= require('util/isWindows.js');
const contextMod	= require('context.js');
const Context 		= require('runtime/Context');
const Window		= require('runtime/Window');
const xssFilter		= require('api/xssFilter');
const alpha			= require('util/auto-report/alpha.js');
const httpUtil		= require('util/http.js');
const isTST			= require('util/isTST.js');
const h5test 		= require('util/h5-test/is-test');
const logReport		= require('util/auto-report/logReport.js');
const httpModAct	= require('./http.mod.act.js');
const httpModMap	= require('./http.mod.map.js');
const mail			= require('util/mail/mail.js');
const CCFinder		= require('runtime/CCFinder.js');
const parseBody		= require('util/http/parseBody.js');
const TSW			= require('api/keyman');
const tnm2 			= require('api/tnm2');


module.exports = function(req,res){

    process.SN = process.SN || 0;

    var timeLimit = httpUtil.isPostLike(req) ? config.timeout.post : config.timeout.get;
    var start	= new Date();
    var d		= domain.create();
    var tid		= null;
    var clear	= function(){

        if(tid === null){
            return;
        }

        clearTimeout(tid);
        tid = null;

        logger.debug('clear called');

        process.nextTick(function(){

            var timeout = timeLimit - (Date.now() - start.getTime());

            if(timeout > 2000){
                timeout = 2000;
            }

            if(!timeout){
                timeout = 0;
            }

            if(timeout < 0){
                timeout = 0;
            }

            req.removeAllListeners('fail');

            res.removeAllListeners('timeout');
            res.removeAllListeners('close');
            res.removeAllListeners('finish');
            res.removeAllListeners('afterFinish');
            res.removeAllListeners('done');

            setTimeout(function(){
                logger.debug('clearing');

                d.remove(req);
                d.remove(res);

                if(d.currentContext){
                    d.currentContext.window.request = null;
                    d.currentContext.window.response = null;
                    d.currentContext.window.onerror = null;
                    d.currentContext.window = null;
                }

                if(d.currentContext){
                    d.currentContext.log = null;
                    d.currentContext = null;
                }

                d = null;
                req = null;
                res = null;
                start = null;
                clear = null;

                logger.debug('cleared');


            },timeout);
        });

    };

    d.add(req);
    d.add(res);

    d.currentContext					= new Context();
    d.currentContext.log				= {};
    d.currentContext.SN					= ++process.SN;
    d.currentContext.window				= new Window();
    d.currentContext.window.request		= req;
    d.currentContext.window.response	= res;

    if(config.enableWindow){
        d.currentContext.window.enable();
    }

    req.timestamps = {
        ClientConnected    : start,
        ClientBeginRequest : start,
        GotRequestHeaders  : start,
        ClientDoneRequest  : start,
        GatewayTime        : 0,
        DNSTime            : 0,
        TCPConnectTime     : 0,
        HTTPSHandshakeTime : 0,
        ServerConnected    : start,
        FiddlerBeginRequest: start,
        ServerGotRequest   : start,
        ServerBeginResponse: 0,
        GotResponseHeaders : 0,
        ServerDoneResponse : 0,
        ClientBeginResponse: 0,
        ClientDoneResponse : 0
    };

    if(isWindows || config.devMode){
        d.currentContext.log.showLineNumber = true;
    }

    if(global.cpuUsed > config.cpuLimit){
        d.currentContext.log = null;
    }

    d.on('error',function(err){

        if(err && err.message === 'socket hang up'){
            logger.warn(err && err.stack);

            //忽略ajax错误
            return;
        }

        if(err && err.message === 'Cannot read property \'asyncReset\' of null'){
            logger.warn(err && err.stack);

            //忽略asyncReset错误
            return;
        }

        if(err && err.message === 'Cannot read property \'resume\' of null'){
            logger.warn(err && err.stack);

            //忽略io错误
            return;
        }

        if(err && err.message === 'write ECONNRESET'){
            logger.warn(err && err.stack);

            //忽略io错误
            return;
        }

        if(err && err.message === 'This socket is closed'){
            logger.warn(err && err.stack);

            //忽略io错误
            return;
        }

        if(err && err.stack && err.stack.indexOf('/') === -1 && err.stack.indexOf('\\') === -1){
            logger.warn(err && err.stack);
            //忽略原生错误
            return;
        }

        if(clear === null){
            logger.warn(err && err.stack);
            return;
        }

        onerror(req,res,err);

        if(httpUtil.isSent(res)){
            logger.warn('${err}\nhttp://${host}${url}',{
                err: err && err.stack,
                url: req.url,
                host: req.headers.host
            });

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_PAGE',
                toIp		: '127.0.0.1',
                code		: -100503,
                isFail		: 1,
                delay		: Date.now() - start.getTime()
            });

        }else{
            logger.error('${err}\nhttp://${host}${url}',{
                err: err && err.stack,
                url: req.url,
                host: req.headers.host
            });

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_PAGE',
                toIp		: '127.0.0.1',
                code		: 100503,
                isFail		: 1,
                delay		: Date.now() - start.getTime()
            });

            try{
                res.writeHead(503, {'Content-Type': 'text/html; charset=UTF-8'});
                res.end();
            }catch(e){
                logger.info(`response 503 fail ${e.message}`);
            }
        }

        try{res.emit('done');}catch(e){logger.info(`emit done event fail ${e.message}`);}

        var key,Content;

        if(err && err.stack && err.message){

            if(err.message === 'Cannot read property \'asyncReset\' of null'){
                return;
            }

            if(err.message.indexOf('ETIMEDOUT') > 0){
                return;
            }

            if(err.message.indexOf('timeout') > 0){
                return;
            }

            if(err.message.indexOf('hang up') > 0){
                return;
            }

            if(err.message.indexOf('error:140943FC') > 0){
                return;
            }

            if(isWindows){
                //return;
            }

            key = [err.message].join(':');

            Content = [
                '<p><strong>错误堆栈</strong></p>',
                '<p><pre><code>',
                err.stack,
                '</code></pre></p>',
            ].join('');

            mail.SendMail(key,'js',600,{
                'Title'			: key,
                'runtimeType'	: 'Error',
                'MsgInfo'		: err.stack || err.message,
                'Content'		: Content
            });
        }

    });

    res.once('finish',function(){
        this.emit('done');
    });

    res.once('close',function(){
        res.__hasClosed = true;
        logger.debug('response has close');

        this.emit('done');//  let it going
    });

    res.once('done',function(){

        var isFail = 0,now;

        if(clear === null){
            return;
        }
        clear();

        now = new Date();

        if(!res.statusCode){
            isFail = 1;
        }

        if(res.statusCode === 200){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_20X', 1);
        }else if(res.statusCode === 206 || res.statusCode === 204){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_20X', 1);
        }else if(res.statusCode === 301){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_302', 1);
        }else if(res.statusCode === 302){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_302', 1);
        }else if(res.statusCode === 303){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_302', 1);
        }else if(res.statusCode === 307){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_302', 1);
        }else if(res.statusCode === 304){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_304', 1);
        }else if(res.statusCode === 403){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_403', 1);
        }else if(res.statusCode === 404){
            isFail = 2;
            tnm2.Attr_API('SUM_TSW_HTTP_404', 1);
        }else if(res.statusCode === 418){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_418', 1);
        }else if(res.statusCode === 419){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_419', 1);
        }else if(res.statusCode === 666){
            isFail = 0;
            tnm2.Attr_API('SUM_TSW_HTTP_666', 1);
        }else if(res.statusCode === 501){
            isFail = 2;
            tnm2.Attr_API('SUM_TSW_HTTP_501', 1);
        }else if(res.statusCode === 508){
            isFail = 2;
            tnm2.Attr_API('SUM_TSW_HTTP_508', 1);
        }else if(res.statusCode >= 500 && res.statusCode <= 599){
            isFail = 1;
            tnm2.Attr_API('SUM_TSW_HTTP_500', 1);
        }else{
            isFail = 2;
            tnm2.Attr_API('SUM_TSW_HTTP_OTHER', 1);
        }

        req.timestamps.ServerBeginResponse	= req.timestamps.ServerBeginResponse || now;
        req.timestamps.GotResponseHeaders	= req.timestamps.ServerBeginResponse;
        req.timestamps.ServerDoneResponse	= res.ServerDoneResponse || now;
        req.timestamps.ClientBeginResponse	= req.timestamps.ServerBeginResponse;
        req.timestamps.ClientDoneResponse	= req.timestamps.ServerDoneResponse;


        if(isFail === 1){
            logger.debug('finish, statusCode: ${statusCode},cost: ${cost}ms',{
                statusCode: res.statusCode,
                cost: Date.now() - start.getTime()
            });

            if(typeof req.REQUEST.body === 'string'){

                if(req.REQUEST.body.length < 32 * 1024){
                    logger.debug('\n${head}${body}',{
                        head: httpUtil.getRequestHeaderStr(req),
                        body: req.REQUEST.body || ''
                    });
                }else{
                    logger.debug('\n${head}${body}',{
                        head: httpUtil.getRequestHeaderStr(req),
                        body: 'body size >= 32KB'
                    });
                }
            }else{

                logger.debug('\n${head}${body}',{
                    head: httpUtil.getRequestHeaderStr(req),
                    body: req.REQUEST.body || ''
                });
            }

        }else{
            logger.debug('finish, statusCode: ${statusCode}, cost: ${cost}ms',{
                statusCode: res.statusCode,
                cost: Date.now() - start.getTime()
            });
        }

        if(res.__hasTimeout && isFail !== 1){

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_TIMEOUT',
                toIp		: '127.0.0.1',
                code		: res.statusCode || 0,
                isFail		: isFail,
                delay		: Date.now() - start.getTime()
            });

        }else if(res.__hasClosed){

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_CLOSE',
                toIp		: '127.0.0.1',
                code		: res.statusCode || 0,
                isFail		: isFail,
                delay		: Date.now() - start.getTime()
            });
        }else{

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_PAGE',
                toIp		: '127.0.0.1',
                code		: res.statusCode || 0,
                isFail		: isFail,
                delay		: Date.now() - start.getTime()
            });

            dcapi.report({
                key			: 'EVENT_TSW_HTTP_CODE',
                toIp		: '127.0.0.1',
                code		: res.statusCode || 0,
                isFail		: isFail,
                delay		: Date.now() - start.getTime()
            });

        }


        res.emit('afterFinish');
    });

    d.run(function(){
        tid = setTimeout(function(){

            res.__hasTimeout = true;

            logger.debug('timeout: ' + timeLimit);

            onerror(req,res,new Error('timeout'));

            if(res.__hasClosed){

                try{res.writeHead(202);	}catch(e){logger.info(`response 202 fail ${e.message}`);}
                try{res.end();}catch(e){logger.info(`response end fail ${e.message}`);}
                try{res.emit('done');}catch(e){logger.info(`emit done event fail ${e.message}`);}
            }else if(res.finished){

                try{res.end();}catch(e){logger.info(`response end fail ${e.message}`);}
                try{res.emit('done');}catch(e){logger.info(`emit done event fail ${e.message}`);}
            }else if(!res._headerSent && !res.headersSent && !res.finished && res.statusCode === 200){
                logger.debug('statusCode: ${statusCode}, _headerSent: ${_headerSent}, headersSent: ${headersSent}, finished: ${finished}',res);

                //输出一条错误log方便定位问题
                logger.error('response timeout http://${host}${url}',{
                    url: req.url,
                    host: req.headers.host
                });

                try{res.writeHead(513);	}catch(e){logger.info(`response 513 fail ${e.message}`);}
                try{res.end();}catch(e){logger.info(`response end fail ${e.message}`);}

                try{res.emit('done');}catch(e){logger.info(`emit done event fail ${e.message}`);}
            }else{
                logger.debug('statusCode: ${statusCode}, _headerSent: ${_headerSent}, headersSent: ${headersSent}, finished: ${finished}',res);

                try{res.end();}catch(e){logger.info(`response end fail ${e.message}`);}
                try{res.emit('done');}catch(e){logger.info(`emit done event fail ${e.message}`);}
            }

            req.emit('close');
        },timeLimit);

        doRoute(req,res);
    });

};

module.exports.doRoute = doRoute;

function doRoute(req,res){

    var clientIp	= httpUtil.getUserIp(req);
    var userIp24	= httpUtil.getUserIp24(req);

    //增加测试环境header
    if(config.isTest) {
        res.setHeader('Test-Head',	serverInfo.intranetIp || '');
    }

    logger.debug('${method} ${protocol}://${host}${path}',{
        protocol: req.REQUEST.protocol,
        path: req.REQUEST.path,
        host: req.headers.host,
        method: req.method
    });

    logger.debug('idc: ${idc}, server ip: ${intranetIp}, tcp: ${remoteAddress}:${remotePort} > ${localAddress}:${localPort}, client ip: ${clientIp}, cpuUsed: ${cpuUsed}',{
        cpuUsed: global.cpuUsed,
        idc: config.idc,
        intranetIp: serverInfo.intranetIp,
        clientIp: clientIp,
        remoteAddress: (req.socket && req.socket.remoteAddress),
        remotePort: (req.socket && req.socket.remotePort),
        localAddress: (req.socket && req.socket.localAddress),
        localPort: (req.socket && req.socket.localPort)
    });

    if(config.isTest){
        logger.debug('config.isTest is true');
        if(isTST.isTST(req)){
            res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
            res.end();
            return;
        }
    }


    //安全中心扫描报个指标
    //支持从配置中直接屏蔽安全中心扫描请求
    if(isTST.isTST(req)){
        tnm2.Attr_API('SUM_TSW_HTTP_TST', 1);

        if(config.ignoreTST){
            logger.debug('ignore TST request');

            res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
            res.end('200');

            return;
        }
    }

    if(config.devMode){
        logger.debug('config.devMode is true');
    }

    //log自动上报
    logReport(req,res);

    res.writeHead = (function(fn){
        return function(...args){
            if(alpha.isAlpha(req)){
                if(logger.getLog()){
                    logger.getLog().showLineNumber = true;
                    logger.debug('showLineNumber on');
                }

                //抓回包
                httpUtil.captureBody(this);
            }

            logger.debug('response ${statusCode}',{
                statusCode: args[0]
            });

            return fn.apply(this,args);
        };
    }(res.writeHead));

    var mod_act	= contextMod.currentContext().mod_act || httpModAct.getModAct(req);
    contextMod.currentContext().mod_act	= mod_act;

    if(alpha.isAlpha(req)){
        if(logger.getLog()){
            logger.getLog().showLineNumber = true;
            logger.debug('showLineNumber on');
        }
    }

    logger.debug('node-${version}, name: ${name}, appid: ${appid}',{
        version: process.version,
        name: mod_act || null,
        appid: config.appid || null
    });

    //测试环境
    if(h5test.isTestUser(req, res)){
        return;
    }

    //跟踪url调用深度
    var steps = parseInt(req.headers['tsw-trace-steps'] || '0') || 0;

    //深度超过5层，直接拒绝
    if(steps >= 5){

        tnm2.Attr_API('SUM_TSW_ROUTE_EXCEED', 1);

        try{
            res.writeHead(503, {'Content-Type': 'text/html; charset=UTF-8'});
            res.end('503');
        }catch(e){
            logger.info(`response 503 fail ${e.message}`);
        }

        return;
    }

    req.headers['tsw-trace-steps'] = steps + 1;

    var	modulePath						= httpModMap.find(mod_act,req,res);

    if(res.headersSent || res._headerSent || res.finished){
        return;
    }

    if(modulePath && typeof modulePath.handle === 'function'){
        let app = modulePath;

        modulePath = function(req,res,plug){
            return app.handle(req,res);
        };
    }

    if(modulePath && typeof modulePath.callback === 'function'){
        let app = modulePath;

        modulePath = function(req,res,plug){
            return app.callback()(req,res);
        };
    }

    if(typeof modulePath !== 'function'){
        if(req.REQUEST.pathname === '/419') {
            if(typeof config.page419 === 'string'){
                modulePath = require(config.page419);
            }
        } else {
            if(typeof config.page404 === 'string'){
                modulePath = require(config.page404);
            }
        }
    }

    if(typeof modulePath !== 'function'){
        try{
            res.writeHead(404, {'Content-Type': 'text/html; charset=UTF-8'});
            res.end('404');
        }catch(e){
            logger.info(`response 404 fail ${e.message}`);
        }
        return;
    }

    var modulePathHandler = function(){
        var maybePromise = modulePath(req, res, plug);
        if(
            typeof maybePromise === 'object'
			&&
			typeof maybePromise.catch === 'function'
        ){
            maybePromise.catch(function(err){
                logger.error(err);
                process.domain && process.domain.emit('error',err);
            });
        }
    };

    var blackIpMap = TSW.getBlockIpMapSync() || {};

    if(blackIpMap[clientIp] || blackIpMap[userIp24] || !clientIp){
        logger.debug('连接已断开');

        tnm2.Attr_API('SUM_TSW_IP_EMPTY', 1);
        res.writeHead(403, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end();
        return;
    }

    if(blackIpMap[clientIp] || blackIpMap[userIp24]){
        logger.debug('命中黑名单IP');

        dcapi.report({
            key			: 'EVENT_TSW_HTTP_IP_BLOCK',
            toIp		: clientIp || '127.0.0.1',
            code		: 0,
            isFail		: 0,
            delay		: 100
        });
        tnm2.Attr_API('SUM_TSW_IP_BLOCK', 1);
        res.writeHead(403, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end();
        return;
    }

    if(CCFinder.checkHost(req,res) === false){
        return;
    }

    if(CCFinder.check(req,res) === false){
        return;
    }

    //webso柔性
    if(global.cpuUsed > 80){

        if(httpUtil.isFromWns(req) && req.headers['if-none-match']){

            logger.debug('webso limit 304, cpuUsed: ${cpuUsed}',{
                cpuUsed		: global.cpuUsed
            });

            tnm2.Attr_API('SUM_TSW_WEBSO_LIMIT', 1);
            try{
                res.writeHead(304, {
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Etag': req.headers['if-none-match']
                });
                res.end();
            }catch(e){
                logger.info(`response 304 fail ${e.message}`);
            }

            return;
        }

    }

    var contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';

    if(req.method === 'GET' || req.method === 'HEAD'){

        if(httpUtil.isFromWns(req)){
            //wns请求不过门神检查
            return modulePathHandler();
        }

        xssFilter.check().done(function(){
            return modulePathHandler();
        }).fail(function(){
            res.writeHead(501, {'Content-Type': 'text/plain; charset=UTF-8'});
            res.end('501 by TSW');
        });
    }else if(context.autoParseBody === false){
        return modulePathHandler();
    }else if(
        contentType.indexOf('application/x-www-form-urlencoded') > -1
		|| contentType.indexOf('text/plain') > -1
		|| contentType.indexOf('application/json') > -1
    ){
        parseBody(req,res,function(){
            return modulePathHandler();
        });
    }else{
        return modulePathHandler();
    }

}



function onerror(req,res,err){
    var listener = req.listeners('fail');
    var window	 = context.window || {};

    if(res.headersSent || res._headerSent || res.finished){
        return;
    }

    if(listener && listener.length > 0){
        try{
            req.emit('fail',err);
        }catch(e){
            logger.error(e && e.stack);
        }

        req.removeAllListeners('fail');

    }else if(window.onerror){
        try{
            window.onerror(err);
        }catch(e){
            logger.error(e && e.stack);
        }

        window.onerror = null;
    }
}