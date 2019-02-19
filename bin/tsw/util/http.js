/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const { isWin32Like } = require('util/isWindows');
const serverInfo = require('serverInfo.js');
const logger = require('logger');
const isInnerIP = require('util/http.isInnerIP.js');
const Deferred = require('util/Deferred');
const more = require('util/http.more.js');
const maxBodySize = 1024 * 1024;  // 1MB


this.formatHeader = function(headers) {

    const res = {};

    if (!headers) {
        return headers;
    }

    Object.keys(headers).forEach(function(key) {

        if (typeof key !== 'string') {
            return;
        }

        const formatKey = key.trim().replace(/(\w)(\w+)/g, function(v, v1, v2) {
            return v1.toUpperCase() + v2.toLowerCase();
        });

        res[formatKey] = module.exports.filterInvalidHeaderChar(headers[key]);

    });

    return res;
};

/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 **/
this.checkInvalidHeaderChar = function(val) {

    if (typeof val !== 'string') {
        return false;
    }

    let ch;

    for (let i = 0; i < val.length; i++) {
        ch = val.charCodeAt(i);
        if (ch === 9) continue;
        if (ch <= 31 || ch > 255 || ch === 127) return true;
    }
    return false;
};

// 过滤非法字符
this.filterInvalidHeaderChar = function(val) {

    /* eslint-disable no-control-regex */
    if (typeof val === 'string' && this.checkInvalidHeaderChar(val)) {
        return val.replace(/[^\u0009\u0020-\u007E\u0080-\u00FF]/g, '');
    }
    /* eslint-enable no-control-regex */

    return val;
};

this.captureIncomingMessageBody = function(req) {
    // init...
    const result = [];
    let bodySize = 0;

    if (req._capturing) {
        return;
    }

    req._capturing = true;

    const data = function(chunk) {
        bodySize += chunk.length;

        if (bodySize <= maxBodySize) {
            result.push(chunk);
        }
    };

    logger.debug('capture IncomingMessage body on');

    // req.on('data', data);

    // 直接监听data事件会有问题：
    // request流是消费型的，前面监听的data监听器会优先消费缓存中已经接收到的数据，
    // 导致当业务侧在异步绑定data事件监听器的时候会丢失前面已经接收的数据
    this.captureStream(req, data);

    req.once('end', function() {
        logger.debug('receive end');
        this.removeListener('data', data);
        const buffer = Buffer.concat(result);
        req._bodySize = bodySize;
        req._body = buffer;
    });
};

this.captureStream = function(stream, handler) {
    const oriPush = stream.push;

    // stream.readableBuffer for node >=9, stream._readableState.buffer for node < 9
    const bufferData = stream.readableBuffer || stream._readableState.buffer;

    let head = bufferData.head;

    while (head) {
        handler(head.data);

        head = head.next;
    }

    stream.push = (chunk, encoding) => {
        try {
            chunk && handler(chunk);
        } catch (e) {
            logger.debug(`captrue stream chunk error ${e.message}`);
        }

        return oriPush.call(stream, chunk, encoding);
    };
};

this.captureBody = this.captureServerResponseBody = function(res) {

    if (res._capturing) {
        return;
    }

    res._capturing = true;
    res._body = [];
    res._bodySize = 0;

    logger.debug('capture ServerResponse body on');

    res.captrueBody = function(data, encoding) {
        // 大于1M的不抓包
        let buffer;

        if (typeof data === 'function') {
            data = null;
        } else if (typeof encoding === 'function') {
            encoding = null;
        }

        if (!data) {
            return;
        }

        if (Buffer.isBuffer(this._body)) {
            logger.debug('write aftre end.');
            return;
        }

        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else {
            buffer = Buffer.from(data, encoding);
        }

        const size = buffer.length;
        this._bodySize += size;

        // chunked
        if (this.useChunkedEncodingByDefaultNoNeed) {
            this._body.push(Buffer.from(String(size.toString(16)) + '\r\n'));
        }

        if (this._bodySize < maxBodySize) {
            this._body.push(buffer);
            // chunked
            if (this.useChunkedEncodingByDefaultNoNeed) {
                this._body.push(Buffer.from('\r\n'));
            }
        }
    };

    res._send = (function(fn) {
        return function(...args) {

            this.captrueBody(args[0], args[1]);

            return fn.apply(this, args);
        };
    })(res._send);

    res._finish = (function(fn) {
        return function(...args) {

            this.ServerDoneResponse = new Date();

            const ret = fn.apply(this, args);

            if (this.useChunkedEncodingByDefaultNoNeed) {
                this._body.push(Buffer.from('0\r\n\r\n'));
            }

            if (!Buffer.isBuffer(this._body)) {
                this._body = Buffer.concat(this._body);
            }

            return ret;
        };
    })(res._finish);
};

