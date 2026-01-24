import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { setSecurityHeaders } from '../middleware/security';
import { createValidationMiddleware } from '../validators/common';
import { validateCreateCustomer, validateUserParams } from '../validators/stripe';

const router = Router();

// Create Stripe customer - Keep for StripeService compatibility
router.post(
  '/create-customer',
  createValidationMiddleware(validateCreateCustomer),
  customerController.createCustomer.bind(customerController)
);

// Get or create Stripe customer ID for user
router.post('/get-customer-id', customerController.getCustomerId.bind(customerController));

// Get Stripe customer ID for user
router.get(
  '/user/:userId/customer-id',
  setSecurityHeaders,
  createValidationMiddleware(validateUserParams),
  customerController.getUserCustomerId.bind(customerController)
);

export default router;
