class Logger {
  writeLog(level: any, info: any) {
    // do nothing
  }
  debug(str: string) {
    console.debug(str);
  }

  error(str: string) {
    console.error(str);
  }
}

let logger: Logger;

if (!logger) {
  logger = new Logger();
}

export default logger;
