import { Router } from 'express';
import { membershipController } from '../controllers/membershipController';
import { createValidationMiddleware } from '../validators/common';
import { validateUserParams } from '../validators/stripe';

const router = Router();

// Get membership plans with Stripe data
router.get("/membership-plans", membershipController.getMembershipPlans.bind(membershipController));

// Get user membership status (works even without active subscription)
router.get(
  "/user/:userId/membership",
  createValidationMiddleware(validateUserParams),
  membershipController.getUserMembership.bind(membershipController)
);

// Create test membership for development (bypass Stripe)
router.post("/create-test-membership", membershipController.createTestMembership.bind(membershipController));

// Sync products with Stripe
router.post("/sync-products", membershipController.syncProducts.bind(membershipController));

// Get all incomplete subscriptions for testing
router.get("/incomplete-subscriptions", membershipController.getIncompleteSubscriptions.bind(membershipController));

// Complete subscription payment for testing
router.post(
  "/complete-payment/:subscriptionId",
  membershipController.completePayment.bind(membershipController)
);

export default router;
