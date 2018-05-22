/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const logger		= require('logger');
const xssFilter		= require('api/xssFilter');
const httpUtil		= require('util/http.js');
const qs			= require('qs');

module.exports = function(req,res,next){
	
    var arr = [];
	
    if(!httpUtil.isPostLike(req)){
        next();
		
        return;
    }
	
    if(req.REQUEST.body !== undefined){
        next();
		
        return;
    }
	
    req.on('data',function(txt){
		
        arr.push(txt);
		
        logger.debug('receive ' + txt.length);
    });

    req.once('end',function(){
		
        logger.debug('receive end');

        var buffer = Buffer.concat(arr);
        var willParseBody	= '';
        req.REQUEST.body	= buffer.toString('UTF-8');
        req.POST			= {};
        req.body			= req.POST;

        var contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';

        if(contentType.indexOf('application/x-www-form-urlencoded') > -1){

            if(req.REQUEST.body.indexOf('+') > -1){
                willParseBody = req.REQUEST.body.replace(/\+/g,' ');
            }else{
                willParseBody = req.REQUEST.body;
            }

            try{
                req.POST = qs.parse(willParseBody,{ parameterLimit: 4096 });
            }catch(e){
                req.POST = {};
                logger.debug(e.stack);
                logger.report();
            }

            req.body = req.POST;
        }else if(contentType.indexOf('application/json') > -1){

            try{
                req.POST = JSON.parse(req.REQUEST.body);
            }catch(e){
                req.POST = {};
                logger.debug(e.stack);
                logger.report();
            }
            req.body = req.POST;
        }

        xssFilter.check().fail(function(){
            res.writeHead(501, {'Content-Type': 'text/plain; charset=UTF-8'});
            res.end('501 by TSW');
        }).done(function(){
            next();
        });
		
    });
	
};


