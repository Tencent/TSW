/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

const logger	= require('logger');
const config	= require('./config.js');
const http		= require('http');
const codeWatch	= require('api/code/watcher.js');
const parseGet	= require('util/http/parseGet.js');
const cp		= require('child_process');

const server = http.createServer(function(req, res){

    var action;

    logger.info('admin request by： ${url}',{
        url: req.url
    });

    //解析get参数
    parseGet(req);

    action = methodMap[req.REQUEST.pathname] || methodMap['default'];

    action.apply(methodMap,arguments);

});

logger.info('start admin');

server.listen(config.httpAdminPort,'127.0.0.1',function(err){
    if(err){
        logger.info('admin listen error ${address}:${port}',{
            address: '127.0.0.1',
            port: config.httpAdminPort
        });
    }else{
        logger.info('admin listen ok ${address}:${port}',{
            address: '127.0.0.1',
            port: config.httpAdminPort
        });
    }
});


const methodMap = {

    'default' : function(req, res){
        res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end('no such command!');
    },

    '/globaldump' : function(req, res){
        process.emit('sendCmd2workerOnce',{
            CMD: 'globaldump',
            GET: req.GET
        });
        res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end('done!\r\n');
    },

    '/heapdump' : function(req, res){
        process.emit('sendCmd2workerOnce',{
            CMD: 'heapdump',
            GET: req.GET
        });
        res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end('done!\r\n');
    },

    '/profiler' : function(req, res){
        process.emit('sendCmd2workerOnce',{
            CMD: 'profiler',
            GET: req.GET
        });
        res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end('done!\r\n');
    },

    '/top100' : function(req, res){
        process.emit('sendCmd2workerOnce',{
            CMD: 'top100',
            GET: req.GET
        });
        res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        res.end('done!\r\n');
    },

    '/reload' : function(req, res){

        cp.exec('./check.js',{
            timeout: 5000,
            cwd: __dirname
        },function(err, stdout, stderr){
            if(err){
                logger.error(err.stack);
                res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
                res.write(err.stack);
                res.socket && res.socket.end();

                return;
            }

            if(stderr && stderr.length > 0){

                logger.error(stderr.toString('UTF-8'));
                res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
                res.write(stderr.toString('UTF-8'));

                res.socket && res.socket.end();
                return;
            }

            if(stdout && stdout.length > 0){
                logger.info(stdout.toString('UTF-8'));

                process.emit('reload',req.GET);

                res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
                res.write(stderr.toString('UTF-8'));
                res.end('\r\ndone!\r\n');

                return;
            }

        });

    }

};

logger.setLogLevel(0);
codeWatch.watch();
