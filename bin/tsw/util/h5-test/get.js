/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const logger		= require('logger');
const Deferred		= require('util/Deferred');
const isTest 		= require('./is-test.js');
const post			= require('util/auto-report/post.js');
const gzipHttp		= require('util/gzipHttp.js');
const OALogin		= require('util/oa-login/index.js');

module.exports = function(request, response) {
    OALogin.checkLoginForTSW(request, response, function() {
        module.exports.go(request, response);
    });
};

module.exports.go = async function(request, response){
		
    var data = await module.exports.getTestUser().toES6Promise().catch(function(){
        return null;
    });

    var result = {code: 0,data: data};

    returnJson(result);
};

module.exports.getTestUser = function(){
    logger.debug('getTestUser');

    //从内存中读取testTargetMap
    var memcached	= isTest.cmem();
    var keyText		= isTest.keyBitmap();
    var defer		= Deferred.create();
    var appid		= '';

    if(context.appid && context.appkey){
        //开平过来的
        appid	= context.appid;
        keyText = `${keyText}.${appid}`;
    }

    if(!memcached){
        return defer.resolve({});
    }

    memcached.get(keyText,function(err,data){

        if(appid && typeof data === 'string'){
            //解密
            data = post.decode(context.appid,context.appkey,data);
        }

        if(err){
            logger.error('memcache get error:' + err);
            defer.reject('memcache get error');
        }else if(typeof data == 'object'){
            logger.debug('getTestUser success!');
            defer.resolve(data);
        }else{
            logger.debug('memcache return not a object');
            defer.resolve({});
        }
    });
	
    return defer;
};


module.exports.openapi = async function(req,res){

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

    if(!/^[a-zA-Z0-9_-]{0,50}$/.test(appid)){
        returnJson({ code: -2 , message: 'appid is required'});
        return;
    }

    logger.setKey(`h5testSync_${appid}`);	//上报key

    var data = await module.exports.getTestUser().toES6Promise().catch(function(){
        return null;
    });

    var result = {code: 0,data: data};

    returnJson(result);
};

var returnJson = function(json){
    var gzip = gzipHttp.create({
        contentType: 'application/json; charset=UTF-8',
        code: 200
    });

    gzip.write(JSON.stringify(json,null,2));
    gzip.end();
};

