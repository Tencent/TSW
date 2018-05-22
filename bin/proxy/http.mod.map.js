/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const config  = require('./config.js');
var base    = null;

if(config.skyMode){
    base = require('default/config.default.sky.js');
}else if(config.isTest){
    base = require('default/config.default.h5test.js');
}

if(base){
    module.exports.find = function(mod_act,req,res){
        var mod = base.modMap.find(mod_act,req,res);

        if(mod){
            return mod;
        }
        return config.modMap.find(mod_act,req,res);
    };

}else{
    module.exports = config.modMap;
}

