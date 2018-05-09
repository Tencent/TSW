/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

function Queue(){
	
	this._queue = [];
}


this.create = function(){
	return new Queue();
}


Queue.prototype.queue = function(fn){
	
	if(typeof fn !== 'function'){
		
		return this;
	}
	
	fn._domain = process.domain;
	
	this._queue.push(fn);
	
	if(this._queue.length === 1){
		this.dequeue();
	}
	
	return this;
}

Queue.prototype.dequeue = function(){
	
	var domain,that,fn;
	
	if(this._queue.length <= 0){
		return this;
	}
	
	if(this._queue[0] === 'ing'){
		
		this._queue.shift();
		this.dequeue();
		
		return this;
	}
	
	fn = this._queue[0];
	this._queue[0] = 'ing';
	
	domain		= fn._domain;
	that		= this;
	fn._domain	= undefined;
	
	if(domain && domain !== process.domain){
		domain.run(function(){
			fn.call(that);
		});
	}else{
		fn.call(this);
	}
	
	return this;
}



