/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const logger = require('logger');
const Deferred = require('util/Deferred');
const isTest = require('./is-test.js');
const post = require('util/auto-report/post.js');
const OALogin = require('util/oa-login/index.js');
const gzipHttp = require('util/gzipHttp.js');
const canIuse = /^[0-9a-zA-Z_-]{0,64}$/;

module.exports = function(request, response) {
    OALogin.checkLoginForTSW(request, response, function() {
        module.exports.go(request, response);
    });
};

module.exports.go = async function(request, response) {

    const uin = request.param('uin');
    const val = request.param('val');

    const data = await module.exports.addTestUser(uin, val).toES6Promise().catch(function() {
        return null;
    });

    const result = { code: 0, data: data };

    returnJson(result);
};

const returnJson = function(json) {
    const gzip = gzipHttp.create({
        contentType: 'application/json; charset=UTF-8',
        code: 200
    });

    gzip.write(JSON.stringify(json, null, 2));
    gzip.end();
};

module.exports.addTestUser = function(uin, val) {
    logger.debug('addTestUser:' + uin);
    val = val || true;
    const memcached = isTest.cmem();
    let keyText = isTest.keyBitmap();
    const defer = Deferred.create();
    let appid = '';

    if (context.appid && context.appkey) {
        // 开平过来的
        appid = context.appid;
        keyText = `${keyText}.${appid}`;
    }

    if (!uin) {
        return defer.reject();
    }

    if (!canIuse.test(uin)) {
        return defer.reject();
    }

    if (!val) {
        return defer.reject();
    }

    if (!memcached) {
        return defer.reject('memcached not exists');
    }

    memcached.get(keyText, function(err, data) {

        if (appid && typeof data === 'string') {
            // 解密
            data = post.decode(context.appid, context.appkey, data);
        }

        const expire = 24 * 60 * 60;

        if (err) {
            logger.error('memcache get error:' + err);
            return defer.reject('memcache get error');
        }

        let text;

        if (typeof data === 'object') {
            text = data || {};
        } else {
            text = {};
        }

        text[uin] = val;

        logger.debug(`setKeyText: ${uin}; value: ${val}`);

        if (appid) {
            // 加密
            text = post.encode(context.appid, context.appkey, text);
        }

        memcached.set(keyText, text, expire, function(err, ret) {
            if (err) {
                defer.reject('memcache set data error');
            } else {
                logger.debug('setKeyText success');
                defer.resolve();
            }
        });

    });
    return defer;
};