this.isPostLike = function(req) {
    const method = typeof req === 'string' ? req : req.method;

    if (method === 'POST') {
        return true;
    }
    if (method === 'PUT') {
        return true;
    }
    if (method === 'DELETE') {
        return true;
    }
    return false;
};

this.isGetLike = function(req) {

    const method = typeof req === 'string' ? req : req.method;

    if (method === 'GET') {
        return true;
    }
    if (method === 'HEAD') {
        return true;
    }
    if (method === 'OPTIONS') {
        return true;
    }
    return false;
};

this.isSent = function(res) {

    if (!res) {
        return true;
    }

    if (res.headersSent || res._headerSent || res.finished) {
        return true;
    }

    return false;
};

this.getClientResponseHeaderStr = function(response, bodySize) {

    let key;
    const headData = [];

    bodySize = ~~bodySize;

    headData.push('HTTP/' + response.httpVersion + ' ' + response.statusCode + ' ' + response.statusMessage);

    const headers = Deferred.extend({}, response.headers);

    if (bodySize >= 0 && headers['content-length'] === undefined) {
        delete headers['transfer-encoding'];
        headers['content-length'] = bodySize;
    }

    for (key in headers) {

        headData.push(key + ': ' + headers[key]);
    }

    headData.push('');
    headData.push('');

    return headData.join('\r\n');
};

this.getClientRequestHeaderStr = function(request) {

    return request._header;
};

this.getRequestHeaderStr = function(request) {

    const window = context.window || {};
    const headData = [];
    let key;

    if (!request) {
        request = window.request;
    }

    if (!request) {
        return '';
    }

    headData.push(request.method + ' ' + request.url + ' HTTP/' + request.httpVersion);


    for (key in request.headers) {
        headData.push(key + ': ' + request.headers[key]);
    }

    headData.push('');
    headData.push('');

    return headData.join('\r\n');
};

this.getResponseHeaderStr = function(response) {
    const window = context.window || {};
    const headData = [];
    let key;

    if (!response) {
        response = window.response;
    }

    if (!response) {
        return '';
    }

    if (response._header) {
        return response._header;
    }

    headData.push('HTTP/1.1 ' + response.statusCode + ' ' + response.statusMessage);

    for (key in response._headers) {
        headData.push(key + ': ' + response._headers[key]);
    }

    headData.push('');
    headData.push('');

    return headData.join('\r\n');
};

this.getUserIp24 = function(request) {
    const window = context.window || {};
    if (!request) {
        request = window.request;
    }

    if (!request) {
        return '';
    }

    const userIp = this.getUserIp(request);

    if (!userIp) {
        return '';
    }

    if (request.userIp24) {
        return request.userIp24;
    }

    request.userIp24 = userIp.split('.').slice(0, -1).join('.') + '.*';

    return request.userIp24;
};

this.getUserIp = function(request) {

    const window = context.window || {};
    let userIp = '';

    if (!request) {
        request = window.request;
    }

    if (!request) {
        return '';
    }

    if (request.userIp) {
        return request.userIp;
    }

    // 取socket ip
    if (request.socket) {
        userIp = request.socket.remoteAddress || '';
    }

    // win7判断
    if (isWin32Like && userIp === '127.0.0.1') {
        userIp = serverInfo.intranetIp || userIp;
        request.userIp = userIp;

        return userIp;
    }

    if (!request.headers) {
        return '';
    }

    let xff = request.headers['x-forwarded-for'] || '';
    const qvia = request.headers['qvia'] || '';
    const realIp = request.headers['x-real-ip'] || '';

    if (realIp) {

        // x-real-ip
        if (userIp && this.isInnerIP(userIp)) {
            userIp = realIp;
        }
    } else if (xff) {

        // xff判断，注意只认内网ip带的xff，外网带的不算
        if (userIp && this.isInnerIP(userIp)) {

            xff = xff.split(',').slice(-1)[0] || userIp;
            userIp = xff.trim() || userIp;
        }

    } else if (qvia) {

        // 注意只认内网ip带的qvia，外网带的不算
        if (userIp && this.isInnerIP(userIp)) {
            userIp = this.getIpCromQuia(qvia) || userIp;
        }

    }

    // ipv4 in ipv6
    if (userIp.startsWith('::ffff:')) {
        userIp = userIp.substr(7);
    }

    request.userIp = userIp;

    return userIp;
};


this.isHttps = function(request) {
    const window = context.window || {};
    if (!request) {
        request = window.request;
    }

    if (!request || !request.REQUEST) {
        return false;
    }

    if (this.isFromWns(request) || request.REQUEST.protocol === 'https' || request.REQUEST.protocol === 'https:') {
        return true;
    } else {
        return false;
    }

};


this.isInnerIP = function(ipAddress) {
    return isInnerIP.isInnerIP(ipAddress);
};

this.isFromWns = more.isFromWns;
this.getIpCromQuia = more.getIpCromQuia;
this.getBase = more.getBase;
this.fixPicUrl = more.fixPicUrl;
