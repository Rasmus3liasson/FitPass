import { Router } from "express";
import billingRouter from "./billing";
import customersRouter from "./customers";
import membershipsRouter from "./memberships";
import { securityMiddleware } from "./middleware";
import paymentMethodsRouter from "./paymentMethods";
import paymentsRouter from "./payments";
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
router.use("/", billingRouter);
router.use("/", scheduledChangesRouter);
router.use("/", paymentsRouter);

export default router;