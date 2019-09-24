/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const WebSocket = require('ws');
const WSServer = require('./webSocketServer');
const logger = require('logger');
const lang = require('i18n/lang.js');
const domain = require('domain');
const Context = require('runtime/Context');
const contextMod = require('context.js');
const { isWin32Like } = require('util/isWindows.js');
const mail = require('util/mail/mail.js');
const parseGet = require('util/http/parseGet.js');
const tnm2 = require('api/tnm2');
const logReport = require('util/auto-report/logReport');
const h5test = require('util/h5-test/is-test');
const Window = require('runtime/Window');
const config = require('./config.js');
const serverInfo = require('serverInfo.js');
const httpUtil = require('util/http.js');
const wsRoute = require('./ws.route');

function wsFiller(ws, req) {
    if (!ws || typeof ws !== 'object') {
        return;
    }

    ws.logReportTimer = null;
    ws.__tempSend = ws.send;
    ws.reportIndex = 1;

    ws.send = function(message) {
        if (ws.readyState == WebSocket.OPEN) {
            logger.debug('server send message : ${message}', {
                message
            });
            ws.__tempSend(message);
        } else {
            logger.warn('send message fail! WebSocket readyState is : ' + ws.readyState);
        }
    };

    ws.logKey = req.headers['sec-websocket-key'] || Math.random();
}

function emitReportLog(ws, type) {
    ws.upgradeReq.emit(type);
}

function reportWebSocketLog(ws, isEnd) {
    // 这里触发log上报
    const logLength = logger.getTextLength();
    // 每次上报log时，先看下Log多不多，不多的话，延迟上报下
    clearTimeout(ws.logReportTimer);
    if (isEnd) {
        emitReportLog(ws, 'reportLog');
    } else if (logLength > 30) {
        // 立即上报
        emitReportLog(ws, 'reportLogStream');
    } else {
        ws.logReportTimer = setTimeout(function() {
            emitReportLog(ws, 'reportLogStream');
        }, 5000);
    }
}

