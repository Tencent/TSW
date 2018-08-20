/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

const i18n = require('i18n');
const fs = require('fs');
const config = require('config');
const language = config.language || 'cn';
const forder = __dirname + '/../../../locales';

const getSupportLang = function() {
    const langList = (fs.readdirSync(forder) || []).map(function(item) {
        return (item.split('.'))[0];
    });
    return langList;
};

i18n.configure({
    locales: getSupportLang(),
    defaultLocale: 'cn',
    extension: '.json',
    objectNotation: true,
    directory: forder,
    register: this
});

i18n.setLocale(language);

