/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const cluster		= require('cluster');
const cmem			= require('pool/cmem.l5.js');
const logger		= require('logger');
const gzipHttp		= require('util/gzipHttp.js');
const dcapi			= require('api/libdcapi/dcapi.js');
const serverInfo	= require('serverInfo');
const parseBody		= require('util/http/parseBody.js');
const Deferred		= require('util/Deferred');
const config		= require('config');
const ajax			= require('ajax');
const isWindows		= require('util/isWindows');
const isTST			= require('util/isTST');
const alpha			= require('util/auto-report/alpha');
const cmemTSW		= require('data/cmem.tsw.js');
const url			= require('url');
const fileCache		= require('api/fileCache');
const openapi		= require('util/openapi');
var isFirstLoad	= false;

//以下是提高稳定性用的
function getFileCacheKey(project,key){
	var cacheFilename = [project,key.replace(/\?.+$/,'')].join('/');

	cacheFilename += '.cache';
	return cacheFilename;
}

/**
 *
 * 更新缓存
 *
 */
function updateFileCache(project,key,text){
	text  = text || JSON.stringify({});
	var cacheFilename = getFileCacheKey(project,key);

	//保存到文件
	fileCache.set(cacheFilename,Buffer.from(text,'UTF-8'));
}

//监听restart事件
if(!global[ __filename + '.restart']){
	global[ __filename + '.restart'] = true;
	isFirstLoad = true;
}

if(isFirstLoad){
	cluster.worker && cluster.worker.once('disconnect', function(worker){
		logger.info('save h5test on disconnect event...');
		onDisconnect('restart');
	});
}

function onDisconnect (type) {
	type = type || "restart";
	if(global[__filename]){
		//有数据才fileCache
		try{
			updateFileCache('h5test','test.user.list',JSON.stringify(global[__filename]));
		}catch(e){
			//依然谨慎
		}
	}

}

//提高稳定性结束

//1分钟从memcache中更新一次足够了
var getTimeout = 60000;
var lastUpdateTime	= 0;

//获取测试用户
var getTestUserMap = function(){
	
	//看下fileCache里面有没有
	if(!global[__filename]){
		//进入这个逻辑，是worker restart后的一分钟内的[第一次]，从硬盘同步数据过来；一旦取到数据之后，这里将不再执行
		global[__filename] = module.exports.getTestUserMapFromFileCache() || {};
	}

	if(Date.now() - lastUpdateTime > getTimeout || isWindows.isWindows){
		lastUpdateTime = Date.now();
		syncFromMemcachedOrCloud();
	}
	
	return global[__filename] || {};
};

var syncFromMemcachedOrCloud = function(){
	if(config.appid && config.appkey){
		return syncFromCloud();
	}

	return syncFromMemcached();
};

var syncFromMemcached = function(){

	//从内存中读取testTargetMap
	var memcached	= module.exports.cmem();
	var keyText		= module.exports.keyBitmap();

	if(!memcached){
		return;
	}

	memcached.get(keyText,function(err,data){
		if(err){
			logger.error('memcache get error:' + err);
			data = {};
		}
		if(data === true){
			logger.error('memcache get data true');
			data = {};
		}
		
		global[__filename] = data || {};

		//加到白名单里
		alpha.update(global[__filename]);

		//服务器上超时逻辑里面不做fileCache，较少不必要的磁盘IO;windows环境下一般不会走到这里,just for jest
		if(isWindows.isWindows){
			onDisconnect('test.in.windows');
		}
	});
};

//从云端同步
var syncFromCloud = function(merge){

	if(!config.appid){
		return;
	}

	if(!config.appkey){
		return;
	}

	if(!config.h5testSyncUrl){
		return;
	}

	var postData = {
		appid: config.appid,
		now: Date.now()
	};

	var sig	= openapi.signature({
		pathname: url.parse(config.h5testSyncUrl).pathname,
		method: 'POST',
		data: postData,
		appkey: config.appkey
	});

	postData.sig	= sig;

	ajax.request({
		url			: config.h5testSyncUrl,
		type		: 'POST',
		l5api		: config.tswL5api['openapi.tswjs.org'],
		dcapi		: {
			key: 'EVENT_TSW_OPENAPI_H5TEST_SYNC'
		},
		data		: postData,
		keepAlive	: true,
		autoToken	: false,
		dataType	: 'json'
	}).fail(function(){
		logger.error('syncFromCloud fail.');
		if(merge === 'merge'){
			return;
		}
		global[__filename] = {};
	}).done(function(d){
		var data = null;
		if(d.result && d.result.code === 0){
			data = d.result.data || {};
		}

		if(merge === 'merge'){
			//追加
			global[__filename] = global[__filename] || {};
			Object.assign(global[__filename],data);
		}else{
			//覆盖
			global[__filename] = data || {};
		}

		//加到白名单里
		alpha.update(global[__filename]);

		//服务器上超时逻辑里面不做fileCache，较少不必要的磁盘IO;windows环境下一般不会走到这里,just for jest
		if(isWindows.isWindows){
			onDisconnect('test.in.windows');
		}

		logger.debug('syncFromCloud success.');
	});
};

