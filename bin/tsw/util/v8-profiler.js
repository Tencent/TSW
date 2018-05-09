/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const fs       = require('fs');
const profiler = require('v8-profiler');
const DEFAULT_RECORD_TIME = 5 * 1000;
const MAX_RECORD_TIME = 5 * 60 * 1000;

let _isRecording = false;

/**
 * 获取CPU Profiler
 * @param  {[type]}   opt      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function getProfiler(opt, callback) {
	if(_isRecording){
		callback && callback(null);

		return;
	}

	_isRecording = true;

	opt = opt || {};

	const tag = 'cpu_profiler_' + Date.now();

	profiler.startProfiling(tag, true);

	setTimeout(() => {
		const prof = profiler.stopProfiling(tag);

		prof.export((err, result) => {
			callback && callback(result);

			prof.delete();
		});

		_isRecording = false;
	}, Math.min(opt.recordTime || DEFAULT_RECORD_TIME, MAX_RECORD_TIME));
}

/**
 * 获取CPU Profiler并写本地文件，支持自定义参数
 * @param  {[type]}   path     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function writeProfilerOpt(path, opt = {}, callback) {
	getProfiler(opt, result => {
		if(path && result){
			fs.writeFile(path, result, err => {
				callback && callback(path);
			});
		}else{
			callback && callback(path);
		}
	});
}

/**
 * 获取CPU Profiler并写本地文件
 * @param  {[type]}   path     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function writeProfiler(path, callback) {
	writeProfilerOpt(path, {}, callback);
}

module.exports = {
	getProfiler,
	writeProfiler,
	writeProfilerOpt
};