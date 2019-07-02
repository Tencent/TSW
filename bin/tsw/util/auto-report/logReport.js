/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const fs = require('fs');
const url = require('url');
const logger = require('logger');
const dcapi = require('api/libdcapi/dcapi.js');
const serverInfo = require('serverInfo');
const config = require('config');
const alpha = require('./alpha.js');
const httpUtil = require('util/http');
const openapi = require('util/openapi');
const isTST = require('util/isTST.js');
const post = require('util/auto-report/post.js');
const postOpenapi = require('util/auto-report/post.openapi.js');
const tnm2 = require('api/tnm2');
const format = require('webapp/utils/format');
const CD = require('util/CD.js');
const canIuse = /^[0-9a-zA-Z_-]{0,64}$/;
const maxBodySize = 512 * 1024;
const MAX_ALPHA_LOG = post.MAX_ALPHA_LOG;

const limit = {
    count: {
        error: 0,
        alpha: 0,
        force: 0,
        fail: 0,
        tst: 0
    },
    max: {
        error: 20,
        alpha: 20,
        force: 9999,
        fail: 9999,
        tst: 9999
    },
    time: 0
};

module.exports = function(req, res) {

    const window = context.window || {};
    const isWebSocket = !!window.websocket;

    if (isWebSocket) {
        req = window.websocket.upgradeReq;
    }

    if (!isWebSocket) {
        res.removeAllListeners('afterFinish');
        res.once('afterFinish', function() {
            req.emit('reportLog');
        });
    }

    req.removeAllListeners('reportLog');
    req.once('reportLog', function() {
        module.exports.reportLog();
        this.removeAllListeners('reportLogStream', module.exports.reportLog);
    });
    req.on('reportLogStream', module.exports.reportLog);
};

module.exports.fingureCroup = function(opts) {
    let group = 'other';

    const contentType = opts.resHeaders['content-type'] || '';
    const suffix = opts.suffix.toLowerCase();
    // 一些特殊后缀的映射
    const groupMap = {
        gif: 'image',
        xml: 'xml',
        map: 'js',
        // 有些js返回头不一样还是要根据后缀来
        js: 'js'
    };

    if (!contentType) {
        // 没声明算html
        return 'html';
    }

    switch (true) {
    case /^text\/html/.test(contentType):
        group = 'html';
        break;
    case contentType === 'webapp':
        group = 'webapp';
        break;
    case contentType === 'websocket':
        group = 'websocket';
        break;
    case opts.reqHeaders['x-requested-with'] === 'XMLHttpRequest':
        group = 'XHR';
        break;
    case /^text\/javascript/.test(contentType):
        group = 'js';
        break;
    case /^image\/.*/.test(contentType):
        group = 'image';
        break;
    case ['json', 'cgi', 'fcg', 'php'].indexOf(suffix) !== -1:
        group = 'XHR';
        break;
    case ['eot', 'svg', 'ttf', 'woff'].indexOf(suffix) !== -1:
        group = 'font';
        break;
        // 其余的通过后缀区分吧
    default:
        if (!suffix) {
            group = 'other';
        } else {
            group = groupMap[suffix] || 'other';
        }
        break;
    }

    return group;
};

module.exports.reportAlpha = function(data) {
    const currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24, 10);

    if (!data.key) {
        return;
    }

    if (!canIuse.test(data.key)) {
        return;
    }

    const reportKey = [data.key].join('/');
    const logNumMax = context.MAX_ALPHA_LOG || MAX_ALPHA_LOG;

    post.report(reportKey, data.logText, data.logJson).done(function(isFirst) {
        if (isFirst) {
            // 增加计数
            CD.checkByCmem(`SUM_TSW_ALPHA_LOG_KEY.${currDays}`, logNumMax, 24 * 60 * 60).done(function(curr) {
                logger.debug('SUM_TSW_ALPHA_LOG_KEY curr count: ' + curr);
            });
        } else {
            CD.checkByCmem(`SUM_TSW_ALPHA_LOG.${currDays}`, logNumMax * logNumMax * logNumMax, 24 * 60 * 60).done(function(curr) {
                logger.debug('SUM_TSW_ALPHA_LOG curr count: ' + curr);
            });
        }
    });

    if (!data.group) {
        return;
    }

    if (!canIuse.test(data.group)) {
        return;
    }

    const reportGroupKey = [data.group, data.key].join('/');

    post.report(reportGroupKey, data.logText, data.logJson).done(function(isFirst) {
        // 这里不用计数了
    }).always(function() {
        // 上报分组
        CD.checkByCmem('v2.group.send.${data.group}', 1, 60).done(function() {
            post.report('v2.group.alpha', data.group, { group: data.group });
        });
    });
};

