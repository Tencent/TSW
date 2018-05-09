/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const url			= require('url');
const cmem			= require('pool/cmem.l5.js');
const Deferred		= require('util/Deferred');
const config		= require('config');
const dcapi			= require('api/libdcapi/dcapi.js');
const logger		= require('logger');
const {isWindows}	= require('util/isWindows.js');
const cmemTSW		= require('data/cmem.tsw.js');
const tnm2 			= require('api/tnm2');
const gzipHttp		= require('util/gzipHttp.js');
const openapi		= require('util/openapi');
const crypto		= require('crypto');
const cacheTime		= 10 * 60 * 1000;	//最大cache时间

var cacheStart	= Date.now();
var cache		= {};

if(global[__filename]){
	cache = global[__filename];
}else{
	global[__filename] = cache;
}

this.check = function(key,count,second){

	//请求openapi
	if(config.appid && config.appkey && config.utilCDUrl){
		return checkByOpenapi(key,count,second);
	}

	return checkByCmem(key,count,second);
}


var checkByOpenapi = function(keyOri,count,second){
	var defer 	= Deferred.create();
	var appid	= context.appid || null;

	var key	= 'CD3.' + crypto.createHash('sha1').update(`CD3.${appid}.${keyOri}.${count}.${second}`).digest('hex');
	var start = Date.now();

	if(cache[key]){
		if(start - cache[key] < second * 1000){
			logger.debug('miss mem ${key}',{
				key: key
			});

			return defer.reject();
		}
	}

	//清缓存逻辑
	if(start - cacheStart > cacheTime){
		cache		= {};
		cacheStart	= Date.now();
	}


	defer.fail(function(value){
		//设置缓存
		cache[key] = start;
	});

	var postData = {
		appid: config.appid,
		key: key,
		count: count,
		second: second,
		now: Date.now()
	};

	if(!config.utilCDUrl){
		return defer.reject();
	}

	var sig	= openapi.signature({
		pathname: url.parse(config.utilCDUrl).pathname,
		method: 'POST',
		data: postData,
		appkey: config.appkey
	});

	postData.sig	= sig;

	require('ajax').request({
		url			: config.utilCDUrl,
		type		: 'POST',
		l5api		: config.tswL5api['openapi.tswjs.org'],
		dcapi		: {
			key: 'EVENT_TSW_OPENAPI_UTIL_CD'
		},
		data		: postData,
		keepAlive	: true,
		autoToken	: false,
		dataType	: 'json'
	}).fail(function(){
		logger.error('checkByOpenapi fail.');
		defer.reject();
	}).done(function(d){
		var data = null;
		if(d.result && d.result.code === 0){
			data = d.result.data;
		}

		if(data > 0){
			return defer.resolve(data);
		}

		logger.debug('checkByOpenapi success.');
		return defer.reject();
	});

	return defer;
}


this.curr = function(keyOri,count,second){

	var defer 	= Deferred.create();
	var appid	= context.appid || null;

	var key	= 'CD3.' + crypto.createHash('sha1').update(`CD3.${appid}.${keyOri}.${count}.${second}`).digest('hex');

	var memcached = module.exports.cmem();

	if(!memcached){
		return defer.reject();
	}

	memcached.get(key,function(err, result){

		var now = new Date().getTime();

		if(err){
			return defer.reject();
		}

		return defer.resolve(result);
	});

	return defer;
}

var checkByCmem = function(keyOri,count,second){

	var defer 	= Deferred.create();
	var appid	= context.appid || null;

	var key	= 'CD3.' + crypto.createHash('sha1').update(`CD3.${appid}.${keyOri}.${count}.${second}`).digest('hex');
	var start = Date.now();

	if(cache[key]){
		if(start - cache[key] < second * 1000){
			logger.debug('miss mem ${key}',{
				key: key
			});

			return defer.reject();
		}
	}

	//清缓存逻辑
	if(start - cacheStart > cacheTime){
		cache		= {};
		cacheStart	= Date.now();
	}

	var memcached = module.exports.cmem();

	if(!memcached){
		return defer.reject();
	}

	defer.fail(function(value){
		//设置缓存
		cache[key] = start;
	});

	defer.always(function(){
		tnm2.Attr_API('SUM_TSW_CD_CHECK', 1);
	});

	memcached.add(key,1,second,function(err, result){

		var now = new Date().getTime();

		if(err){
			//add失败是正常的
		}

		if(result === true){
			logger.debug(`add ${key} true`);
			return defer.resolve(1);
		}

		logger.debug(`add ${key} fail`);

		if(count <= 1){
			return defer.reject();
		}

		memcached.incr(key,1,function(err, result){

			if(err){
				logger.error(err.satck);
				return defer.reject();
			}

			if(result <= count){
				logger.debug(`incr ${key} : ${result}`);
				return defer.resolve(result);
			}else{
				return defer.reject(result);
			}
		});

	});

	return defer;
}

this.checkByCmem = checkByCmem;

this.cmem = function(){
	if(context.appid && context.appkey){
		return cmemTSW.openapi();
	}
	return cmemTSW.sz();
}

//开放接口
this.openapi = async function(req,res){

	var appid	= context.appid;
	var appkey	= context.appkey;

	if(req.param('appid') !== appid){
		returnJson({ code: -2 , message: 'appid错误'});
		return;
	}

	if(!appid){
		returnJson({ code: -2 , message: 'appid is required'});
		return;
	}

	if(!appkey){
		returnJson({ code: -2 , message: 'appkey is required'});
		return;
	}

	if(!/^[a-zA-Z0-9_\-]{0,50}$/.test(appid)){
		returnJson({ code: -2 , message: 'appid is required'});
		return;
	}

	logger.setKey(`CD_${appid}`);	//上报key

	var key		= req.param('key');
	var second	= ~~req.param('second');	//单位秒
	var count	= ~~req.param('count');		//默认是1

	if(!key){
		returnJson({ code: -2 , message: 'key is required'});
		return;
	}

	if(!second){
		returnJson({ code: -2 , message: 'second is required'});
		return;
	}

	if(second > 48 * 60 * 60){
		returnJson({ code: -2 , message: '不支持超过48h的second'});
		return;
	}

	if(key.length > 256){
		returnJson({ code: -2 , message: 'key.length超过了256'});
		return;
	}

	var data = await checkByCmem(key,count,second).toES6Promise().catch(function(){
		return null;
	});

	var result = {code: 0,data: data};

	returnJson(result);
}

var returnJson = function(json){
	var gzip = gzipHttp.create({
		contentType: 'application/json; charset=UTF-8',
		code: 200
	});

	gzip.write(JSON.stringify(json,null,2));
	gzip.end();
}
