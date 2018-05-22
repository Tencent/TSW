/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const net   = require('net');

this.isInnerIP = (function(){
    
    /**  
    私有IP：A类  10.0.0.0-10.255.255.255
            A    100.64.0.0/10
           B类  172.16.0.0-172.31.255.255  
           C类  192.168.0.0-192.168.255.255  
    当然，还有127.x.x.x这个网段是环回地址
    **/

    var ABegin  = getIpNum('100.64.0.0');
    var AEnd    = getIpNum('100.127.255.255');
    var aBegin  = getIpNum('10.0.0.0');   
    var aEnd    = getIpNum('10.255.255.255');
    var a2Begin = getIpNum('9.0.0.0');
    var a2End   = getIpNum('9.255.255.255');
    var bBegin  = getIpNum('172.16.0.0');
    var bEnd    = getIpNum('172.31.255.255');   
    var cBegin  = getIpNum('192.168.0.0');   
    var cEnd    = getIpNum('192.168.255.255');

    var xBegin  = getIpNum('127.0.0.0');
    var xEnd    = getIpNum('127.255.255.255');
    
    return function(ipAddress){
        
        if(typeof ipAddress !== 'string'){
            return false;
        }

        if(!net.isIPv4(ipAddress)){
            return false;
        }
        
        var ipNum = getIpNum(ipAddress);   
        
        if(isInner(ipNum,xBegin,xEnd)){
            return '127.0.0.1';
        }

        if(isInner(ipNum,ABegin,AEnd)){
            return 'A';
        }
        
        if(isInner(ipNum,aBegin,aEnd)){
            return 'a';
        }

        if(isInner(ipNum,a2Begin,a2End)){
            return 'a2';
        }
        
        if(isInner(ipNum,bBegin,bEnd)){
            return 'b';
        }
        
        if(isInner(ipNum,cBegin,cEnd)){
            return 'c';
        }
           
        return false;     
    };
})();


function getIpNum(ipAddress) {   
    var ip  = ipAddress.split('.');   
    var a   = parseInt(ip[0],10);   
    var b   = parseInt(ip[1],10);   
    var c   = parseInt(ip[2],10);   
    var d   = parseInt(ip[3],10);   
  
    var res = a * 256 * 256 * 256 + b * 256 * 256 + c * 256 + d;   
    return res;   
}  


function isInner(userIp,begin,end){   
    return (userIp >= begin) && (userIp <= end);   
}
