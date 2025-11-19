import { Router } from "express";
import customersRouter from "./customers";
import membershipsRouter from "./memberships";
import { securityMiddleware } from "./middleware";
import paymentMethodsRouter from "./paymentMethods";
import scheduledChangesRouter from "./scheduledChanges";
import subscriptionsRouter from "./subscriptions";
import syncRouter from "./sync";

const router = Router();

// Apply security middleware to all Stripe routes
router.use(securityMiddleware);

// Mount sub-routers
router.use("/", customersRouter);
router.use("/", paymentMethodsRouter);
router.use("/", subscriptionsRouter);
router.use("/", membershipsRouter);
router.use("/", syncRouter);
router.use("/", scheduledChangesRouter);

export default router;