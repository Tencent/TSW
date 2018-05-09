/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const crypto = require('crypto');

/**
 * 计算openapi签名
 * @param  {[string]} method   请求方法  GET/POST
 * @param  {[string]} pathname 请求路径
 * @param  {[object]} data     请求数据
 * @param  {[string]} appkey   应用appkey
 * @return {[string]} sig      签名结果
 */
this.signature = function(opt) {
	opt = opt || {};
	let busidataArr, i, queryArray = [];

	busidataArr = [opt.method, encode(opt.pathname)]; //HTTP请求方式 & encode(uri) & encode(a=x&b=y&...)

	for (i in opt.data) {
		i != 'sig' && queryArray.push(i + '=' + opt.data[i]);
	}
	queryArray.sort(function(val1, val2) {
		if (val1 > val2) {
			return 1;
		}

		if (val1 < val2) {
			return -1;
		}

		return 0;
	});


	queryArray.length > 0 && busidataArr.push(encode(queryArray.join('&')));

	return crypto.createHmac('sha1', opt.appkey + '&').update(busidataArr.join('&')).digest().toString('base64');
}

//encode
function encode(str) {
	let res = encodeURIComponent(str);

	//0~9 a~z A~Z !*()
	res = res.replace(/[^0-9a-zA-Z\-_\.%]/g, function($0) {
		//不用考虑一位数了
		return '%' + $0.charCodeAt(0).toString(16).toUpperCase();
	});

	return res;
};