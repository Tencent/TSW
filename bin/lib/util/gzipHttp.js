/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const zlib		= require('zlib');
const logger	= require('logger');
const crypto	= require('crypto');
const httpUtil	= require('util/http.js');
const defaultChunkSize	= 8 * 1024;

this.httpUtil	= httpUtil;

this.create = this.getGzipResponse = function(opt){
    var window   = context.window || {};

    opt = opt || {};

    var request			= opt.request || window.request,
        response		= opt.response ||window.response,
        code			= opt.code || 200,
        headers			= opt.headers || null,
        chunkSize		= opt.chunkSize || defaultChunkSize,
        contentType		= opt.contentType || (headers && headers['content-type']) || 'text/html; charset=UTF-8',
        gzipOutputStream;

    if(headers && headers['content-length'] !== undefined){
        response.useChunkedEncodingByDefault = false;
        delete headers['transfer-encoding'];
        delete headers['content-length'];
        delete headers['content-encoding'];
    }

    response.setHeader('Content-Type', contentType);
	
    if(/\bgzip\b/.test(request.headers['accept-encoding'])){
		
        response.setHeader('Content-Encoding', 'gzip');
        response.writeHead(code,headers);
		
        response.socket && response.socket.setNoDelay(true);
        gzipOutputStream = zlib.createGzip({
            chunkSize: chunkSize
        });
		
        gzipOutputStream.on('data',function(buffer){
            logger.debug('gzip chunked send ${len}',{
                len: buffer.length
            });

            if(!response.finished){
                response.write(buffer);
            }
        });
		
        gzipOutputStream.once('end',function(){
            response.end();
        });
		
        return gzipOutputStream;
		
    }else{
		
        response.writeHead(code,headers);
		
        response.on('data',function(buffer){
            logger.debug('chunked send ${len}',{
                len: buffer.length
            });
        });
		
        if(!response.flush){
            response.flush = function(){return true;};
        }

        if(response.flush && response.flushHeaders){
            response.flush = function(){return true;};
        }
		
        return response;
    }
	
};


/**
从buffer获取SHA1的方法，独立出来其实是为了方便测试
*/
exports.getSHA1 = function(buffer){
    return crypto.createHash('sha1').update(buffer).digest('hex');	
};

