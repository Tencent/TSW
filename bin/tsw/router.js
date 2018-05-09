/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger		= require('logger');
const httpRoute		= require('../proxy/http.route.js');
const parseGet		= require('util/http/parseGet.js');

this.route = function(url,mod_act){
	
	var req,res;
	var window   	= context.window || {};
	
	req = window.request;
	res = window.response;
	
	if(!req){
		return;
	}
	
	res.removeAllListeners('afterFinish');
	
	if(url){
		
		logger.debug('route to : ${url}',{
			url: url
		});
		
		req.url = url;
		//解析get参数
		parseGet(req);
	}
	
	if(mod_act){
		logger.debug('route to mod_act: ${mod_act}',{
			mod_act: mod_act
		});
		
		context.mod_act   = mod_act;
	}else{
		context.mod_act   = null;
	}
	
	httpRoute.doRoute(req,res);
}


