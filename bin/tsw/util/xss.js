/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */


this.filterParams = function(params) {

    const _params = params || {};

    /* eslint-disable no-control-regex */
    const replaceMap = {
        reg: /(['"<\r\n\t\s\u0000-\u001f])/gim,
        '\'': '\u0027',
        '"': '\u0022',
        '<': '\u003C'
    };
    /* eslint-enable no-control-regex */

    const replaceFunc = function(n) {
        return replaceMap[n] || '';
    };

    for (const key in _params) {
        if (Array.isArray(_params[key])) {
            for (let i = _params[key].length - 1; i >= 0; i--) {
                _params[key][i] = _params[key][i] && (String(_params[key][i])).replace(replaceMap.reg, replaceFunc);
            }
        } else {
            _params[key] = _params[key] && (String(_params[key])).replace(replaceMap.reg, replaceFunc);
        }
    }

    return _params;
};

this.filterXSS = function (str) {
    const _param = {
        xss: str || ''
    };

    return this.filterParams(_param).xss;
};


const encodeMap = {
    'reg': /([&"'<>])/g,
    '&': '&amp;',
    '"': '&quot;',
    '\'': '&#039;',
    '<': '&lt;',
    '>': '&gt;'
};

const decodeMap = {
    'reg': /(&lt;)|(&quot;)|(&#0039;)|(&#039;)|(&#39;)|(&amp;)|(&gt;)/g,
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#0039;': '\'',
    '&#039;': '\'',
    '&#39;': '\'',
    '&amp;': '&'
};

const encode = function($0, c) {
    return encodeMap[c];
};

const decode = function(c) {
    return decodeMap[c];
};

// encode
this.htmlEncode = function(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return str.replace(encodeMap.reg, encode);
};
// decode
this.htmlDecode = function(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return str.replace(decodeMap.reg, decode);
};
