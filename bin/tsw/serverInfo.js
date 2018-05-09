/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const os			= require('os');
const {isWindows} 	= require('util/isWindows');
const isInnerIP		= require('util/http.isInnerIP.js');

this.intranetIp = '127.0.0.1';

if(isWindows){
	this.intranetIp = getWinLocalIpv4();
}else{
	this.intranetIp = getLinuxLocalIpv4();
}

function getLinuxLocalIpv4(){
	var intranetIp = '';
	var networkInterfaces = os.networkInterfaces();

	Object.keys(networkInterfaces).forEach(function(key){
		var eth		= networkInterfaces[key];
		var address	= eth && eth[0] && eth[0].address;

		if(!address){
			return;
		}

		var tmp = isInnerIP.isInnerIP(address);
		if(!tmp){
			return;
		}

		if(tmp === '127.0.0.1'){
			return;
		}

		intranetIp = address;
	});

	return intranetIp;
}

function getWinLocalIpv4(){

	var localNet = os.networkInterfaces();
	var key,item;
	var k,v,i;
	var userIp = null;

	for(key in localNet){
		item = localNet[key];

		if(String(key).indexOf('本地连接') > -1){

			for(i =0 ; i < item.length; i++){
				v = item[i];

				if(v.family === 'IPv4'){
					userIp = v.address;
					return userIp;
				}
			}

		}

	}

}

