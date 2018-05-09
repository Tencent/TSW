/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const Context	= require('runtime/Context');
const Window	= require('runtime/Window');

this.currentContext = function(){
	return (process.domain && process.domain.currentContext) || new Context();
}

if(!global.context){
	
	Object.defineProperty(global, 'context', {
	    get : function(){
			return module.exports.currentContext();
	    }
	});
	
	Object.defineProperty(global, 'window', {
	    get : function(){

			if(global.windowHasDisabled){
				return undefined;
			}

			var curr = module.exports.currentContext();

			if(!curr.window){
				curr.window = new Window();
			}

	        return curr.window;
	    }
	});
}


