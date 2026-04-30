import { Injectable, ConsoleLogger, Scope } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable({ scope: Scope.TRANSIENT }) // TRANSIENT çok önemli!
export class AppLogger extends ConsoleLogger {
  // Constructor'a context parametresi koyma!
  // scope: TRANSIENT sayesinde her service kendi instance'ını alır

  log(message: string, context?: string) {
    super.log(message, context);
  }

  info(message: string, context?: string) {
    super.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context);
  }

  // HTTP request logging
  logRequest(req: Request, context?: string) {
    const ip = req.ip || req.socket?.remoteAddress || '-';
    this.log(`⬆️  ${req.method} ${req.url} - ${ip}`, context || 'HTTP');
  }

  logResponse(res: Response, duration: number, context?: string) {
    const statusCode = res.statusCode;
    if (statusCode >= 400) {
      this.error(
        `⬇️  ${statusCode} - ${duration}ms`,
        undefined,
        context || 'HTTP',
      );
    } else {
      this.log(`⬇️  ${statusCode} - ${duration}ms`, context || 'HTTP');
    }
  }
}
