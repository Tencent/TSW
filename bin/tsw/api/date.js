/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

var Date = {
	
	/**
	 * 格式化时间
     * @method formatData
	 * @param {Date} mDate 时间对象
	 * @param {String} fmt 格式化形式，如 MM月dd日 HH:mm
	 */
	format: function(mDate, fmt){
		var o = {
			'M+': mDate.getMonth() + 1, //月份
			'D+': mDate.getDate(), //日
			'h+': mDate.getHours() % 12 == 0 ? 12 : mDate.getHours() % 12, //小时
			'H+': mDate.getHours(), //小时
			'm+': mDate.getMinutes(), //分
			's+': mDate.getSeconds(), //秒
			'q+': Math.floor((mDate.getMonth() + 3) / 3), //季度
			'S': mDate.getMilliseconds() //毫秒
		}, week = {
			'0': '\u65e5',
			'1': '\u4e00',
			'2': '\u4e8c',
			'3': '\u4e09',
			'4': '\u56db',
			'5': '\u4e94',
			'6': '\u516d'
		};
		
		if (/(Y+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (mDate.getFullYear() + '').substr(4 - RegExp.$1.length));
		}
		if (/(E+)/.test(fmt)) {
			fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[mDate.getDay() + '']);
		}
		
		for (var k in o) {
			if (new RegExp('(' + k + ')').test(fmt)) {
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
			}
		}
		
		return fmt;
	}
};

module.exports = Date;