/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const TIMES_LIMIT = 5;

if(global[__filename]){
	global[__filename].map = {};
}else{

	global[__filename] = {
		map: {}
	};

	//追踪重复读写
	process.nextTick(function(){
		var cache		= global[__filename];
		var isWindows	= require('util/isWindows');
		var fs			= require('fs');
		var util 		= require('util');
		var logger 		= require('logger');
		var config 		= require('config');
		var tnm2 		= require('api/tnm2');

		fs.existsSync = hack(fs.existsSync,function(file){
			var sum 	= 0;
			var name	= 'fs.existsSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum % TIMES_LIMIT === 0 && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		fs.writeFileSync = hack(fs.writeFileSync,function(file){
			var sum 	= 0;
			var name	= 'fs.writeFileSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum % TIMES_LIMIT === 0 && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		fs.statSync = hack(fs.statSync,function(file){
			var sum 	= 0;
			var name	= 'fs.statSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum > TIMES_LIMIT && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		fs.accessSync = hack(fs.accessSync,function(file){
			var sum 	= 0;
			var name	= 'fs.accessSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum % TIMES_LIMIT === 0 && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		fs.readFileSync = hack(fs.readFileSync,function(file){
			var sum 	= 0;
			var name	= 'fs.readFileSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum > TIMES_LIMIT && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		fs.readdirSync = hack(fs.readdirSync,function(file){
			var sum 	= 0;
			var name	= 'fs.readdirSync';
			var key		= name + file;

			cache.map[key]	= ~~cache.map[key] + 1;
			sum			= cache.map[key];

			if(sum % TIMES_LIMIT === 0 && !config.devMode){
				logger.warn('[sync]${name} callee ${sum} times on file: ${file} \n${stack}',{
					name: name,
					file: file,
					sum: sum,
					stack: new Error('find bad code').stack
				});
			}

			tnm2.Attr_API('SUM_TSW_FILE_SYNC', 1);
		});

		//fs.realpathSync = hack(fs.realpathSync,function(file){
		//	logger.debug('[sync] ${name} ${file}',{
		//		name: 'fs.realpathSync',
		//		file: file
		//	});
		//});

		function checkSum(){
			logger.info()
		}

		function hack(fn,callback){

			if(isWindows.isWindows){
				return fn;
			}

			return function(){
				callback.apply(this, arguments);
				return fn.apply(this, arguments);
			}
		}
	});

}


