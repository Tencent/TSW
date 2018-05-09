/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

if(!global[__filename]){
    
    global[__filename] = true;

    process.nextTick(function(){
        var config  = require('config');
        var dns     = require('dns');
        var dcapi   = require('api/libdcapi/dcapi');
        var logger  = require('logger');
        var net     = require('net');

        dns.lookup = (function(fn) {

            return function(hostname, options, callback) {
                var args  = [hostname];
                var start = Date.now();

                if(net.isIP(hostname)){
                    return fn.apply(this, arguments);
                }

                if (typeof options === 'function') {
                    callback = options;
                }

                var timer;
                var code;
                var isFail;
                var timeoutError;
                var isCalled = false;

                var callbackWrap = function(err, address, family) {
                    if (isCalled)  return;

                    if(!err) {
                        code   = 0;
                        isFail = 0;
                    } else if(err === timeoutError) {
                        code   = 513;
                        isFail = 1;
                    } else {
                        code   = 500;
                        isFail = 1;
                    }

                    if(err){
                        logger.error('dns lookup error: ' + err.stack);
                    }else{
                        logger.debug(`dns lookup: ${hostname} --> ${address}`);
                    }

                    dcapi.report({
                        key     : 'EVENT_TSW_DNS_LOOKUP',
                        toIp    : '127.0.0.1',
                        code    : code,
                        isFail  : isFail,
                        delay   : Date.now() - start
                    });

                    isCalled = true;
                    clearTimeout(timer);
                    callback(err, address, family);
                }

                if(callback !== options) {
                    args.push(options)
                }
                args.push(callbackWrap)

                timer = setTimeout(function() {
                    callbackWrap((timeoutError = new Error("Dns Lookup Timeout")));
                }, config.timeout && config.timeout.dns || 3000);

                return fn.apply(this, args);
            };

        })(dns.lookup);
    });
}