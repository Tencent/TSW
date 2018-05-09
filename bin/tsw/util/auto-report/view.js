/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger		= require('logger');
const gzipHttp		= require('util/gzipHttp.js');
const config		= require('config');
const post			= require('./post');
const postOpenapi	= require('./post.openapi.js');
const tmpl 			= require('./tmpl');
const OALogin		= require('util/oa-login/index.js');
const httpUtil		= require('util/http');
const hls 			= require('./highlight-tsw.js');
const canIuse		= /^[0-9a-zA-Z_\-]{0,64}$/;
const CD 			= require('util/CD.js');
const MAX_ALPHA_LOG	= post.MAX_ALPHA_LOG;

tmpl.hls = hls;

module.exports = function(request, response){
	OALogin.checkLoginForTSW(request,response,function(){
		module.exports.go(request,response);
	});
}

module.exports.checkLogin = function(request, response, callback){
	OALogin.checkLoginForTSW(request,response,function(){
		callback();
	});
}

module.exports.go = function(request, response){

	var arr			= request.REQUEST.pathname.split('/');
	var appid		= context.appid || '';
	var group		= arr[3];
	var key			= arr[4];
	var groupKey	= 'v2.group.alpha';
	var limit		= ~~context.limit || 64;
	var currPost	= post;

	if(appid){
		currPost	= postOpenapi;
		groupKey	= `${appid}/v2.group.alpha`;
	}

	if(!key){
		key		= group;
		group	= '';
	}

	if(!canIuse.test(appid)){
		return returnError('appid格式非法');
	}

	if(!canIuse.test(group)){
		return returnError('group格式非法');
	}

	if(!canIuse.test(key)){
		return returnError('key格式非法');
	}

	var createLogKey = function(appid,group,key){
		var logKey		= key;

		if(group){
			logKey	= `${group}/${logKey}`;
		}

		return logKey;
	};

	var logKey		= createLogKey(appid,group,key);

	if(appid){
		logKey	= `${appid}/${logKey}`;
	}

	//上下文设置
	context.group			= group;
	context.limit			= limit;
	context.key				= key;
	context.groupKey		= groupKey;
	context.logKey			= logKey;
	context.createLogKey	= createLogKey;

	var logCount	= 0;
	var logKeyCount	= 0;
	var logNumMax	= context.MAX_ALPHA_LOG || MAX_ALPHA_LOG;
	var currDays	= parseInt(Date.now() / 1000 / 60 / 60 / 24);

	logger.debug('logKey :${logKey}',{
		logKey: logKey
	});

	if(request.GET.type === 'json'){
		currPost.getLogJson(logKey,limit).done(function(logArr){
			var gzipResponse = gzipHttp.getGzipResponse({
				request: request,
				response: response,
				code: 200,
				contentType: 'text/html; charset=UTF-8'
			});

			gzipResponse.end(JSON.stringify(logArr,null,2));
		});
	}else{
		CD.curr(`SUM_TSW_ALPHA_LOG_KEY.${currDays}`,logNumMax,24 * 60 * 60).done(function(count){
			logKeyCount = ~~ count;
		}).always(function(){
			CD.curr(`SUM_TSW_ALPHA_LOG.${currDays}`,logNumMax * logNumMax * logNumMax,24 * 60 * 60).done(function(count){
				logCount = ~~ count;
			}).always(function(){
				currPost.getLog(logKey,limit).done(function(logArr){
					currPost.getLog(groupKey,limit).done(function(groupArr){

						var html = tmpl.log_view({
							logKeyCount: logKeyCount,
							logNumMax: logNumMax,
							logCount: logCount,
							logArr: logArr,
							groupArr: groupArr,
							//也代表顺序
							nameMap : {
								html	: 'html',
								XHR		: 'XHR',
								js		: 'js',
								image	: 'image',
								css		: 'css',
								webapp  : 'webapp',
								websocket : 'websocket',
								tsw		: 'tsw',
								font	: '字体'
							}
						});

						var gzipResponse = gzipHttp.getGzipResponse({
							request: request,
							response: response,
							code: 200,
							contentType: 'text/html; charset=UTF-8'
						});

						gzipResponse.end(html);
					});
				});
			});
		});
	}
}

function returnError(message){
	var window = context.window;
	var gzipResponse = gzipHttp.getGzipResponse({
		request: window.request,
		response: window.response,
		code: 200,
		contentType: 'text/html; charset=UTF-8'
	});

	gzipResponse.end(message);
}



