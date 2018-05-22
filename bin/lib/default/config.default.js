/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

this.defaultConfigLoadFrom = __filename;

//开发者模式
this.devMode = false;

//是否测试环境
this.isTest = false;

//是否允许url中出现数组
this.allowArrayInUrl = false;

//http监听地址
this.httpAddress = '0.0.0.0';

//http监听端口
this.httpPort = 80;

//worker起始端口
this.workerPortBase = 12801;

//webso监听端口
this.websoPort = 20000;

//wnshtml监听端口
this.wnshtmlPort = 10080;

//pdu服务监听端口
this.pduServerPort = 19000;

//http管理端口
this.httpAdminPort = 12701;

//webso目标端口
this.websoDstPort = this.httpPort;

//webso目标IP
this.websoDstIp = '127.0.0.1';

//alpha号码文件
this.alphaFile	= null;

//alpha号码文件
this.alphaFileUrl	= null;

//ip黑名单文件
this.blackIpFile	= null;

//ip黑名单文件
this.blackIpFileUrl	= null;

//邮件接收者
this.mailTo = '';

//邮件抄送者
this.mailCC = '';

//cpu分配
this.runAtThisCpu = 'auto';

//worker用户
this.workerUid = 'nobody';

//mod_act映射
this.modAct = {
    getModAct: function(req){
        return null;
    }
};

//路由
this.modMap = {
    find: function(mod_act,req,res){
        return null;
    }
};

this.isCloud = false;

this.page419 = null;

this.page404 = null;

//logger
this.logger = {
    logLevel: 'debug'
};

//cpu限制
this.cpuLimit = 85;

//内存限制
this.memoryLimit = 768 * 1024 * 1024;

//限制
this.CCIPLimit = 500;

//allowHost
this.allowHost = [];

this.idc = 'sz';

//l5 api
this.l5api = {};

this.timeout = {
    socket		: 120000,
    post		: 30000,
    get			: 10000,
    keepAlive	: 10000,
    dns			: 3000
};


this.extendMod = {
    getUin: req => {}
};

//openapi
this.logReportUrl		= 'https://openapi.tswjs.org/v1/log/report';
this.h5testSyncUrl		= 'https://openapi.tswjs.org/v1/h5test/sync';
this.utilCDUrl			= 'https://openapi.tswjs.org/v1/util/cd';
this.appReportUrl		= 'https://openapi.tswjs.org/v1/app/report';
this.runtimeReportUrl	= 'https://openapi.tswjs.org/v1/runtime/report';

this.ignoreTST = false;

this.ajaxDefaultOptions = {
    useJsonParseOnly : true
};

this.tswL5api	= {};
this.tswL5api['cmem.tsw.sz']		= null;
this.tswL5api['cmem.tsw.sh']		= this.tswL5api['cmem.tsw.sz'];
this.tswL5api['cmem.tsw.tj']		= this.tswL5api['cmem.tsw.sh'];
this.tswL5api['cmem.tsw.h5test']	= this.tswL5api['cmem.tsw.sz'];

