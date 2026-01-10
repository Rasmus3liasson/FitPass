import { Router } from "express";
import { securityMiddleware } from "../middleware/security";

// Import route modules
import authRoutes from "./auth";
import customerRoutes from "./customers";
import gdprRoutes from "./gdpr";
import membershipRoutes from "./memberships";
import paymentMethodRoutes from "./paymentMethods";
import payoutRoutes from "./payouts";
import stripeRoutes from "./stripe/index"; // Modular stripe routes
import subscriptionRoutes from "./subscriptions";
import syncRoutes from "./sync";

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Mount route modules
router.use("/auth", authRoutes);
router.use("/", customerRoutes);
router.use("/stripe", stripeRoutes);
router.use("/", subscriptionRoutes);
router.use("/", syncRoutes);
router.use("/", membershipRoutes);
router.use("/", paymentMethodRoutes);
router.use("/payouts", payoutRoutes);
router.use("/gdpr", gdprRoutes);

export default router;
