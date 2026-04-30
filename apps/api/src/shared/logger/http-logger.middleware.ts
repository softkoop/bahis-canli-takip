// src/shared/logger/http-logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './app-logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const logMethod =
        statusCode >= 400
          ? this.logger.error.bind(this.logger)
          : this.logger.info.bind(this.logger);

      logMethod(
        `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`,
      );
    });

    next();
  }
}
