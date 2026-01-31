import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { createValidationMiddleware } from '../validators/common';
import { validateCreateSubscription, validateUserParams } from '../validators/stripe';

const router: Router = Router();

// UNIFIED SUBSCRIPTION MANAGEMENT - handles create, update, and change plans
router.post(
  '/manage-subscription',
  createValidationMiddleware(validateCreateSubscription),
  subscriptionController.manageSubscription.bind(subscriptionController)
);

// Get user subscription
router.get(
  '/user/:userId/subscription',
  createValidationMiddleware(validateUserParams),
  subscriptionController.getUserSubscription.bind(subscriptionController)
);

// Cancel user subscription (at period end)
router.post(
  '/user/:userId/subscription/cancel',
  createValidationMiddleware(validateUserParams),
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

// Reactivate user subscription
router.post(
  '/user/:userId/subscription/reactivate',
  createValidationMiddleware(validateUserParams),
  subscriptionController.reactivateSubscription.bind(subscriptionController)
);

export default router;
