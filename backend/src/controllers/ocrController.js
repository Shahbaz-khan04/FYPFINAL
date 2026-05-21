import { linkReceipt, scanReceipt } from "../services/ocrService.js";

export async function scanReceiptController(req, res) {
  try {
    const { imageBase64, imageUrl } = req.body || {};

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ message: "Provide imageBase64 or imageUrl" });
    }

    const result = await scanReceipt({ imageBase64, imageUrl });
    return res.status(200).json(result);
  } catch (error) {
    console.log("OCR scan error", error);
    return res.status(500).json({ message: error.message || "Scan failed, retry." });
  }
}

export async function linkReceiptController(req, res) {
  try {
    const { receiptId } = req.params;
    const { transactionId } = req.body || {};

    if (!transactionId) {
      return res.status(400).json({ message: "transactionId is required" });
    }

    const linked = linkReceipt(receiptId, transactionId);
    if (!linked) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    return res.status(200).json({ message: "Receipt linked", receipt: linked });
  } catch (error) {
    console.log("Receipt link error", error);
    return res.status(500).json({ message: "Failed to link receipt" });
  }
}
