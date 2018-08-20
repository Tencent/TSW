/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
let isFirstLoad = false;
let cache = {
    config: null
};


if (global[__filename]) {
    cache = global[__filename];
} else {
    global[__filename] = cache;
    isFirstLoad = true;
}

if (isFirstLoad) {
    process.dlopen = (function(fn) {
        const parent = path.join(__dirname, '..');

        return function(module, curr) {
            // 检查node私有文件
            if (/\.node$/i.test(curr) && curr.indexOf(parent) !== 0) {
                // 发现私有node扩展
                setTimeout(function() {
                    require('runtime/md5.checker.js').findNodeCpp(curr);
                }, 3000);
            }
            return fn.apply(this, arguments);
        };
    })(process.dlopen);
}
