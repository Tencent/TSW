/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const logger		= require('logger');
const Deferred		= require('util/Deferred');
const http			= require('http');
const https			= require('https');
const vm			= require('vm');
const url			= require('url');
const qs			= require('qs');
const form			= require('./form.js');
const token			= require('./token.js');
const config		= require('config.js');
const {isWindows}	= require('util/isWindows.js');
const zlib			= require('zlib');
const L5			= require('api/L5/L5.api.js');
const dcapi			= require('api/libdcapi/dcapi.js');
const httpUtil		= require('util/http.js');
const isTST			= require('util/isTST.js');
const optionsUtil	= require('./http-https.options.js');
const sbFunction	= vm.runInNewContext('(Function)',Object.create(null));		//沙堆
var lastRetry		= 0;
var undefined;


module.exports = new Ajax();


function Ajax(req, res){

    this._proxyRequest = req;
    this._proxyResponse = res;

}

Ajax.prototype.proxy = function(req, res){

    var window = context.window || {};

    if(!req){
        req = window.request;
    }

    if(!res){
        req = window.response;
    }

    if(!req){
        logger.warn('!req is true');
    }

    if(!res){
        logger.warn('!res is true');
    }

    return new Ajax(req, res);
};

Ajax.prototype.request = function(opt){

    if(config.devMode && isWindows && config.httpProxy && config.httpProxy.enable && !opt.ip && !opt.devIp){
        opt.proxyIp		= config.httpProxy.ip;
        opt.proxyPort	= config.httpProxy.port;
    }

    if(opt.l5api){
        return this.l5Request(opt);
    }else{
        return this.doRequest(opt);
    }
	
};


//dns带你去ajax
Ajax.prototype.dnsRequest = function(opt){
    return this.doRequest(opt);
};

//L5带你去ajax
Ajax.prototype.l5Request = function(opt){
	
    var 
        defer		= Deferred.create(),
        that		= this,
        l5api;
	
    l5api = Deferred.extend({
        modid: 0,
        cmd: 0
    },opt.l5api);

    if(l5api.modid === 0){
        return this.doRequest(opt);
    }

    if(isWindows){
        //windows不走L5，直接请求
        return this.doRequest(opt);
    }
	
    L5.ApiGetRoute(l5api).done(function(route){
		
        var start = new Date();
		
        opt.ip		= route.ip;
        opt.port	= route.port;
		
        //开始真正的请求
        that.doRequest(opt).always(function(d){
			
            if(d.opt && d.opt.headers && isTST.isTST(opt)){
                //忽略安全中心请求
                return;
            }

            if(route.ip !== opt.ip){
                //不用上报，可能走了devIp
                return;
            }

            var end = new Date();

            //上报调用结果
            L5.ApiRouteResultUpdate({
                modid		: l5api.modid,
                cmd			: l5api.cmd,
                usetime		: end - start,
                ret			: (d && (d.hasError || d.hasRetry)) ? -1 : 0,
                ip			: route.ip,
                port		: route.port,
                pre			: route.pre,
                flow		: route.flow
            });
			
        }).done(function(d){
            defer.resolve(d);
        }).fail(function(d){
            defer.reject(d);
        });
		
    }).fail(function(d){
		
        if(opt.dcapi){
            dcapi.report(Deferred.extend({},opt.dcapi,{
                toIp		: '127.0.0.1',
                code		: d.ret,
                isFail		: 1,
                delay		: 100
            }));
        }
		
        defer.reject({
            opt: opt,
            buffer: null,
            result: null,
            responseText: null,
            hasError: true,
            msg: 'L5 get error! ' + d.ret,
            code: d.ret,
            response: null
        });
		
        opt.error && defer.fail(opt.error);
    });
	
    return defer;
};


