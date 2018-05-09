/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

function formatBuffer(buffer) {
	if(!(buffer && buffer.length)){
        return '';
    }

    var str = "";

    for (var i = 0, len = buffer.length; i < len; i++) {
        if(i % 16 === 0){
            str += '0x' + ('00000000000' + i.toString(16)).slice(-8) + ':  ';
        }

        str += (buffer[i] > 15 ? "" : "0") + buffer[i].toString(16).toUpperCase() + (((i+1) % 16 == 0) ? "\n" : (i % 2 === 0 ? '' : ' '));
    }

    return str;
}

module.exports = {
	formatBuffer
};