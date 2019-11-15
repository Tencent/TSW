class Logger {
    writeLog(level: any, info: any) {}
    debug(str: string) {
        console.debug(str)
    }
    error(str: string) {
        console.error(str)
    }
}

let logger

if (!logger) {
    logger = new Logger()
}

export default logger
