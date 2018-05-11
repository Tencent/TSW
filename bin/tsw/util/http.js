/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const isWindows 	= require('util/isWindows');
const os			= require('os');
const serverInfo	= require('serverInfo.js');
const logger		= require('logger');
const isInnerIP		= require('util/http.isInnerIP.js');
const Deferred		= require('util/Deferred');
const more			= require('util/http.more.js');


this.formatHeader = function(headers){

	var key, v,res = {};

	if(!headers){
		return headers;
	}

	Object.keys(headers).forEach(function(key){

		if(typeof key !== 'string'){
			return;
		}

		var formatKey = key.trim().replace(/(\w)(\w+)/g , function(v,v1,v2){
			return  v1.toUpperCase()+v2.toLowerCase()
		});

		res[formatKey] = module.exports.filterInvalidHeaderChar(headers[key]);

	});

	return res;
}

/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 **/
this.checkInvalidHeaderChar = function(val) {

	if(typeof val !== 'string'){
		return false;
	}

	var ch;

	for (var i = 0; i < val.length; i++) {
		ch = val.charCodeAt(i);
		if (ch === 9) continue;
		if (ch <= 31 || ch > 255 || ch === 127) return true;
	}
	return false;
}

//过滤非法字符
this.filterInvalidHeaderChar = function(val){

	if(typeof val === 'string' && this.checkInvalidHeaderChar(val)){
		return val.replace(/[^\u0009\u0020-\u007E\u0080-\u00FF]/g,'')
	}

	return val;
}

this.captureBody = function(res){
	
	if(res._capturing){
		return;
	}
	
	res._capturing = true;
	res._body = [];
	res._bodySize = 0;

	res.captrueBody = function(data, encoding){
		//大于1M的不抓包
		var buffer;
		var size;

		if (typeof data === 'function') {
		    data = null;
		} else if (typeof encoding === 'function') {
		    encoding = null;
		}

		if(!data){
			return;
		}

		if(Buffer.isBuffer(this._body)){
            logger.debug('write aftre end.');
            return;
        }

		if(Buffer.isBuffer(data)){
			buffer = data;
		}else{
			buffer = Buffer.from(data,encoding);
		}
		
		size = buffer.length;
		this._bodySize += size;

		//chunked
		if(this.useChunkedEncodingByDefaultNoNeed){
			this._body.push(Buffer.from('' + size.toString(16) + '\r\n'));
		}
		
		if(this._bodySize < 1024 * 1024){
			this._body.push(buffer);
			//chunked
			if(this.useChunkedEncodingByDefaultNoNeed){
				this._body.push(Buffer.from('\r\n'));
			}
		}
	};
	
	res._send = (function(fn){
		return function(...args){

			this.captrueBody(args[0],args[1]);
			
			return fn.apply(this,args);
		}
	}(res._send));
	
	res._finish = (function(fn){
		return function(...args){

			this.ServerDoneResponse = new Date();
			
			var ret = fn.apply(this,args);

			if(this.useChunkedEncodingByDefaultNoNeed){
				this._body.push(Buffer.from('0\r\n\r\n'));
			}
			
			if(!Buffer.isBuffer(this._body)){
				this._body = Buffer.concat(this._body);
			}

			return ret;
		}
	}(res._finish));
}

this.isPostLike = function(req){
	var method = typeof req === 'string' ? req : req.method;

	if(method === 'POST'){
		return true;
	}
	if(method === 'PUT'){
		return true;
	}
	if(method === 'DELETE'){
		return true;
	}
	return false;
}

this.isGetLike = function(req){

	var method = typeof req === 'string' ? req : req.method;

	if(method === 'GET'){
		return true;
	}
	if(method === 'HEAD'){
		return true;
	}
	if(method === 'OPTIONS'){
		return true;
	}
	return false;
}

this.isSent = function(res){

	if(!res){
		return true;
	}

	if(res.headersSent || res._headerSent || res.finished){
		return true;
	}

	return false;
}

