/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const os = require('os');
const fs = require('fs');
const cp = require('child_process');
const { isWindows } = require('./isWindows.js');
const logger = require('logger');
let cache;

if (!global[__filename]) {
    cache = {
        time: 0,
        total: 0,
        used: 0,
        curr: 0
    };
    global[__filename] = cache;
} else {
    cache = {
        time: 0,
        total: 0,
        used: 0,
        curr: 0
    };
    global[__filename] = cache;
}

this.getCpuUsed = function(cpu) {

    const now = Date.now();

    cpu = cpu || '';

    if (isWindows) {
        return cache.curr;
    }

    if (now - cache.time < 3000) {
        return cache.curr;
    }

    cache.time = now;

    if (typeof cpu !== 'number') {
        cpu = '';
    }

    fs.readFile('/proc/stat', function(err, buffer) {

        if (err) {
            /* eslint-disable no-console */
            console.error(err.stack);
            /* eslint-enable no-console */
            return;
        }

        const lines = buffer.toString('UTF-8').split('\n');
        let str = '';
        let arr = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(`cpu${cpu} `)) {
                str = lines[i];
                break;
            }
        }

        if (str) {
            arr = str.split(/\W+/);
        } else {
            return;
        }

        const user = parseInt(arr[1], 10) || 0;
        const nice = parseInt(arr[2], 10) || 0;
        const system = parseInt(arr[3], 10) || 0;
        const idle = parseInt(arr[4], 10) || 0;
        const iowait = parseInt(arr[5], 10) || 0;
        const irq = parseInt(arr[6], 10) || 0;
        const softirq = parseInt(arr[7], 10) || 0;
        // var  steal   = parseInt(arr[8],10) || 0;
        // var guest    = parseInt(arr[9],10) || 0;

        const total = user + nice + system + idle + iowait + irq + softirq;
        const used = user + nice + system + irq + softirq;
        const curr = Math.round((used - cache.used) / (total - cache.total) * 100);

        cache.curr = curr;
        cache.total = total;
        cache.used = used;
    });

    return cache.curr;
};


this.cpus = function() {

    const res = [];


    os.cpus().forEach(function(v) {

        if (v.times && v.times.idle !== 0) {
            res.push(v);
        }

    });


    return res;
};


this.taskset = function(oriCpu, pid) {
    if (isWindows) {
        return;
    }

    // 绑定CPU
    logger.info('taskset -cp ${pid}', {
        pid: pid
    });

    // 打印shell执行信息
    cp.exec(`taskset -cp ${pid}`, {
        timeout: 5000
    }, function(err, data, errData) {

        const str = data.toString('UTF-8');
        const tmp = str.split(':');
        let cpus;

        if (tmp.length >= 2) {
            cpus = exports.parseTaskset(tmp[1]);
        }

        let cpu = oriCpu;
        if (cpus.length > 1) {
            // cpu编号修正
            cpu = parseInt(cpus[cpu % cpus.length], 10);
        } else {
            // 超过cpu编号时，修正
            cpu = cpu % exports.cpus().length;
        }

        if (err) {
            logger.error(err.stack);
        }

        if (data.length) {
            logger.info('\n' + data.toString('UTF-8'));
        }

        if (errData.length) {
            logger.error('\n' + errData.toString('UTF-8'));
        }

        logger.info('taskset -cp ${cpu} ${pid}', {
            cpu: cpu,
            pid: pid
        });

        cp.exec(`taskset -cp ${cpu} ${pid}`, {
            timeout: 5000
        }, function(err, data, errData) {
            if (err) {
                logger.error(err.stack);
            }

            if (data.length) {
                logger.info('\n' + data.toString('UTF-8'));
            }

            if (errData.length) {
                logger.error('\n' + errData.toString('UTF-8'));
            }
        });

    });

};


this.parseTaskset = function(str) {

    const res = [];
    const arr = str.split(',');

    arr.forEach(function(v) {

        v = v.trim();

        const tmp = v.split('-');
        const start = ~~tmp[0];
        let end = ~~tmp[1];
        let i;

        if (end < start) {
            end = start;
        }

        for (i = start; i <= end; i++) {
            res.push(i);
        }
    });

    return res;
};

if (process.mainModule === module) {
    setInterval(function() {
        /* eslint-disable no-console */
        console.log('cpu: ' + module.exports.getCpuUsed());
        /* eslint-enable no-console */
    }, 1000);
}
