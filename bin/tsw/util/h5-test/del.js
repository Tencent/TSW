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
const isTest		= require('./is-test.js');
const post			= require('util/auto-report/post.js');
const OALogin		= require('util/oa-login/index.js');
const gzipHttp		= require('util/gzipHttp.js');
const canIuse		= /^[0-9a-zA-Z_-]{0,64}$/;


module.exports = function(request, response) {
    OALogin.checkLoginForTSW(request, response, function() {
        module.exports.go(request, response);
    });
};

module.exports.go = async function(request, response){
	
    var uin		= request.param('uin');
	
    var data = await module.exports.deleteTestUser(
        uin
    ).toES6Promise().catch(function(){
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


module.exports.deleteTestUser = function(uin){
    logger.debug('deleteTestUser:' + uin);
    var memcached	= isTest.cmem();
    var keyText		= isTest.keyBitmap();
    var defer       = Deferred.create();
    var appid		= '';

    if(!uin){
        return defer.reject();
    }

    if(!canIuse.test(uin)){
        return defer.reject();
    }

    if(context.appid && context.appkey){
        //开平过来的
        appid	= context.appid;
        keyText = `${keyText}.${appid}`;
    }

    if(!memcached){
        return defer.reject('memcached not exists');
    }

    memcached.get(keyText,function(err,data){

        if(appid && typeof data === 'string'){
            //解密
            data = post.decode(context.appid,context.appkey,data);
        }

        var expire = 24*60*60;

        if(err){
            return defer.reject('memcache get error');
        }

        var text = data || {};

        if(typeof data === 'object'){
            text = data || {};
        }else{
            logger.debug('memcache return not a object');
            return defer.resolve();
        }

        if(text[uin]) {
            delete text[uin];
        }

        logger.debug('deleteKeyText:' + uin);

        if(appid){
            //加密
            text = post.encode(context.appid,context.appkey,text);
        }

        memcached.set(keyText, text, expire,function(err,ret){
            if(err){
                defer.reject('memcache del data error');
            }else {
                logger.debug('deleteKeyText success');
                defer.resolve();
            }
        });

    });
    return defer;
};