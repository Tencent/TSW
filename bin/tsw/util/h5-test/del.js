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

module.exports.go = async request => {

    const uin = request.param('uin');

    const data = await module.exports.deleteTestUser(
        uin
    ).toES6Promise().catch(() => null);

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

module.exports.deleteTestUser = uin => {
    return module.exports.deleteTestUsers(String(uin).split(','));
};

/**
 * 批量删除测试环境
 * @param uins
 * @returns {void | * | Promise<any> | Promise<never>}
 */
module.exports.deleteTestUsers = uins => {
    logger.debug('deleteTestUser:' + uins);
    const memcached = isTest.cmem();
    const defer = Deferred.create();
    const appid = context.appid || '';
    const appkey = context.appkey;
    let keyText = isTest.keyBitmap();

    if (!uins || uins.length === 0) {
        return defer.reject();
    }

    if (context.appid && context.appkey) {
        // 开平过来的
        keyText = `${keyText}.${appid}`;
    }

    if (!memcached) {
        return defer.reject('memcached not exists');
    }

    for (let i = 0; i < uins.length; i++) {
        if (!uins[i] || !canIuse.test(uins[i])) {
            return defer.reject();
        }
    }

    memcached.get(keyText, (err, data) => {

        if (appid && typeof data === 'string') {
            // 解密
            data = post.decode(appid, appkey, data);
        }

        const expire = 24 * 60 * 60;

        if (err) {
            return defer.reject('memcache get error');
        }

        let text = data || {};

        if (typeof data === 'object') {
            text = data || {};
        } else {
            logger.debug('memcache return not a object');
            return defer.resolve();
        }

        for (let i = 0; i < uins.length; i++) {
            const uin = uins[i];
            if (text[uin]) {
                delete text[uin];
            }
            logger.debug('deleteKeyText:' + uin);
        }

        if (appid) {
            // 加密
            text = post.encode(appid, appkey, text);
        }

        memcached.set(keyText, text, expire, err => {
            if (err) {
                defer.reject('memcache del data error');
            } else {
                logger.debug('deleteKeyText success');
                defer.resolve();
            }
        });

    });
    return defer;
};
