/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const logger		= require('logger');
const Deferred		= require('util/Deferred');
const cmemTSW		= require('data/cmem.tsw.js');
const crypto		= require('crypto');
const zlib			= require('zlib');
const MAX_NUM		= 64;
const MAX_ALPHA_LOG	= 1000;

module.exports.MAX_ALPHA_LOG = MAX_ALPHA_LOG;

module.exports.cmem = function(){
    return cmemTSW.sz();
};

module.exports.getLog = function(uin,limit){
    return this.getLogArr(uin,'text',null,limit);
};

module.exports.getLogJson = function(uin,limit){
    return this.getLogArr(uin,'json',null,limit);
};

module.exports.getLogJsonByKey = function (uin,key) {

    var prefix = this.keyJson('');
    var keyJson;

    if(String(key).startsWith(prefix)){
        keyJson = key;
    }else{
        keyJson = this.keyJson(key);
    }

    return this.getLogArr(uin,'json',keyJson);
};

module.exports.getLogArr = function(uin,type,key,limit){
	
    var defer		= Deferred.create();
    var memcached	= this.cmem();
    var keyBitmap	= this.keyBitmap(uin);

    if(!memcached){
        return defer.resolve([]);
    }

    memcached.get(keyBitmap,function(err,data){
        var start	= data || 0;

        var keyTextArr	= type === 'text' ? module.exports.keyTextArr(uin,start) : module.exports.keyJsonArr(uin,start);
        var keyJsonArr  = module.exports.keyJsonArr(uin,start);

        //如果传递进来key，则只需要关注传进来的key
        if(key){
            keyTextArr = [key];
        }

        if(limit && keyTextArr.length > limit){
            keyTextArr.length = limit;
            keyJsonArr.length = limit;
        }

        memcached.get(keyTextArr,function(err,data){

            if(err){
                logger.error('bad key:');
                logger.error(keyTextArr);
                logger.error((err && err.stack) || err);
                defer.resolve([]);
                return;
            }

            var i,len,index;
            var arr = [],keys = [],SNKeys = [],extInfos = []; //keys和SNKeys挂在arr下面，保持跟arr同序。
            var currKey,tmpInfo = {};

            for(len = keyTextArr.length,i = 0; i < len ;i++){

                index = i;
                currKey = keyTextArr[index];
                tmpInfo = {};
                if(data[currKey]){
                    if(context.appid && context.appkey){
                        //解密
                        data[currKey] = module.exports.decode(context.appid,context.appkey,data[currKey]);
                    }
                    arr.push(data[currKey]);
                    keys.push(keyJsonArr[index].split('.').slice(-1));

                    if(type == 'json'){
                        tmpInfo = data[currKey].curr;//内含resultCode
                        SNKeys.push(module.exports.getLogSN(data[currKey].curr && data[currKey].curr.logText));
                    }else{
                        SNKeys.push(module.exports.getLogSN(data[currKey]));
                        tmpInfo.resultCode = module.exports.getLogResultCode(data[currKey]);
                    }
                    extInfos.push(tmpInfo);

                }
            }

            arr.keys = keys;
            arr.SNKeys = SNKeys;
            arr.extInfos = extInfos;
            arr.cmemIp = memcached.servers && memcached.servers[0];

            logger.debug('log length: ' + arr.length);
            defer.resolve(arr);
        });
    });


	
    return defer;
};

module.exports.getLogSN = function (logText) {
    var SNReg = /\[(\d+\scpu\d+\s\d+)\]/;
    if(logText){
        logText = logText.match && logText.match(SNReg) && logText.match(SNReg)[1] || 'unknown';
        return logText.replace(/\s/igm,'');

    }
    return 'unknown';
};

module.exports.getLogFromReg = function (logText,reg) {
    if(logText && reg){
        logText = logText.match && logText.match(reg) && logText.match(reg)[1] || 'unknown';
        return logText.replace(/\s/igm,'');

    }
    return '';
};

module.exports.getLogResultCode = function (logText) {
    var reg = /response\s(\d+)\s\{/;
    return this.getLogFromReg(logText,reg);
};

module.exports.report = function(key,logText,logJson){
    var defer		= Deferred.create();

    if(!key){
        return defer.reject();
    }
	
    if(!logText){
        return defer.reject();
    }
	
    logJson = logJson || {};

    var memcached	= this.cmem();  //要用this
    var keyText		= module.exports.keyText(key);
    var keyJson		= module.exports.keyJson(key);
    var keyBitmap	= module.exports.keyBitmap(key);

    if(!memcached){
        return defer.resolve();
    }

    memcached.add(keyBitmap,0,24 * 60 * 60,function(err,ret){

        var isFirst = false;

        if(err){
            //add err是正常的
            //return;
        }

        if(ret === true){
            isFirst = true;
        }

        memcached.incr(keyBitmap, 1, function(err, result){
            if(err){
                logger.error(err.stack);
                defer.reject();
                return;
            }

            var index = 0;

            if(typeof result === 'number'){
                index = result % MAX_NUM;
            }

            memcached.set([keyText,index].join('.'),logText,24 * 60 * 60,function(err,ret){
                memcached.set([keyJson,index].join('.'),logJson,24 * 60 * 60,function(err,ret){
                    defer.resolve(isFirst);
                });
            });

        });
    });

    return defer;
};


module.exports.keyBitmap = function(key){
    var currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24);
    return ['bitmap.v4.log',currDays,key].join('.');
};

module.exports.keyJson = function(key){
    var currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24);
    return ['json.v4.log',currDays,key].join('.');
};

module.exports.keyText = function(key){
    var currDays = parseInt(Date.now() / 1000 / 60 / 60 / 24);
    return ['text.v4.log',currDays,key].join('.');
};

module.exports.keyJsonArr = function(key,index){
	
    var i = 0;
    var arr = [];
    var keyJson = this.keyJson(key);

    index = index || 0;
    for(i = MAX_NUM; i > 0; i--){
        arr.push([keyJson,(i + index)%MAX_NUM].join('.'));
    }
	
    return arr;
};

module.exports.keyTextArr = function(key,index){
	
    var i = 0;
    var arr = [];
    var keyText = this.keyText(key);

    index = index || 0;
    for(i = MAX_NUM; i > 0; i--){
        arr.push([keyText,(i + index)%MAX_NUM].join('.'));
    }
	
    return arr;
};


//加密
module.exports.encode = function(appid,appkey,data){
    var input	= Buffer.from(JSON.stringify(data),'UTF-8');
    var buff	= zlib.deflateSync(input);
    var des		= crypto.createCipher('des',(appid + appkey));
    var buf1	= des.update(buff, null , 'hex');
    var buf2	= des.final('hex');
    var body	= Buffer.from(buf1 + buf2,'hex').toString('base64');
    return body;
};

//解密
module.exports.decode = function(appid,appkey,body){
    var des		= crypto.createDecipher('des',(appid + appkey));
    var buf1	= '';
    var buf2	= '';

    try{
        buf1	= des.update(body,'base64', 'hex');
        buf2	= des.final('hex');
    }catch(e){
        logger.error(e.stack);
        return null;
    }

    var buff	= Buffer.from(buf1 + buf2 ,'hex');
    var input	= zlib.inflateSync(buff);

    var data	= null;

    try{
        data = JSON.parse(input.toString('UTF-8'));
    }catch(e){
        logger.error(e.stack);
        return null;
    }

    return data;
};




