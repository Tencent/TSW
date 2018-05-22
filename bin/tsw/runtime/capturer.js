/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * 抓包
 *
 */
const http			= require('http');
const https			= require('https');
var isFirstLoad 	= true;

if(global[__filename]){
    isFirstLoad = false;
}else{
    global[__filename] = {};
}

isFirstLoad &&
process.nextTick(function() {
    const logger		= require('logger');
    const httpUtil		= require('util/http');
    const alpha			= require('util/auto-report/alpha.js');
    const serverInfo	= require('serverInfo.js');

    const create	= function(oriRequest,protocol){
        return function(...args){
            var opt				= args[0];
            var request			= oriRequest.apply(this,args);
            var captureBody		= false;
            var result			= [];
            var buffer			= Buffer.alloc(0);
            var bodySize		= 0;
            var maxBodySize 	= 1024 * 1024;
            var timeStart		= Date.now();
            var timeEnd			= 0;
            var timeResponse	= 0;
            // var timeCurr		= timeStart;
            var remoteAddress	= '';
            var remotePort		= '';
            var localAddress	= '';
            var localPort		= '';
            var host			= (opt.headers && opt.headers.host) || opt.host;

            if(context.requestCaptureSN){
                context.requestCaptureSN++;
            }else{
                context.requestCaptureSN = 1;
            }

            var SN		= context.requestCaptureSN || 0;
            var logPre	= `[${SN}] `;

            logger.debug(logPre + '${method} ${ip}:${port} ~ ${protocol}//${host}${path}',{
                protocol	: protocol,
                method		: opt.method,
                host		: host,
                ip			: opt.host,
                port		: opt.port || (protocol === 'https:' ? 443 : 80),
                path		: opt.path
            });

            //抓包
            if(alpha.isAlpha()){
                logger.debug(logPre + 'capture body on');
                captureBody = true;
            }

            if(captureBody){
                httpUtil.captureBody(request);

                request.once('finish',function(){
                    logger.debug(logPre + 'send finish, total size ' + this._body.length);
                });
            }

            var report = function(oriResponse){
                var logJson		= logger.getJson();
                var response 	= oriResponse || {
                    headers : {
                        'content-length'	: 0,
                        'content-type'		: 'text/html'
                    },
                    httpVersion 	: '1.1',
                    statusCode		: 513,
                    statusMessage	: 'server buisy'
                };

                if(!logJson){
                    logger.debug('logger.getJson() is empty!');
                    return;
                }

                var curr		= {
                    SN				: SN,

                    protocol		: protocol === 'https:' ? 'HTTPS' : 'HTTP',
                    host    		: host,
                    url 			: `${protocol}//${host}${opt.path}`,
                    cache   		: '',
                    process 		: 'TSW:' + process.pid,
                    resultCode  	: response.statusCode,
                    contentLength	: bodySize || response.headers['content-length'],
                    contentType		: response.headers['content-type'],
                    clientIp     	: localAddress || serverInfo.intranetIp,
                    clientPort     	: localPort || '',
                    serverIp       	: remoteAddress || opt.host,
                    serverPort		: remotePort || opt.port,
                    requestRaw   	: httpUtil.getClientRequestHeaderStr(request) + (request._body.toString('UTF-8') || ''),
                    responseHeader 	: httpUtil.getClientResponseHeaderStr(response,bodySize),
                    responseBody  	: (buffer.toString('base64')) || '',
                    timestamps   	: {
                        ClientConnected    : new Date(timeStart),
                        ClientBeginRequest : new Date(timeStart),
                        GotRequestHeaders  : new Date(timeStart),
                        ClientDoneRequest  : new Date(timeStart),
                        GatewayTime        : 0,
                        DNSTime            : 0,
                        TCPConnectTime     : 0,
                        HTTPSHandshakeTime : 0,
                        ServerConnected    : new Date(timeStart),
                        FiddlerBeginRequest: new Date(timeStart),
                        ServerGotRequest   : new Date(timeStart),
                        ServerBeginResponse: new Date(timeResponse),
                        GotResponseHeaders : new Date(timeResponse),
                        ServerDoneResponse : new Date(timeEnd),
                        ClientBeginResponse: new Date(timeResponse),
                        ClientDoneResponse : new Date(timeEnd)
                    }
                };

                logJson.ajax.push(curr);
            };

            request.once('response',(response)=>{
                timeResponse	= Date.now();

                var socket		= response.socket;

                process.domain && process.domain.add(response);

                remoteAddress	= socket.remoteAddress;
                remotePort		= socket.remotePort;
                localAddress	= socket.localAddress;
                localPort		= socket.localPort;

                logger.debug(logPre + '${localAddress}:${localPort} > ${remoteAddress}:${remotePort} response ${statusCode} cost:${cost}ms ${encoding}',{
                    remoteAddress	: remoteAddress,
                    remotePort		: remotePort,
                    localAddress	: localAddress,
                    localPort		: localPort,
                    statusCode: response.statusCode,
                    encoding: response.headers['content-encoding'],
                    cost: timeResponse - timeStart
                });

                var done = function(){
                    this.removeListener('data',data);

                    if(timeEnd){
                        return;
                    }

                    timeEnd = new Date().getTime();

                    if(captureBody){
                        buffer = Buffer.concat(result);
                        result = [];
                    }

                    //上报
                    if(captureBody){
                        report(response);
                    }
                };

                var data = function(chunk){
                    // var cost = Date.now() - timeCurr;

                    // timeCurr = Date.now();

                    //logger.debug('${logPre}receive data: ${size},\tcost: ${cost}ms',{
                    //	logPre: logPre,
                    //	cost: cost,
                    //	size: chunk.length
                    //});

                    bodySize += chunk.length;

                    if(captureBody && bodySize <= maxBodySize){
                        result.push(chunk);
                    }
                };

                response.on('data',data);

                response.once('close',function(){
                    logger.debug(logPre + 'close');

                    done.call(this);
                });

                response.once('end',function(){
                    var cost = Date.now() - timeStart;

                    logger.debug('${logPre}end size：${size}, receive data cost: ${cost}ms',{
                        logPre: logPre,
                        cost: cost,
                        size: bodySize
                    });

                    done.call(this);
                });

            });

            return request;
        };
    };

    http.request	= create(http.request,'http:');
    https.request	= create(https.request,'https:');
});

