/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

exports.getModAct = function (ws) {
    const wsModAct = require('./ws.mod.act');
    return wsModAct.getModAct(ws);
};

exports.doRoute = function(ws, type, opts) {
    const wsModMap = require('./ws.mod.map');
    const logger = require('logger');
    const contextMod = require('context.js');

    const mod_act = exports.getModAct(ws),
        moduleObj = wsModMap.find(mod_act, ws);

    if (typeof moduleObj !== 'object') {
        try {
            ws.send('module ' + mod_act + ' is not object');
        } catch (e) {
            logger.error(`send message fail ${e.message}`);
        }
        return;
    }
    if (typeof moduleObj.onConnection !== 'function') {
        moduleObj.onConnection = function(ws) {
            ws.readyState === 1 && ws.send('no onConnection funtion,so go default');
        };
    }
    if (typeof moduleObj.onMessage !== 'function') {
        moduleObj.onMessage = function(ws, data) {
            ws.readyState === 1 && ws.send('no onMessage function,so go default,ws server get message:' + data);
        };
    }
    if (typeof moduleObj.onClose !== 'function') {
        moduleObj.onClose = function() {
            logger.debug('no onClose function, so go default');
        };
    }
    if (typeof moduleObj.onError !== 'function') {
        moduleObj.onError = function() {
            logger.debug('no onError function, so go default');
        };
    }
    if (type === 'connection') {
        moduleObj.onConnection(ws, opts.wsServer);
    } else if (type === 'message') {
        contextMod.currentContext().mod_act = mod_act;
        moduleObj.onMessage(ws, opts.message, opts.wsServer);
    } else if (type === 'close') {
        moduleObj.onClose(ws, opts.code, opts.reason, opts.wsServer);
    } else if (type === 'error') {
        moduleObj.onError(ws, opts.error, opts.wsServer);
    }
};
