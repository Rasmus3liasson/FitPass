import { Request, Response } from 'express';

// 🔒 SECURITY: Middleware to sanitize logs and prevent sensitive data exposure
export const securityMiddleware = (req: Request, res: Response, next: any) => {
  // Override console.log for this request to filter sensitive data
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const sanitizeLogData = (data: any): any => {
    if (typeof data === 'string') {
      // Remove potential card numbers, CVCs, or sensitive patterns
      return data
        .replace(/\b\d{13,19}\b/g, '****CARD_NUMBER_REDACTED****')
        .replace(/\b\d{3,4}\b/g, (match) => {
          // Only redact if it looks like a CVC (3-4 digits)
          return match.length <= 4 ? '***' : match;
        });
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      // List of sensitive fields to redact
      const sensitiveFields = [
        'card_number',
        'number',
        'cvc',
        'cvv',
        'cvv2',
        'exp_month',
        'exp_year',
        'client_secret',
        'secret',
        'password',
        'token',
        'key',
      ];

      Object.keys(sanitized).forEach((key) => {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          sanitized[key] = '****REDACTED****';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = sanitizeLogData(sanitized[key]);
        }
      });

      return sanitized;
    }

    return data;
  };

  console.log = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleLog(...sanitizedArgs);
  };

  console.error = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleError(...sanitizedArgs);
  };

  // Restore original console functions after response
  res.on('finish', () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  next();
};
