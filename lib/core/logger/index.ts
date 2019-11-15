class Logger {
    writeLog(level, info) {
        return `${level}: ${info}`
    }
}

let logger

if (!logger) {
    logger = new Logger()
}

export default logger
