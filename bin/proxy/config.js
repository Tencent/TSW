/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs			= require('fs');
const path			= require('path');
const plug			= require('plug');
const Deferred		= plug('util/Deferred');
const defaultValue	= plug('default/config.default.js');

var isFirstLoad	= false;
var cache			= {
    config: null
};


if(global[__filename]){
    cache = global[__filename];
}else{
    global[__filename] = cache;
    isFirstLoad = true;
}

if(isFirstLoad){
    process.dlopen = function(fn){
        var parent  	= path.join(__dirname , '..');

        return function(module,curr){
            //检查node私有文件
            if(/\.node$/i.test(curr) && curr.indexOf(parent) !== 0){
                //发现私有node扩展
                setTimeout(function(){
                    require('runtime/md5.check.js').findNodeCpp(curr);
                },3000);
            }
            return fn.apply(this, arguments);
        };
    }(process.dlopen);
}



if(fs.existsSync('/etc/tsw.config.js')){
    cache.config = require('/usr/local/node_modules/config.js');
}else if(fs.existsSync('/usr/local/node_modules/config.js')){
    cache.config = require('/usr/local/node_modules/config.js');
}else if(fs.existsSync('/data/release/node_modules/config.js')){
    cache.config = require('/data/release/node_modules/config.js');
}else if(fs.existsSync(__dirname + '/../../conf/config.js')){
    cache.config = require('../../conf/config.js');
}



Deferred.extend(true,exports,defaultValue,cache.config);


if(exports.router){
    exports.modAct = {
        getModAct : function(req){
            return exports.router.name(req);
        }
    };
    exports.modMap = {
        find : function(name,req,res){
            return exports.router.find(name,req,res);
        }
    };
}

if(exports.wsRouter){
    exports.wsModAct = {
        getModAct : function(ws){
            return exports.wsRouter.name(ws);
        }
    };
    exports.wsModMap = {
        find : function(name,ws){
            return exports.wsRouter.find(name,ws);
        }
    };
}


module.exports = exports;

if(process.mainModule === module){
    /* eslint-disable no-console */
    console.log(exports);
    /* eslint-enable no-console */
}