module.exports.report = function(data) {
    return require('default/logReport.js').report(data);
};


module.exports.reportCloud = function(data) {

    if (!config.appid) {
        return;
    }

    if (!config.appkey) {
        return;
    }

    if (!config.logReportUrl) {
        return;
    }

    if (!data.key) {
        return;
    }

    // only alpha
    if (data.type !== 'alpha') {
        return;
    }

    logger.debug('reportCloud');
    logger.debug('report log type: ${type}, key ${key}', data);

    const postData = Object.assign({}, data);

    // 加密
    postData.logText = post.encode(config.appid, config.appkey, data.logText);
    postData.logJson = post.encode(config.appid, config.appkey, data.logJson);
    postData.appid = config.appid;
    postData.userip = '';
    postData.now = Date.now();


    const sig = openapi.signature({
        pathname: url.parse(config.logReportUrl).pathname,
        method: 'POST',
        data: postData,
        appkey: config.appkey
    });

    postData.sig = sig;

    require('ajax').request({
        url: config.logReportUrl,
        type: 'POST',
        l5api: config.tswL5api['openapi.tswjs.org'],
        dcapi: {
            key: 'EVENT_TSW_OPENAPI_LOG_REPORT'
        },
        data: postData,
        keepAlive: true,
        autoToken: false,
        dataType: 'json'
    }).done(function() {
        logger.debug('reportCloud success.');
    }).fail(function() {
        logger.error('reportCloud fail.');
    });

};

