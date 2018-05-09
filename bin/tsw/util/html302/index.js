/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const gzipHttp		= require('util/gzipHttp');
const logger		= require('logger');
const tmpl			= require('./tmpl.js');
const httpUtil		= require('util/http.js');

//用html代替302跳转
this.go = function(url){
	
	var data	= {};
	var window   	= context.window || {};
	var request		= window.request;
	var response	= window.response;
	
	data.url = url;
	
	logger.debug('jump to : ' + url);
	
	
	if(request && request.headers['x-wns-uin']){
		
		
		var html = tmpl.jump(data);
		
		var gzip = gzipHttp.create({
			code: 200,
			offline: 'false'
		});
		
		gzip.write(html);
		gzip.end();
		
		return;
	}
	
	if(httpUtil.checkInvalidHeaderChar(url)){
		url = encodeURI(url);
	}

	response.setHeader('location', url);
	response.writeHead(302, {'Content-Type': 'text/html; charset=UTF-8'});
	response.end();
	
}
