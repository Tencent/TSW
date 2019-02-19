/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const fs = require('fs');
const path = require('path');
const plug = require('plug');
const Deferred = plug('util/Deferred');
const defaultValue = plug('default/config.default.js');
const processArgs = plug('util/process.args.js');
const cwd = process.cwd();
const currConfig = path.join(cwd, 'tsw.config.js');
let cache = {
    config: null
};

if (global[__filename]) {
    cache = global[__filename];
} else {
    global[__filename] = cache;
}

if (typeof processArgs.config === 'string') {
    cache.config = loadConfig(path.resolve(cwd, processArgs.config));
} else if (typeof process.env.TSW_CONFIG_PATH === 'string') {
    cache.config = loadConfig(process.env.TSW_CONFIG_PATH);
} else if (fs.existsSync(currConfig)) {
    cache.config = loadConfig(currConfig);
} else if (fs.existsSync('/etc/tsw.config.js')) {
    cache.config = loadConfig('/etc/tsw.config.js');
} else if (fs.existsSync('/usr/local/node_modules/config.js')) {
    cache.config = loadConfig('/usr/local/node_modules/config.js');
} else if (fs.existsSync('/data/release/tsw.config.js')) {
    cache.config = loadConfig('/data/release/tsw.config.js');
} else if (fs.existsSync('/data/release/node_modules/config.js')) {
    cache.config = loadConfig('/data/release/node_modules/config.js');
} else if (fs.existsSync(__dirname + '/../../conf/config.js')) {
    cache.config = loadConfig(__dirname + '/../../conf/config.js');
}

function loadConfig(configFrom) {
    const config = require(configFrom);
    config.configFrom = configFrom;
    return config;
}


Deferred.extend(true, exports, defaultValue, cache.config);


if (exports.router) {
    exports.modAct = {
        getModAct: function(req) {
            return exports.router.name(req);
        }
    };
    exports.modMap = {
        find: function(name, req, res) {
            return exports.router.find(name, req, res);
        }
    };
}

if (exports.wsRouter) {
    exports.wsModAct = {
        getModAct: function(ws) {
            return exports.wsRouter.name(ws);
        }
    };
    exports.wsModMap = {
        find: function(name, ws) {
            return exports.wsRouter.find(name, ws);
        }
    };
}


module.exports = exports;

if (process.mainModule === module) {
    /* eslint-disable no-console */
    console.log(exports);
    /* eslint-enable no-console */
}