this.getClientResponseHeaderStr = function(response,bodySize){
	
	var headData 	= [],
		bodySize	= ~~bodySize,
		key;


	headData.push('HTTP/' + response.httpVersion +  ' ' + response.statusCode + ' ' + response.statusMessage);
	
	var headers = Deferred.extend({},response.headers);
	
	if(bodySize >= 0 && headers['content-length'] === undefined){
		delete headers['transfer-encoding'];
		headers['content-length'] = bodySize;
	}

	for(key in headers){

		headData.push(key + ': ' + headers[key]);
	}
	
	headData.push('');
	headData.push('');
	
	return headData.join('\r\n');    
}

this.getClientRequestHeaderStr = function(request){
	
	return request._header;
}

this.getRequestHeaderStr = function(request){

	var window   = context.window || {};
	var headData 	= [],
		key;
		
	if(!request){
		request		= window.request;
	}
	
	if(!request){
		return '';
	}
	
	headData.push(request.method + " " + request.url +" HTTP/" + request.httpVersion);
	
	
	for(key in request.headers){
		headData.push(key + ': ' + request.headers[key]);
	}
	
	headData.push('');
	headData.push('');
	
	return headData.join('\r\n');    
}

this.getResponseHeaderStr = function(response){
	var window   = context.window || {};
	var headData 	= [],
		key;
		
	if(!response){
		response		= window.response;
	}
	
	if(!response){
		return '';
	}
	
	if(response._header){
		return response._header;
	}
	
	headData.push('HTTP/1.1 ' + response.statusCode + ' ' + response.statusMessage);
	
	for(key in response._headers){
		headData.push(key + ': ' + response._headers[key]);
	}
	
	headData.push('');
	headData.push('');
	
	return headData.join('\r\n');    
}

this.getUserIp24 = function(request){
	var window   = context.window || {};
	if(!request){
		request		= window.request;
	}

	if(!request){
		return '';
	}

	var userIp = this.getUserIp(request);

	if(!userIp){
		return '';
	}

	if(request.userIp24){
		return request.userIp24;
	}

	request.userIp24 = userIp.split('.').slice(0,-1).join('.') + '.*';

	return request.userIp24;
}

this.getUserIp = function(request){

	var window   = context.window || {};
	var userIp	= '';

	if(!request){
		request		= window.request;
	}
	
	if(!request){
		return '';
	}
	
	if(request.userIp){
		return request.userIp;
	}
	
	//取socket ip
	if(request.socket){
		userIp = request.socket.remoteAddress || '';
	}
	
	//win7判断
	if(isWindows.isWindows && userIp === '127.0.0.1'){
		userIp = serverInfo.intranetIp || userIp;
		request.userIp = userIp;

		return userIp;
	}

	if(!request.headers){
		return '';
	}
	
	var xff		= request.headers['x-forwarded-for'] || '';
	var qvia	= request.headers['qvia'] || '';
	var realIp	= request.headers['x-real-ip'] || '';

	if(xff){

		//xff判断，注意只认内网ip带的xff，外网带的不算
		if(userIp && this.isInnerIP(userIp)){

			xff		= xff.split(',').slice(-1)[0] || userIp;
			userIp	= xff.trim() || userIp;
		}

	}else if(realIp){

		//x-real-ip
		if(userIp && this.isInnerIP(userIp)){
			userIp = realIp;
		}
	}else if(qvia){
		
		//注意只认内网ip带的qvia，外网带的不算
		if(userIp && this.isInnerIP(userIp)){
			userIp = this.getIpCromQuia(qvia) || userIp;
		}
		
	}

	request.userIp = userIp;
	
	return  userIp;
}



this.isHttps = function(request){
	var window   = context.window || {};
	if(!request){
		request		= window.request;
	}
	
	if(!request || !request.REQUEST){
		return false;
	}

	if(this.isFromWns(request) || request.REQUEST.protocol == "https" || request.REQUEST.protocol == "https:"){
		return true;
	}else{
		return false;
	}

}


this.isInnerIP = function(ipAddress){
	return isInnerIP.isInnerIP(ipAddress);
};

this.isFromWns		= more.isFromWns;
this.getIpCromQuia	= more.getIpCromQuia;
this.getBase		= more.getBase;
this.fixPicUrl		= more.fixPicUrl;