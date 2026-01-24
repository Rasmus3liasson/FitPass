import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../types/api';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateStripeCustomerId = (customerId: string): boolean => {
  return typeof customerId === 'string' && customerId.startsWith('cus_');
};

export const validateStripePaymentMethodId = (paymentMethodId: string): boolean => {
  return typeof paymentMethodId === 'string' && paymentMethodId.startsWith('pm_');
};

export const validateStripeSubscriptionId = (subscriptionId: string): boolean => {
  return typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_');
};

export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateRequired = <T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void => {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

export const createValidationMiddleware = (validator: (req: Request) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validator(req);
      next();
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        message: 'Validation failed',
      };
      res.status(400).json(response);
    }
  };
};
