/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const tnm2 = require('api/tnm2');

if (!global[__filename]) {

    global[__filename] = true;

    const watch = function() {
        const t1 = Date.now();

        setTimeout(() => {
            const t = (Date.now() - t1) * 10;

            tnm2.Attr_API_Set('AVG_TSW_ST0_X10', t);

            // 10S检查一次
            setTimeout(() => {
                watch();
            }, 10 * 1000);
        }, 0);
    };

    watch();
}
