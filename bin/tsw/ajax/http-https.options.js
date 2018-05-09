/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const fs        = require('fs');
const https     = require('https');
const http      = require('http');
const cache     = {};


///etc/pki/tls/certs/ca-bundle.crt

this.getHttpsAgent = function(host){

    var key = ['https',host].join('.');

    if(!cache[key]){
        cache[key] = new https.Agent({
            maxSockets          : 65535,
            maxFreeSockets      : 32,
            maxCachedSessions   : 65535,
            keepAlive	        : true,
            keepAliveMsecs      : 5000
        })
    };

    return cache[key];
}

this.getHttpAgent = function(host){

    var key = ['http',host].join('.');

    if(!cache[key]){
        cache[key] = new http.Agent({
            maxSockets          : 65535,
            maxFreeSockets      : 32,
            keepAlive           : true,
            keepAliveMsecs      : 5000
        })
    };

    return cache[key];
}