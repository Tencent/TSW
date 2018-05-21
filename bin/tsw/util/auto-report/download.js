/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger		= require('logger');
const dcapi		    = require('api/libdcapi/dcapi.js');
const serverInfo	= require('serverInfo');
const gzipHttp 	    = require('util/gzipHttp.js');
const httpUtil	    = require('util/http');
const Archiver 	    = require('archiver');
const OALogin		= require('util/oa-login/index.js');
const tmpl 		    = require('./tmpl');
const post 		    = require('./post');
const postOpenapi	= require('./post.openapi.js');
const canIuse		= /^[0-9a-zA-Z_\-]{0,64}$/;
const Deferred	    = require('util/Deferred');
const zlib		    = require('zlib');
const MAX_ALPHA_LOG = post.MAX_ALPHA_LOG;


module.exports = function(request, response){
    OALogin.checkLoginForTSW(request,response,function(){
        module.exports.go(request,response);
    });
}

module.exports.go = function(request, response){

    var arr			= request.REQUEST.pathname.split('/');
    var appid		= context.appid || '';
    var group		= arr[3];
    var key			= arr[4];
    var groupKey	= 'v2.group.alpha';
    var limit		= ~~context.limit || 64;
    var currPost	= post;


    var flagOfDownloadFileFormat = request.query.fileFormat;

    if(appid){
        currPost	= postOpenapi;
        groupKey	= `${appid}/v2.group.alpha`;
    }

    if(!key){
        key		= group;
        group	= '';
    }

    if(!canIuse.test(appid)){
        return returnError('appid格式非法');
    }

    if(!canIuse.test(group)){
        return returnError('group格式非法');
    }

    if(!canIuse.test(key)){
        return returnError('key格式非法');
    }

    var createLogKey = function(appid,group,key){
        var logKey		= key;

        if(group){
            logKey	= `${group}/${logKey}`;
        }

        return logKey;
    };

    var logKey		= createLogKey(appid,group,key);

    if(appid){
        logKey	= `${appid}/${logKey}`;
    }

    //上下文设置
    context.group			= group;
    context.limit			= limit;
    context.key				= key;
    context.groupKey		= groupKey;
    context.logKey			= logKey;
    context.createLogKey	= createLogKey;

    var logCount	= 0;
    var logKeyCount	= 0;
    var logNumMax	= context.MAX_ALPHA_LOG || MAX_ALPHA_LOG;

    logger.debug('logKey :${logKey}',{
        logKey: logKey
    });

    //下标。
    var index = parseInt(request.GET.index,10);

    key = logKey + '.' + index;

    if(index >= 0){
        if(flagOfDownloadFileFormat === 'har'){
            currPost.getLogJsonByKey(logKey,key).done(function(data){
                downloadHaz(request, response, {
                    id: logKey + data['SNKeys'][0],
                    data: data
                });
            });
        }else {
            currPost.getLogJsonByKey(logKey,key).done(function(data){
                download(request, response, {
                    id: logKey + data['SNKeys'][0],
                    data: data
                });
            });
        }

    }else{
        //点击下载全部
        if(flagOfDownloadFileFormat === 'har'){
            currPost.getLogJson(logKey).done(function(data){
                downloadHaz(request, response, {
                    id: logKey,
                    data: data
                });
            });
        }else {
            currPost.getLogJson(logKey).done(function(data){
                download(request, response, {
                    id: logKey,
                    data: data
                });
            });
        }

    }
};


function returnError(message){
    var window = context.window;
    var gzipResponse = gzipHttp.getGzipResponse({
        request: window.request,
        response: window.response,
        code: 200,
        contentType: 'text/html; charset=UTF-8'
    });

    gzipResponse.end(message);
}


