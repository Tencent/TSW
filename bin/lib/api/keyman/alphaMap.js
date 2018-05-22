/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Deferred		= require('util/Deferred');
const logger		= require('logger');
const config		= require('config');
const fs			= require('fs');
const fileCache		= require('api/fileCache');
const fileUrl		= config.alphaFileUrl;

var isFirstLoad	= false;
var cache		= {
    timeUpdate: 0,
    data: {},
    dataFile: {}
};

if(global[__filename]){
    cache = global[__filename];
}else{
    global[__filename] = cache;
    isFirstLoad = true;
}


if(isFirstLoad){
    if(config.alphaFile){

        (function(){
            //导入alphaFile
            var text = '';

            try{
                text = fs.readFileSync(config.alphaFile,'UTF-8');
            }catch(e){
                logger.warn(e.stack);
            }

            if(!text){
                return;
            }

            if(text.length >= 2 * 1024 * 1024){
                logger.error('alpha file limit <=2M');
                return;
            }

            cache.dataFile	= getMap(text);
            updateMap();
        })();

    }else{
        logger.debug('config.alphaFile is: ' + config.alphaFile);
    }
}


function getMap(text){

    var map		= {};

    text = text || '';

    text.replace(/^([0-9a-zA-Z_-]+).*$/gm,function($0,key){
        map[key] = 1;
    });

    return map;
}

function updateMap(text){

    var map		= getMap(text);

    //copy
    Object.assign(map,cache.dataFile);

    cache.data = map;

    logger.debug('update ok');
}


this.getSync = function(){
    this.get();
	
    return cache.data;
};

this.get = function(){
	
    var defer 	= Deferred.create();
    var delay	= (process.serverInfo && process.serverInfo.cpu * 1000) || 0;
    var l5api	= config.tswL5api['alphaFileUrl'];

    if(Date.now() - cache.timeUpdate < 60000 + delay){
        return defer.resolve(cache.data);
    }
	
    cache.timeUpdate = Date.now();

    if(!fileUrl){
        return defer.resolve(cache.data);
    }
	
    fileCache.getAsync(fileUrl).done(function(d){
		
        var lastModifyTime = 0;
        var text = '';
		
        if(d && d.stats){
            lastModifyTime = d.stats.mtime.getTime();
        }
		
        if(d && d.data){
            text = d.data.toString('utf-8');
        }
		
        if(Date.now() - lastModifyTime < 60000){
            logger.debug('使用本地文件');
			
            updateMap(text);
			
            defer.resolve(cache.data);
            return;
        }
	
        require('ajax').request({
            url: fileUrl,
            type: 'get',
            autoToken: false,
            l5api: l5api,
            devIp: config.tswDevIp,
            devPort: config.tswDevPort,
            retry: 0,
            dcapi: {
                key: 'EVENT_TSW_ALPHA_FILE_URL'
            },
            dataType: 'text'
        }).fail(function(d){
            defer.resolve(cache.data);
        }).done(function(d){
			
            var text	= '';
				
            if(d && d.result && typeof d.result === 'string'){
				
                text = d.result;
            }

            if(text.length >= 2 * 1024 * 1024){
                logger.error('alpha file limit <=2M');
                return defer.resolve(cache.data);
            }
			
            updateMap(text);
			
            //保存在本地
            fileCache.set(fileUrl,Buffer.from(text,'UTF-8'));
			
            defer.resolve(cache.data);
        });
    });
	
	
    return defer;
};


function init(){

    var buffer = null;
    var text = '';

    if(fileUrl){
        buffer = fileCache.getSync(fileUrl).data;
    }

    if(buffer){
        text = buffer.toString('utf-8');
        updateMap(text);
    }

}


init();


