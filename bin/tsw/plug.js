/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const path = require('path');

/**
 * 
 * 获取内置模块
 * 
 * @param {String} id
 */
function plug(id){
	return require(id);
}

if(!global.plug){
	
	
	plug.__dirname  = __dirname;
	plug.parent  	= path.join(__dirname , '..');
	plug.paths 		= [
		path.join(__dirname , '../tsw'),
		path.join(__dirname , '../tencent'),
		path.join(__dirname , '../lib')
	];

	module.paths = plug.paths.concat(module.paths);

	global.plug = plug;
	
	//支持seajs模块
	require('loader/seajs');
	require('loader/extentions.js');

	JSON.stringify = function(stringify){
		return function(){
			var str = stringify.apply(this,arguments);
			
			if(str && str.indexOf('<') > -1){
				str = str.replace(/</gmi,'\\u003C');
			}
			return str;
		}
	}(JSON.stringify);
	
}

module.exports = plug;


