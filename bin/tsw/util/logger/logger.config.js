/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {debugOptions}    = process.binding('config');

this.levelMap = {
    'debug':10,
    'info':20,
    'warn':30,
    'error':40,
    'off':50
};

this.logLevel = null;


this.getLogLevel = function(){

    if(debugOptions && debugOptions.inspectorEnabled){
        return this.levelMap['debug'];
    }

    if(typeof this.logLevel === 'string'){
        this.logLevel   = this.levelMap[this.logLevel] || null;
    }

    if(this.logLevel !== null){
        return this.logLevel;
    }

    this.logLevel   = this.levelMap['info'];

    var config  = require('config.js');

    if(config.logger){
        if(typeof config.logger.logLevel === 'number'){
            this.logLevel = config.logger.logLevel;
        }else{
            this.logLevel = this.levelMap[config.logger.logLevel] || this.logLevel;
        }

    }

    return this.logLevel;
};