//是否命中测试环境
module.exports.getTestSpaceInfo = function(req){
	//windows版本，更不用转
	if(isWindows.isWindows){
		return;
	}

	//安全中心请求，也不用转了~
	if(isTST.isTST(req)){
		return;
	}

	//测试环境虽然不用转发，但是还是需要通过拉取名单来触发更新本地名单
	var testTargetMap	= getTestUserMap();

	//配置不转发H5测试环境
	if(config.isForwardH5test && config.isForwardH5test(req) === false) {
		return;
	}

	//如果已经是测试环境，就不用转发了
	if(config.isTest){
		return;
	}

	var uin 		= logger.getKey() || alpha.getUin(req);
	var testIp		= '';
	var testPort	= 80;

	if(
		uin
		&& testTargetMap
		&& testTargetMap[uin]
		&& typeof testTargetMap[uin] === "string"
		&& testTargetMap[uin].split(".").length == 4
	){
		testIp = testTargetMap[uin];

		let arr = testIp.split(':');

		if(arr.length === 2){
			testIp		= arr[0];
			testPort	= ~~arr[1];
		}

		if(serverInfo.intranetIp === testIp) {
			return;
		}

		return {
			testIp: testIp,
			testPort: testPort
		};
	}

	return;
}


//是否命中测试环境
//命中则直接转发请求，return true;不命中则return false
module.exports.isTestUser = function(req, res){
	var testSpaceInfo = module.exports.getTestSpaceInfo(req);

	if(!testSpaceInfo){
		return false;
	}

	var reqUrl      	= req.REQUEST.href;
	var timeout			= config.timeout[req.method.toLowerCase()] || config.timeout.get;
	var testPort		= testSpaceInfo.testPort || 80;
	var testIp			= testSpaceInfo.testIp || '';
	timeout 			= parseInt(timeout * 0.8);

	logger.debug('isTestUser...');
	logger.setGroup('h5test');

	context.mod_act = 'h5_test';

	ajax.proxy(req,res).request({
		url 		: reqUrl,
		type		: req.method,
		dataType	: 'proxy',
		timeout		: timeout,
		retry		: 0,		//不重试
		devIp 		: testIp,
		devPort		: testPort,
		ip			: testIp,
		port		: testPort,
		//关闭自动补token逻辑，安全第一
		autoToken	: false,
		headers		: {
			'isTestUser' : 'true'
			//后台不支持https开头的origin，把origin置空
			//"origin": ""  发给node不需要这个
		},
		dcapi		:{
			key		: 'EVENT_TSW_HTTP_H5_TEST'
		}
	}).done(function(d){
	}).fail(function(d){
		logger.error('h5test proxy fail...');
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		res.writeHead(500);
		res.end();
	});

	return true;
};

//cmem对象
module.exports.cmem = function(){
	return cmemTSW.h5test();
};

//uin对应的存储key，每天一变
module.exports.keyBitmap = function(uin){
	var currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24);
	return "bitmap.h5.test." + currDays;
};

//getTestUser for jest
module.exports.getTestUserMap = getTestUserMap;

module.exports.getTestUserMapFromFileCache = function () {
	var fileCacheKey = getFileCacheKey('h5test','test.user.list');
	var localData = fileCache.getSync(fileCacheKey).data;
	var localJSON = {};

	if(localData){
		//发现有数据
		try{
			localJSON = JSON.parse(localData.toString('utf-8'));
		}catch(e){
			//加个try catch是谨慎一点，防止出现一些奇奇怪怪的问题
		}
	}

	if(typeof localJSON !== 'object'){
		localJSON = {};
	}

	if(!localJSON){
		localJSON = {};
	}

	return localJSON;
};



