/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger		= require('logger');
const Memcached		= require('memcached');
const Queue			= require('util/Queue');
const dcapi			= require('api/libdcapi/dcapi.js');
const L5			= require('api/L5/L5.api.js');
const {isWindows}	= require('util/isWindows.js');
var cache			= global[__filename];

if(!cache){
	cache = {};
	global[__filename] = cache;
}


module.exports = function(opt){
	/**
	* 这里像这样写的目的主要是为了进行测试
	  因为在使用sinon.js时， 如果你exports的是一个function，你就无法进行stub，
	*/
	return module.exports.getCmem(opt);
};

module.exports.getCmem = function(opt){
	var route;
	var key;

	if(!opt){
		return null;
	}

	if(!isWindows && opt.modid && opt.cmd){
		
		route = L5.ApiGetRouteSync(opt);
		
		logger.debug('L5 ~${ip}:${port}',route);
		
		if(route.ip && route.port){
			opt.host = [route.ip,route.port].join(':');
		}
		
		route.ret		= route.ret;
		route.usetime	= 100;
		L5.ApiRouteResultUpdate(route);
		
	}
	
	key = [opt.modid,opt.cmd,opt.host].join(':');
	
	if(!cache[key]){
		cache[key] = queueWrap(new Memcached(opt.host, opt)); 
	}
	
	return cache[key];
}


function queueWrap(memcached){
	
	if(memcached.__queue){
		return memcached;
	}
	
	memcached.__queue = Queue.create();
	
	memcached.command = function(command){
		
		return function(queryCompiler, server){
			var memcached	= this;
			var queue		= memcached.__queue;
			var servers		= memcached.servers && memcached.servers[0];
			var start		= Date.now();
		
			queue.queue(function(){
				
				var fn = (function(queryCompiler){
					return function(){
						var query	= queryCompiler();
						var command = query.command || '';
						var index	= command.indexOf('\r\n');	//不要数据部分
						if(index > 0){
							command = command.slice(0,Math.min(128,index));
						}
						if(command.length >= 128){
							command = command.slice(0,128) + '...' + command.length;
						}

						logger.debug(command);

						query.callback = function(callback){
							return function(...args){
								var err		= args[0];
								var code	= 0;
								var isFail	= 0;
								var delay	= Date.now() - start;
								var toIp	= servers.split(':')[0];

								if(err && err.message !== 'Item is not stored'){
									if(err.stack){
										logger.error(command);
										logger.error(servers);
										logger.error(err.stack);
										code = 2;
										isFail = 1;
									}else{
										logger.debug(err);
									}
								}

								dcapi.report({
									key			: 'EVENT_TSW_MEMCACHED',
									toIp		: toIp,
									code		: code,
									isFail		: isFail,
									delay		: delay
								});

								queue.dequeue();
								return callback && callback.apply(this,args);
							}
						}(query.callback);
						return query;
					}
				})(queryCompiler)
				
				command.call(memcached,fn, server);
			});
		}
	}(memcached.command);
	
	
	return memcached;
}
