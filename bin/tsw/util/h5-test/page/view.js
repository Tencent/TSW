/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger 		= require('logger');
const gzipHttp 		= require('util/gzipHttp.js');
const config 		= require('config');
const pagetmpl 		= require('./tmpl');
const TEReport 		= require('util/auto-report/TEReport.js');
const OALogin 		= require('util/oa-login/index.js');

module.exports = function(request, response) {
	
	OALogin.checkLoginForTSW(request, response, function() {
		module.exports.go(request, response);
	});
};

module.exports.go = async function(request, response, plug) {

	var gzipResponse = gzipHttp.getGzipResponse({
		request: request,
		response: response,
		code: 200,
		contentType: 'text/html; charset=UTF-8'
	});

	var arr = request.REQUEST.pathname.split('/');

	var groupName = "";
	if (arr && arr.length > 3) {
		groupName = arr[3];
	}

	var group = await TEReport.list(groupName).toES6Promise().catch(function() {
		return null;
	});

	var bodyHtml = pagetmpl.new_body_sync({
		appid: '', //私有化部署不存在
		group: group
	});

	var navMenus = context.navMenus;

	if(!navMenus){
		navMenus = [
			{
				href: '/group/page',
				title: '测试环境'
			},
			{
				href: '/h5test/page/alpha',
				title:'染色'
			},
			{
				href: '/log/view/xxx',
				title:'抓包'
			},
			{
				href: '/index',
				title:'首页'
			}
		];
	}

	var responseHtml = pagetmpl.new_main({
		head: {
			title: 'H5测试环境配置'
		},
		body: pagetmpl.new_header(navMenus) + bodyHtml
	});

	gzipResponse.end(responseHtml);
};