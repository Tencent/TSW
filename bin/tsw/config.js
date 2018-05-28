/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


module.exports = require('../../bin/proxy/config.js');

if (Object.keys(module.exports).length === 0) {

    let curr = module;

    /* eslint-disable no-console */
    console.error('config加载存在循环引用:');

    while (curr.parent) {

        console.error(curr.parent.filename);
        curr = curr.parent;
    }
    /* eslint-enable no-console */

    process.emit('warning', 'config加载存在循环引用');

}

