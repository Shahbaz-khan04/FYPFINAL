import express from "express";
import { getMonthlyInsights } from "../controllers/aiController.js";

const router = express.Router();

router.post("/monthly-insights/:userId", getMonthlyInsights);

export default router;
