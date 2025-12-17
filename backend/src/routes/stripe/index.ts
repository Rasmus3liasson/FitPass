import { Router } from "express";
import billingRouter from "./billing";
import connectRouter from "./connect";
import customersRouter from "./customers";
import earningsRouter from "./earnings";
import membershipsRouter from "./memberships";
import { securityMiddleware } from "./middleware";
import paymentMethodsRouter from "./paymentMethods";
import paymentsRouter from "./payments";
import scheduledChangesRouter from "./scheduledChanges";
import subscriptionsRouter from "./subscriptions";
import subscriptionStatusRouter from "./subscriptionStatus";
import syncRouter from "./sync";
import webhookRouter from "./webhook";

const router = Router();

// Apply security middleware to all Stripe routes
router.use(securityMiddleware);

// Mount sub-routers
router.use("/", customersRouter);
router.use("/", paymentMethodsRouter);
router.use("/", subscriptionsRouter);
router.use("/", subscriptionStatusRouter);
router.use("/", membershipsRouter);
router.use("/", syncRouter);
router.use("/", billingRouter);
router.use("/", scheduledChangesRouter);
router.use("/", paymentsRouter);
router.use("/connect", connectRouter);
router.use("/earnings", earningsRouter);
router.use("/", webhookRouter);

export default router;