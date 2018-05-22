/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const WebSocket		= require('ws');
const WSServer		= WebSocket.Server;
const logger		= require('logger');
const ContextWrap	= require('runtime/ContextWrap');
const logReport		= require('util/auto-report/logReport.js');
const parseGet		= require('util/http/parseGet.js');
const tnm2			= require('api/tnm2');
const h5test		= require('util/h5-test/is-test');
// const wsModAct		= require('./ws.mod.act');
const wsRoute		= require('./ws.route');

function bind_listen(server) {
    server.on('error', function(error) {
        logger.debug('ws server error:' + (error && error.stack));
    });

    server.on('connection', function(ws) {
        var req = ws.upgradeReq;
        var wsClient;
        tnm2.Attr_API('SUM_TSW_WEBSOCKET_CONNECT', 1);

        parseGet(req);

        if(req.headers['x-client-proto'] === 'https'){
            req.REQUEST.protocol = 'wss';
        } else {
            req.REQUEST.protocol = 'ws';
        }

        var testSpaceInfo = h5test.getTestSpaceInfo(req);
        if(testSpaceInfo){
            var clientReqHeaders = Object.assign({}, req.headers);
            delete clientReqHeaders['sec-websocket-key'];
            wsClient = new WebSocket('ws://' + testSpaceInfo.testIp + req.url, testSpaceInfo.testPort, {
                headers : clientReqHeaders
            });
        }
        if(wsClient){
            //存在代理,new websocket时相当于触发了connection了
            wsClient.on('message', function(data){
                //代理收到目标服务器的回报，再发送给客户端
                if(ws.readyState == WebSocket.OPEN){
                    ws.send(data);
                }
            });
            wsClient.on('close', function(data, msg){
                //目标服务器关闭
                ws.close();
            });
            wsClient.on('error', function(error){
                if(ws.readyState == WebSocket.OPEN){
                    ws.send('TSW_Websocket_proxy_client_error');
                }
            });
        }else{
            wsRoute.doRoute(ws,'connection');
        }

        ws.on('message', function(message) {
            tnm2.Attr_API('SUM_TSW_WEBSOCKET_MESSAGE', 1);

            if(wsClient){
                //存在代理
                if(wsClient.readyState == WebSocket.OPEN){
                    wsClient.send(message);	
                }
                return;
            }

            var requestData = {};
            try {
                requestData = JSON.parse(message);
            } catch(e) {
                logger.error(`parse message fail ${e.message}`);
            }

            // var mod_act = wsModAct.getModAct(ws);
            var cwrap = new ContextWrap({
                url: req.url
                //reqSocket: ws,
                //rspSocket: ws
            });

            //cwrap.add(ws);
            cwrap.run(function() {
                var window	= context.window || {};
                window.websocket = ws;

                var timeout = 3000;
                var hasEnd = false;
                var tid = setTimeout(function() {
                    logger.debug('[websocket server] respond timeout');
                    if(hasEnd) {
                        return;
                    }
                    hasEnd = true;

                    var respond;
                    var window	= context.window || {};

                    if(requestData.seq) {
                        respond = JSON.stringify({
                            'seq': requestData.seq,
                            'ret': 513,
                            'msg': 'websocket server respond timeout'
                        });
                        tnm2.Attr_API('SUM_TSW_WEBSOCKET_TIMEOUT', 1);
                    } else {
                        respond = JSON.stringify({
                            'ret': 514,
                            'msg': ''
                        });
                    }

                    //将message转成fiddler抓包的包体内容
                    if(cwrap) {
                        if(window.websocket) {
                            window.websocket.upgradeReq.REQUEST.body = message;
                        }
                        if(window.response) {
                            window.response._body = Buffer.from(respond);
                            window.response.setHeader('content-length', window.response._body.length);
                            window.response.setHeader('content-type', 'websocket');
                            window.response.writeHead(101);
                            window.response.emit('afterMessage');
                            window.response.removeAllListeners('sendMessage');
                        }
                        //cwrap.remove(ws);
                        window.websocket = null;
                        cwrap.destroy();
                    }
                }, timeout);

                logReport(window.request, window.response);
                window.response.removeAllListeners('sendMessage');
                window.response.once('sendMessage', function(respondData) {
                    var respond;

                    if(tid) {
                        clearTimeout(tid);
                    }
                    //确认是否已经响应请求
                    if(hasEnd) {
                        return;
                    }
                    hasEnd = true;

                    tnm2.Attr_API('SUM_TSW_WEBSOCKET_RESPONSE', 1);

                    if(respondData) {
                        respond = respondData;
                    } else {
                        respond = {
                            'ret': 0,
                            'msg': ''
                        };
                    }
                    if(requestData.seq) {
                        respond.seq = requestData.seq;
                    }
                    respond = JSON.stringify(respond);
                    if(ws.readyState === 1) {
                        ws.send(respond);
                        logger.debug('websocket message respond: ' + respond);
                    } else {
                        logger.debug('websocket is not open, message respond abort, readyState: ' + ws.readyState);
                    }

                    //将message转成fiddler抓包的包体内容
                    if(window.websocket) {
                        window.websocket.upgradeReq.REQUEST.body = message;
                    }
                    window.response._body = Buffer.from(respond);
                    window.response.setHeader('content-length', window.response._body.length);
                    window.response.setHeader('content-type', 'websocket');
                    window.response.writeHead(101);
                    window.response.emit('afterMessage');
                    //cwrap.remove(ws);
                    window.websocket = null;
                    cwrap.destroy();
                });

                wsRoute.doRoute(ws, 'message', message);
            });
        });
        ws.on('close', function(code, reason) {
            tnm2.Attr_API('SUM_TSW_WEBSOCKET_CLOSE', 1);
            if(wsClient){
                wsClient.close();
                return;
            }
            wsRoute.doRoute(ws, 'close', code, reason);
        });
        ws.on('error', function(error) {
            tnm2.Attr_API('SUM_TSW_WEBSOCKET_ERROR', 1);
            if(wsClient){
                if(wsClient.readyState == WebSocket.OPEN){
                    wsClient.send('TSW_Websocket_proxy_server_error');
                }
                return;
            }
            wsRoute.doRoute(ws, 'error', error);
        });
    });
}

exports.start_listen = function() {
    var ws = new WSServer({
        server: global.TSW_HTTP_SERVER
    });
    bind_listen(ws);

    if(global.TSW_HTTPS_SERVER) {
        var wss = new WSServer({
            server: global.TSW_HTTPS_SERVER
        });
        bind_listen(wss);
    }
};