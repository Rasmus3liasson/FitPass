import { Router } from "express";
import {
    generateMonthlyPayouts,
    getClubPayouts,
    getPayoutSummary,
    logVisit,
    sendPayoutTransfers,
} from "../controllers/payoutController";

const router = Router();

router.post("/log-visit", logVisit);
router.post("/generate-monthly", generateMonthlyPayouts);
router.post("/send-transfers", sendPayoutTransfers);
router.get("/club/:clubId", getClubPayouts);
router.get("/summary/:period", getPayoutSummary);

export default router;
