/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path		= require('path');
const fs		= require('fs');
const gzipHttp 	= require('util/gzipHttp.js');
const logger	= require('logger');
const mime		= require('./mime.js');

module.exports = function(request,response,plug){

    var filename	= path.normalize(request.REQUEST.pathname).replace(/\\/g,'/');

    try{
        //支持中文
        filename = decodeURIComponent(filename);
    }catch(e){
        logger.info(`decode file name fail ${e.message}`);
    }
    
    var wwwroot		= plug.parent + '/wwwroot';

    if(filename === '' || filename === '/'){
        filename = '/index';
    }

    //保证请求的文件是wwwroot目录下的
    var realPath	= path.join(wwwroot,path.join('/',filename));
    var ext			= path.extname(realPath);

    if(ext){
        //.js --> js
        ext = ext.slice(1);
    }


    if(fs.existsSync(realPath)){
        //保证是文件
        fs.stat(realPath, function(err, stats){
            if(err){
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end();

                return;
            }

            var opt, gzipResponse;

            if(mime.types[ext] && mime.types[ext] === 'application/json'){
                opt = {
                    flags: 'r'
                };

                gzipResponse = gzipHttp.getGzipResponse({
                    request: request,
                    response: response,
                    cache: 'max-age=600',
                    code: 200,
                    contentType: mime.types[ext]
                });
            }else if(mime.types[ext] && mime.types[ext].indexOf('text/') === 0){
                opt = {
                    flags: 'r'
                };

                gzipResponse = gzipHttp.getGzipResponse({
                    request: request,
                    response: response,
                    cache: 'max-age=600',
                    code: 200,
                    contentType: mime.types[ext]
                });
            }else{
                var range = request.headers.range || '';
                var positions = range.replace(/bytes=/, '').split('-');
                var start = parseInt(positions[0], 10) || 0;
                var end = positions[1] ? parseInt(positions[1], 10) : (stats.size - 1);

                if(end < start || end >= stats.size){
                    response.writeHead(416, {
                        'Connection': 'close',
                        'Content-Type': mime.types[ext] || 'application/octet-stream',
                        'Content-Length': 0
                    });
                    response.end();
                    return;
                }

                response.writeHead(positions.length === 2 ? 206 : 200, {
                    'Cache-Control' : 'max-age=259200',

                    'Connection': 'close',
                    'Content-Type': mime.types[ext] || 'application/octet-stream',
                    'Transfer-encoding': '',
                    'Content-Length': end - start + 1,
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + stats.size,
                    'Accept-Ranges': 'bytes'
                });

                opt = {
                    start: start,
                    end: end,
                    flags: 'r'
                };

                gzipResponse = response;
            }

            var rs = fs.createReadStream(realPath, opt);

            rs.on('error', function(e){
                logger.error(e.stack);
                gzipResponse.end();
            });

            rs.on('data', function(buffer){
                gzipResponse.write(buffer);
            });

            rs.on('end', function(){
                gzipResponse.end();
            });
        });
    }else{
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end();
    }

};


