import { Router } from 'express';
import { syncController } from '../controllers/syncController';

const router = Router();

// Comprehensive bi-directional sync (Database ↔ Stripe)
router.post("/comprehensive-sync", syncController.comprehensiveSync.bind(syncController));

// Auto-sync status endpoint
router.get("/auto-sync-status", syncController.getAutoSyncStatus.bind(syncController));

// Debug membership endpoint
router.get("/debug/membership/:userId", syncController.debugMembership.bind(syncController));

// Fix customer ID mismatch between profile and membership
router.post("/fix-customer/:userId", syncController.fixCustomerMismatch.bind(syncController));

// Comprehensive sync of all subscriptions from Stripe
router.post("/sync-all-subscriptions", syncController.syncAllSubscriptions.bind(syncController));

// Sync scheduler control endpoints
router.post("/scheduler/start", syncController.startScheduler.bind(syncController));
router.post("/scheduler/stop", syncController.stopScheduler.bind(syncController));
router.get("/scheduler/status", syncController.getSchedulerStatus.bind(syncController));
router.post("/scheduler/trigger", syncController.triggerManualSync.bind(syncController));

export default router;
