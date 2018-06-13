/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const logger = require('logger');
const cp = require('child_process');

module.exports = {
    'default': function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('no such command!');
    },

    '/globaldump': function (req, res) {
        process.emit('sendCmd2workerOnce', {
            CMD: 'globaldump',
            GET: req.GET
        });
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('done!\r\n');
    },


    '/profiler': function (req, res) {
        process.emit('sendCmd2workerOnce', {
            CMD: 'profiler',
            GET: req.GET
        });
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('done!\r\n');
    },

    '/top100': function (req, res) {
        process.emit('sendCmd2workerOnce', {
            CMD: 'top100',
            GET: req.GET
        });
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('done!\r\n');
    },

    '/reload': function (req, res) {

        cp.exec('./check.js', {
            timeout: 5000,
            encoding: 'utf8',
            cwd: __dirname
        }, function (err, stdout, stderr) {
            let errMessage = '';
            if (err) {
                errMessage = err.stack;
                logger.error(err.stack);
            }

            if (stderr) {
                errMessage = stderr;
                logger.error(stderr);
            }

            if (errMessage) {
                // 异常情况下，不能直接res.end()，需要模拟http异常，让shell感知到异常
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
                res.write(errMessage);

                res.socket && res.socket.end();
                return;
            }

            if (stdout) {
                logger.info(stdout);

                // 开始执行reload
                process.emit('reload', req.GET);

                res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
                res.write(stdout);
                res.end('\r\ndone!\r\n');

                return;
            }

        });
    }
};
