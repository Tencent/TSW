/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const serverInfo    = require('serverInfo.js');
const mapping       = require("./mapping.json");
const {isWindows}   = require('util/isWindows.js');
const url           = require('url');
const Deferred      = require('util/Deferred');
const cluster       = require('cluster');

var cache = {
    curr: {},
    time: Date.now() - 50000
};
var isFirstLoad = false;

if(global[__filename]){
    cache = global[__filename];
}else{
    global[__filename] = cache;
    isFirstLoad = true;
}

if(isFirstLoad){
    cluster.worker && cluster.worker.once('disconnect', function(worker){
        var logger  = require('logger');
        var last    = cache.curr;

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
    cacheOrRepoet(attr, iValue);
};

/**
 * 叠加类型上报
 */
this.Attr_API = function (attr, iValue) {
    cacheOrRepoet(attr, iValue);
};

var cacheOrRepoet = function(attr, iValue){
    var curr;

    if(!mapping[attr]){
        return;
    }

    if(!cache.curr[attr]){
        cache.curr[attr] = {
            count: 0,
            sum: 0
        };
    }

    curr = cache.curr[attr];
    curr.sum    += iValue;
    curr.count  += 1;

    var now = Date.now();

    if(now - cache.time < 60000){
        return;
    }

    var last = cache.curr;

    cache.curr = {};
    cache.time = now;

    reportOpenapi(last);
}


var reportOpenapi = function(last){
    var defer   = Deferred.create();
    var ajax    = require('ajax');
    var openapi = require('util/openapi');
    var logger  = require('logger');
    var config  = require('config');
    var retCall;

    if(typeof config.beforeReportApp === 'function'){
        retCall = config.beforeReportApp(last);
    }

    //阻止默认上报
    if(retCall === false){
        return;
    }

    if(isWindows){
        return;
    }

    if(config.isTest){
        return;
    }

    if(!config.appid || !config.appkey){
        return;
    }

    if(!config.appReportUrl){
        return;
    }

    var arr = [];

    Object.keys(last).forEach(function(v,i){
        arr.push([v,last[v].sum,last[v].count].join('.'));
    });

    var postData = {
        appid   : config.appid,
        ip      : serverInfo.intranetIp,
        arr     : arr.join('-'),
        now     : Date.now()
    };

    var sig	= openapi.signature({
        pathname: url.parse(config.appReportUrl).pathname,
        method: 'POST',
        data: postData,
        appkey: config.appkey
    });

    postData.sig	= sig;

    require('ajax').request({
        url			: config.appReportUrl,
        type		: 'POST',
        l5api		: config.tswL5api['openapi.tswjs.org'],
        dcapi		: {
            key: 'EVENT_TSW_OPENAPI_APP_REPORT'
        },
        data		: postData,
        keepAlive	: true,
        autoToken	: false,
        dataType	: 'json'
    }).fail(function(){
        logger.error('app report fail.');
        defer.reject();
    }).done(function(d){
        if(d.result){
            if(d.result.code === 0){
                logger.debug('app report success.');
                return defer.resolve();
            }else{
                logger.debug('app report fail.');
                return defer.reject(d.result.code);
            }
        }

        logger.debug('app report fail.');
        return defer.reject();
    });

    return defer;
}