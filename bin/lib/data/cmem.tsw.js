/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const config	= require('config');
const cmem		= require('pool/cmem.l5.js');

this.cmem = function(){

    if(config.idc === 'sh'){
        return this.sh();
    }

    if(config.idc === 'tj'){
        return this.tj();
    }

    return this.sz();
}

this.openapi = function(){
    return cmem(config.memcached);
}

this.h5test = function(){
    return cmem(config.memcached);
}

this.sz = function(){
    return cmem(config.memcached);
}

this.sh = function(){
    return cmem(config.memcached);
}

this.tj = function(){
    return cmem(config.memcached);
}
