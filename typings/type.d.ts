/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare interface Console {
  originDebug(message?: any, ...optionalParams: any[]): void;
  originLog(message?: any, ...optionalParams: any[]): void;
  originInfo(message?: any, ...optionalParams: any[]): void;
  originDir(message?: any, ...optionalParams: any[]): void;
  originWarn(message?: any, ...optionalParams: any[]): void;
  originError(message?: any, ...optionalParams: any[]): void;
}

declare namespace NodeJS {
  interface Process {
    SN: number;
  }

  interface Domain {
    currentContext?: any;
  }

  interface Global {
    tswConfig: {
      appid: string;
      appkey: string;
      plugins: string[];
    };
    eventBus: EventEmitter;
  }
}
