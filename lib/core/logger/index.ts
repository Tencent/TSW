type LoggerLevel =
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"

class Logger {
  writeLog(level: LoggerLevel, info: string): void {
    // do nothing
    console.log(level);
    console.log(info);
  }
  debug(str: string): void {
    console.debug(str);
  }

  error(str: string): void {
    console.error(str);
  }
}

let logger: Logger;

if (!logger) {
  logger = new Logger();
}

export default logger;
