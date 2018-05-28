/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


this.token = function(skey) {


    let str = skey || '';
    let hash = 5381;

    if (typeof context !== 'undefined') {
        const window = context.window || {};
        if (window.request) {
            str = str
                || window.request.cookies.p_skey
                || window.request.cookies.skey
                || window.request.cookies.rv2
                || window.request.cookies.access_token
                || '';
        }
    }

    for (let i = 0, len = str.length; i < len; ++i) {
        hash += (hash << 5) + str.charAt(i).charCodeAt();
    }
    return hash & 0x7fffffff;
};

