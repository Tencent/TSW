/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const cp			= require('child_process');
const fs			= require('fs');
const path			= require('path');
const logger		= require('logger');
const dateApi		= require('api/date.js');
const {isWindows}	= require('util/isWindows.js');
const logDir		= path.resolve(__dirname, '../../../../log/').replace(/\\/g, '/');
const backupDir		= path.resolve(logDir, './backup/').replace(/\\/g, '/');
const runlogPath	= path.resolve(logDir, './run.log.0').replace(/\\/g, '/');

//判断logDir目录是否存在
fs.exists(logDir, function(exists){
	if (!exists) {
		fs.mkdirSync(logDir,0o777);
	}

	//判断backup目录是否存在
	fs.exists(backupDir, function(exists){
		if (!exists) {
			fs.mkdirSync(backupDir,0o777);
		}
	});
});

var LogMan = {
	
	/**
	 * 按分钟\小时\天去备份log
	 */
	delayMap: {
		m: 60000,
		H: 3600000,
		D: 86400000
	},
	
	/**
	 * 启动log管理
	 */
	start: function(config){
		logger.info('start log manager');
		var self = this;
		this.delayType = config.delay || 'D';
		this.delay = this.delayMap[this.delayType];
		this.timer = setInterval(function(){
			self.backLog();
		}, this.delay);
	},
	
	/**
	 * 备份log
	 */
	backLog: function(){
		logger.info('start backup log');
		var self = this;
		var curBackupDir = path.resolve(backupDir, './' + dateApi.format(new Date, 'YYYY-MM-DD'));
		fs.exists(curBackupDir, function(exists){
			if(!exists){
				fs.mkdirSync(curBackupDir);
			}
			var logFilePath = path.resolve(curBackupDir, './' + dateApi.format(new Date, self.delayType + self.delayType) + '.log');
			var cmdCat = 'cat ' + runlogPath + ' >> ' + logFilePath;
			var cmdClear = 'cat /dev/null > ' + runlogPath;
			
			//兼容windows
			if(isWindows){
				logFilePath = logFilePath.replace(/\\/g, '\\\\');
				cmdCat = 'type ' + runlogPath + ' > ' + logFilePath;
				cmdClear = 'type NUL > ' + runlogPath;
			}
			
			//backup
			logger.info('backup: '+ cmdCat);
			var cat = cp.exec(cmdCat, function(error, stdout, stderr){
				if (error !== null) {
					logger.error('cat error, ' + error);
				}
				
				//clear
				logger.info('clear: ' + cmdClear);
				var clear = cp.exec(cmdClear, function(error, stdout, stderr){
					if (error !== null) {
						logger.error('clear error, ' + error);
					}
				});
			});
		});
	}
	
}

module.exports = LogMan;