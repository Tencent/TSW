type LoggerLevel =
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"

class Logger {
  writeLog(level: LoggerLevel, info: string): void {
    // do nothing
  }

  debug(str: string): void {
    // do nothing
  }

  error(str: string): void {
    // do nothing
  }
}

let logger: Logger;

if (!logger) {
  logger = new Logger();
}

export default logger;
