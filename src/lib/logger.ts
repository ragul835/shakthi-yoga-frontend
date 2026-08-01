import winston from 'winston';
import 'winston-daily-rotate-file';

let logger: winston.Logger;

if (typeof window === 'undefined') {
  // Server-side
  logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/frontend-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
    ],
  });
} else {
  // Client-side fallback
  const createClientLogger = (level: string) => {
    return {
      info: (...args: any[]) => console.info(`[FRONTEND INFO]`, ...args),
      warn: (...args: any[]) => console.warn(`[FRONTEND WARN]`, ...args),
      error: (...args: any[]) => console.error(`[FRONTEND ERROR]`, ...args),
      debug: (...args: any[]) => console.debug(`[FRONTEND DEBUG]`, ...args),
    } as unknown as winston.Logger;
  };
  logger = createClientLogger('info');
}

export default logger;
