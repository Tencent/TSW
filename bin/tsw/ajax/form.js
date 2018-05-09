/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

/**
 * ajax发请求时组装form-data
 */


/**
 * 普通类型Form值
 * @param  {[type]} boundary [description]
 * @param  {[type]} key      [description]
 * @param  {[type]} value    [description]
 * @return {[type]}          [description]
 */
function textField(boundary, key, value) {
	return Buffer.from([
		'--' + boundary,
		'Content-Type: text/plain; charset=utf-8',
		'Content-Disposition: form-data; name="' + key + '"',
		'',
		value,
		''
	].join('\r\n'));
}


/**
 * 文件类型Form值
 * @param  {[type]} boundary [description]
 * @param  {[type]} key      [description]
 * @param  {[type]} value    =             {} [description]
 * @return {[type]}          [description]
 */
function fileField(boundary, key, value = {}) {
	let tmp = [];

	let contentType     = value.contentType || 'application/octet-stream';
	let dispositionType = value.dispositionType || 'form-data';
	let fileName        = value.fileName || '';

	tmp.push('--' + boundary);

	tmp.push('Content-Type: ' + contentType);

	tmp.push('Content-Disposition: ' + dispositionType + '; name="' + key + '"; filename="' + fileName + '"');

	tmp.push('\r\n');

	let buffer = Buffer.from(tmp.join('\r\n'));

	if(Buffer.isBuffer(value.content)){
		buffer = Buffer.concat([buffer, value.content, Buffer.from('\r\n')]);
	}else{
		buffer = Buffer.concat([buffer, Buffer.from(value.content || ''), Buffer.from('\r\n')]);
	}

	return buffer;
}


/**
 * 构建Form表单发送时的buffer
 * @param  {[type]} opt = {} [description]
 * @return {[type]}      	 [description]
 */
function getFormBuffer(opt = {}) {

	let buffer = Buffer.alloc(0);

	let v;

	for(let key in opt.data){
		
		v = opt.data[key];
		
		if(v !== undefined && v !== null){
			
			if(v.fileType){
				buffer = Buffer.concat([buffer, fileField(opt.boundary, key, v)]);
			}else{
				buffer = Buffer.concat([buffer, textField(opt.boundary, key, v)]);
			}
		}
	}
	
	buffer = Buffer.concat([buffer, Buffer.from('--' + opt.boundary + '--')]);

	return buffer;
}

module.exports = {
	getFormBuffer
};