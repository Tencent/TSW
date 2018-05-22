/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * 测试环境自动发现
 */

const serverInfo	= require('serverInfo');
const config		= require('config');
const logReport		= require('./logReport.js');
const post			= require('util/auto-report/post.js');
const postOpenapi	= require('util/auto-report/post.openapi.js');
const Deferred		= require('util/Deferred');
const isWindows		= require('util/isWindows.js');


this.report = function(){
	
    if(isWindows.isWindows){
        return;
    }

    if(!config.isTest){
        return;
    }

    var logText = `${serverInfo.intranetIp}:${config.httpPort}`;
    var logJson = {
        ip		: serverInfo.intranetIp,
        port	: config.httpPort
    };

    require('api/cmdb').GetDeviceThisServer().done(function(d){

        var business;

        if(d && d.business){
            business = d.business[0];
        }

        if(!business){
            business = {
                moduleId: 0,
                L1Business: '未知',
                L2Business: '未知',
                L3Business: '未知',
                module: '未知'
            };
        }

        logJson.moduleId	=  business.moduleId;
        logJson.moduleName	= [business.L1Business,business.L2Business,business.L3Business,business.module].join('->');

        logJson		= Deferred.extend(true,{
            time	: new Date().toGMTString(),
            name	: '',
            group	: 'unknown',
            desc	: '',
            order	: 0,
            owner	: ''
        },config.testInfo,logJson);

        var logKey		= 'h5test' + logJson.group;

        //上报自己
        post.report(logKey,logText,logJson);

        //开放平台上报，不用再分组了
        if(config.appid && config.appkey){
            logReport.reportCloud({
                type		: 'alpha',
                logText		: logText,
                logJson		: logJson,
                key			: 'h5test',
                group		: 'tsw',
                mod_act		: 'h5test',
                ua 			: '',
                userip 		: '',
                host		: '',
                pathname	: '',
                statusCode	: ''
            });
        }

        //上报分组
        require('util/CD.js').check('h5test' + logJson.group,1,60).done(function(){
            post.report('group.h5test',logText,logJson);
        });

    });
		
};


this.list = function(group){
	
    var defer	= Deferred.create();
    var getLogJsonDefer;

    group		= group || '';

    //开平对应的存储
    if(context.appid && context.appkey){
        getLogJsonDefer = postOpenapi.getLogJson(`${context.appid}/tsw/h5test`);
    }else{
        getLogJsonDefer = post.getLogJson(`h5test${group}`);
    }

    getLogJsonDefer.done(function(arr){
		
        var res = [];
        var map = {};
		
        arr.forEach(function(v){
            if(!map[v.ip]){
                map[v.ip] = true;
                res.push(v);
            }
        });

        //增加一个临时染色
        res.push({
            time: new Date(),
            name: '临时染色',
            group: 'TSW',
            desc: '人在家中坐，包从天上来',
            order: -65536,
            //owner: "TSW",
            groupName: group,
            ip: 'alpha',
            moduleId: 0,
            moduleName: 'null'
        });

        res.sort(function(a,b){
            return a.order - b.order;
        });

        defer.resolve(res);
    });
	
    return defer;
};


this.getAllGroup = function(){

    var defer		= Deferred.create();

    post.getLogJson('group.h5test').done(function(arr){

        var res = [];
        var map = {};

        arr.forEach(function(v){
            if(!map[v.group]){
                map[v.group] = true;
                res.push(v);
            }
        });

        res.sort(function(a,b){
            return a.order - b.order;
        });

        defer.resolve(res);
    });

    return defer;
};
