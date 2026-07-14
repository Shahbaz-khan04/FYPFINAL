import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

import transactionsRoute from "./routes/transactionsRoute.js";
import ocrRoute from "./routes/ocrRoute.js";
import fxRoute from "./routes/fxRoute.js";
import receiptsRoute from "./routes/receiptsRoute.js";
import aiRoute from "./routes/aiRoute.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start();

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(rateLimiter);
app.use(express.json({ limit: "12mb" }));

// our custom simple middleware
// app.use((req, res, next) => {
//   console.log("Hey we hit a req, the method is", req.method);
//   next();
// });

const PORT = process.env.PORT || 5001;

app.use("/api/transactions", transactionsRoute);
app.use("/api/ocr", ocrRoute);
app.use("/api/receipts", receiptsRoute);
app.use("/api/fx", fxRoute);
app.use("/api/ai", aiRoute);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
});