//curr
var initRequestHar =  function (request) {
    var unpackRaw = function (requestRaw) {
        var requestArr = [];
        // 补全没有的数据
        var request = {
            cookie:'',
            headers:[],
            postData:{},
            queryString:[],
            cache:{},
            timings:{}
        };
        if(requestRaw){
            requestArr = requestRaw.split(/\r\n/g);
            if(requestArr.length > 0 ){

                requestArr.forEach(function (item,index) {

                    item = item.trim();
                    if(item!=='' && item.length !== 0){
                        // 第一行，请求头：GET url；回包：HTTP/1.1 200 OK
                        if(index === 0){
                            var firstItem = item.split(' ');
                            // 请求头：GET url；
                            if(firstItem.length === 3){
                                request.protocol = firstItem[2];
                            }else{
                                request.protocol = firstItem[1];
                            }
                            request.method = firstItem[0];

                        }else{
                            item = item.split(':') || [];
                            if(item.length === 2 ){
                                request[item[0]] = item[1].trim();
                                request.headers.push({
                                    name:item[0],
                                    value:item[1]
                                });
                            }
                        }
                    }
                });
                if(request.method && request.method === 'POST'){
                    var postDataArr = requestArr[requestArr.length - 1];
                    request.postData.mimeType = "multipart/form-data";
                    request.postData.text = postDataArr;
                }


            }
        }
        // 补齐cookie
        if(request.cookie){
            var cookieArray = request.cookie.split(';');
            if(cookieArray.length > 0){
                request.cookieArray = [];
                cookieArray.forEach(function (item) {
                    item = item.split('=') || [];
                    request.cookieArray.push({
                        name:item[0],
                        value:item[1]
                    });
                })
            }
        }
        // 补齐query
        if(request.path && request.path.indexOf('?') !== -1){
            var query = request.path.slice(request.path.indexOf('?') + 1);
            if(query){
                query = query.split('&');// re=va
                query.forEach(function (item) {
                    item = item.split('=');
                    request.queryString.push({
                        name:item[0],
                        value:item[1],
                    });
                });
            }
        }

        return request;
    };
    var getUrl    = function (curr) {
        var url;
        var host;
        if(curr){
            host = String(curr.host);
            url = String(curr.url);
            // 不包括host，特殊处理下
            if(url && host && url.indexOf(host) === -1){
                url = 'https://'+ host + url;
            }
        }
        return url
    }
    var
        requestHaz = {},
        requestHeader,
        responseHeader,
        response;

    requestHeader  = unpackRaw((Buffer.from(request.requestRaw ||'')).toString('utf8'));
    responseHeader = unpackRaw((Buffer.from(request.responseHeader || '')).toString('utf8'));



    requestHaz.startedDateTime = request.timestamps.ClientConnected;
    requestHaz.time = 3000;

    requestHaz.request  = {
        "method":requestHeader.method,
        "url":getUrl(request),
        "httpVersion": requestHeader.protocol,
        "cookies": requestHeader.cookieArray,
        "headers": requestHeader.headers,
        "queryString" : requestHeader.queryString,
        "postData" : requestHeader.postData,
        "headersSize" : request.requestRaw.replace(/\n/g,'').length,
        "bodySize" : requestHeader['Content-Length'] || 0,
    };

    // console.error(request.responseBody,'request.responseBody');
    // 处理responseBody 的格式，由base64 转到 utf-8 ;
    // var requestResponseBodyBase64  = request.responseBody || 0;
    // if(response.headers['content-encoding'] === 'gzip'){
    //
    // }
    // zlib.unzip(requestResponseBodyBase64, function(err, buffer) {
    //     console.log(buffer.toString())
    // });

    var mimeTypeTemp = responseHeader['Content-Type'] ;
    var mimeType= (typeof mimeTypeTemp === 'undefined')? responseHeader['content-type']: mimeTypeTemp ;
    mimeType = (typeof mimeType=== 'undefined') ? mimeType : mimeType.trim();

    requestHaz.response = {
        'Content-Type':'text/html; charset=UTF-8',
        "status": parseInt(request.resultCode)||0,
        "statusText": "OK",
        "httpVersion": responseHeader.protocol,
        "cookies": responseHeader.cookieArray,
        "headers": responseHeader.headers,
        "redirectURL": '',
        "headersSize" : requestHeader['Content-Length'] || 0,
        "bodySize" : request.contentLength || 0,
        "comment" : "",
        "content":{
            "mimeType":mimeType,
            // "compression":request.responseBody.length - (request.contentLength || 0),
            // "text":request.responseBody,
            // "text": (Buffer.from(request.responseBody || '', 'base64')).toString('utf8'),
            // "encoding":'base64',
        }
    };

    requestHaz.serverIPAddress = request.serverIp;
    requestHaz.pageref = request.sid;
    requestHaz.timings = {
        "blocked": 0,
        "dns": request.timestamps.dns,
        "connect": request.timestamps.TCPConnectTime,
        "send": 20,
        "wait": 38,
        "receive": 12,
        "ssl": -1,
        "comment": ""
    };

    if(typeof request.responseBody !== 'undefined' && request.responseBody.length !== 0 ){
        requestHaz.response.content.size = request.responseBody.length;
        var requestResponseBodyBaseBuffer  = (Buffer.from(request.responseBody || '', 'base64'));

        //  chunked decode
        if(typeof responseHeader['Transfer-Encoding'] !== 'undefined' && responseHeader['Transfer-Encoding'] === 'chunked'){
            requestResponseBodyBaseBuffer = decodeChunkedUint8Array(requestResponseBodyBaseBuffer);
        }

        // console.error(requestResponseBodyBaseBuffer.length,'requestResponseBodyBaseBuffer');

        if(typeof responseHeader['Content-Encoding'] !== 'undefined' && responseHeader['Content-Encoding'] === 'gzip'){
            try {
                var ungziprawText = zlib.gunzipSync(requestResponseBodyBaseBuffer);
                requestHaz.response.content.text = ungziprawText.toString('utf8');// 暂时文件
            } catch (e) {
                requestHaz.response.content.text = requestResponseBodyBaseBuffer;// 暂时文件
            } finally {

            }

            return requestHaz;
        }else{
            requestHaz.response.content.text = requestResponseBodyBaseBuffer.toString('utf8');

            return requestHaz;
        }

    }else{
        requestHaz.response.content.size =0;
        requestHaz.response.content.text = '';
        return requestHaz;
    }

};

