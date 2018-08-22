/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const logger = require('logger');
const Queue = require('util/Queue');
const dcapi = require('api/libdcapi/dcapi.js');
const tnm2 = require('api/tnm2');
const L5 = require('api/L5/L5.api.js');
const { isWin32Like } = require('util/isWindows.js');
const Memcached = require('memcached');
let cache = global[__filename];

if (!cache) {
    cache = {};
    global[__filename] = cache;
}


module.exports = function(opt) {
    /**
     * 这里像这样写的目的主要是为了进行测试
     因为在使用sinon.js时， 如果你exports的是一个function，你就无法进行stub，
     */
    return module.exports.getCmem(opt);
};

module.exports.getCmem = function(opt) {
    let route;

    if (!opt) {
        return null;
    }

    if (!isWin32Like && opt.modid && opt.cmd) {

        route = L5.ApiGetRouteSync(opt);

        logger.debug('L5 ~${ip}:${port}', route);

        if (route.ip && route.port) {
            opt.host = [route.ip, route.port].join(':');
        }

        route.ret = route.ret;
        route.usetime = 100;
        L5.ApiRouteResultUpdate(route);

    }

    if (!opt.host) {
        return null;
    }

    return fromCache(opt);
};

const fromCache = (opt) => {
    const key = [opt.modid, opt.cmd, opt.host].join(':');
    const poolSize = opt.poolSize || 1;
    const option = Object.assign({}, opt, {
        poolSize: 1
    });

    if (!cache[key]) {
        const queueWrapList = [];

        for (let i = 0; i < poolSize; i++) {
            queueWrapList.push(queueWrap(new Memcached(opt.host, option)));
        }
        queueWrapList.curr = 0;
        cache[key] = queueWrapList;
    } else {
        cache[key].curr = (cache[key].curr + 1) % cache[key].length;

        let currentClient = cache[key][cache[key].curr];
        // if this socket was unusable, make a new
        if (!currentClient.connections[opt.host]
            || !currentClient.connections[opt.host].isAvailable()) {
            logger.debug('memcached socket is unusable, make a new one');

            currentClient = queueWrap(new Memcached(opt.host, option));
        }
    }

    return cache[key][cache[key].curr];
};


function queueWrap(memcached) {

    if (memcached.__queue) {
        return memcached;
    }

    memcached.__queue = Queue.create();

    memcached.command = (function(command) {

        return function(queryCompiler, server) {
            const memcached = this;
            const queue = memcached.__queue;
            const servers = memcached.servers && memcached.servers[0];
            const start = Date.now();

            tnm2.Attr_API('SUM_TSW_CKV_CMD', 1);

            queue.queue(function() {
                const startQueue = Date.now();
                const costQueue = startQueue - start;

                tnm2.Attr_API_Set('AVG_TSW_CKV_QUEUE_COST', costQueue);

                const fn = (function(queryCompiler) {
                    return function() {
                        const query = queryCompiler();
                        let command = query.command || '';
                        const index = command.indexOf('\r\n');    // 不要数据部分
                        if (index > 0) {
                            command = command.slice(0, Math.min(128, index));
                        }
                        if (command.length >= 128) {
                            command = command.slice(0, 128) + '...' + command.length;
                        }

                        logger.debug(command);

                        query.callback = (function(callback) {
                            return function(...args) {
                                const err = args[0];
                                let code = 0;
                                let isFail = 0;
                                const delay = Date.now() - start;
                                const toIp = servers.split(':')[0];

                                if (err && err.message !== 'Item is not stored') {
                                    if (err.stack) {
                                        logger.error(command);
                                        logger.error(servers);
                                        logger.error(err.stack);
                                        code = 2;
                                        isFail = 1;
                                    } else {
                                        logger.debug(err);
                                    }
                                }

                                tnm2.Attr_API_Set('AVG_TSW_CKV_CMD_COST', Date.now() - startQueue);

                                dcapi.report({
                                    key: 'EVENT_TSW_MEMCACHED',
                                    toIp: toIp,
                                    code: code,
                                    isFail: isFail,
                                    delay: delay
                                });

                                queue.dequeue();
                                return callback && callback.apply(this, args);
                            };
                        })(query.callback);
                        return query;
                    };
                })(queryCompiler);

                command.call(memcached, fn, server);
            });
        };
    })(memcached.command);


    return memcached;
}
