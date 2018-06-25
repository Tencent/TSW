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
        curr: null
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

        if (tmp.startsWith('127.')) {
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
        const sum = {
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
        const incr = {
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
            cache.total = sum;
        }

        incr.external.receive.bytes = sum.external.receive.bytes - cache.total.external.receive.bytes;
        incr.external.receive.packets = sum.external.receive.packets - cache.total.external.receive.packets;
        incr.external.transmit.bytes = sum.external.transmit.bytes - cache.total.external.transmit.bytes;
        incr.external.transmit.packets = sum.external.transmit.packets - cache.total.external.transmit.packets;
        incr.internal.receive.bytes = sum.internal.receive.bytes - cache.total.internal.receive.bytes;
        incr.internal.receive.packets = sum.internal.receive.packets - cache.total.internal.receive.packets;
        incr.internal.transmit.bytes = sum.internal.transmit.bytes - cache.total.internal.transmit.bytes;
        incr.internal.transmit.packets = sum.internal.transmit.packets - cache.total.internal.transmit.packets;
        incr.local.receive.bytes = sum.local.receive.bytes - cache.total.local.receive.bytes;
        incr.local.receive.packets = sum.local.receive.packets - cache.total.local.receive.packets;
        incr.local.transmit.bytes = sum.local.transmit.bytes - cache.total.local.transmit.bytes;
        incr.local.transmit.packets = sum.local.transmit.packets - cache.total.local.transmit.packets;
        incr.cost = cost; // ms

        cache.curr = {
            external: {
                receive: {
                    bytes: Math.floor(incr.external.receive.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.external.receive.packets * 1000 / cost),
                },
                transmit: {
                    bytes: Math.floor(incr.external.transmit.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.external.transmit.packets * 1000 / cost)
                }
            },
            internal: {
                receive: {
                    bytes: Math.floor(incr.internal.receive.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.internal.receive.packets * 1000 / cost)
                },
                transmit: {
                    bytes: Math.floor(incr.internal.transmit.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.internal.transmit.packets * 1000 / cost)
                }
            },
            local: {
                receive: {
                    bytes: Math.floor(incr.local.receive.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.local.receive.packets * 1000 / cost)
                },
                transmit: {
                    bytes: Math.floor(incr.local.transmit.bytes * 8 / cost), // kbps
                    packets: Math.floor(incr.local.transmit.packets * 1000 / cost)
                }
            }
        };

        cache.total = sum;
    });

    return cache.curr;
};


this.getNetInfo();
