/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const crypto = require('crypto');
const zlib = require('zlib');
const logger = plug('logger');

const ALGORITHM_NAME = 'aes-128-gcm';
const ALGORITHM_NONCE_SIZE = 12;
const ALGORITHM_TAG_SIZE = 16;
const ALGORITHM_KEY_SIZE = 16;
const PBKDF2_NAME = 'sha256';
const PBKDF2_SALT_SIZE = 16;
const PBKDF2_ITERATIONS = 32767;
const CHARSET_NAME = 'UTF-8';
const CURRENT_VERSION = 'v1:';

const EVP_BytesToKey = password => {
    const pwd = Buffer.from(password, 'binary');
    let keyLen = 8;
    let ivLen = 8;
    const key = Buffer.alloc(keyLen);
    const iv = Buffer.alloc(ivLen);
    let tmp = Buffer.alloc(0);
    while (keyLen > 0 || ivLen > 0) {
        const md5 = crypto.createHash('md5');

        md5.update(tmp);
        md5.update(pwd);
        tmp = md5.digest();

        let used = 0;

        if (keyLen > 0) {
            const keyStart = key.length - keyLen;
            used = Math.min(keyLen, tmp.length);
            tmp.copy(key, keyStart, 0, used);
            keyLen -= used;
        }

        if (used < tmp.length && ivLen > 0) {
            const ivStart = iv.length - ivLen;
            const length = Math.min(ivLen, tmp.length - used);
            tmp.copy(iv, ivStart, used, used + length);
            ivLen -= length;
        }
    }

    tmp.fill(0);
    return {
        key,
        iv
    };
};

function encrypt(plaintext, key) {
    const nonce = crypto.randomBytes(ALGORITHM_NONCE_SIZE);
    const cipher = crypto.createCipheriv(ALGORITHM_NAME, key, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]);
}

function decrypt(ciphertextAndNonce, key) {
    const nonce = ciphertextAndNonce.slice(0, ALGORITHM_NONCE_SIZE);
    const ciphertext = ciphertextAndNonce.slice(ALGORITHM_NONCE_SIZE, ciphertextAndNonce.length - ALGORITHM_TAG_SIZE);
    const tag = ciphertextAndNonce.slice(ciphertext.length + ALGORITHM_NONCE_SIZE);
    const cipher = crypto.createDecipheriv(ALGORITHM_NAME, key, nonce);
    cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(ciphertext), cipher.final()]);
}

// 加密
module.exports.encode = function (appid, appkey, data) {
    const buff = zlib.deflateSync(Buffer.from(JSON.stringify(data), CHARSET_NAME));
    const password = appid + appkey;
    const salt = crypto.randomBytes(PBKDF2_SALT_SIZE);
    const key = crypto.pbkdf2Sync(Buffer.from(password, CHARSET_NAME), salt, PBKDF2_ITERATIONS, ALGORITHM_KEY_SIZE, PBKDF2_NAME);
    const ciphertextAndNonceAndSalt = Buffer.concat([salt, encrypt(buff, key)]);
    return CURRENT_VERSION + ciphertextAndNonceAndSalt.toString('base64');
};


// 解密
module.exports.decode = function (appid, appkey, body) {
    const password = appid + appkey;
    const content = body || '';
    let decodeResult;
    let data;
    if (content.indexOf(CURRENT_VERSION) === 0) {
        const ciphertextAndNonceAndSalt = Buffer.from(content.slice(CURRENT_VERSION.length), 'base64');
        const salt = ciphertextAndNonceAndSalt.slice(0, PBKDF2_SALT_SIZE);
        const ciphertextAndNonce = ciphertextAndNonceAndSalt.slice(PBKDF2_SALT_SIZE);
        const key = crypto.pbkdf2Sync(Buffer.from(password, CHARSET_NAME), salt, PBKDF2_ITERATIONS, ALGORITHM_KEY_SIZE, PBKDF2_NAME);
        try {
            decodeResult = decrypt(ciphertextAndNonce, key);
        } catch (e) {
            logger.warn(e.stack);
            return null;
        }
    } else {
        const kv = EVP_BytesToKey(appid + appkey);
        const des = crypto.createDecipheriv('des', kv.key, kv.iv);
        let buf1 = '';
        let buf2 = '';

        try {
            buf1 = des.update(body, 'base64', 'hex');
            buf2 = des.final('hex');
        } catch (e) {
            logger.warn(e.stack);
            return null;
        }
        decodeResult = Buffer.from(buf1 + buf2, 'hex');
    }

    const input = zlib.inflateSync(decodeResult);
    try {
        data = JSON.parse(input.toString(CHARSET_NAME));
    } catch (e) {
        logger.warn(e.stack);
        return null;
    }


    return data;
};