module.exports.receiveCloud = function(req, res) {

    const returnJson = function(message) {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        res.writeHead(200);
        res.end(JSON.stringify({
            code: message ? -1 : 0,
            message: message || 'success'
        }, null, 2));
    };

    const data = req.POST || {};

    if (!data.appid) {
        return returnJson('appid is required');
    }

    if (!canIuse.test(data.appid)) {
        return returnJson('appid is invalid');
    }

    if (!data.key) {
        return returnJson('key is required');
    }

    if (!canIuse.test(data.key)) {
        return returnJson('key is invalid');
    }

    if (!data.group) {
        // group is allow empty
    }

    if (!canIuse.test(data.group)) {
        return returnJson('group is invalid');
    }

    // only alpha
    if (data.type !== 'alpha') {
        return returnJson('type=alpha is required');
    }

    if (context.appid !== data.appid) {
        return returnJson('appid is not match');
    }

    if (!context.appkey) {
        return returnJson('get appkey error');
    }

    if (!data.logText) {
        return returnJson('logText is required');
    }

    if (typeof data.logText !== 'string') {
        return returnJson('logText is not a string');
    }

    if (data.logText.length >= 64 * 1024) {
        return returnJson('logText is large than 64KB');
    }

    if (!data.logJson) {
        return returnJson('logJson is required');
    }

    if (typeof data.logJson !== 'string') {
        return returnJson('logJson is not a string');
    }

    if (data.logJson.length >= 1024 * 1024) {
        return returnJson('logJson is large than 1MB');
    }

    const appid = context.appid;
    const appkey = context.appkey;
    const reportKey = [appid, data.key].join('/');
    const currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24, 10);
    const logNumMax = context.MAX_ALPHA_LOG || MAX_ALPHA_LOG;

    logger.setKey(`report_${appid}_${data.key}`);    // 上报key
    logger.debug('report log type: ${type}, key ${key}', data);

    CD.curr(`SUM_TSW_ALPHA_LOG_KEY.${currDays}`, logNumMax, 24 * 60 * 60).fail(function(err) {
        logger.debug(err && err.stack);
        returnJson('服务器错误');
    }).done(function(count) {
        count = ~~count;

        if (count > logNumMax) {
            return returnJson('alpha log超限');
        }

        postOpenapi.report(reportKey, data.logText, data.logJson).done(function(isFirst) {
            if (isFirst) {
                // 增加计数
                CD.checkByCmem(`SUM_TSW_ALPHA_LOG_KEY.${currDays}`, logNumMax, 24 * 60 * 60).done(function(curr) {
                    logger.debug('curr count: ' + curr);
                });
            } else {
                CD.checkByCmem(`SUM_TSW_ALPHA_LOG.${currDays}`, logNumMax * logNumMax * logNumMax, 24 * 60 * 60).done(function(curr) {
                    logger.debug('curr count: ' + curr);
                });
            }
        });

        if (!data.group) {
            return returnJson();
        }

        if (!canIuse.test(data.group)) {
            return returnJson();
        }

        const reportGroupKey = [appid, data.group, data.key].join('/');

        postOpenapi.report(reportGroupKey, data.logText, data.logJson).done(function(isFirst) {
            // 这里不用计数了
        }).always(function() {
            // 上报分组
            CD.checkByCmem(`v2.group.${appid}.${data.group}`, 1, 60).fail(function() {
                returnJson();
            }).done(function() {

                const logText = postOpenapi.encode(appid, appkey, data.group);
                const logJson = postOpenapi.encode(appid, appkey, { group: data.group });

                postOpenapi.report(`${appid}/v2.group.alpha`, logText, logJson).always(function() {
                    returnJson();
                });
            });
        });
    });

};


module.exports.top100 = function(req, res) {

    let item;

    if (!global.top100) {
        return;
    }

    global.top100.push({
        pathname: req.REQUEST.pathname,
        hostname: req.headers.host,
        ip: httpUtil.getUserIp(req) || '',
        socketIp: (req.socket && req.socket.remoteAddress),
        header: httpUtil.getRequestHeaderStr(req),
        body: req.REQUEST.body,
        statusCode: res.statusCode,
        resHeader: JSON.stringify(res._headers, null, 2)
    });

    if (global.top100.length % 100 === 0) {
        logger.info('top: ' + global.top100.length);
    }

    if (global.top100.length < 1000) {
        return;
    }

    const result = global.top100;
    global.top100 = null;


    let map = {};
    let arr = [];
    let key;
    const buffer = [];

    // 分析pathname聚集
    map = {};
    arr = [];
    result.forEach(function(v, i) {

        const key = v.hostname + v.pathname;

        if (map[key]) {
            map[key]++;
        } else {
            map[key] = 1;
        }

    });

    for (key in map) {

        item = map[key];

        arr.push({
            count: item,
            key: key
        });

    }

    arr.sort(function(a, b) {
        return b.count - a.count;
    });

    arr.forEach(function(v, i) {

        // top 100
        if (i < 100) {
            buffer.push(v.count + '\t' + v.key);
            buffer.push('\r\n');
        }

    });

    buffer.push('\r\n\r\n');


    // 分析ip聚集
    map = {};
    arr = [];
    result.forEach(function(v, i) {

        if (map[v.ip]) {
            map[v.ip]++;
        } else {
            map[v.ip] = 1;
        }

    });

    for (key in map) {

        item = map[key];

        arr.push({
            count: item,
            key: key
        });

    }

    arr.sort(function(a, b) {
        return b.count - a.count;
    });

    arr.forEach(function(v, i) {

        // top 100
        if (i < 100) {
            buffer.push(v.count + '\t' + v.key);
            buffer.push('\r\n');
        }

    });

    buffer.push('\r\n\r\n');


    result.forEach(function(v, i) {

        buffer.push(v.ip, ', socket ip: ' + v.socketIp);
        buffer.push('\r\n');
        buffer.push(v.header);
        buffer.push(v.body);
        buffer.push('\r\n\r\n');
        buffer.push(v.statusCode + ':' + v.resHeader);
        buffer.push('\r\n\r\n\r\n');

    });


    const str = buffer.join('');

    const filename = __dirname + '/../../../proxy/cpu' + process.serverInfo.cpu + '.' + Date.now() + '.top100';


    fs.writeFile(filename, Buffer.from(str, 'utf-8'), function(err) {

        if (err) {
            logger.error(`top100 error ${err.message}`);

            return;
        }

        logger.info('top100: ' + filename);
    });

};