var downloadHaz = function (request, response, opt) {
    opt = opt || {};

    var data		= opt.data || [],
        viewData	= [],
        filename	= opt.id || 'log',
        index		= parseInt(request.GET.index,10),
        SNKey       = request.GET.SNKey,
        tmp
    ;
    var hazJson = {
        "log":{
            "version": "1.2",
            "creator": {
                "name": "TSW",
                "version": "1.0"
            },
            "entries":[]
        }
    };

    if(data.length <= 0){
        failRet(request, response, 'not find log');

        return;
    }

    if(SNKey && data.SNKeys && data.SNKeys[0] != SNKey){
        failRet(request, response, '该log已经过期,请联系用户慢点刷log~');

        return;
    }

    if(typeof  data == 'string'){
        failRet(request, response, 'key类型不对');

        return;
    }

    response.setHeader('Content-disposition', 'attachment; filename=' + filename + '.har');
    var gzipResponse = gzipHttp.getGzipResponse({
        request: request,
        response: response,
        plug: plug,
        code: 200,
        contentType: 'application/octet-stream'
    });

    if(SNKey){
        //override index
        index = 0;
    }

    if(index >= 0){
        data = [data[index]];
    }else{
        data = data.reverse();
    }
    data.forEach(function (tmp,i) {
        if(tmp.curr){
            viewData.push(tmp.curr);
        }

        tmp.ajax &&
        tmp.ajax.forEach(function(ajax,i){
            if(!ajax.SN){
                return;
            }
            viewData.push(ajax);
        });
    });

    viewData.forEach(function(tmp,i){

        hazJson.log.entries.push(initRequestHar(tmp));


    });
    var buf = Buffer.from(JSON.stringify(hazJson),'UTF-8');
    gzipResponse.write(buf);
    gzipResponse.end();
};

