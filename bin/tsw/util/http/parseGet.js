/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const url			= require('url');
const cookie		= require('cookie');
const qs			= require('qs');
const serverInfo	= require('serverInfo');
const config		= require('config');
const logger		= require('logger');
const httpUtil		= require('util/http.js');
const tnm2 			= require('api/tnm2');

module.exports = function(req){
	
	var v,key,index1,index2;

	if(req.url.indexOf('+') > -1){
		req.REQUEST = url.parse(req.url.replace(/\+/g,' '));
	}else{
		req.REQUEST = url.parse(req.url);
	}

	req.GET		= {};
	req.query	= req.GET;
	req.POST	= {};
	req.body	= req.POST;
	req.params	= {};
	if('upgrade' === req.headers.connection && 'websocket' === req.headers.upgrade) {
		if(req.headers['x-client-proto'] === 'https'){
			req.REQUEST.protocol = 'wss';
		} else {
			req.REQUEST.protocol = 'ws';
		}
	} else if(req.headers['x-client-proto'] === 'https'){
		req.REQUEST.protocol = 'https';
	} else {
		req.REQUEST.protocol = 'http';
	}
	if(req.headers.host){
		req.REQUEST.host = req.REQUEST.hostname = req.headers.host;
	}else if(req.REQUEST.hostname){
		req.REQUEST.host = req.headers.host = req.REQUEST.hostname;
	}

	req.REQUEST.port = 80;
	
	req.REQUEST.query = req.REQUEST.query || '';
	
	if(req.REQUEST.query.length > 16384){
		logger.debug('query large than 16KB :' + req.REQUEST.query.length);
		req.REQUEST.query = req.REQUEST.query.slice(0,16384);
	}

	if(config.allowArrayInUrl){
		try{
			req.GET = qs.parse(req.REQUEST.query);
		}catch(e){
			req.GET = {};
			logger.debug(e.stack);
			logger.report();
		}
	}else{
		//fast parse
		req.REQUEST.query.split('&').forEach(function(v){
			var index = v.indexOf('=');

			if(index < 0){
				return;
			}

			var $1 = v.substr(0,index);
			var $2 = v.substr(index + 1);

			try{
				req.GET[$1] = decodeURIComponent($2);
			}catch(e) {
				req.GET[$1] = null;
			}

		});
	}

	req.query	= req.GET;

	if(req.headers.cookie && req.headers.cookie.length > 16384){
		logger.debug('cookie large than 16KB :' + req.headers.cookie.length);
		req.headers.cookie = req.headers.cookie.slice(0,16384);
	}
	
	if(req.headers.cookie){
		index1 = req.headers.cookie.indexOf('; ');
	}

	if(
		!httpUtil.isFromWns(req)
		&& global.cpuUsed < config.cpuLimit
		&& req.headers.cookie
		&& req.headers.cookie.charAt(0) === ','
		&& req.headers.cookie.charAt(1) === ' '
	){
		
		//logger.info('fix bad cookie(-3002):\n' + httpUtil.getUserIp(req) + '\n'  + httpUtil.getRequestHeaderStr(req));

		logger.debug('orign cookie: ' + req.headers.cookie);

		//兼容wap  cookie开头错误问题
		req.headers.cookie = req.headers.cookie.replace(/, /g,'; ');
		
		logger.report();
		
		tnm2.Attr_API('SUM_TSW_BAD_COOKIE', 1);
	}
	
	if(
		!httpUtil.isFromWns(req)
		&& global.cpuUsed < config.cpuLimit
		&& index1 === -1
	){

		index2 = req.headers.cookie.indexOf(';');
		
		if(index2 > 0 && index2 !== req.headers.cookie.length - 1){
			
			//logger.info('fix bad cookie(-3000):\n' + httpUtil.getUserIp(req) + '\n'  + httpUtil.getRequestHeaderStr(req));
			logger.debug('orign cookie: ' + req.headers.cookie);

			//兼容wap  cookie分号没空格的问题	
			req.headers.cookie = req.headers.cookie.replace(/;/g,'; ');
			
			if(req.headers['x-wns-uin']){
				//...
			}else{
				logger.report();
			}

			tnm2.Attr_API('SUM_TSW_BAD_COOKIE', 1);
		}else if(req.headers.cookie.indexOf(',') > 0){
			
			//logger.info('fix bad cookie(-3001):\n' + httpUtil.getUserIp(req) + '\n' + httpUtil.getRequestHeaderStr(req));
			logger.debug('orign cookie: ' + req.headers.cookie);

			//兼容wap  cookie里全是逗号的问题
			req.headers.cookie = req.headers.cookie.replace(/,/g,'; ');
			
			logger.report();
			
			tnm2.Attr_API('SUM_TSW_BAD_COOKIE', 1);
		}
	}
	
	if(
		!httpUtil.isFromWns(req)
		&& global.cpuUsed < config.cpuLimit
	){
		
		//去掉header里的\u0000
		for(key in req.headers){
			v = req.headers[key];
			
			if(key.indexOf(' ') > -1){
				logger.debug('delete headers : ${key} : ${v}',{
					key	: key,
					v	: v
				});
				
				delete req.headers[key];
				
				continue;
			}

			v = httpUtil.filterInvalidHeaderChar(v);

			if(v !== req.headers[key]){
				req.headers[key] = v;

				logger.debug('find invalid characters in header: ${key}',{
					key: key
				});
			}
		}
		
	}
	
	req.cookies = cookie.parse(req.headers.cookie || '');
	
	req.param = paramFn;

}

function paramFn(name, defaultValue){
	var params = this.params || {};
	var body = this.body || {};
	var query = this.query || {};
	if (null != params[name] && params.hasOwnProperty(name)) return params[name];
	if (null != body[name]) return body[name];
	if (null != query[name]) return query[name];
	return defaultValue;
}

function noArray(GET){

	for(var key in GET){
		if(typeof GET[key] === 'object' && GET[key].length >= 0){
			GET[key] = GET[key][0];
		}
	}

}
