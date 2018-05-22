/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

this.filterParams = function(params){

    var _params = params || {};

    /* eslint-disable no-control-regex */
    var replaceMap = {
        reg  : /(['"<\r\n\t\s\u0000-\u001f])/gim,
        '\'' : '\u0027',
        '"' : '\u0022',
        '<'  : '\u003C'
    };
    /* eslint-enable no-control-regex */

    var replaceFunc = function(n){
        return replaceMap[n] || '';
    };

    for(var key in _params){
        if(Array.isArray(_params[key])){
            for(var i=_params[key].length-1; i>=0; i--){
                _params[key][i] = _params[key][i] && (_params[key][i]+'').replace(replaceMap.reg,replaceFunc);
            }
        }else{
            _params[key] = _params[key] && (_params[key]+'').replace(replaceMap.reg,replaceFunc);
        }
    }

    return _params;
};

this.filterXSS = function (str) {
    var _param = {
        xss : str || ''
    };

    return this.filterParams(_param).xss;
};


var encodeMap	= {
        reg	: /([&"'<>])/g,
        '&' : '&amp;',
        '"'	: '&quot;',
        '\''	: '&#039;',
        '<'	: '&lt;',
        '>'	: '&gt;'
    },
    decodeMap = {
        reg : /(&lt;)|(&quot;)|(&#0039;)|(&#039;)|(&#39;)|(&amp;)|(&gt;)/g,
        '&lt;' : '<',
        '&gt;' : '>',
        '&quot;' : '"',
        '&#0039;' : '\'',
        '&#039;' : '\'',
        '&#39;' : '\'',
        '&amp;' : '&'
    },
    encode	= function($0,c){return encodeMap[c];},
    decode = function(c){return decodeMap[c];};

//encode
this.htmlEncode = function(str){
    if(typeof str != 'string'){
        str = str + '';
    }
    return str.replace(encodeMap.reg,encode);
};
//decode
this.htmlDecode = function(str){
    if(typeof str != 'string'){
        str = str + '';
    }
    return str.replace(decodeMap.reg,decode);
};