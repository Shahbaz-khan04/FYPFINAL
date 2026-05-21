import express from "express";
import { scanReceiptController } from "../controllers/ocrController.js";

const router = express.Router();

router.post("/scan", scanReceiptController);

export default router;
