const fs = require('fs');
const winston = require('winston');

if (!fs.existsSync("./logs"))
    fs.mkdirSync("./logs");

const createLogger = function () {

    const options = {
        file: {
            level: 'info',
            filename: './logs/application.log',
            handleExceptions: true,
            json: false,
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
                winston.format.printf(info => `${info.timestamp} [${info.level}] - ${info.message}`),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 100,
            colorize: false,
            eol: "\r\n"
        },
        console: {
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true,
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
                winston.format.printf(info => `${info.timestamp} [${info.level}] - ${info.message}`),
            ),
            eol: "\r\n"
        },
    };

    try
    {
        return winston.createLogger({
            levels: winston.config.npm.levels,
            transports: [
                new winston.transports.File(options.file),
                new winston.transports.Console(options.console)
            ],
            exitOnError: false
        });
    }
    catch (err)
    {
        console.error(err);
    }

    // fallback 
    return console;
}

const logger = createLogger();
module.exports = logger;