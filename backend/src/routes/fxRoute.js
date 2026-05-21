import express from "express";
import { getRatesController } from "../controllers/fxController.js";

const router = express.Router();

router.get("/rates", getRatesController);

export default router;
