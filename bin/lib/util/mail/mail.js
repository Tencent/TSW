/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const serverInfo	= require('serverInfo.js');
const config		= require('config.js');
const isWindows		= require('util/isWindows.js');
const httpUtil		= require('util/http');
const logger		= require('logger');
const Deferred		= require('util/Deferred');
const url			= require('url');
const crypto		= require('crypto');

this.SendMail = function(key,group,second,oriOpt){

	var opt 	= Deferred.extend({},oriOpt);
	var data	= {};
	var now		= new Date();
	var prefix	= '[runtime]';

	if(isWindows.isWindows){
		return;
	}

	//晚上不发
	//allDaySend强制全天候24小时发送
	if(!opt.allDaySend && now.getHours() < 8){
		return;
	}

	if(context.title){
		opt.Title = `[${context.title}]${opt.Title}`;
	}

	if(config.isTest){
		prefix			+= '[测试环境]';
	}else{
		if(opt.runtimeType){
			prefix += `[${opt.runtimeType}][考核]`;
		}
	}

	opt.Title 			= prefix + opt.Title;

	data.Title			= opt.Title || '';
	data.isTest			= ~~config.isTest;
	data.Content		= opt.Content || '';
	data.MsgInfo		= opt.MsgInfo || '';
	data.intranetIp		= serverInfo.intranetIp || '';
	data.second			= second || '';
	data.idc			= config.idc || '';
	data.logText		= logger.getText() || '';
	data.headerText		= httpUtil.getRequestHeaderStr() || '';
	data.runtimeType	= opt.runtimeType || '';
	data.processTitle	= process.title || '';
	data.processPid		= process.pid || '';

	opt.data			= data;

	if(isWindows.isWindows){
		key = key + Date.now();
	}

	process.nextTick(function(){
		require('util/CD.js').check(key,1,second).done(function(){
			reportOpenapi(data);
		});
	});
}



var reportOpenapi = function(data){
	var defer   = Deferred.create();
	var config  = require('config');
	var ajax    = require('ajax');
	var openapi = require('util/openapi');
	var logger  = require('logger');

	var retCall;

	if(typeof config.beforeRuntimeReport === 'function'){
		retCall = config.beforeRuntimeReport(data);
	}

	//阻止默认上报
	if(retCall === false){
		return defer.resolve(0);;
	}

	if(!config.appid || !config.appkey){
		return;
	}

	if(!config.runtimeReportUrl){
		return;
	}

	var postData = data;

	postData.appid	= config.appid;
	postData.now	= Date.now();

	var sig	= openapi.signature({
		pathname	: url.parse(config.runtimeReportUrl).pathname,
		method		: 'POST',
		data		: postData,
		appkey		: config.appkey
	});

	postData.sig	= sig;

	require('ajax').request({
		url			: config.runtimeReportUrl,
		type		: 'POST',
		l5api		: config.tswL5api['openapi.tswjs.org'],
		dcapi		: {
			key: 'EVENT_TSW_OPENAPI_RUNTIME_REPORT'
		},
		data		: postData,
		keepAlive	: true,
		autoToken	: false,
		dataType	: 'json'
	}).fail(function(){
		logger.error('runtime report fail.');
		defer.reject();
	}).done(function(d){
		if(d.result){
			if(d.result.code === 0){
				logger.debug('runtime report success.');
				return defer.resolve();
			}else{
				logger.debug('runtime report fail.');
				return defer.reject(d.result.code);
			}
		}

		logger.debug('runtime report fail.');
		return defer.reject();
	});

	return defer;
}


//升级周知
this.SendTSWMail = function(opt){

}

//发送周知邮件
this.SendArsMail = function(opt){
	

}


this.findMailARS = function(file){
	return '';
}



