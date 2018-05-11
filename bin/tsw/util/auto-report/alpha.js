/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const fs			= require('fs');
const config		= require('config');
const logger		= require('logger');
const {isWindows} 	= require('util/isWindows');
const TSW			= require('api/keyman');

if(!global[__filename]){
    global[__filename] = {};
}

this.update = function(map){
    global[__filename] = map || {};
};

this.add = function(uin){
    //
}

this.isAlpha = function(req){

    var uin;

    if(typeof req === 'object'){

        if(!uin){
            uin = logger.getKey();
        }

        if(!uin){
            uin = this.getUin(req);
        }
    }else{
        uin = req;

        if(!uin){
            uin = logger.getKey();
        }

        if(!uin){
            uin = this.getUin();
        }
    }

    if(uin && isWindows){
        //windows 抓包用
        if(config.skyMode){
            return true;
        }
    }

    var uinMap = global[__filename] || {};

    return uinMap[uin] || TSW.getAlphaUinMapSync()[uin];
}

this.getUin = function(req){

    var uin;
    var window   = context.window || {};

    req = req || window.request;

    if(!req){
        return uin;
    }

    //业务有可能不使用uin登录态，支持业务扩展getUin实现
    if(config.extendMod && typeof config.extendMod.getUin === 'function'){
        return config.extendMod.getUin(req);
    }

    return uin;
}