//普通请求
Ajax.prototype.doRequest = function(opt){

    var window   	= context.window || {};
    var defer		= Deferred.create(),
        tid			= null,
        that		= this,
        currAgent	= false,
        times		= {
            start: 0,
            response: 0,
            end: 0
        },
        currRetry,
        AJAXSN,logPre,
        request,
        key,v,
        obj;
	
    if(context.AJAXSN){
        context.AJAXSN++;
    }else{
        context.AJAXSN = 1;
    }
	
    AJAXSN = context.AJAXSN || 0;
	
    logPre = '[' + AJAXSN + '] ';
	
    opt = Deferred.extend({
        type		: 'GET',
        url			: '',
        devIp		: '',
        devPort		: '',
        testIp		: '',
        testPort	: '',
        ip			: '',
        port		: '',
        host		: '',
        path		: '',
        headers		: {},
        timeout		: 2000,
        data		: {},
        protocol		: '',			//protocol协议
        retry			: 1,			//重试次数
        keepAlive		: false,		//使用长连接
        body			: null,			//对应HTTP BODY
        success			: null,			//success事件
        error			: null,			//error事件
        response		: null,			//response事件
        dataType		: 'html',		//数据类型
        send			: null,			//send事件
        l5api			: {},			//l5api
        useIPAsHost		: false,		//使用IP覆盖host
        dcapi			: null, 		//api监控上报
        maxBodySize 	: -1,   		//指定最大body大小,超过之后整个请求直接断掉
        autoToken		: false,		//自动带token
        autoQzoneToken		: false,	//自动带Qzonetoken
        jsonpCallback		: null,		//JSONP回调名字
        ignoreErrorReport	: false,	//上报时忽略错误
        useJsonParseOnly	: false,	//强制jsonParse
        encodeMethod		: 'encodeURIComponent',
        enctype				: 'application/x-www-form-urlencoded',  //multipart/form-data  application/json
        isRetriedRequest	: false 		//标记当前请求是否是重试的请求
    },config.ajaxDefaultOptions,opt);

    opt.type = opt.type.toUpperCase();

    if(!httpUtil.isGetLike(opt.type)){
        opt.retry = 0;
    }

    currRetry = opt.retry;
	
    if(opt.dataType !== 'proxy'){
        //默认开启gzip
        opt.headers = Deferred.extend(
            {
                'accept-encoding': 'gzip,deflate'
            },
            opt.headers
        );
    }

    if(this._proxyRequest){

        //是代理请求

        opt.headers = Deferred.extend(
            {
                //这个不能删除，会被修改
            },
            this._proxyRequest.headers,
            {
                'x-forwarded-for' : httpUtil.getUserIp(this._proxyRequest)
            },
            opt.headers
        );
    }
	
    if(opt.headers['origin'] === 'null'){
        //兼容客户端
        opt.headers['origin'] = undefined;
    }
	
    opt.type = opt.type.toUpperCase();

    if(opt.url){

        obj = url.parse(opt.url);

        opt.protocol=opt.protocol || obj.protocol || 'http:';
        opt.host	= opt.host || obj.hostname;
        opt.port	= opt.port || obj.port || (opt.protocol === 'https:' ? 443 : 80);
        opt.path	= opt.path || obj.path;

        logger.debug(logPre + 'host from url: ' + opt.host);
    }else{
        opt.port	= opt.port || (opt.protocol === 'https:' ? 443 : 80);
    }

    if(!opt.data){
        opt.data = {};
    }
	
    if(opt.dataType === 'proxy'){
        opt.autoToken		= false;
        opt.autoQzoneToken	= false;
    }

    if(opt.autoToken && !opt.isRetriedRequest){
        if(opt.path.indexOf('?') === -1){
            opt.path = opt.path + '?g_tk=' + token.token();
        }else{
            opt.path = opt.path + '&g_tk=' + token.token();
        }
    }
	
    if(opt.autoQzoneToken){
        opt.headers['x-qzone-token'] = opt.headers['x-qzone-token'] || String(opt.autoQzoneToken);
    }

    if(opt.encodeMethod === 'encodeURIComponent'){
        opt.encoder = encodeURIComponent;
    }else if(opt.encodeMethod === 'encodeURI'){
        opt.encoder = encodeURI;
    }else if(opt.encodeMethod === 'escape'){
        opt.encoder = escape;
    }else{
        opt.encoder = encodeURIComponent;
    }


    if(httpUtil.isPostLike(opt.type)){

        //优先使用body
        if(!opt.body && opt.data && Object.keys(opt.data).length > 0){
            if(opt.enctype === 'application/json'){

                opt.headers['content-type'] = 'application/json';
                opt.body = JSON.stringify(opt.data);

            }else if(opt.enctype === 'multipart/form-data'){

                opt.boundary = opt.boundary || Math.random().toString(16);
                opt.headers['content-type'] = 'multipart/form-data; boundary=' + opt.boundary;

                opt.body = form.getFormBuffer(opt);

            }else{
                opt.headers['content-type'] = opt.enctype;
                opt.body = qs.stringify(opt.data, { arrayFormat: 'brackets', skipNulls: true, encoder: opt.encoder });
            }
        }
    }else{
        if(!opt.isRetriedRequest){
            let query = qs.stringify(opt.data, { arrayFormat: 'brackets', skipNulls: true, encoder: opt.encoder });
            if(query){
                if(opt.path.indexOf('?') === -1){
                    opt.path = opt.path + '?' + query;
                }else{
                    opt.path = opt.path + '&' + query;
                }
            }
        }
    }


		

    if(config.isTest){
		
        if(opt.testIp){
            logger.debug('use testIp');

            //测试环境模式
            opt.ip		= opt.testIp || opt.ip;
            opt.port	= opt.testPort || opt.port;
        }
    }else if((config.devMode || isWindows)){

        if(opt.devIp){
            logger.debug('use devIp');
            //开发者模式
            opt.ip			= opt.devIp		|| opt.ip;
            opt.port		= opt.devPort	|| opt.port;
            opt.proxyPort	= null;
        }

    }


    if(opt.host){
        opt.headers.host	= opt.host;
    }else{
        opt.host			= opt.headers.host;
    }

    if(opt.useIPAsHost){
        opt.headers.host = opt.ip;
    }

    if(currRetry === opt.retry){
        //防止重复注册 
        opt.success && defer.done(opt.success);
        opt.error && defer.fail(opt.error);
    }

    //开始时间点
    times.start = new Date().getTime();

    function report(opt, isFail, code) {
		
		
        if(isTST.isTST(opt)){
            //忽略安全中心请求
            return;
        }

        if(isFail === 1 && opt.ignoreErrorReport){
            isFail = 2;
        }

        if(opt.dcapi){

            logger.debug(logPre + '返回码：' + code + ', isFail:' + isFail);

            dcapi.report(Deferred.extend({},opt.dcapi,{
                toIp		: opt.ip,
                code		: code,
                isFail		: isFail,
                delay		: new Date - times.start
            }));
        }
    }
	
    //解决undefined报错问题
    for(key in opt.headers){
        v = opt.headers[key];

        if(v === undefined){
            logger.debug('delete header: ${key}',{
                key: key
            });
            delete opt.headers[key];
            continue;
        }

        if(v === null){
            logger.debug('delete header: ${key}',{
                key: key
            });
            delete opt.headers[key];
            continue;
        }

        if(key.indexOf(' ') >= 0){
            logger.debug('delete header: ${key}',{
                key: key
            });
            delete opt.headers[key];
            continue;
        }

        v = httpUtil.filterInvalidHeaderChar(v);

        if(v !== opt.headers[key]){
            opt.headers[key] = v;

            logger.debug('find invalid characters in header: ${key}',{
                key: key
            });
        }
    }
	
    if((httpUtil.isPostLike(opt.type)) && opt.dataType === 'proxy' && this._proxyRequest){

        if(this._proxyRequest.REQUEST.body !== undefined){
            opt.body = this._proxyRequest.REQUEST.body;
        }else{
            opt.send = function(request){
                that._proxyRequest.on('data',function(buffer){
                    request.write(buffer);
                });
				
                that._proxyRequest.once('end',function(buffer){
                    that._proxyRequest.removeAllListeners('data');
                    request.end();
                });
            };
        }
    }
	
    if(httpUtil.isGetLike(opt.type) && opt.headers['content-length']){
		
        logger.debug('reset Content-Length: 0 , origin: ' + opt.headers['content-length']);
		
        delete opt.headers['content-length'];
        delete opt.headers['content-type'];
        opt.body = null;
    }else if(opt.body){
        if(!Buffer.isBuffer(opt.body)){
            opt.body = Buffer.from(opt.body,'UTF-8');
        }
		
        opt.headers['Content-Length'] = opt.body.length;
    }

    if(opt.protocol === 'https:'){
        //https不走代理
        opt.proxyIp = null;
        opt.proxyPort= null;
    }

    //过滤特殊字符
    if(httpUtil.checkInvalidHeaderChar(opt.path)){
        opt.path = encodeURI(opt.path);
    }

    logger.debug(logPre + '${type} ${dataType} ~ ${ip}:${port} ${protocol}//${host}${path}',{
        protocol	: opt.protocol,
        type		: opt.type,
        dataType	: opt.dataType,
        ip			: opt.proxyIp || opt.ip || opt.host,
        port		: opt.proxyPort || opt.port,
        host		: opt.host,
        path		: opt.path
    });

    if(opt.proxyPort){
        opt.proxyPath = 'http://' + opt.host + opt.path;
    }


    if(opt.agent){
        currAgent = opt.agent;
    }else if(opt.keepAlive === 'https'){
        if(opt.protocol === 'https:'){
            currAgent = optionsUtil.getHttpsAgent(opt.headers.host);
        }else{
            currAgent = false;
        }
    }else if(opt.keepAlive){
        if(opt.protocol === 'https:'){
            currAgent = optionsUtil.getHttpsAgent(opt.headers.host);
        }else{
            currAgent = optionsUtil.getHttpAgent(opt.headers.host);
        }
    }else{
        currAgent = false;
    }

    request = (opt.protocol === 'https:' ? https : http).request({
        agent	: currAgent,
        host	: opt.proxyIp	|| opt.ip	|| opt.host,
        port	: opt.proxyPort	|| opt.port,
        path	: opt.proxyPath	|| opt.path,
        method	: opt.type,
        headers	: opt.headers
    });

    request.setNoDelay(true);
    request.setSocketKeepAlive(true);
	
    defer.always(function(){
        clearTimeout(tid);
        request.removeAllListeners();
		
        //request.abort();  长连接不能开
        //request.destroy(); 长连接不能开
        request = null;
        tid		= null;
    });
	
    tid = setTimeout(function(){
        logger.debug(logPre + 'timeout: ${timeout}', {
            timeout		: opt.timeout
        });
        request.abort();
        request.emit('fail');
    },opt.timeout);
	
    request.once('error',function(err){
        request.emit('fail',err);
    });
	
    request.once('fail',function(err){
		
        if(defer.isRejected() || defer.isResolved()){
            return;
        }
		
        times.end = new Date().getTime();

        if(err){
            logger.error(logPre + '[${userIp}] ${type} error ~ ${ip}:${port} ${protocol}//${host}${path} ' + err.stack,{
                protocol	: opt.protocol,
                type		: opt.type,
                dataType	: opt.dataType,
                ip			: opt.proxyIp || opt.ip,
                port		: opt.proxyPort || opt.port,
                host		: opt.host,
                path		: opt.path,
                userIp 		: httpUtil.getUserIp()
            });
            report(opt,1,502);
            defer.reject({
                opt: opt,
                hasError: true,
                code: 502,
                e:err,
                msg: err.message,
                times: times
            });

            return;
        }
		
        if(window.response && window.response.__hasClosed){
            logger.error(logPre + '[${userIp}] ${type} error ~ ${ip}:${port} ${protocol}//${host}${path} socket closed',{
                protocol	: opt.protocol,
                type		: opt.type,
                dataType	: opt.dataType,
                ip			: opt.proxyIp || opt.ip,
                port		: opt.proxyPort || opt.port,
                host		: opt.host,
                path		: opt.path,
                userIp 		: httpUtil.getUserIp()
            });
            report(opt,2,600 + opt.retry);
            defer.reject({
                opt: opt,
                hasError: true,
                code: 600,
                e:err,
                msg: 'request error',
                times: times
            });
            return;
        }
		
        report(opt,1,513 + opt.retry);
		
        logger.error(logPre + '[${userIp}] ${type} error ~ ${ip}:${port} ${protocol}//${host}${path}',{
            protocol	: opt.protocol,
            type		: opt.type,
            dataType	: opt.dataType,
            ip			: opt.proxyIp || opt.ip,
            port		: opt.proxyPort || opt.port,
            host		: opt.host,
            path		: opt.path,
            userIp 		: httpUtil.getUserIp()
        });
		
        //限制次数，1s只放过一个
        if(opt.retry > 0 && times.end - lastRetry > 1000){
            lastRetry = times.end;
			
            opt.retry = opt.retry - 1;
			
            logger.debug('retry: ' + opt.retry);
            opt.isRetriedRequest = true;

            that.request(opt).done(function(d){
                d.hasRetry = true;
				
                defer.resolve(d);
            }).fail(function(d){
                d.hasRetry = true;
				
                defer.reject(d);
            });
			
            return;	
        }else{
            report(opt,1,513 + opt.retry);
        }

        defer.reject({
            opt: opt,
            hasError: true,
            code: 513,
            e:err,
            msg: 'request error',
            times: times
        });
		
    });

    request.once('response',function(response){
        var result		= [];
        var pipe		= response;
        var isProxy		= false;
		
        if(opt.dataType === 'proxy' && that._proxyResponse){
            isProxy = true;
        }
		
        if(currRetry != opt.retry){
            //防止第一个请求又回包捣乱
            logger.debug('currRetry: ${currRetry}, opt.retry: ${retry}',{
                currRetry: currRetry,
                retry: opt.retry
            });
            return;
        }
		
        //不能再重试了
        opt.retry = 0;
		
        //不能省掉哦
        process.domain && process.domain.add(response);
		
        opt.statusCode		= response.statusCode;
        opt.remoteAddress	= request.socket && request.socket.remoteAddress;
        opt.remotePort		= request.socket && request.socket.remotePort;
		
        response._bodySize	= 0;
		
        times.response = new Date().getTime();
		
        if(opt.dataType === 'proxy'){
            if(response.statusCode >= 500 && response.statusCode <= 599 && response.statusCode !== 501){
                logger.debug(logPre + '${ip}:${port} response ${statusCode} cost:${cost}ms ${encoding}\nrequest: ${headers}\nresponse: ${resHeaders}',{
                    ip: opt.remoteAddress,
                    port: opt.remotePort,
                    statusCode: response.statusCode,
                    headers: JSON.stringify(opt.headers,null,2),
                    resHeaders: JSON.stringify(response.headers,null,2),
                    encoding: response.headers['content-encoding'],
                    cost: +new Date() - times.start
                });
            }else{
                logger.debug(logPre + '${ip}:${port} response ${statusCode} cost:${cost}ms ${encoding}\nresponse ${statusCode} ${resHeaders} ',{
                    ip: opt.remoteAddress,
                    port: opt.remotePort,
                    statusCode: response.statusCode,
                    resHeaders: JSON.stringify(response.headers,null,2),
                    encoding: response.headers['content-encoding'],
                    cost: +new Date() - times.start
                });
            }
        }else{
            if(
                opt.statusCode === 200
				|| opt.statusCode === 206
				|| opt.statusCode === 666
				|| opt.dataType === response.statusCode
            ){
                logger.debug(logPre + '${ip}:${port} response ${statusCode} cost:${cost}ms ${encoding}',{
                    ip: opt.remoteAddress,
                    port: opt.remotePort,
                    statusCode: response.statusCode,
                    encoding: response.headers['content-encoding'],
                    cost: +new Date() - times.start
                });
            }else{
                logger.debug(logPre + '${ip}:${port} response ${statusCode} cost:${cost}ms ${encoding}\nrequest: ${headers}\nresponse: ${resHeaders}',{
                    ip: opt.remoteAddress,
                    port: opt.remotePort,
                    statusCode: response.statusCode,
                    headers: JSON.stringify(opt.headers,null,2),
                    resHeaders: JSON.stringify(response.headers,null,2),
                    encoding: response.headers['content-encoding'],
                    cost: +new Date() - times.start
                });
            }
        }
		
        if(defer.isRejected() || defer.isResolved()){
            logger.debug(logPre + 'isRejected: ${isRejected}, isResolved: ${isResolved}', {
                isRejected: defer.isRejected(),
                isResolved: defer.isResolved()
            });
            return;
        }
		
        if(typeof opt.response === 'function'){
            if(opt.response(response) === false){
                //中断处理流程
                return;
            }
        }

        if(isProxy){
            if(httpUtil.isSent(that._proxyResponse)){
                logger.debug('proxy end');
                return;
            }
        }
		
        if(opt.dataType === 'buffer' || (isProxy && response.headers['content-encoding']) || response.headers['content-length'] == 0){
            logger.debug(logPre + 'response type: buffer');
        }else{
            if(response.headers['content-encoding'] === 'gzip'){
				
                pipe = zlib.createGunzip();
                response.on('data',function(buffer){
                    pipe.write(buffer);
                });
                response.once('end',function(){
                    pipe.end();
                });
            }else if(response.headers['content-encoding'] === 'deflate'){
				
                pipe = zlib.createInflateRaw();
				
                response.on('data',function(buffer){
                    pipe.write(buffer);
                });
                response.once('end',function(){
                    pipe.end();
                });
            }
        }
		
        if(isProxy){

            if(response.headers['transfer-encoding'] !== 'chunked'){
                that._proxyResponse.useChunkedEncodingByDefault = false;
            }
            //如果是测试环境，增加一个proxy头以便识别ip
            if(opt.ip && config.isTest){
                that._proxyResponse.setHeader('Proxy-Domain-Ip', opt.ip);
            }
            if(config.isTest && response.headers['cache-control']) {
                response.headers['cache-control'] = 'max-age=0, must-revalidate';
            }

            if(
                !response.headers['content-encoding'] &&
				response.headers['content-type'] &&
				(response.headers['content-type'].indexOf('text/') === 0 ||
				response.headers['content-type'] === 'application/x-javascript' ||
				response.headers['content-type'] === 'x-json')
            ){

                //自带压缩功能
                delete response.headers['transfer-encoding'];
                delete response.headers['content-length'];
                delete response.headers['connection'];

                //解决循环依赖
                that._proxyResponse = require('util/gzipHttp.js').create({
                    request		: that._proxyRequest,
                    response	: that._proxyResponse,
                    code		: response.statusCode,
                    headers		: httpUtil.formatHeader(response.headers)
                });
            }else{
                delete response.headers['connection'];
				
                that._proxyResponse.writeHead(response.statusCode,httpUtil.formatHeader(response.headers));
            }
        }

        pipe.timeStart = Date.now();
        pipe.timeCurr = pipe.timeStart;

        pipe.on('data',function(chunk){
            // var cost = Date.now() - pipe.timeCurr;

            pipe.timeCurr = Date.now();

            //logger.debug('${logPre}receive data: ${size},\tcost: ${cost}ms',{
            //	logPre: logPre,
            //	cost: cost,
            //	size: chunk.length
            //});

            response._bodySize += chunk.length;

            if(opt.maxBodySize > 0 && response._bodySize > opt.maxBodySize){
                logger.debug(logPre + 'request abort(body size too large) size:${len},max:${max}', {
                    len: response._bodySize,
                    max:opt.maxBodySize
                });
                request.abort();
                request.emit('fail');
                return;
            }
			
            if(isProxy){
                if(!that._proxyResponse.finished){
                    that._proxyResponse.write(chunk);
                }

            }else{
                result.push(chunk);
            }
        });
		
        pipe.once('close',function(){
            logger.debug(logPre + 'close');
            this.emit('done');
        });
		
        pipe.once('end',function(){
            var cost = Date.now() - pipe.timeStart;

            logger.debug('${logPre}end：${size},\treceive data cost: ${cost}ms',{
                logPre: logPre,
                cost: cost,
                size: response._bodySize
            });

            this.emit('done');
        });
		
        pipe.once('done',function(){
			
            var obj,responseText,buffer,code;
            var key,Content;
			
            this.removeAllListeners('close');
            this.removeAllListeners('end');
            this.removeAllListeners('data');
            this.removeAllListeners('done');
			
            if(defer.isRejected() || defer.isResolved()){
                return;
            }

            times.end = new Date().getTime();
            buffer = Buffer.concat(result);
            result = [];
			
            logger.debug(logPre + 'done size:${len}', {
                len: response._bodySize
            });
			
            if(isProxy){
                if (response.statusCode >= 500 && response.statusCode <= 599 && response.statusCode !== 501) {
                    report(opt, 1, response.statusCode);
                }else{
                    report(opt,0,response.statusCode);
                }
				
                that._proxyResponse.end();
				
                defer.resolve({
                    opt: opt,
                    buffer: buffer,
                    result: null,
                    responseText: responseText,
                    hasError: false,
                    msg: 'success',
                    response: response,
                    times: times
                });
				
				
                return;
            }
			
            if(opt.dataType === response.statusCode){
                report(opt,0,response.statusCode);
                defer.resolve({
                    opt: opt,
                    buffer: buffer,
                    result: null,
                    responseText: responseText,
                    hasError: false,
                    msg: 'success',
                    response: response,
                    times: times
                });

                return;
            }
			
            if(opt.dataType === 'json' || opt.dataType === 'jsonp' || opt.dataType === 'text' || opt.dataType === 'html'){
                responseText = buffer.toString('UTF-8');
            }
			
            if(buffer.length <= 1024){
                if(responseText){
                    if(opt.dataType === 'json' || opt.dataType === 'jsonp' || opt.dataType === 'text'){
                        logger.debug(logPre + 'responseText:\n' + responseText);
                    }
                }else if(/charset=utf-8/i.test(response.headers['Content-Type'])){
                    logger.debug(logPre + 'responseText:\n' + buffer.toString('UTF-8'));
                }
            }
			
            if(responseText){
                buffer = null;
            }
			
            if(response.statusCode !== 200 && response.statusCode !== 666 && response.statusCode !== 206){
                //dataType为proxy但是不走代理模式的时候，30x类型的返回码当作成功上报
                if(response.statusCode >= 300 && response.statusCode < 400){
                    if(opt.dataType === 'proxy'){
                        report(opt,0,response.statusCode);
                    }else{
                        report(opt,2,response.statusCode);
                    }
                }else{
                    report(opt,1,response.statusCode);
                }
				
                defer.reject({
                    opt: opt,
                    buffer: buffer,
                    result: null,
                    responseText: responseText,
                    hasError: false,
                    msg: 'request statusCode : ' + response.statusCode,
                    response: response,
                    times: times
                });

                return;
            }

            if(opt.dataType === 'json' || opt.dataType === 'jsonp'){
				
                try{

                    if(opt.jsonpCallback){
                        //json|jsonp
                        code = `var result=null; var ${opt.jsonpCallback}=function($1){result=$1}; ${responseText}; return result;`;
                        obj = new sbFunction(code)();
                    }else if(opt.dataType === 'json' && opt.useJsonParseOnly){
                        //json only
                        obj = JSON.parse(responseText);
                    }else{
                        //other
                        code = `return (${responseText})`;
                        try{
                            obj = new sbFunction(code)();
                        }catch(e){
                            //尝试JSON.parse
                            obj = JSON.parse(responseText);
                        }
                    }

                }catch(e){

                    let parseErr = e;
					
                    if(e && code){
                        try{
                            code = code.replace(/[\u2028\u2029]/g,'');
                            obj = new sbFunction(code)();
                            parseErr = null;
                        }catch(err){
                            logger.error(`parse response body fail ${err.message}`);
                        }
                    }

                    if(parseErr){
                        logger.error(logPre + 'parse error: ${error} \n\nrequest: ${headers}\nresponse: ${resHeaders}\n\n${responseTextU8}',{
                            error: parseErr.stack,
                            headers: JSON.stringify(opt.headers,null,2),
                            resHeaders: JSON.stringify(response.headers,null,2),
                            responseTextU8: JSON.stringify(responseText,null,2),
                        });
                        report(opt,1,508);
                        defer.reject({
                            opt: opt,
                            buffer: buffer,
                            result: null,
                            responseText: responseText,
                            hasError: false,
                            msg: 'parse error',
                            code: 508,
                            response: response,
                            times: times
                        });
						
                        key = [window.request.headers.host,context.mod_act,parseErr.message].join(':');
				
                        Content = [
                            '<p><strong>错误堆栈</strong></p>',
                            '<p><pre><code>',
                            parseErr.stack,
                            '</code></pre></p>',
                        ].join('');
						
                        require('util/mail/mail.js').SendMail(key,'js data',1800,{
                            'Title'			: key,
                            'runtimeType'	: 'ParseError',
                            'Content'		: Content,
                            'MsgInfo'		: '错误堆栈:\n' + parseErr.stack
                        });
						
                        return;
                    }
					
                }
				
                if(obj){
                    code = obj.code || 0;
                }
				
            }else{
                code = {
                    isFail: 0,
                    code: response.statusCode
                };

                obj = responseText;
            }
			
            if(typeof opt.formatCode === 'function'){
                code = opt.formatCode(obj,opt,response);
            }
			
            //支持{isFail:0,code:1,message:''}
            if(typeof code === 'object'){
				
                if(typeof code.isFail !== 'number'){
                    code.isFail = ~~code.isFail;
                }
				
                if(typeof code.code !== 'number'){
                    code.code = ~~code.code;
                }
				
                report(opt,code.isFail,code.code);
            }else{
				
                if(typeof code !== 'number'){
                    code = ~~code;
                }
				
                if(code === 0){
                    report(opt,0,code);
                }else{
                    report(opt,2,code);
                }
            }
			
			
            defer.resolve({
                opt: opt,
                buffer: buffer,
                result: obj,
                responseText: responseText,
                hasError: false,
                msg: 'success!',
                response: response,
                times: times
            });
        });

    });
	

	
    if(opt.send){
        opt.send(request);
    }else{
		
        if(opt.body){
			
            request.useChunkedEncodingByDefault = false;
            try{
                request.write(opt.body);
            }catch(e){
                logger.info(e.stack);
            }
        }
		
        request.end();
    }
	
    return defer;
};


