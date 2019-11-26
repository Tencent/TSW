import * as util from 'util'
import * as moment from 'moment'
import * as chalk from 'chalk'

import * as contextMod from '../context'
import { isWin32Like } from '../util/isWindows'
import { getCallInfo, Info } from './callInfo'

type Log = contextMod.Log | null
type LogInfo = {
  type?: string;
  pid?: number;
  cpu?: string | number;
  SN?: number;
  file?: string;
  line?: number;
  moment?: string;
  txt?: string;
  column?: number;
}
enum TYPE_2_LEVEL {
  'DEBUG' = 10,
  'INFO' = 20,
  'WARN' = 30,
  'ERROR'= 40,
};
enum TYPE_COLOR {
  'DEBUG' = 'yellow',
  'INFO' = 'blue',
  'WARN' = 'magenta',
  'ERROR'= 'red',
  'FATAL' = 'cyan'
}

let logger: Logger;

const isExceedFreq = (level: number, str?: string, obj?: any): boolean => {
  return true;
}
const merge = (str: string, obj?: object): string => {
  if(typeof obj !== 'object'){
    return str;
  }
  str = str.replace(/\$\{(.+?)\}/g, ($0, $1): string => {
    let rs = obj[$1] || '';
    if(typeof rs === 'object'){
      rs = util.inspect(rs);
    }else{
      rs = String(rs);
    }
    return rs;
  })
}
const formatStr = (obj: LogInfo, useColor?: boolean): string => {
  const moment = obj.moment
  const type = `[${obj.type}]`
  const cpuInfo = `[${obj.pid} cpu${obj.cpu} ${obj.SN}]`
  const fileInfo = `[${obj.file}:${obj.line}]`
  const txt = obj.txt
  if(useColor){
    const typeColor = TYPE_COLOR[obj.type] || 'black'
    return `${chalk.black(moment)} ${chalk[typeColor](type)} ${chalk.black(cpuInfo)} ${chalk.blue(fileInfo)} ${txt}`
  }else{
    return `${moment} ${type} ${cpuInfo} ${fileInfo} ${txt}`
  }
}

class Logger {
  logLevel: number
  setLogLevel(level: string | number): void{
    if(typeof level == 'string'){
      this.logLevel = TYPE_2_LEVEL[level]
    }else{
      this.logLevel = level;
    }
  }
  getLogLevel(): number{
    return this.logLevel;
  }
  getLog(): Log{
    const log: Log = contextMod.currentContext().log;
    return log
  }
  clean(): void{
    let log: Log = this.getLog();
    if(log){
      log.arr = null
      if(log.json){
        delete log.json;
      }
      log = null;
    }
  }
  fillBuffer(type: string, logStr: string): void{
    const log: Log = this.getLog();
    if(log){
      if(!log.arr){
        log.arr = [];
      }
      if(logStr){
        log.arr.push(logStr);
      }
      if(type){
        if(log[type]){
          log[type] ++;
        }else{
          log[type] = 1;
        }
      }
      const arrLength: number = log.arr.length;
      const ajaxLength: number = log.json && log.json.ajax && log.json.ajax.length;
      if(arrLength % 512 === 0 || ajaxLength % 10 === 0) {
        const beforeLogClean = contextMod.currentContext().beforeLogClean;
        if (typeof beforeLogClean === 'function') {
          beforeLogClean();
        }
      }else if (arrLength % 1024 === 0 || ajaxLength % 20 === 0) {
        process.emit('warning', new Error('too many log'));
        this.clean();
      }
    }
  }
  getSN(): number{
    return contextMod.currentContext().SN || 0;
  }
  getCpu(): string{
    let cpu: string = process.serverInfo && process.serverInfo.cpu;
    if(cpu === undefined){
      cpu = '';
    }
    return cpu;
  }
  debug(str: string, obj?: object): void{
    this.writeLog('DEBUG', str, obj);
  }
  info(str: string, obj?: object): void{
    this.writeLog('INFO', str, obj)
  }
  warn(str: string, obj?: object): void{
    this.writeLog('WARN', str, obj)
  }
  error(str: string, obj?: object): void{
    this.writeLog('ERROR', str, obj)
  }
  writeLog(type: string, str: string, obj?: object): Logger {
    const level: number = TYPE_2_LEVEL[type]
    const log: Log = this.getLog();
    const allow: boolean = isExceedFreq(level, str, obj);
    const useInspectFlag = process.execArgv.join().includes('inspect');
    let logStr: string = null;
    const logLevel: number = this.getLogLevel();
    if(log || allow === true || level >= logLevel) {
      logStr = this._getLog(type, level, str, obj);
    }
    if (logStr === null) {
      return this;
    }
    // 全息日志写入原始日志
    this.fillBuffer(type, logStr);
    if (allow === false || level < logLevel) {
      return this;
    }
    if(useInspectFlag){
      // Chrome写入原始日志
      this.fillInspect(logStr, level);
      // 控制台写入高亮日志
      const logWithColor = this._getLog(type, level, str, obj, 'color');
      this.fillStdout(logWithColor);
    }else{
      // 非调试模式写入原始日志
      this.fillStdout(logStr);
    }
    return this;
  }
  _getLog(type: string, level: number, str: string, obj: object | null, useColor?: string): any{
    const log: Log = this.getLog();
    let filename: string, column: number, line: number, enable = false, info: Info;
    if(level >= this.getLogLevel()){
      enable = true;
    }
    if(log && log['showLineNumber']){
      enable = true;
    }
    if(enable || isWin32Like){
      info = getCallInfo(3);
      line = info.line;
      column = info.column;
      filename = info.filename || '';
    }
    const now = new Date();
    if(isWin32Like) {
      filename = filename.replace(/\\/g, '/');
    }
    // let index: number = filename.lastIndexOf('/node_modules/');
    // if (index >= 0) {
    //   index += 14;
    // } else {
    //   index = filename.lastIndexOf('/') + 1;
    // }
    // if(index >= 0) {
    //   filename = filename.slice(index);
    // }
    const txt: string = typeof str == 'string' ? merge(str, obj) : (typeof str === 'object' ? '\n' : '') + util.inspect(str);
    const logStr: string = formatStr({
      SN: this.getSN(),
      moment: moment(now).format('YYYY-MM-DD HH:mm:ss.SSS'),
      type,
      file: filename,
      txt,
      line,
      column,
      cpu: this.getCpu(),
      pid: process.pid
    }, !!useColor);
    return logStr;
  }
  fillInspect(str: string, level: number): void{
    if(level <= 20){
      (console.originLog || console.log)(str);
    }else if(level <= 30) {
      (console.originWarn || console.warn)(str);
    }else{
      (console.originError || console.error)(str);
    }
  }
  fillStdout(str: string): void{
    process.stdout.write(str + '\n');
  }
}

if (!logger) {
  logger = new Logger();
}
export default logger;
