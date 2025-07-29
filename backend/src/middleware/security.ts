import { NextFunction, Request, Response } from 'express';
import { sanitizeLogData } from '../utils/helpers';

export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Override console.log for this request to filter sensitive data
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleLog.apply(console, sanitizedArgs);
  };

  console.error = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleError.apply(console, sanitizedArgs);
  };

  // Restore original console methods after request
  res.on("finish", () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  next();
};

export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers for sensitive responses
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "X-Content-Type-Options": "nosniff",
  });
  
  next();
};
