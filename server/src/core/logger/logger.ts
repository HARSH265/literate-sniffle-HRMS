import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const { NODE_ENV } = process.env;

export const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}`;
          }
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
  ],
});