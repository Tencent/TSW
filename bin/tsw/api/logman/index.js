/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('logger');
const dateApi = require('api/date.js');
const { isWin32Like } = require('util/isWindows.js');
const logDir = path.resolve(__dirname, '../../../../log/').replace(/\\/g, '/');
const backupDir = path.resolve(logDir, './backup/').replace(/\\/g, '/');
const runlogPath = path.resolve(logDir, './run.log.0').replace(/\\/g, '/');

// 判断logDir目录是否存在
fs.exists(logDir, function(exists) {
    if (!exists) {
        fs.mkdir(logDir, 0o777, (err) => {
            logger.error(err);
        });
    }

    // 判断backup目录是否存在
    fs.exists(backupDir, function(exists) {
        if (!exists) {
            fs.mkdir(backupDir, 0o777, (err) => {
                logger.error(err);
            });
        }
    });
});

const LogMan = {

    /**
     * 按分钟\小时\天去备份log
     */
    delayMap: {
        m: 60000,
        H: 3600000,
        D: 86400000
    },

    /**
     * 启动log管理
     */
    start: function(config) {
        logger.info('start log manager');
        const self = this;
        this.delayType = config.delay || 'D';
        this.delay = this.delayMap[this.delayType];
        this.timer = setInterval(function() {
            self.backLog();
        }, this.delay);
    },

    /**
     * 备份log
     */
    backLog: async function() {
        logger.info('start backup log');
        const self = this;
        const curBackupDir = path.resolve(backupDir, './' + dateApi.format(new Date(), 'YYYY-MM-DD'));
        const curBackupDirExists = await new Promise((resolve, reject) => {
            fs.stat(curBackupDir, function(stats, err) {
                if (err) {
                    return resolve(false);
                }

                if (stats.isDirectory()) {
                    return resolve(true);
                } else {
                    return reject(new Error('not a directory'));
                }
            });
        }).catch((err) => {
            logger.error(err);
            return err;
        });

        if (curBackupDirExists instanceof Error) {
            return;
        }

        if (curBackupDirExists === false) {
            const result = await new Promise((resolve, reject) => {
                fs.mkdir(curBackupDir, 0o777, function(stats, err) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(true);
                });
            }).catch((err) => {
                logger.error(err);
                return err;
            });

            if (result instanceof Error) {
                return;
            }
        }

        let logFilePath = path.resolve(curBackupDir, './' + dateApi.format(new Date(), self.delayType + self.delayType) + '.log');
        let cmdCat = `cp ${runlogPath} ${logFilePath}`;
        let cmdClear = 'cat /dev/null > ' + runlogPath;

        // 兼容windows
        if (isWin32Like) {
            logFilePath = logFilePath.replace(/\\/g, '\\\\');
            cmdCat = 'type ' + runlogPath + ' > ' + logFilePath;
            cmdClear = 'type NUL > ' + runlogPath;
        }

        if (cmdCat) {
            // backup
            logger.info('backup: ' + cmdCat);
            const result = await new Promise((resolve, reject) => {
                cp.exec(cmdCat, {
                    timeout: 60000,
                    killSignal: 9
                }, function(error, stdout, stderr) {
                    if (error) {
                        return reject(error);
                    }

                    return resolve();
                });
            }).catch((err) => {
                logger.error(err);
                return err;
            });

            if (result instanceof Error) {
                return;
            }
        }

        if (cmdClear) {
            // clear
            logger.info('clear: ' + cmdClear);
            const result = await new Promise((resolve, reject) => {
                cp.exec(cmdClear, {
                    timeout: 5000,
                    killSignal: 9
                }, function(error, stdout, stderr) {
                    if (error) {
                        return reject(error);
                    }

                    return resolve();
                });
            }).catch((err) => {
                logger.error(err);
                return err;
            });

            if (result instanceof Error) {
                return;
            }
        }
    }

};

module.exports = LogMan;
