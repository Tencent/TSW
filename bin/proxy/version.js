/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';


const arr = process.versions.node.split('.');

if (arr[0] < 8) {
    console.error('The nodejs version you installed is ' + process.versions.node);
    console.error('Please update the nodejs version to 8.0.0');
    process.exit(1);
}
if (arr[0] == 10 && (arr[1] >= 0 && arr[1] <= 3)) {
    console.error('The nodejs version you installed is ' + process.versions.node);
    console.error('Please update to the nodejs version which greater than 10.4.0');
    process.exit(1);
}
