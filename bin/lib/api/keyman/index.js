/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

this.getBlockIpMapSync = function(){
    return require('./blackIpMap.js').getSync();
};

this.getBlockIpMap = function(){
    return require('./blackIpMap.js').get();
};

this.getAlphaUinMapSync = function(){
    return require('./alphaMap.js').getSync();
};

this.getAlphaUinMap = function(){
    return require('./alphaMap.js').get();
};

this.getTestIp = function(group){
    return require('util/auto-report/TEReport.js').list(group);
};

this.getAllGroup = function(){
    return require('util/auto-report/TEReport.js').getAllGroup();
};

this.ipCheck	= function(opt){
    return require('./ipCheck.js').info(opt);
};

this.runtimeAdd	= function(opt){
    return require('./runtimeAdd.js').add(opt);
};