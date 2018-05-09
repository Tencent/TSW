/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const config 		= require('./logger.config');
const cluster		= require('cluster');
const fs			= require('fs');
const path			= require('path');
const util			= require('util');
const contextMod	= require('context.js');
const callInfo		= require('./callInfo.js');
const {isWindows}	= require('util/isWindows.js');
const tnm2 			= require('api/tnm2');
const canIuse		= /^[0-9a-zA-Z_\-]{0,64}$/;
const cache			= global[__filename] || {
	filterWatcher: null
};
const freqCache 	= {
	clearTime: 0,
	count: 0,
	detail: {}
};
const errFreqConfig = {		////错误log频率限制
	'time': 5 * 1000,		//频率周期
	'count': 20				//最大次数
};

var	logger;


global[__filename] = cache;

module.exports = function(){
	if(!logger){
		logger = new Logger();
	}
	return logger;
};

module.exports.Logger = Logger;


function Logger(){
	
	return this;
}

Logger.prototype = {
	
	occurError: function(){
		
		var curr = contextMod.currentContext();
		
		if(curr.window && curr.window.request){
			curr.log = curr.log || {};
		}
		
		if(curr.log){
			curr.log.showLineNumber = true;
		}
		
	},
	
	getLog: function(){
		var log = contextMod.currentContext().log || null;
		
		return log;
	},

	drop: function(dropAlpha){
		var log = this.getLog();

		if(log && log.showLineNumber && !dropAlpha){
			return;
		}

		contextMod.currentContext().log = null;
	},
	
	getJson: function(){
		var log = this.getLog();
		var json = {
			curr: {},
			ajax: []
		};
		
		if(log === null){
			return null;
		}
		
		if(log.json){
			json = log.json;
		}else{
			log.json = json;
		}

		return json;
	},
	
	getText: function(){
		var log = this.getLog();
		var arr = [];
		
		if(log && log.arr){
			
			log.arr.forEach(function(fn){
				arr.push(fn());
			});
			
			return arr.join('\n');
		}

		return '';
	},
	
	setKey: function(key){

		if(!canIuse.test(key)){
			this.debug('bad key: ${key}',{key:key});
			return;
		}

		this.debug('setKey: ${key}',{key:key});
		
		var log = this.getLog();
		var alpha		= require('util/alpha.js');

		if(!log){
			return;
		}

		log.key = key;

		if(alpha.isAlpha(key)){
			log.showLineNumber = true;
		}
	},

	getKey: function(){
		var log = this.getLog();
		
		if(log){
			return log.key;
		}
		
		return null;
	},

	setGroup: function(group){

		if(!canIuse.test(group)){
			this.debug('bad group: ${group}',{group:group});
			return;
		}

		this.debug('setGroup: ${group}',{group:group});

		var log = this.getLog();

		if(log){
			log.group = group;
		}
	},

	getGroup: function(){
		var log = this.getLog();

		if(log){
			return log.group;
		}

		return null;
	},
	
	isReport: function(){
		var log = this.getLog();
		
		if(!log){
			return false;
		}
		
		if(log.force){
			return true;
		}
		
		if(log.ERRO){
			return true;
		}
		
		return false;
	},
	
	report: function(key){
		
		this.debug('report ${key}',{key:key});
		
		var log = this.getLog();
		
		if(log){
			log.force = 1;
		}
		
		if(key){
			this.setKey(key);
		}
	},
	
	fillBuffer: function(type,fn){
		var log = this.getLog();
		var buff;
		
		if(log){
			
			if(!log.arr){
				log.arr = [];
			}
			
			if(fn){
				log.arr.push(fn);
			}
			
			if(type){
				if(log[type]){
					log[type]++;
				}else{
					log[type] = 1;
				}
			}
		}
	},
	
	getSN: function(){
		return contextMod.currentContext().SN || 0;
	},
	
	getCpu: function(){
		var cpu =  process.serverInfo && process.serverInfo.cpu;
		
		if(cpu === undefined){
			cpu = '';
		}
		
		return cpu;
	},
	
	debug : function(str,obj){
		this.writeLog('DBUG',str,obj);
	},
	
	info : function(str,obj){
		this.writeLog('INFO',str,obj);
	},
	
	warn : function(str,obj){
		this.writeLog('WARN',str,obj);
	},
	
	error : function(str,obj){
		//this.occurError();
		this.writeLog('ERRO',str,obj);
	},
	
	writeLog : function(type,str,obj){
		
		var level	= this.type2level(type);
		var log		= this.getLog();
		var allow	= filter(level,str,obj);
		var logStr	= null;
		
		if(log || allow === true || level >= config.getLogLevel()){
			logStr	= this._getLog(type,level,str,obj);
		}
		
		if(logStr === null){
			return this;
		}
		
		this.fillBuffer(type,logStr);
		
		if(allow === false){
			return this;
		}
		
		if(allow === true){
			return this.asyncLog(logStr,level);
		}
		
		if(level >= config.getLogLevel()){
			return this.asyncLog(logStr,level);
		}
	},
	
	type2level: function(type){
		
		if(type === 'DBUG'){
			return 10;
		}
		
		if(type === 'INFO'){
			return 20;
		}
		
		if(type === 'WARN'){
			return 30;
		}
		
		if(type === 'ERRO'){
			return 40;
		}
		
		return 0;
	},

	setLogLevel: function(level){
		config.logLevel = level;
	},
	
	_getLog: function(type,level,str,obj){
		
		var log 		= this.getLog();
		var that		= this;
		var filename	= '';
		var column		= '';
		var line		= '';
		var orig,err,stack;
		var enable		= false;
		var info		= {};
		
		if(level >= config.getLogLevel()){
			enable = true;
		}

		////大量报错导致性能问题，先关闭
		//if(log && log['ERRO']){
		//	enable = true;
		//}
		
		if(log && log['showLineNumber']){
			enable = true;
		}

		if((enable && global.cpuUsed < 70) || isWindows){
			
			info = callInfo.getCallInfo(3);
			
			line		= info.line;
			column		= info.column;
			filename	= info.filename || '';
		}
		
		
		var now = new Date();
		var text = null;
				
		var fn = function(){
			
			if(text!== null){
				return text;
			}
			
			filename	= filename || '';
			
			if(isWindows){
				filename = filename.replace(/\\/g,'/');
			}
			
			var index = filename.lastIndexOf('/node_modules/');
		
			if(index >= 0){
				index += 14; 
			}else{
				index = filename.lastIndexOf('/') + 1;
			}
			
			if(index >= 0){
				filename = filename.slice(index);
			}
			
			text = that.format({
				SN		: that.getSN(),
				yyyy 	: now.getFullYear(),
				MM		: zeroize(now.getMonth() + 1,2),
				dd		: zeroize(now.getDate(),2),
				HH		: zeroize(now.getHours(),2),
				mm		: zeroize(now.getMinutes(),2),
				ss		: zeroize(now.getSeconds(),2),
				msec	: zeroize(now.getTime() % 1000,3),
				type	: type,
				mod_act	: contextMod.currentContext().mod_act || null,
				file	: filename,
				txt		: typeof str === 'string' ? merge(str,obj) : '\n' + util.inspect(str),
				line	: line,
				column	: column,
				cpu		: that.getCpu(),
				pid		: process.pid
			});
			
			return text;
		}
		
		return fn;
	},
	
	asyncLog: function(fn,level){
		
		var str;
		
		if(typeof fn === 'function'){
			str = fn();
		}else{
			str = fn;
		}
		
		this.print(str,level);
		
		return this;
	},
	
	print: function(str,level){

		if(level <= 20){
			(console.originLog || console.log)(str)
		}else if(level <= 30){
			(console.originWarn || console.warn)(str)
		}else{
			(console.originError || console.error)(str);
		}

		//console.Console.prototype.log.call(console,str);
		//process.stdout.write(str);
		//process.stdout.write('\n');
	},
	
	format: function(data){
		
		var str = data.yyyy
			 + '-'
			 + data.MM
			 + '-'
			 + data.dd
			 + ' '
			 + data.HH
			 + ':'
			 + data.mm
			 + ':'
			 + data.ss
			 + '.'
			 + data.msec
			 + ' ['
			 + data.type
			 + '] ['
			 + data.pid
			 + ' cpu'
			 + data.cpu
			 + ' '
			 + data.SN
			 + '] ['
			 + data.mod_act
			 + '] ['
			 + data.file
			 + ':'
			 + data.line
			 + '] '
			 + data.txt;
			 
		return str;
	},
	
	merge: merge,
	zeroize: zeroize
}

