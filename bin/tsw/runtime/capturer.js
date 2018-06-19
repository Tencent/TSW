/* !
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
const http = require('http');
const https = require('https');
const net = require('net');
let isFirstLoad = true;

if (global[__filename]) {
    isFirstLoad = false;
} else {
    global[__filename] = {};
}

isFirstLoad &&
process.nextTick(function() {
    const logger = require('logger');
    const httpUtil = require('util/http');
    const alpha = require('util/auto-report/alpha.js');
    const serverInfo = require('serverInfo.js');

    const create = function(oriRequest, protocol) {
        return function(...args) {
            const opt = args[0];
            const request = oriRequest.apply(this, args);
            let captureBody = false;
            let result = [];
            let buffer = Buffer.alloc(0);
            let bodySize = 0;
            const maxBodySize = 1024 * 1024;
            const timeStart = Date.now();
            let timeLookup = timeStart;
            let timeConnect = timeStart;
            let timeResponse = 0;
            let timeEnd = 0;
            let remoteAddress = '';
            let remotePort = '';
            let localAddress = '';
            let localPort = '';
            const host = (opt.headers && opt.headers.host) || opt.host;

            if (context.requestCaptureSN) {
                context.requestCaptureSN++;
            } else {
                context.requestCaptureSN = 1;
            }

            const SN = context.requestCaptureSN || 0;
            const logPre = `[${SN}] `;

            logger.debug(logPre + '${method} ${ip}:${port} ~ ${protocol}//${host}${path}', {
                protocol: protocol,
                method: opt.method,
                host: host,
                ip: opt.host,
                port: opt.port || (protocol === 'https:' ? 443 : 80),
                path: opt.path
            });

            // 抓包
            if (alpha.isAlpha()) {
                logger.debug(logPre + 'capture body on');
                captureBody = true;
            }

            if (captureBody) {
                httpUtil.captureBody(request);

                request.once('finish', function() {
                    logger.debug(logPre + 'send finish, total size ' + this._body.length);
                });
            }

            const report = function(oriResponse) {
                const logJson = logger.getJson();
                const response = oriResponse || {
                    headers: {
                        'content-length': 0,
                        'content-type': 'text/html'
                    },
                    httpVersion: '1.1',
                    statusCode: 513,
                    statusMessage: 'server buisy'
                };

                if (!logJson) {
                    logger.debug('logger.getJson() is empty!');
                    return;
                }

                const curr = {
                    SN: SN,

                    protocol: protocol === 'https:' ? 'HTTPS' : 'HTTP',
                    host: host,
                    url: `${protocol}//${host}${opt.path}`,
                    cache: '',
                    process: 'TSW:' + process.pid,
                    resultCode: response.statusCode,
                    contentLength: bodySize || response.headers['content-length'],
                    contentType: response.headers['content-type'],
                    clientIp: localAddress || serverInfo.intranetIp,
                    clientPort: localPort || '',
                    serverIp: remoteAddress || opt.host,
                    serverPort: remotePort || opt.port,
                    requestHeader: httpUtil.getClientRequestHeaderStr(request),
                    requestBody: request._body ? request._body.toString('base64') : '',
                    responseHeader: httpUtil.getClientResponseHeaderStr(response, bodySize),
                    responseBody: (buffer.toString('base64')) || '',
                    timestamps: {
                        ClientConnected: new Date(timeStart),
                        ClientBeginRequest: new Date(timeStart),
                        GotRequestHeaders: new Date(timeStart),
                        ClientDoneRequest: new Date(timeStart),
                        GatewayTime: 0,
                        DNSTime: timeLookup - timeStart,
                        TCPConnectTime: timeConnect - timeStart,
                        HTTPSHandshakeTime: 0,
                        ServerConnected: new Date(timeConnect),
                        FiddlerBeginRequest: new Date(timeStart),
                        ServerGotRequest: new Date(timeStart),
                        ServerBeginResponse: new Date(timeResponse),
                        GotResponseHeaders: new Date(timeResponse),
                        ServerDoneResponse: new Date(timeEnd),
                        ClientBeginResponse: new Date(timeResponse),
                        ClientDoneResponse: new Date(timeEnd)
                    }
                };

                logJson.ajax.push(curr);
            };


            const finish = function(maybeResponse) {
                if (timeEnd) {
                    return;
                }

                timeEnd = new Date().getTime();

                request.removeListener('response', onResponse);
                request.removeListener('socket', onSocket);
                request.removeListener('error', onError);

                if (captureBody) {
                    buffer = Buffer.concat(result);
                    result = [];
                }

                // 上报
                if (captureBody) {
                    report(maybeResponse);
                }
            };

            const onResponse = function(response) {
                timeResponse = Date.now();

                const socket = response.socket;

                process.domain && process.domain.add(response);

                remoteAddress = socket.remoteAddress;
                remotePort = socket.remotePort;
                localAddress = socket.localAddress;
                localPort = socket.localPort;

                logger.debug(logPre + '${localAddress}:${localPort} > ${remoteAddress}:${remotePort} response ${statusCode} cost:${cost}ms ${encoding}', {
                    remoteAddress: remoteAddress,
                    remotePort: remotePort,
                    localAddress: localAddress,
                    localPort: localPort,
                    statusCode: response.statusCode,
                    encoding: response.headers['content-encoding'],
                    cost: timeResponse - timeStart
                });

                const done = function() {
                    this.removeListener('data', data);
                    finish(response);
                };

                const data = function(chunk) {
                    bodySize += chunk.length;

                    if (captureBody && bodySize <= maxBodySize) {
                        result.push(chunk);
                    }
                };

                response.on('data', data);

                response.once('close', function() {
                    logger.debug(logPre + 'close');

                    done.call(this);
                });

                response.once('end', function() {
                    const cost = Date.now() - timeStart;

                    logger.debug('${logPre}end size：${size}, receive data cost: ${cost}ms', {
                        logPre: logPre,
                        cost: cost,
                        size: bodySize
                    });

                    done.call(this);
                });

            };

            const onError = function(err) {
                logger.error(err.stack);
                finish();
            };

            const onSocket = function(socket) {
                if (socket.remoteAddress) {
                    timeLookup = Date.now();
                    timeConnect = Date.now();
                    remoteAddress = socket.remoteAddress;
                    remotePort = socket.remotePort;
                    const cost = timeLookup - timeStart;
                    logger.debug(`${logPre}socket reuse ${remoteAddress}:${remotePort}, cost ${cost}ms`);
                    return;
                }

                const onError = function(err) {
                    logger.error(logPre + err.stack);
                    clean();
                    finish();
                };

                const onConnect = function() {
                    timeConnect = Date.now();
                    const cost = timeConnect - timeStart;
                    remoteAddress = this.remoteAddress;
                    remotePort = this.remotePort;
                    logger.debug(`${logPre}connect ${remoteAddress}:${remotePort}, cost ${cost}ms`);
                    clean();
                };

                const onLookup = function(err, address, family, host) {
                    timeLookup = Date.now();
                    if (err) {
                        logger.error(logPre + err.stack);
                        clean();
                        finish();
                        return;
                    }
                    const cost = timeLookup - timeStart;
                    logger.debug(`${logPre}dns lookup ${host} -> ${address}, cost ${cost}ms`);
                };

                const clean = function() {
                    socket.removeListener('error', onError);
                    socket.removeListener('connect', onConnect);
                    socket.removeListener('lookup', onLookup);
                };

                if (!net.isIP(opt.host)) {
                    socket.once('lookup', onLookup);
                }

                socket.once('connect', onConnect);
                socket.once('error', onError);
            };

            request.once('socket', onSocket);
            request.once('error', onError);
            request.once('response', onResponse);

            return request;
        };
    };

    http.request = create(http.request, 'http:');
    https.request = create(https.request, 'https:');
});