var download = function(request, response, opt){
	opt = opt || {};

	var data		= opt.data || [],
		viewData	= [],
		filename	= opt.id || 'log',
		index		= parseInt(request.GET.index,10),
		SNKey       = request.GET.SNKey,
		tmp
		;

	if(data.length <= 0){
		failRet(request, response, 'not find log');

		return;
	}

	if(SNKey && data.SNKeys && data.SNKeys[0] != SNKey){
		failRet(request, response, '该log已经过期,请联系用户慢点刷log~');

		return;
	}

	//data = data[0];

	if(typeof  data == 'string'){
		failRet(request, response, 'key类型不对');

		return;
	}
	
	filename = filename.replace(/[^a-zA-Z0-9_\.\-]/gmi,'_');
	
	response.setHeader('Content-disposition', 'attachment; filename=' + filename + '.saz');

	var gzipResponse = gzipHttp.getGzipResponse({
		request: request,
		response: response,
		plug: plug,
		code: 200,
		contentType: 'application/octet-stream'
	});

	if(SNKey){
		//override index
		index = 0;
	}

	if(index >= 0){
		data = [data[index]];
	}else{
		data = data.reverse();
	}
	
	var archiver = new Archiver('zip');

	archiver.append(tmpl.download_index(data), {name: '_index.htm'});
	archiver.append(tmpl.download_content_types(), {name: '[Content_Types].xml'});
	
	data.forEach(function(tmp,i){
		var sid			= ('0000' + (i + 1)).slice(-3);
		tmp.curr		= tmp.curr || {};
		tmp.curr.sid	= sid + '.0000';
		
		
		tmp.curr.logText	= tmp.curr.logText || '';
		tmp.curr.logText	= tmp.curr.logText.replace(/\r\n|\r|\n/gm,'\r\n');
		var logSNKey = post.getLogSN(tmp.curr.logText);
		
		var log = {
			curr: {
				sid				: sid,
				
				protocol		: 'HTTP',
				host    		: '',
				url 			: '',
				cache   		: '',
				process 		: tmp.curr.process,
				resultCode  	: '200',
				contentLength	: Buffer.byteLength(tmp.curr.responseBody || '','UTF-8'),
				contentType		: 'text/plain',
				clientIp     	: '',
				clientPort     	: '',
				serverIp       	: '',
				serverPort		: '',
				requestRaw   	: 'GET log/'+logSNKey+' HTTP/1.1\r\n\r\n',
				responseHeader	: 'HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=UTF-8\r\nConnection: close\r\n\r\n',
				responseBody	: Buffer.from(tmp.curr.logText || '','UTF-8').toString('base64'),
				timestamps   	: tmp.curr.timestamps
			}
		};
		
		viewData.push(tmp);
		viewData.push(log);
		
		tmp.ajax &&
		tmp.ajax.forEach(function(curr,i){
			
			var ajax = {};
			
			if(!curr.SN){
				return;
			}
			
			ajax.curr = curr;
			
			curr.sid = sid + '.' + (`0000${curr.SN}`.slice(-3));
			
			viewData.push(ajax);
		});
	});
	
	viewData.forEach(function(tmp,i){
		archiver.append(
			tmp.curr.requestRaw || '', 
			{
				name: 'raw/' + (tmp.curr.sid) + '_c.txt'
			}
		);
		archiver.append(
			tmpl.download_timestamp(tmp.curr),
			{
				name: 'raw/' + (tmp.curr.sid) + '_m.xml'
			}
		);
		archiver.append(
			Buffer.concat([
                Buffer.from(tmp.curr.responseHeader || '','utf-8'),
                Buffer.from(tmp.curr.responseBody || '', 'base64')
			]),
			{
				name: 'raw/' + (tmp.curr.sid) + '_s.txt'
			}
		);
	});
	
	// archiver.pipe(gzipResponse);
	
	archiver.on('error', function(e){
		logger.error('archive log error \n' + e.message);
	});

	archiver.on('data', function(buffer){
		gzipResponse.write(buffer);
	});

	archiver.once('end', function(){
		gzipResponse.end();
	});

	archiver.finalize();
};

var failRet = function(request, response, msg){
	var gzipResponse = gzipHttp.getGzipResponse({
		request: request,
		response: response,
		plug: plug,
		code: 200,
		contentType: 'text/html; charset=UTF-8'
	});

	gzipResponse.end(msg || '');
};



// chunked decode  buffer ， 格式 ：size +\r\n + rawText +\r\n  + 0|r\n ,  \r\n ====》 13,10, 中间的即为rawText

var decodeChunkedUint8Array = function (Uint8ArrayBuffer) {
    var rawText = [];
    var startOfTheRawText = Uint8ArrayBuffer.indexOf(13);
    while( startOfTheRawText !== -1 && startOfTheRawText !== 0 ){
        var rawTextSizeUint8ArrayBuffer = Uint8ArrayBuffer.slice(0 ,startOfTheRawText);
        var rawTextSizeUint8ArrayInt = parseInt(Buffer.from(rawTextSizeUint8ArrayBuffer),16);
        if(rawTextSizeUint8ArrayInt === 0 ){
            break;
        }
        var chunkedText = Uint8ArrayBuffer.slice(startOfTheRawText+2, startOfTheRawText+2 +rawTextSizeUint8ArrayInt );
        rawText.push(Buffer.from(chunkedText));
        Uint8ArrayBuffer = Uint8ArrayBuffer.slice(startOfTheRawText+2 +rawTextSizeUint8ArrayInt+2);
        startOfTheRawText = Uint8ArrayBuffer.indexOf(13);
        console.log(startOfTheRawText,'startOfTheRawText');
    }
    var bufferText = new Uint8Array( 0 );
    for(var ji=0; ji<rawText.length;ji++){
        bufferText = Buffer.concat([bufferText,rawText[ji]]);
    }
    return bufferText ;
};
