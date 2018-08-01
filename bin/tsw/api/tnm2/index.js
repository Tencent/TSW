/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const serverInfo = require('serverInfo.js');
const mapping = require('api/tnm2/mapping.json');
const url = require('url');
const Deferred = require('util/Deferred');
const cluster = require('cluster');

let cache = {
    curr: {},
    time: Date.now() - 50000
};
let isFirstLoad = false;

if (global[__filename]) {
    cache = global[__filename];
} else {
    global[__filename] = cache;
    isFirstLoad = true;
}

if (isFirstLoad) {
    cluster.worker && cluster.worker.once('disconnect', function(worker) {
        const logger = require('logger');
        const last = cache.curr;

        logger.info('report on disconnect event...');

        cache.curr = {};
        cache.time = Date.now();

        reportOpenapi(last);
    });
}

/**
 * 平均值类型上报
 */
this.Attr_API_Set = function (attr, iValue) {
    cacheOrReport(attr, iValue);
};

/**
 * 叠加类型上报
 */
this.Attr_API = function (attr, iValue) {
    cacheOrReport(attr, iValue);
};

const cacheOrReport = function(attr, iValue) {

    if (!mapping[attr]) {
        return;
    }

    if (!cache.curr[attr]) {
        cache.curr[attr] = {
            count: 0,
            sum: 0
        };
    }

    const curr = cache.curr[attr];
    curr.sum += iValue;
    curr.count += 1;

    const now = Date.now();

    if (now - cache.time < 60000) {
        return;
    }

    const last = cache.curr;

    cache.curr = {};
    cache.time = now;

    // keep async
    process.nextTick(function() {
        reportOpenapi(last);
    });
};


const reportOpenapi = function(last) {
    const defer = Deferred.create();

    const openapi = require('util/openapi');
    const logger = require('logger');
    const config = require('config');

    if (typeof config.beforeReportApp === 'function') {
        const retCall = config.beforeReportApp(last);
        if (retCall === false) {
            // 阻止默认上报
            return defer.resolve();
        }
    }

    if (config.isTest) {
        return defer.resolve();
    }

    if (config.devMode) {
        return defer.resolve();
    }

    if (!config.appid || !config.appkey) {
        return defer.resolve();
    }

    if (!config.appReportUrl) {
        return defer.resolve();
    }

    const arr = [];

    Object.keys(last).forEach(function(v, i) {
        arr.push([v, last[v].sum, last[v].count].join('.'));
    });

    const postData = {
        appid: config.appid,
        ip: serverInfo.intranetIp || '',    // 不能为空
        arr: arr.join('-'),
        now: Date.now()
    };

    const sig = openapi.signature({
        pathname: url.parse(config.appReportUrl).pathname,
        method: 'POST',
        data: postData,
        appkey: config.appkey
    });

    postData.sig = sig;

    require('ajax').request({
        url: config.appReportUrl,
        type: 'POST',
        l5api: config.tswL5api['openapi.tswjs.org'],
        dcapi: {
            key: 'EVENT_TSW_OPENAPI_APP_REPORT'
        },
        data: postData,
        keepAlive: true,
        autoToken: false,
        dataType: 'json'
    }).fail(function() {
        logger.error('app report fail.');
        defer.reject();
    }).done(function(d) {
        if (d.result) {
            if (d.result.code === 0) {
                logger.debug('app report success.');
                return defer.resolve();
            } else {
                logger.debug('app report fail.');
                return defer.reject(d.result.code);
            }
        }

        logger.debug('app report fail.');
        return defer.reject();
    });

    return defer;
};
