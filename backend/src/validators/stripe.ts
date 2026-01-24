import { Request } from 'express';
import {
  validateEmail,
  validateRequired,
  validateStripeCustomerId,
  validateStripePaymentMethodId,
  validateUUID,
} from './common';

export const validateCreateCustomer = (req: Request): void => {
  const { email, name, userId } = req.body;

  validateRequired(req.body, ['email', 'name']);

  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (userId && !validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
};

export const validateCreateSubscription = (req: Request): void => {
  const { userId, stripePriceId } = req.body;

  validateRequired(req.body, ['userId', 'stripePriceId']);

  if (!validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
};

export const validateCreatePaymentMethod = (req: Request): void => {
  const { customerId, userId, email } = req.body;

  // Either customerId should be provided, or userId + email for creating new customer
  if (!customerId && (!userId || !email)) {
    throw new Error(
      'Customer ID is required, or userId and email must be provided to create a new customer'
    );
  }

  if (customerId && !validateStripeCustomerId(customerId)) {
    throw new Error('Invalid customer ID format');
  }

  if (userId && !validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }

  if (email && !validateEmail(email)) {
    throw new Error('Invalid email format');
  }
};

export const validateSetDefaultPaymentMethod = (req: Request): void => {
  const { customerId } = req.params;
  const { paymentMethodId } = req.body;

  validateRequired({ customerId, paymentMethodId }, ['customerId', 'paymentMethodId']);

  if (!validateStripeCustomerId(customerId)) {
    throw new Error('Invalid customer ID format');
  }

  if (!validateStripePaymentMethodId(paymentMethodId)) {
    throw new Error('Invalid payment method ID format');
  }
};

export const validateUserParams = (req: Request): void => {
  const { userId } = req.params;

  validateRequired({ userId }, ['userId']);

  if (!validateUUID(userId)) {
    throw new Error('Invalid user ID format');
  }
};
