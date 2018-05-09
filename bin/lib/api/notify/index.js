/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const Deferred	= require('util/Deferred');
const auth		= require('./util/auth.js');
const logger	= require('logger');
const config	= require('config');

this.DecryptTicketWithClientIP = function(opt){
	var defer 	= Deferred.create();

	return defer.resolve();
}


this.SendRTX = function(opt){
	var defer 	= Deferred.create();

	return defer.resolve();
}


this.SendMail = function(opt){
	
	opt	= Deferred.extend({
		'appKey'		: '',
		'sysId'			: 0,
		'EmailType'		: 1,		//邮件类型，可选值0（外部邮件），1（内部邮件），2（约会邮件）
		'From'			: '',		//邮件发送人
	    'To'			: '',  		//邮件接收人
	    'Title'			: '',  		//邮件标题
	    'Content'		: '',  		//邮件内容
	    'Priority'		: 0,  		//邮件优先级，-1低优先级，0普通，1高优先级
	    'BodyFormat'	: 0,  		//邮件格式，0 文本、1 Html
	    
	    'CC'			: '',  		//邮件抄送人
	    'Bcc'			: '',  		//邮件密送人
	    'Location'		: '',  		//当邮件为约会邮件时，约会地点
	    'Organizer'		: '',  		//当邮件为约会邮件时，约会组织者
	    'StartTime'		: '',  		//当邮件为约会邮件时，约会开始时间
	    'EndTime'		: '',  		//当邮件为约会邮件时，约会结束时间
	    'attachment'	: ''  		//邮件附件的文件名以及文件的内容（在发送请求时，文件内容是二进制数据流的形式发送）
	},opt);

	var defer 	= Deferred.create();

	return defer.resolve();
}


this.SendWeiXin = function(opt){

	opt	= Deferred.extend({
		'appKey'		: '',
		'sysId'			: 0,
		'MsgInfo'		: '',		//内容
		'Priority'		: 0,		//优先级，-1低优先级，0普通，1高优先级
		'Receiver'		: '',		//接收人，英文名，多人用英文分号分隔
		'Sender'		: ''		//发送人
	},opt);

	var defer 	= Deferred.create();

	return defer.resolve();
}


this.SendSMS = function(opt){

	opt	= Deferred.extend({
		'appKey'		: '',
		'sysId'			: 0,
		'MsgInfo'		: '',		//内容
		'Priority'		: 0,		//优先级，-1低优先级，0普通，1高优先级
		'Receiver'		: '',		//接收人，英文名，多人用英文分号分隔
		'Sender'		: ''		//发送人
	},opt);

	var defer 	= Deferred.create();

	return defer.resolve();
}

