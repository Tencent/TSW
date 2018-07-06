/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const isInnerIP = require('util/http.isInnerIP.js');
const { isWin32Like } = require('./isWindows.js');
const logger = require('logger');
let cache;

if (!global[__filename]) {
    cache = {
        time: 0,
        total: null,
        curr: createEmpty()
    };
    global[__filename] = cache;
} else {
    cache = global[__filename];
}

this.getNetworkInterfacesTypes = function() {
    const networkInterfaces = os.networkInterfaces();
    const types = {};

    Object.keys(networkInterfaces).forEach(function(key) {
        const eth = networkInterfaces[key];
        const address = eth && eth[0] && eth[0].address;

        if (!address) {
            return;
        }

        if (eth[0].family !== 'IPv4') {
            return;
        }

        const tmp = isInnerIP.isInnerIP(address);

        if (!tmp) {
            types[key] = 'external';
        }

        if (address.startsWith('127.')) {
            types[key] = 'local';
        } else {
            types[key] = 'internal';
        }

    });

    return types;
};

this.getNetInfo = function() {
    const now = Date.now();

    if (isWin32Like) {
        return cache.curr;
    }

    if (now - cache.time < 3000) {
        return cache.curr;
    }

    const cost = now - cache.time;
    cache.time = now;

    const types = this.getNetworkInterfacesTypes();

    fs.readFile('/proc/net/dev', function(err, buffer) {

        if (err) {
            logger.error(err.stack);
            return;
        }

        const lines = buffer.toString('UTF-8').split('\n');
        const sum = createEmpty();
        const incr = createEmpty();
        const curr = createEmpty();

        lines.forEach((v, i) => {
            const tmp = v.split(/\W+/);

            if (!tmp[1]) {
                return;
            }

            const key = tmp[1];
            const type = types[key];

            if (!type) {
                return;
            }

            sum[type].receive.bytes += parseInt(tmp[2], 10) || 0;
            sum[type].receive.packets += parseInt(tmp[3], 10) || 0;
            sum[type].transmit.bytes += parseInt(tmp[10], 10) || 0;
            sum[type].transmit.packets += parseInt(tmp[11], 10) || 0;
        });

        if (!cache.total) {
            // init total first
            cache.total = sum;
        }

        Object.keys(sum).forEach(function(type) {
            incr[type].receive.bytes = sum[type].receive.bytes - cache.total[type].receive.bytes;
            incr[type].receive.packets = sum[type].receive.packets - cache.total[type].receive.packets;
            incr[type].transmit.bytes = sum[type].transmit.bytes - cache.total[type].transmit.bytes;
            incr[type].transmit.packets = sum[type].transmit.packets - cache.total[type].transmit.packets;

            curr[type].receive.bytes = Math.floor(incr[type].receive.bytes * 8 / (cost / 1000)); // bps
            curr[type].receive.packets = Math.floor(incr[type].receive.packets / (cost / 1000));
            curr[type].transmit.bytes = Math.floor(incr[type].transmit.bytes * 8 / (cost / 1000)); // bps
            curr[type].transmit.packets = Math.floor(incr[type].transmit.packets / (cost / 1000));
        });

        cache.curr = curr;
        cache.total = sum;
    });

    return cache.curr;
};

function createEmpty() {
    return {
        external: {
            receive: {
                bytes: 0,
                packets: 0,
            },
            transmit: {
                bytes: 0,
                packets: 0
            }
        },
        internal: {
            receive: {
                bytes: 0,
                packets: 0
            },
            transmit: {
                bytes: 0,
                packets: 0
            }
        },
        local: {
            receive: {
                bytes: 0,
                packets: 0
            },
            transmit: {
                bytes: 0,
                packets: 0
            }
        }
    };
}

this.getNetInfo();
setTimeout(() => {
    this.getNetInfo();
}, 3000);
