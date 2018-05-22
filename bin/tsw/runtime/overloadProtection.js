/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

// 过载保护
process.nextTick(function() {

    var logger = require('logger');
    var tnm2 = require('api/tnm2');
    var config = require('config');

    // 高负载时丢弃部分请求
    var cpuLimit = 85;
    if (config.cpuLimit >= 0) {
        cpuLimit = config.cpuLimit;
    }

    if (process.binding('config').exposeInternals) {
        logger.info('overload protection working');
        const RoundRobinHandle = require('internal/cluster/round_robin_handle');
        const distribute = RoundRobinHandle.prototype.distribute;
        if (!distribute.hasHack) {
            RoundRobinHandle.prototype.distribute = function(err, handle) {
                if (global.cpuUsed > cpuLimit) {
                    var rejectRate = Math.pow((global.cpuUsed - cpuLimit) / (100 - cpuLimit), 1.5);
                    if (Math.random() > rejectRate) {
                        handle.close();
                        tnm2.Attr_API('SUM_TSW_OVERLOAD_REJECT', 1);
                        return;
                    }
                }
                distribute.call(this, err, handle);
            };
            distribute.hasHack = true;
        }
    }

});