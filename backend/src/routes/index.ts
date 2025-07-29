import { Router } from 'express';
import { securityMiddleware } from '../middleware/security';

// Import route modules
import customerRoutes from './customers';
import membershipRoutes from './memberships';
import paymentMethodRoutes from './paymentMethods';
import stripeRoutes from './stripe';
import subscriptionRoutes from './subscriptions';
import syncRoutes from './sync';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Debug route to test if routes are working
router.get("/test", (req, res) => {
  res.json({
    message: "Stripe routes are working!",
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/', customerRoutes);
router.use('/', stripeRoutes);
router.use('/', subscriptionRoutes);
router.use('/', syncRoutes);
router.use('/', membershipRoutes);
router.use('/', paymentMethodRoutes);

export default router;
