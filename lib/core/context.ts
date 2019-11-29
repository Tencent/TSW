/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

export interface Log {
  showLineNumber?: boolean;
  arr?: Array<string>;
  ERROR?: number;
  WARN?: number;
  INFO?: number;
  DEBUG?: number;
}

export interface ContextType {
  log?: Log;
  window?: Window;
  SN?: number;
  beforeLogClean?: any;
}
export interface Window {
  request?: string | undefined | null;
}

export default (): ContextType => {
  const log: Log = {};
  const window: Window = {};
  const SN = 0;
  const beforeLogClean = (): void => {};
  return {
    log,
    window,
    SN,
    beforeLogClean
  };
};
