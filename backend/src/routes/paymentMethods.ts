import { Router } from 'express';
import { paymentMethodController } from '../controllers/paymentMethodController';
import { setSecurityHeaders } from '../middleware/security';
import { createValidationMiddleware } from '../validators/common';
import {
  validateCreatePaymentMethod,
  validateSetDefaultPaymentMethod,
  validateUserParams
} from '../validators/stripe';

const router : Router = Router();

// Create a payment method for testing
router.post(
  "/create-payment-method",
  createValidationMiddleware(validateCreatePaymentMethod),
  paymentMethodController.createPaymentMethod.bind(paymentMethodController)
);

// Set default payment method for customer
router.post(
  "/set-default-payment-method/:customerId",
  createValidationMiddleware(validateSetDefaultPaymentMethod),
  paymentMethodController.setDefaultPaymentMethod.bind(paymentMethodController)
);

// Get customer payment methods
router.get(
  "/customer/:customerId/payment-methods",
  setSecurityHeaders,
  paymentMethodController.getCustomerPaymentMethods.bind(paymentMethodController)
);

// Delete payment method
router.delete(
  "/payment-method/:paymentMethodId",
  paymentMethodController.deletePaymentMethod.bind(paymentMethodController)
);

// Get payment methods for user by userId
router.post(
  "/user/:userId/payment-methods",
  setSecurityHeaders,
  createValidationMiddleware(validateUserParams),
  paymentMethodController.getUserPaymentMethods.bind(paymentMethodController)
);

export default router;
