/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as moment from "moment";
import * as chalk from "chalk";
import * as path from "path";

import currentContext, { Log } from "../context";
import isLinux from "../util/isLinux";
import getCallInfo from "./callInfo";

enum LOG_LEVEL {
  "DEBUG" = 10,
  "INFO" = 20,
  "WARN" = 30,
  "ERROR"= 40,
}

enum LOG_COLOR {
  "DEBUG" = "yellow",
  "INFO" = "blue",
  "WARN" = "magenta",
  "ERROR"= "red",
  "FATAL" = "cyan"
}

type LogLevelStrings = keyof typeof LOG_LEVEL;

let logger: Logger;

export class Logger {
  logLevel: number

  setLogLevel(level: LogLevelStrings): number {
    if (typeof level === "string") {
      this.logLevel = LOG_LEVEL[level];
    } else {
      this.logLevel = level;
    }

    return this.logLevel;
  }

  getLogLevel(): number {
    return this.logLevel;
  }

  debug(str: string): void {
    this.writeLog("DEBUG", str);
  }

  info(str: string): void {
    this.writeLog("INFO", str);
  }

  warn(str: string): void {
    this.writeLog("WARN", str);
  }

  error(str: string): void {
    this.writeLog("ERROR", str);
  }

  writeLog(type: LogLevelStrings, str: string): Logger {
    const level: number = LOG_LEVEL[type];
    const log = Logger.getLog();
    const useInspectFlag = process.execArgv.join().includes("inspect");
    let logStr: string = null;
    const logLevel: number = this.getLogLevel();
    if (log || level >= logLevel) {
      logStr = this.formatStr(type, level, str);
    }

    if (logStr === null) {
      return this;
    }

    // 全息日志写入原始日志
    Logger.fillBuffer(type, logStr);
    if (level < logLevel) {
      return this;
    }

    if (useInspectFlag) {
      // Chrome写入原始日志
      Logger.fillInspect(logStr, level);
      // 控制台写入高亮日志
      const logWithColor = this.formatStr(type, level, str, true);
      Logger.fillStdout(logWithColor);
    } else {
      // 非调试模式写入原始日志
      Logger.fillStdout(logStr);
    }

    return this;
  }

  formatStr(
    type: LogLevelStrings,
    level: number,
    str: string,
    useColor?: boolean
  ): string {
    const log = Logger.getLog();
    let filename: string;
    let line: number;
    let column: number;
    let enable = false;

    if (level >= this.getLogLevel()) {
      enable = true;
    }

    if (log && log.showLineNumber) {
      enable = true;
    }

    if (enable || !isLinux) {
      // Magic number: 3
      // formatStr -> writeLog -> debug -> User call
      ({ column, line, filename } = getCallInfo(3));
    }

    filename = (filename || "").split(path.sep).join("/");
    const { pid } = process;
    const { SN } = currentContext();
    const timestamp = moment(new Date()).format("YYYY-MM-DD HH:mm:ss.SSS");
    const logType = `[${type}]`;
    const cpuInfo = `[${pid} ${SN}]`;
    const fileInfo = `[${filename}:${line}:${column}]`;
    if (useColor) {
      const typeColor = LOG_COLOR[type];
      return `${chalk.black(timestamp)} ${chalk[typeColor](logType)} ${
        chalk.black(cpuInfo)
      } ${chalk.blue(fileInfo)} ${str}`;
    }

    return `${timestamp} ${logType} ${cpuInfo} ${fileInfo} ${str}`;
  }

  static getLog(): Log {
    const { log } = currentContext();
    return log;
  }

  static clean(): void {
    let log = Logger.getLog();
    if (log) {
      log.arr = null;
      log = null;
    }
  }

  static fillBuffer(type: string, logStr: string): void {
    const log = Logger.getLog();
    if (log) {
      if (!log.arr) {
        log.arr = [];
      }

      if (logStr) {
        log.arr.push(logStr);
      }

      if (type) {
        if (log[type]) {
          log[type] += 1;
        } else {
          log[type] = 1;
        }
      }

      const arrLength = log.arr.length;
      if (arrLength % 512 === 0) {
        const { beforeLogClean } = currentContext();
        if (typeof beforeLogClean === "function") {
          beforeLogClean();
        }
      } else if (arrLength % 1024 === 0) {
        process.emit("warning", new Error("too many log"));
        Logger.clean();
      }
    }
  }

  static fillInspect(str: string, level: number): void {
    if (level <= 20) {
      (console.originLog || console.log)(str);
    } else if (level <= 30) {
      (console.originWarn || console.warn)(str);
    } else {
      (console.originError || console.error)(str);
    }
  }

  static fillStdout(str: string): void {
    process.stdout.write(`${str}\n`);
  }
}

if (!logger) {
  logger = new Logger();
}

export default logger;
