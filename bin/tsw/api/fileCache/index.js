/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const Deferred		= require('util/Deferred');
const logger		= require('logger');
const path			= require('path');
const fs			= require('fs');
const root			= path.join(__dirname,'../../../../log/cache');
const tnm2 			= require('api/tnm2');
const existsCache	= {};


this.getDir = function(filepath){
	
	var res,tmp;
	
	filepath = filepath || '';

	if(!/^[a-z0-9_\/\-\.\\\:]+$/i.test(filepath)){
		throw new Error('filepath not safe: ' + filepath);
	}

	if(filepath.indexOf('http://') > -1){
		filepath = filepath.replace('http://','');
	}
	
	tmp = path.join('/',filepath);
	res = path.join(root,tmp);
	
	res = res.replace(/\\/g,'/');
	
	return res;
}

this.mkdir = function(dirname){

	if(existsCache[dirname]){
		return;
	}

	if(fs.existsSync(dirname)){
		existsCache[dirname] = true;
		return;
	}
	var start 	= Date.now();
	var arr 	= dirname.split('/');
	var i		= 0;
	var curr;
	
	for(i = 1; i < arr.length; i++){
		curr = arr.slice(0,i + 1).join('/');
		if(!fs.existsSync(curr)){
			logger.debug('mkdir : ${dir}',{
				dir: curr
			});
			try{
				fs.mkdirSync(curr,0o777);
			}catch(e){
				logger.info(e.stack);
			}

		}
	}
	var end 	= Date.now();
}

this.set = function(filepath,data){
	var start 		= Date.now();
	var buffer 		= null;
	var filename	= this.getDir(filepath);
	var dirname		= path.dirname(filename);
	var basename	= path.basename(filename);
	var randomname	= basename + '.tmp.' + String(Math.random()).slice(2);
	
	logger.debug('[set] filename : ${filename}',{
		filename: filename
	});
	
	logger.debug('[set] dirname : ${dirname}',{
		dirname: dirname
	});
	
	logger.debug('[set] basename : ${basename}',{
		basename: basename
	});
	
	logger.debug('[set] randomname : ${randomname}',{
		randomname: randomname
	});
	
	this.mkdir(dirname);
	
	if(typeof data === 'string'){
		buffer = Buffer.from(data,'UTF-8');
	}else{
		buffer = data;
	}
	
	fs.writeFile([dirname,randomname].join('/'),buffer,{mode:0o666},function(err){
		
		logger.debug('[write] done: ${randomname}, size: ${size}',{
			randomname: randomname,
			size: buffer.length
		});

		if(err){
			logger.info(err.stack);
			return;
		}
		
		fs.rename([dirname,randomname].join('/'),[dirname,basename].join('/'),function(err){
			var end 		= Date.now();
			
			if(err){
				logger.debug(err);
			}
			
			logger.debug('[rename] done: ${basename}, cost: ${cost}ms',{
				basename: basename,
				cost: end - start
			});
		});
		
	});

	tnm2.Attr_API('SUM_TSW_FILECACHE_WRITE', 1);
}

this.getSync = function(filepath){
	
	var start 		= Date.now();
	var buffer 		= null;
	var filename	= this.getDir(filepath);
	var res 		= {
		stats: null,
		data: null
	};
	
	try{
		buffer = fs.readFileSync(filename);
		if(buffer.length === 0){
			//长度为0返回空，因为垃圾清理逻辑会清空文件
			buffer = null;
		}

		res.stats = fs.statSync(filename);
		res.data = buffer;

	}catch(err){
		buffer = null;
	}
	
	var end 		= Date.now();
	
	logger.debug('[get] done: ${filename}, size: ${size}, cost: ${cost}ms',{
		filename: filename,
		size: buffer && buffer.length,
		cost: end - start
	});
	
	tnm2.Attr_API('SUM_TSW_FILECACHE_READ', 1);
	return res;
}

this.get = this.getAsync = function(filepath){
	
	var defer 		= Deferred.create();
	var filename	= this.getDir(filepath);
	
	
	var res = {
		stats: null,
		data: null
	};
	
	logger.debug('[getAsync] ${filename}',{
		filename: filename
	});
	
	fs.readFile(filename,function(err, buffer){
		
		if(err){
			logger.debug(err.stack);
			defer.resolve(res);
			return;
		}
		
		res.data = buffer;
		
		fs.stat(filename,function(err,stats){
			
			if(err){
				logger.debug(err.stack);
				defer.resolve(res);
				return;
			}
			
			logger.debug('[getAsync] mtime: ${mtime}, size: ${size}',stats);
			
			res.stats = stats;
			defer.resolve(res);
		});
		
	});
	
	return defer;
}



this.updateMtime = function(filepath, atime, mtime){

	var filename	= this.getDir(filepath);
	
	
	logger.debug('[updateMtime] ${filename}',{
		filename: filename
	});
	
	fs.utimes(filename, atime || new Date(), mtime || new Date(), function(err){
		if(err){
			logger.debug(err.stack);
			return;
		}

		logger.debug('[updateMtime] ${filename} succ');
	});
}