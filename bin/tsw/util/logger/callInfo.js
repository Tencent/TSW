/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'no use strict';

this.getCallInfo = function(level) {

    const res = {
        line: 0,
        column: 0,
        filename: ''
    };

    level = level || 0;

    const orig = Error.prepareStackTrace;
    const origLimit = Error.stackTraceLimit;
    Error.prepareStackTrace = captureStackTrace;
    Error.stackTraceLimit = 5;

    const err = Object.create(null);
    Error.captureStackTrace(err, arguments.callee);     // eslint-disable-line no-caller
    const { stack } = err;

    Error.prepareStackTrace = orig;
    Error.stackTraceLimit = origLimit;

    if (stack && stack[level] && typeof stack[level].getLineNumber === 'function') {
        res.line = stack[level].getLineNumber();
        res.column = stack[level].getColumnNumber();
        res.filename = stack[level].getFileName();
    }

    return res;
};

function captureStackTrace(_, stack) {
    return stack;
}

