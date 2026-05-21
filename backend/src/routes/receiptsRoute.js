import express from "express";
import { linkReceiptController } from "../controllers/ocrController.js";

const router = express.Router();

router.post("/:receiptId/link", linkReceiptController);

export default router;
