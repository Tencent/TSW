/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

const logger	= require('logger');
const Deferred	= require('util/Deferred');
const config	= require('config');

//获取路由
this.ApiGetRoute = function(options,callback){
	
	var defer	= Deferred.create();
	var res		= this.ApiGetRouteSync(options) || {};

	if (typeof callback === 'function') {
		callback(res);
	}

	if (res.ret >= 0) {
		defer.resolve(res);
	} else {
		defer.reject(res);
	}

	return defer;
}

//上报结果
this.ApiRouteResultUpdate = function(options){
	
	var defer	= Deferred.create();
	var res		= this.ApiRouteResultUpdateSync(options);
	
	if(res.ret >= 0){
		defer.resolve(res);
	}else{
		defer.reject(res);
	}
	
	return defer;
}

//获取路由
this.ApiGetRouteSync = function(options){
	
	var res = {
		ret: -1
	};

	return res;
};

//上报结果
this.ApiRouteResultUpdateSync = function(options){

	var res = {
		ret: -1
	};

	return res;
}

//多一组方法
this.updateRoute = this.ApiRouteResultUpdateSync;
this.getRouteAsync = this.ApiGetRoute;
