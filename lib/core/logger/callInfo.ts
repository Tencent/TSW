/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import * as path from "path";
/**
 * 利用 V8 Error.captureStackTrace API
 * 实现对调用堆栈的详细追踪
 */
export default (level = 0): {
  line: number;
  column: number;
  filename: string;
} => {
  const res = {
    line: 0,
    column: 0,
    filename: ""
  };

  const originPrepareStackTrace = Error.prepareStackTrace;
  const originStackTraceLimit = Error.stackTraceLimit;
  // Format stack traces to an array of CallSite objects.
  // See CallSite object definitions at https://v8.dev/docs/stack-trace-api.
  Error.prepareStackTrace = (
    error,
    structuredStackTrace
  ): NodeJS.CallSite[] => structuredStackTrace;

  Error.stackTraceLimit = 100;

  const err = Object.create(null);
  Error.captureStackTrace(err);
  const { stack } = err;

  Error.prepareStackTrace = originPrepareStackTrace;
  Error.stackTraceLimit = originStackTraceLimit;

  if (typeof stack[level]?.getLineNumber === "function") {
    res.line = stack[level].getLineNumber();
    res.column = stack[level].getColumnNumber();
    res.filename = path.relative(process.cwd(), stack[level].getFileName());
  }

  return res;
};
