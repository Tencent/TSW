/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


if (!global[__filename]) {

    global[__filename] = true;

    process.nextTick(function() {
        const config = require('config');
        const dns = require('dns');
        const dcapi = require('api/libdcapi/dcapi');
        const logger = require('logger');
        const net = require('net');

        dns.lookup = (function(fn) {

            return function(hostname, options, callback) {
                const args = [hostname];
                const start = Date.now();

                if (net.isIP(hostname)) {
                    return fn.apply(this, arguments);
                }

                if (typeof options === 'function') {
                    callback = options;
                }

                let code;
                let isFail;
                let timeoutError;
                let isCalled = false;

                logger.debug(`dns lookup for ${hostname}`);

                const callbackWrap = function(err, address, family) {
                    if (isCalled) return;

                    if (!err) {
                        code = 0;
                        isFail = 0;
                    } else if (err === timeoutError) {
                        code = 513;
                        isFail = 1;
                    } else {
                        code = 500;
                        isFail = 1;
                    }

                    const cost = Date.now() - start;

                    if (err) {
                        logger.error(`dns lookup [${cost}ms] error:  ${err.stack}`);
                    } else {
                        logger.debug(`dns lookup ${cost}ms: ${hostname} --> ${address}`);
                    }

                    dcapi.report({
                        key: 'EVENT_TSW_DNS_LOOKUP',
                        toIp: '127.0.0.1',
                        code: code,
                        isFail: isFail,
                        delay: cost
                    });

                    isCalled = true;
                    clearTimeout(timer);
                    callback(err, address, family);
                };

                if (callback !== options) {
                    args.push(options);
                }

                args.push(callbackWrap);

                const timer = setTimeout(function() {
                    callbackWrap((timeoutError = new Error('Dns Lookup Timeout')));
                }, config.timeout && config.timeout.dns || 3000);

                return fn.apply(this, args);
            };

        })(dns.lookup);
    });
}
