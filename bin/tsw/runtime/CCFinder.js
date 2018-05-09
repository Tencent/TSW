/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const config		= require('config');
const logger		= require('logger');
const httpUtil		= require('util/http');
const serverInfo	= require('serverInfo.js');
const isTST			= require('util/isTST.js');
const mail			= require('util/mail/mail.js');
const CD			= require('util/CD.js');
const tnm2	 		= require('api/tnm2');
const CCIPSize		= 1000;						//统计周期
const CCIPLimit		= config.CCIPLimit;			//限制
var ipConut			= CCIPSize;
var cache			= {
	ipCache: {},
	whiteList: {},
	ipCacheLast: {}
};

if(global[__filename]){
	cache = global[__filename];
}else{
	global[__filename] = cache;
}

this.addWhiteList = function(userIp){
	cache.whiteList[userIp] = true;
}

this.checkHost = function(req, res){

	var hostAllow	= config.allowHost || [];
	var pass		= true,i,len,v;
	var host		= req.headers['host'];

	if(hostAllow.length === 0){
		return true;
	}

	if(host === serverInfo.intranetIp){
		return true;
	}

	for( i = 0, len = hostAllow.length; i < len; i++){
		v = hostAllow[i];

		if(typeof v === 'string'){
			if(v === host){
				return true;
			}
		}else if(typeof v === 'object'){
			if(v.test && v.test(host)){
				return true;
			}
		}
	}

	logger.debug('limit by config.allowHost');

	res.setHeader('Content-Type', 'text/html; charset=UTF-8');
	res.writeHead(508);
	res.end();

	return false;
}

//计算标准方差
this.StdX10 = function(ipCache){

	var res		= 0;
	var sum		= 0;
	var avg		= 0;
	var arr 	= Object.keys(ipCache).filter(function(item){
		var tmp = ipCache[item];
		if(typeof tmp === 'object' && tmp.list){
			sum   += tmp.list.length;
			return true;
		}
		return false;
	});

	if(arr.length <= 1){
		return 0;
	}

	avg = sum / arr.length;

	var sumXsum = arr.reduce(function(pre,key){
		var item	= ipCache[key];
		var value	= item.list.length;
		item.avg	= avg;

		return pre + (value - avg)*(value - avg);
	},0);

	res = parseInt(Math.sqrt(sumXsum / (arr.length - 1)) * 10);

	return res;
}

this.check = function(req, res){

	var CCIPLimitBase	= 1;  //1倍大小
	var userIp		= httpUtil.getUserIp(req);
	var userIp24	= httpUtil.getUserIp24(req);
	var isInnerIP	= httpUtil.isInnerIP(userIp);
	var key,Content,tmp;
	var info	= {
		userIp		: userIp,
		hostname	: req.headers.host,
		pathname	: req.REQUEST.pathname
	};
	var last,curr;

	if(cache.whiteList[userIp]){
		return true;
	}

	if(cache.whiteList[userIp24]){
		return true;
	}

	//忽略TST请求
	if(isTST.isTST(req)){
		return true;
	}

	if(!cache.ipCache.start){
		cache.ipCache.start = Date.now();
	}
	
	ipConut		= ipConut - 1;
	
	if(ipConut <= 0){
		ipConut				= CCIPSize;
		cache.ipCache.end	= Date.now();
		cache.ipCache.StdX10= this.StdX10(cache.ipCache);
		cache.ipCacheLast	= cache.ipCache;
		cache.ipCache		= {};
		cache.whiteList     = {};

		//上报标准方差
		tnm2.Attr_API_Set('AVG_TSW_IP_STD_X10', cache.ipCacheLast.StdX10);
	}

	if(Date.now() - cache.ipCache.start > 60000){
		//时间太长
		ipConut = 0;
		return true;
	}
	
	if(!cache.ipCache[userIp]){
		cache.ipCache[userIp] = {
			ip007Info: null,
			isSendMail: false,
			list: []
		};
	}
	
	curr = cache.ipCache[userIp];
	last = cache.ipCacheLast[userIp];
	
	curr.list.push(info);

	if(CCIPLimit <= -1){
		return true;
	}

	if(config.isTest){
		//测试环境
		return true;
	}
	
	if(config.devMode){
		//开发环境
		return true;
	}

	if(!cache.ipCacheLast.StdX10){
		return true;
	}
	
	if(cache.ipCacheLast.StdX10 <= CCIPLimit){
		return true;
	}

	if(cache.ipCacheLast.hasSendMail){
		return true;
	}

	//tnm2.Attr_API('SUM_TSW_CC_LIMIT', 1);

	//确认没发送过邮件
	cache.ipCacheLast.hasSendMail = true;

	//发现目标，发邮件
	key = `[AVG_TSW_IP_STD_X10]:${serverInfo.intranetIp}`;

	Content = '';

	Object.keys(cache.ipCacheLast).forEach(function(ip,i){

		var num = '';

		if(
			cache.ipCacheLast[ip]
			&& cache.ipCacheLast[ip].list
			&& cache.ipCacheLast[ip].list.length > 1
		){
			num = '' + cache.ipCacheLast[ip].list.length;
			num = (num + 'XXXXXX').slice(0,8).replace(/X/g,'&nbsp;');
			Content	+= `<div style="font-size:12px;">${num}${ip}</div>`;
		}
	});

	mail.SendMail(key,'TSW',3600,{
		'To'			: config.mailTo,
		'CC'			: config.mailCC,
		'Title'			: `[IP聚集告警][${cache.ipCacheLast.StdX10}%]${serverInfo.intranetIp}`,
		'Content'		: '<p><strong>服务器IP：</strong>' + serverInfo.intranetIp + '</p>'
						+ '<p><strong>IP聚集度：</strong>' + cache.ipCacheLast.StdX10  + '%</p>'
						+ '<p><strong>告警阀值：</strong>' + CCIPLimit + '</p>'
						+ '<p><strong>正常值：</strong>5-50</p>'
						+ '<p><strong>检测耗时：</strong>' + parseInt((cache.ipCacheLast.end - cache.ipCacheLast.start)/1000) + 's</p>'
						+ '<p><strong>证据列表：</strong></p>'
						+ Content
	});


	return true;
}


this.getIpCache = function(){
	return cache.ipCacheLast;
};


this.getIpSize = function(){
	return CCIPSize;
};