module.exports.reportLog = function() {
    const window = context.window || {};
    const isWebSocket = !!window.websocket;
    const req = window.request;
    const res = window.response;
    const logJson = logger.getJson(isWebSocket) || {};

    let log = logger.getLog(),
        type = '',
        typeKey = '',
        arrtKey = '',
        code = 0,
        key;


    if (!isWebSocket && global.top100) {
        module.exports.top100(req, res);
    }

    if (!log) {
        logger.debug('log is null');
        return;
    }

    key = logger.getKey();
    const group = logger.getGroup();

    if (!key) {
        key = alpha.getUin(req);

        if (key) {
            if (canIuse.test(key)) {
                logger.setKey(key);
            } else {
                key = '';
            }
        }
    }

    const mod_act = context.mod_act || 'null';
    log = logger.getLog();

    if (alpha.isAlpha(key) && !isTST.isTST(req)) {
        type = 'alpha';
        typeKey = 'EVENT_TSW_LOG_ALPHA';
        arrtKey = 'SUM_TSW_LOG_ALPHA';
        code = 0;
    } else if (log.ERRO || log.WARN) {
        key && logger.error('report key: ${key}', { key: key });
        type = 'error';
        typeKey = 'EVENT_TSW_LOG_ERROR';
        arrtKey = 'SUM_TSW_LOG_ERROR';
        code = 1;
    } else if (log.force) {
        type = 'force';
        typeKey = 'EVENT_TSW_LOG_FORCE';
        arrtKey = 'SUM_TSW_LOG_FORCE';
        code = 3;
    } else if (context.dcapiIsFail && key) {
        type = 'fail';
        typeKey = 'EVENT_TSW_LOG_FAIL';
        arrtKey = 'SUM_TSW_LOG_FAIL';
        code = 2;
    } else {
        logger.debug('report nothing: ' + key);
        // 不用上报
        return;
    }

    if (isTST.isTST(req)) {
        logger.debug('log type origin: ' + type);
        type = 'TST';
        typeKey = 'EVENT_TSW_LOG_TST';
        arrtKey = 'SUM_TSW_LOG_TST';
        code = -1;
    }

    if (limit.max[type] > 0 === false) {
        return;
    }

    // 频率限制
    if (limit.count[type] > 0) {
        limit.count[type]++;
    } else {
        limit.count[type] = 1;
    }

    if (Date.now() - limit.time < 5000) {

        if (limit.count[type] > limit.max[type]) {

            dcapi.report({
                key: typeKey,
                toIp: '127.0.0.1',
                code: -1,
                isFail: 1,
                delay: 100
            });

            return;
        }

    } else {
        limit.count = {};
        limit.time = Date.now();
    }

    logger.debug('logType: ' + type);

    dcapi.report({
        key: typeKey,
        toIp: '127.0.0.1',
        code: code,
        isFail: 0,
        delay: 100
    });

    tnm2.Attr_API(arrtKey, 1);

    if (!isWebSocket && Buffer.isBuffer(req.REQUEST.body)) {
        req.REQUEST.body = format.formatBuffer(req.REQUEST.body);
    }

    if (!isWebSocket) {
        let requestBodyText = req.REQUEST.body;

        if (!requestBodyText) {
            if (req._body) {
                requestBodyText = req._body.toString('UTF-8');
            }
        }

        // limit 64KB
        if (requestBodyText && requestBodyText.length >= 64 * 1024) {
            requestBodyText = `[Large than 64KB]: ${requestBodyText.length}`;
        }

        logger.debug('\n${headers}${body}\r\nresponse ${statusCode} ${resHeaders}', {
            headers: httpUtil.getRequestHeaderStr(req),
            body: requestBodyText,
            statusCode: res.statusCode,
            resHeaders: JSON.stringify(res._headers, null, 2)
        });
    }

    // websocket的log是分片上报的，每次上报后清除当前Log
    let logText = logger.getText(isWebSocket);
    if (isWebSocket) {
        const ws = window.websocket;
        const firstLogFn = logger._getLog('DBUG', 0, '${method} ${protocol}://${host}${path}, reportIndex: ${reportIndex}, logkey: ${logKey}\n', {
            protocol: req.REQUEST.protocol,
            path: req.REQUEST.path,
            host: req.headers.host,
            method: req.method,
            reportIndex: ws.reportIndex,
            logKey: ws.logKey
        });

        logText = firstLogFn() + logText;
        ws.reportIndex++;
    }

    if (type === 'alpha') {
        try {

            // webapp的二进制回包转成可视化的结构
            if (!isWebSocket && res._body && res._headers['content-type'] === 'webapp') {
                res._body = Buffer.from(format.formatBuffer(res._body));
            }

            let requestBody = '';

            if (req._body){
                if (req._body.length < maxBodySize){
                    requestBody = req._body.toString('base64')
                }else{
                    requestBody = Buffer.from(`body was too large too show, length: ${req._body.length}`).toString('base64');
                }
            }

            logJson.curr = {
                protocol: 'HTTP',
                host: req.headers.host,
                url: req.REQUEST.path,
                cache: '',
                process: 'TSW:' + process.pid,
                resultCode: (res && res.statusCode) || 101,
                contentLength: isWebSocket ? 0 : (res._headers['content-length'] || res._bodySize),
                contentType: isWebSocket ? 'websocket' : res._headers['content-type'],
                clientIp: httpUtil.getUserIp(req),
                clientPort: req.socket && req.socket.remotePort,
                serverIp: serverInfo.intranetIp,
                serverPort: config.httpPort,
                requestHeader: httpUtil.getRequestHeaderStr(req),
                requestBody: requestBody,
                responseHeader: httpUtil.getResponseHeaderStr(res),
                responseBody: res && res._body ? res._body.toString('base64') : '',
                logText: logText,
                timestamps: req.timestamps
            };
        } catch (e) {
            logger.error(e.stack);
        }

    }

    const reportData = {
        type: type || '',
        logText: logText || '',
        logJson: logJson,
        key: String(key),
        group: String(group || ''),
        mod_act: String(mod_act || ''),
        ua: req.headers['user-agent'] || '',
        userip: req.userIp || '',
        host: req.headers.host || '',
        pathname: req.REQUEST.pathname || '',
        ext_info: '',
        statusCode: (res && res.statusCode) || 101
    };

    if (type === 'alpha') {
        // 根据content-type设置group便于分类查询抓包
        if (!isWebSocket && !reportData.group) {
            const pathName = req.REQUEST.pathname;
            const fileName = pathName.substr(pathName.lastIndexOf('/') + 1);
            reportData.group = module.exports.fingureCroup({
                resHeaders: res._headers,
                reqHeaders: req.headers,
                suffix: fileName.indexOf('.') !== -1 ? fileName.substr(fileName.lastIndexOf('.') + 1) : '',
                method: req.method,
                mod_act: mod_act,
                returnCode: res.statusCode
            });
        }

        if (config.appid && config.appkey) {
            module.exports.reportCloud(reportData);
        } else {
            module.exports.reportAlpha(reportData);
        }

    }

    module.exports.report(reportData);
};
