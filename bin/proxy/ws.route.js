/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

exports.doRoute = function(ws, type, d1, d2) {
	var  wsModAct	= require('./ws.mod.act');
	var	 wsModMap	= require('./ws.mod.map');
	var  logger		= require('logger');
	var  contextMod	= require('context.js');

	var mod_act = wsModAct.getModAct(ws),
		moduleObj = wsModMap.find(mod_act, ws);
	if (typeof moduleObj !== 'object') {
		try {
			ws.send('module ' + mod_act + ' is not object');
		} catch (e) {

		}
		return;
	}
	if (typeof moduleObj.onConnection != 'function') {
		moduleObj.onConnection = function(ws) {
			1 == ws.readyState && ws.send('no onConnection funtion,so go default');
		};
	}
	if (typeof moduleObj.onMessage != 'function') {
		moduleObj.onMessage = function(ws, data) {
			1 == ws.readyState && ws.send('no onMessage function,so go default,ws server get message:' + data);
		};
	}
	if (typeof moduleObj.onClose != 'function') {
		moduleObj.onClose = function() {
			logger.debug('no onClose function, so go default');
		};
	}
	if (typeof moduleObj.onError != 'function') {
		moduleObj.onError = function() {
			logger.debug('no onError function, so go default');
		};
	}
	if ('connection' == type) {
		moduleObj.onConnection(ws);
	} else if ('message' == type) {
		contextMod.currentContext().mod_act = mod_act;
		moduleObj.onMessage(ws, d1);
	} else if ('close' == type) {
		moduleObj.onClose(ws, d1, d2);
	} else if ('error' == type) {
		moduleObj.onError(ws, d1);
	}
}