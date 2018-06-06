/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const Deferred = require('util/Deferred');

this.DecryptTicketWithClientIP = function(opt) {
    const defer = Deferred.create();

    return defer.resolve();
};


this.SendRTX = function(opt) {
    const defer = Deferred.create();

    return defer.resolve();
};


this.SendMail = function(opt) {

    opt = Deferred.extend({
        'appKey': '',
        'sysId': 0,
        'emailType': 1,        // 邮件类型，可选值0（外部邮件），1（内部邮件），2（约会邮件）
        'from': '',       // 邮件发送人
        'to': '',       // 邮件接收人
        'title': '',       // 邮件标题
        'content': '',       // 邮件内容
        'priority': 0,        // 邮件优先级，-1低优先级，0普通，1高优先级
        'bodyFormat': 0,        // 邮件格式，0 文本、1 Html

        'cc': '',       // 邮件抄送人
        'bcc': '',       // 邮件密送人
        'location': '',       // 当邮件为约会邮件时，约会地点
        'organizer': '',       // 当邮件为约会邮件时，约会组织者
        'startTime': '',       // 当邮件为约会邮件时，约会开始时间
        'endTime': '',       // 当邮件为约会邮件时，约会结束时间
        'attachment': ''        // 邮件附件的文件名以及文件的内容（在发送请求时，文件内容是二进制数据流的形式发送）
    }, opt);

    const defer = Deferred.create();

    return defer.resolve();
};


this.SendWeiXin = function(opt) {

    opt = Deferred.extend({
        'appKey': '',
        'sysId': 0,
        'msgInfo': '',       // 内容
        'priority': 0,        // 优先级，-1低优先级，0普通，1高优先级
        'receiver': '',       // 接收人，英文名，多人用英文分号分隔
        'sender': ''        // 发送人
    }, opt);

    const defer = Deferred.create();

    return defer.resolve();
};


this.SendSMS = function(opt) {

    opt = Deferred.extend({
        'appKey': '',
        'sysId': 0,
        'msgInfo': '',       // 内容
        'priority': 0,        // 优先级，-1低优先级，0普通，1高优先级
        'receiver': '',       // 接收人，英文名，多人用英文分号分隔
        'sender': ''        // 发送人
    }, opt);

    const defer = Deferred.create();

    return defer.resolve();
};

