/*!
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
"use strict";

//路由
this.modAct = this.modMap = {

	map: {
		log_view	 		: 'util/auto-report/view.js',
		log_download 		: 'util/auto-report/download.js',
		group_page 			: 'util/h5-test/group/view.js',
		h5test_page 		: 'util/h5-test/page/view.js',
		h5test_managerget	: 'util/h5-test/get.js',
		h5test_manageradd	: 'util/h5-test/add.js',
		h5test_managerdel	: 'util/h5-test/del.js',
		'/api/h5test/get'	: 'util/h5-test/get.js',
		'/api/h5test/add'	: 'util/h5-test/add.js',
		'/api/h5test/del'	: 'util/h5-test/del.js',
		'/' 				: 'util/home/view.js',
		'/index'	 		: 'util/home/view.js',
		static_tsw  		: 'util/static/static.js',
		default_page  		: 'util/static/static.js'
	},

	getModAct: function(req){
		var pathname= req.REQUEST.pathname || '';
		var arr		= pathname.split('/',3);
		var mod		= arr[1] || 'default';
		var act		= arr[2] || 'page';
		var mod_act	= mod + '_' + act;


		if(this.map[pathname]){
			req.__mod_act = pathname;
			return pathname;
		}

		if(this.map[mod_act]){
			req.__mod_act = mod_act;
			return mod_act;
		}

		return null;
	},
	find: function(mod_act,req,res){
		mod_act = req.__mod_act;

		var mod = this.map[mod_act];

		if(mod_act === 'default_page'){
			req.REQUEST.pathname = '/static/tsw/index.html';
		}

		if(mod){
			res.setHeader('Mod-Map', mod_act + ':' + mod);
			return plug(mod);
		}

		return null;
	}
}


