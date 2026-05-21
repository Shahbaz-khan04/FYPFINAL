import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getDashboardByUserId,
  getSummaryByUserId,
  getTransactionsByUserId,
} from "../controllers/transactionsController.js";

const router = express.Router();

router.get("/:userId", getTransactionsByUserId);
router.post("/", createTransaction);
router.delete("/:id", deleteTransaction);
router.get("/summary/:userId", getSummaryByUserId);
router.get("/dashboard/:userId", getDashboardByUserId);

export default router;
