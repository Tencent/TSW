/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const plug = require('../../plug');
const http = require('http');
const config = require('./config.js');
const logger = plug('logger');
const path = plug('path');
const {
    exec
} = require('child_process');

const PING_RETRY_TIME = 2;
const PING_TIMEOUT = 10000;
const PING_INSTERVALS = 30000;

let masterPid;
let retry = 0;

function ping() {

    return new Promise((resolve, reject) => {

        const req = http.request({
            method: 'GET',
            hostname: config.httpAdminAddress,
            port: config.httpAdminPort,
            path: '/ping',
            timeout: PING_TIMEOUT
        });

        req.on('response', (res) => {
            resolve();
        });

        req.on('error', (e) => {
            logger.info('ping error');
            reject(new Error('Master response error'));
        });

        req.on('timeout', () => {
            logger.info('ping timeout');
            reject(new Error('Master Timeout'));
        });

        req.end();
    });
}

async function run() {

    try {
        await ping();
        retry = 0;
        setTimeout(run, PING_INSTERVALS);
    } catch (e) {
        if (retry >= PING_RETRY_TIME) {
            logger.info('ping master fail. restart master...');
            restartMaster();
        } else {
            retry++;
            logger.info(`ping master fail.retry:${retry}`);
            setTimeout(run, PING_INSTERVALS);
        }
    }
}

function restartMaster() {
    try {
        exec(`${path.resolve(__dirname, './restart.sh')} &`, (error, stdout, stderr) => {
            if (error) {
                logger.error(`exec error: ${error}`);
                return;
            }
        });
    } catch (err) {
        logger.error(err);
    }
}

function startMonitor() {

    masterPid = process.argv[2];

    logger.info(`master monitor started. pid:${masterPid}`);

    if (!masterPid) {
        logger.info('master pid is empty! exit monitor');
        return;
    }

    run();
}

startMonitor();