function merge(str,obj){

	if(typeof obj !== 'object'){
		return str;
	}

	return str && str.replace(/\$\{(.+?)\}/g,function($0,$1){
		
		var rs = obj && obj[$1];
		var undefined;
		
		return rs === undefined ? '' :
			typeof rs === 'string' ? rs : util.inspect(rs);
	});
}


/**
 * 数字加前导0
 * @param {Number} num 一个整数
 * @param {Number} width 总宽度
 * @return {String} 加完前导0的字符串
 * 
 */
function zeroize(num,width){
	var s = String(num),
		len = s.length;
	return len >= width ? s : '0000000000000000'.slice(len - width) + s;
}


/**
 * 检查Error log是否超过了频率限制
 * @param  {[type]}  level [description]
 * @param  {[type]}  str   [description]
 * @param  {[type]}  obj   [description]
 * @return {Boolean}       [description]
 */
function isExceedFreq(level,str,obj){

	var mod_act = contextMod.currentContext().mod_act || 'null',
		curTime = Date.now(),
		exceed  = false,
		content,
		detail,
		key,
		cfg;

	if(isWindows){
		return false;
	}

	//先只限制error + warn log
	if(level < config.levelMap['warn']){
		return false;
	}

	if(curTime - freqCache.clearTime >= errFreqConfig.time){
		freqCache.clearTime = curTime;

		tnm2.Attr_API_Set('AVG_TSW_ERROE_LOG_5S', freqCache.count);

		freqCache.count  = 0;
		
		freqCache.detail = {};
	}

	freqCache.count++;

	cfg = freqCache.detail[mod_act];

	if(!cfg){
		cfg = {
			count: 0,
			errMsg: ''
		};

		freqCache.detail[mod_act] = cfg;
	}

	cfg.count++;

	//最后一条报错信息也记录下来
	// cfg.errMsg = merge(str, obj);

	//总错误量超过了上限
	if(freqCache.count > errFreqConfig.count){
		exceed = true;

		logger && logger.drop();
		tnm2.Attr_API('SUM_TSW_ERROR_LOG_DROP', 1);
	}

	return exceed;
}


/**
 * 返回过滤器
 */
function filter(level,str,obj){

	if(isExceedFreq(level, str, obj)){
		return false;
	}

}

logger = new Logger(__filename);




