/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

export interface Log {
  showLineNumber: boolean;
  arr: Array<string>;

  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export class Context {
  log: Log;
  SN: number;
  captureSN: number;

  constructor() {
    this.log = {
      showLineNumber: false,
      arr: [],
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0
    };

    this.SN = process.SN || 0;
    this.captureSN = 0;
  }
}

export default (): Context | null => {
  if (!process.domain) {
    return null;
  }

  if (!process.domain.currentContext) {
    process.domain.currentContext = new Context();
  }

  return process.domain.currentContext;
};
