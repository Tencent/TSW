/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"no use strict";

this.getCallInfo = function(level){
	
	var orig,err,stack,line,column,filename;
	var res = {};
	
	level = level || 0;
	
	orig					= Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    err						= new Error();
    Error.captureStackTrace(err, arguments.callee);
    stack					= err.stack;
    Error.prepareStackTrace = orig;
	
	if(stack && stack[level] && typeof stack[level].getLineNumber === 'function'){
		res.line		= stack[level].getLineNumber();
		res.column		= stack[level].getColumnNumber();
		res.filename	= stack[level].getFileName();
	}
	
	return res;
}