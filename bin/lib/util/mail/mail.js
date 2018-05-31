/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const serverInfo = require('serverInfo.js');
const config = require('config.js');
const { isWin32Like } = require('util/isWindows.js');
const httpUtil = require('util/http');
const logger = require('logger');
const Deferred = require('util/Deferred');
const url = require('url');

this.SendMail = function(key, group, second, oriOpt) {

    const opt = Deferred.extend({}, oriOpt);
    const data = {};
    const now = new Date();

    if (isWin32Like) {
        return;
    }

    // 晚上不发
    // allDaySend强制全天候24小时发送
    if (!opt.allDaySend && now.getHours() < 8) {
        return;
    }

    data.title = opt.title || '';
    data.oriTitle = oriOpt.title || '';
    data.ctxTitle = context.title || '';
    data.isTest = ~~config.isTest;
    data.content = opt.content || '';
    data.msgInfo = opt.msgInfo || '';
    data.intranetIp = serverInfo.intranetIp || '';
    data.second = second || '';
    data.idc = config.idc || '';
    data.logText = logger.getText() || '';
    data.headerText = httpUtil.getRequestHeaderStr() || '';
    data.runtimeType = opt.runtimeType || '';
    data.processTitle = process.title || '';
    data.processPid = process.pid || '';

    opt.data = data;

    if (isWin32Like) {
        key = key + Date.now();
    }

    process.nextTick(function() {
        require('util/CD.js').check(key, 1, second).done(function() {
            reportOpenapi(data);
        });
    });
};


const reportOpenapi = function(data) {
    const defer = Deferred.create();
    const config = require('config');
    const openapi = require('util/openapi');
    const logger = require('logger');

    let retCall;

    if (typeof config.beforeRuntimeReport === 'function') {
        retCall = config.beforeRuntimeReport(data);
    }

    // 阻止默认上报
    if (retCall === false) {
        return defer.resolve(0);
    }

    if (!config.appid || !config.appkey) {
        return;
    }

    if (!config.runtimeReportUrl) {
        return;
    }

    const postData = data;

    postData.appid = config.appid;
    postData.now = Date.now();

    const sig = openapi.signature({
        pathname: url.parse(config.runtimeReportUrl).pathname,
        method: 'POST',
        data: postData,
        appkey: config.appkey
    });

    postData.sig = sig;

    require('ajax').request({
        url: config.runtimeReportUrl,
        type: 'POST',
        l5api: config.tswL5api['openapi.tswjs.org'],
        dcapi: {
            key: 'EVENT_TSW_OPENAPI_RUNTIME_REPORT'
        },
        data: postData,
        keepAlive: true,
        autoToken: false,
        dataType: 'json'
    }).fail(function() {
        logger.error('runtime report fail.');
        defer.reject();
    }).done(function(d) {
        if (d.result) {
            if (d.result.code === 0) {
                logger.debug('runtime report success.');
                return defer.resolve();
            } else {
                logger.debug('runtime report fail.');
                return defer.reject(d.result.code);
            }
        }

        logger.debug('runtime report fail.');
        return defer.reject();
    });

    return defer;
};


// 升级周知
this.SendTSWMail = function(opt) {

};

// 发送周知邮件
this.SendArsMail = function(opt) {


};


this.findMailARS = function(file) {
    return '';
};

