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

module.exports = (request, response) => {
    OALogin.checkLoginForTSW(request, response, () => {
        module.exports.go(request, response);
    });
};

module.exports.go = async (request) => {

    const uin = request.param('uin');
    const val = request.param('val');
    const map = request.param('uinval');
    let data;

    if (map && typeof map === 'object') {
        data = await module.exports.addTestUsers(map).toES6Promise().catch(() => null);
    } else {
        data = await module.exports.addTestUser(uin, val).toES6Promise().catch(() => null);
    }

    const result = { code: 0, data: data };

    returnJson(result);
};

const returnJson = json => {
    const gzip = gzipHttp.create({
        contentType: 'application/json; charset=UTF-8',
        code: 200
    });

    gzip.write(JSON.stringify(json, null, 2));
    gzip.end();
};

/**
 * 设置测试环境
 * @param uin
 * @param val
 * @returns {void | * | Promise<any> | Promise<never>}
 */
module.exports.addTestUser = (uin, val) => {
    if (!uin) return Deferred.create().reject();
    const users = {};
    users[uin] = val;
    return module.exports.addTestUsers(users);
};

/**
 * 批量设置测试环境
 * @param map 批量设置列表 key 是 uin，map[key] 是环境
 * @returns {void | * | Promise<any> | Promise<never>}
 */
module.exports.addTestUsers = (map) => {
    let expire = 24 * 60 * 60;

    if (window.request.cookies && window.request.cookies['_expiresTest']) {
        const expectExpire = parseInt(window.request.cookies['_expiresTest'] || 1, 10);

        if (!isNaN(expectExpire)) {
            expire = Math.max(Math.min(expectExpire, 365), 1) * 60 * 60;
        }
    }

    const uins = Object.keys(map);
    logger.debug('addTestUsers:' + uins);
    const defer = Deferred.create();

    const memcached = isTest.cmem();

    if (!memcached) {
        return defer.reject('memcached not exists');
    }

    const appid = context.appid || '';
    const appkey = context.appkey;
    let keyText = isTest.keyBitmap();

    if (appid && appkey) {
        // 开平过来的
        keyText = `${keyText}.${appid}`;
    }

    if (!uins.length) {
        return defer.reject();
    }

    for (let i = 0; i < uins.length; i++) {
        if (!canIuse.test(uins[i])) {
            return defer.reject();
        }

        if (!map[uins[i]]) {
            return defer.reject();
        }
    }

    memcached.get(keyText, (err, data) => {

        if (appid && typeof data === 'string') {
            // 解密
            data = post.decode(appid, appkey, data);
        }

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

        for (let i = 0; i < uins.length; i++) {
            const uin = uins[i];
            const val = map[uin];
            text[uin] = val;

            logger.debug(`setKeyText: ${uin}; value: ${val}`);
        }

        if (appid) {
            // 加密
            text = post.encode(appid, appkey, text);
        }

        memcached.set(keyText, text, expire, (err) => {
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

