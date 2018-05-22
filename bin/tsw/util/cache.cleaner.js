/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path		= require('path');
const logger	= require('logger');

/**
 * 
 * 清除指定目录下所有的模块缓存
 * @param {String} dir 目录绝对路径
 */
this.clear = function(dir,showLog){
	
    dir	= path.normalize(dir);
        
    let key;
	
    logger.info('clear dir: ${dir}',{
        dir: dir
    });
	
    for(key in require.cache){
        require.cache[key].children = [];
        require.cache[key].resolveFilenameCache = {};

        if(key.indexOf(dir) >= 0 && !/\.node$/i.test(key)){
            delete require.cache[key].parent;
            delete require.cache[key];
            if(showLog){
                logger.debug('clear: ${key}',{
                    key: key.slice(dir.length)
                });
            }
        }
    }
};