function bind_listen(server) {
    server.on('error', function(error) {
        logger.debug('ws server error:' + (error && error.stack));
    });

    server.on('connection', function(ws, request) {
        ws.upgradeReq = ws.upgradeReq || request;
        process.SN = process.SN || 0;
        let d = domain.create();
        d.add(ws);
        d.currentContext = new Context();
        d.currentContext.log = {};
        d.currentContext.SN = ++process.SN;
        d.currentContext.window = new Window();
        d.currentContext.window.websocket = ws;
        d.currentContext.window.response = {};
        d.currentContext.isWebsocket = true;
        d.currentContext.beforeLogClean = function() {
            logReport.reportLog();
            logger.clean();
        };

        if (config.enableWindow) {
            d.currentContext.window.enable();
        }

        if (isWin32Like || config.devMode) {
            d.currentContext.log.showLineNumber = true;
        }

        if (global.cpuUsed > config.cpuLimit) {
            d.currentContext.log = null;
        }

        d.on('error', function(err) {
            if (err && err.message && errorIgnore[err.message] === 'ignore') {
                logger.warn(err && err.stack);
                return;
            }

            if (err && err.stack && err.message) {
                const key = err.message;
                const content = `<p><strong>${lang.__('mail.errorStack')}</strong></p><p><pre><code>${err.stack}</code></pre></p>`;
                mail.SendMail(key, 'js', 600, {
                    'title': key,
                    'runtimeType': 'Error',
                    'msgInfo': err.stack || err.message,
                    'content': content
                });

                logger.error(err);
            }
        });

        d.run(function() {
            const req = ws.upgradeReq;
            parseGet(req);
            if (d.currentContext.window) {
                d.currentContext.window.request = req;
            }
            contextMod.currentContext().mod_act = wsRoute.getModAct(ws);
            logger.setGroup('websocket');
            tnm2.Attr_API('SUM_TSW_WEBSOCKET_CONNECT', 1);
            wsFiller(ws, req);

            const clientIp = httpUtil.getUserIp(req);
            logger.debug('idc: ${idc}, server ip: ${intranetIp}, tcp: ${remoteAddress}:${remotePort} > ${localAddress}:${localPort}, client ip: ${clientIp}, cpuUsed: ${cpuUsed}', {
                cpuUsed: global.cpuUsed,
                idc: config.idc,
                intranetIp: serverInfo.intranetIp,
                clientIp: clientIp,
                remoteAddress: (req.socket && req.socket.remoteAddress),
                remotePort: (req.socket && req.socket.remotePort),
                localAddress: (req.socket && req.socket.localAddress),
                localPort: (req.socket && req.socket.localPort)
            });

            if (req.headers['x-client-proto'] === 'https') {
                req.REQUEST.protocol = 'wss';
            } else {
                req.REQUEST.protocol = 'ws';
            }

            let wsClient;
            const testSpaceInfo = h5test.getTestSpaceInfo(req);
            if (testSpaceInfo) {
                const clientReqHeaders = Object.assign({}, req.headers);
                delete clientReqHeaders['sec-websocket-key'];
                wsClient = new WebSocket('ws://' + testSpaceInfo.testIp + req.url, testSpaceInfo.testPort, {
                    headers: clientReqHeaders
                });

                logger.debug('websocket server proxy , proxy server ip: ${proxyServerIp} > ${serverIp}:${serverPort}', {
                    proxyServerIp: serverInfo.intranetIp,
                    serverIp: testSpaceInfo.testIp,
                    serverPort: testSpaceInfo.testPort
                });
            }
            if (wsClient) {
                // 存在代理,new websocket时相当于触发了connection了
                wsClient.on('message', function(data) {
                    // 代理收到目标服务器的回报，再发送给客户端
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(data);
                    }
                });
                wsClient.on('close', function(data, msg) {
                    // 目标服务器关闭
                    ws.close();
                });
                wsClient.on('error', function(error) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send('TSW_Websocket_proxy_client_error');
                    }
                    logger.debug('websocket client error : ${error}', {
                        error
                    });
                });
            } else {
                wsRoute.doRoute(ws, 'connection', { wsServer: server });
            }


            ws.on('message', function(message) {
                logger.debug('server get message size : ${size}', {
                    size: message.length

                });
                tnm2.Attr_API('SUM_TSW_WEBSOCKET_MESSAGE', 1);

                if (wsClient) {
                    // 存在代理
                    if (wsClient.readyState === WebSocket.OPEN) {
                        wsClient.send(message);
                    }
                    return;
                }

                wsRoute.doRoute(ws, 'message', { message: message, wsServer: server });
                reportWebSocketLog(ws);
            });
            ws.once('clear', function() {
                // 清理domain
                setTimeout(function() {
                    reportWebSocketLog(ws, true);
                    logger.debug('clearing');

                    d.remove(ws);

                    req.removeAllListeners('fail');
                    req.removeAllListeners('reportLog');

                    if (d.currentContext) {
                        if (d.currentContext.window) {
                            d.currentContext.window.websocket = null;
                            d.currentContext.window = null;
                        }

                        d.currentContext.beforeLogClean = null;
                        d.currentContext.log = null;
                        d.currentContext = null;
                    }

                    d = null;
                    ws = null;

                    logger.debug('cleared');
                }, 3000);
            });
            ws.once('close', function(code, reason) {
                tnm2.Attr_API('SUM_TSW_WEBSOCKET_CLOSE', 1);
                if (wsClient) {
                    wsClient.close();
                    return;
                }
                wsRoute.doRoute(ws, 'close', { code: code, reason: reason, wsServer: server });
                logger.debug('websocket server close, code : ${code}, reason : ${reason}', {
                    code,
                    reason
                });

                this.emit('clear');
            });
            ws.once('error', function(error) {
                tnm2.Attr_API('SUM_TSW_WEBSOCKET_ERROR', 1);
                if (wsClient) {
                    if (wsClient.readyState === WebSocket.OPEN) {
                        wsClient.send('TSW_Websocket_proxy_server_error');
                    }
                } else {
                    wsRoute.doRoute(ws, 'error', { error: error, wsServer: server });
                }
                logger.debug('websocket server error : ${error}', {
                    error
                });

                reportWebSocketLog(ws);
                this.emit('clear');
            });

            logReport();
            reportWebSocketLog(ws);
        });
    });
}

exports.start_listen = function() {
    const ws = new WSServer({
        server: global.TSW_HTTP_SERVER
    });
    bind_listen(ws);

    if (global.TSW_HTTPS_SERVER) {
        const wss = new WSServer({
            server: global.TSW_HTTPS_SERVER
        });
        bind_listen(wss);
    }
};

const errorIgnore = {
    'socket hang up': 'ignore',
    'Cannot read property \'asyncReset\' of null': 'ignore',
    'Cannot read property \'resume\' of null': 'ignore',
    'write ECONNRESET': 'ignore',
    'This socket is closed': 'ignore'
};
