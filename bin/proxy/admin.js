/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const logger = require('logger');
const config = require('./config.js');
const http = require('http');
const codeWatch = require('api/code/watcher.js');
const parseGet = require('util/http/parseGet.js');
const actions = require('./admin.actions.js');

const server = http.createServer(function (req, res) {
    logger.debug('admin request by： ${url}', {
        url: req.url
    });

    parseGet(req);  // 解析get参数
    const action = actions[req.REQUEST.pathname] || actions['default'];
    action.call(actions, req, res);
});

server.on('error', serverError);

function serverError(err) {
    logger.error('exit with ' + err.stack);

    setTimeout(function() {
        process.exit(1);
    }, 500);
}

this.start = function () {
    // 管理进程开启info日志
    logger.setLogLevel('info');

    logger.info('start admin...');

    server.listen(config.httpAdminPort, config.httpAdminAddress, function () {
        logger.info('admin listen ok ${address}:${port}', {
            address: '127.0.0.1',
            port: config.httpAdminPort
        });
    });

    // 变更感知
    codeWatch.watch();
};

