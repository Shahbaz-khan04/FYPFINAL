import { randomUUID } from 'node:crypto';
import https from 'node:https';
import { env } from '../config/env.js';
import { supabase } from '../db/supabase.js';
import type { Receipt } from '../types/receipt.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const requestOcrSpace = (body: string) =>
  new Promise<string>((resolve, reject) => {
    const url = new URL(env.OCR_SPACE_API_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(`OCR API failed with status ${res.statusCode ?? 500}`));
            return;
          }
          resolve(raw);
        });
      },
    );

    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });

const normalizeDate = (value: string) => {
  const text = value.trim();
  const ymd = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const dmy = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
};

const parseReceiptText = (rawText: string) => {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const amountCandidates: number[] = [];
  for (const line of lines) {
    const moneyMatches = line.match(/(?:RS|PKR|USD|EUR|\$)?\s*(\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{2}))/gi);
    if (!moneyMatches) continue;
    for (const match of moneyMatches) {
      const numeric = match.replace(/[^\d.,]/g, '').replace(/,/g, '');
      const value = Number(numeric);
      if (Number.isFinite(value) && value > 0) {
        amountCandidates.push(value);
      }
    }
  }

  const extractedAmount = amountCandidates.length ? Math.max(...amountCandidates) : null;

  let extractedDate: string | null = null;
  for (const line of lines) {
    const value = normalizeDate(line);
    if (value) {
      extractedDate = value;
      break;
    }
  }

  const extractedMerchant =
    lines.find(
      (line) =>
        /^[a-z0-9 .,&'-]{3,}$/i.test(line) &&
        !/invoice|receipt|total|tax|amount|balance|cash|card/i.test(line),
    ) ?? null;

  return { extractedAmount, extractedDate, extractedMerchant };
};

export const receiptService = {
  async scanReceipt(
    userId: string,
    payload: {
      imageBase64?: string;
      imageUrl?: string;
    },
  ) {
    if (!env.OCR_SPACE_API_KEY) {
      throw new HttpError(500, 'OCR_NOT_CONFIGURED', 'OCR API key is not configured');
    }

    const hasBase64 = Boolean(payload.imageBase64?.trim());
    const hasUrl = Boolean(payload.imageUrl?.trim());
    if (!hasBase64 && !hasUrl) {
      throw new HttpError(400, 'RECEIPT_IMAGE_REQUIRED', 'Provide imageBase64 or imageUrl');
    }

    const formBody = new URLSearchParams();
    formBody.set('apikey', env.OCR_SPACE_API_KEY);
    formBody.set('language', 'eng');
    formBody.set('isOverlayRequired', 'false');
    if (hasBase64) {
      formBody.set('base64Image', payload.imageBase64!.trim());
    } else if (hasUrl) {
      formBody.set('url', payload.imageUrl!.trim());
    }

    const raw = await requestOcrSpace(formBody.toString());
    const parsed = JSON.parse(raw) as {
      ParsedResults?: Array<{ ParsedText?: string }>;
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string[] | string;
    };

    if (parsed.IsErroredOnProcessing) {
      const errorMessage = Array.isArray(parsed.ErrorMessage)
        ? parsed.ErrorMessage.join(', ')
        : parsed.ErrorMessage || 'OCR processing failed';
      throw new HttpError(400, 'OCR_FAILED', errorMessage);
    }

    const ocrRawText = parsed.ParsedResults?.[0]?.ParsedText?.trim() ?? '';
    const extracted = parseReceiptText(ocrRawText);

    const db = requireDb();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('receipts')
      .insert({
        id: randomUUID(),
        user_id: userId,
        image_url: payload.imageUrl?.trim() || null,
        ocr_raw_text: ocrRawText,
        extracted_amount: extracted.extractedAmount,
        extracted_merchant: extracted.extractedMerchant,
        extracted_date: extracted.extractedDate,
        linked_transaction_id: null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<Receipt>();

    if (error || !data) {
      throw new HttpError(500, 'RECEIPT_SAVE_FAILED', 'Could not save scanned receipt');
    }

    return {
      id: data.id,
      imageUrl: data.image_url,
      ocrRawText: data.ocr_raw_text,
      extractedAmount: data.extracted_amount,
      extractedMerchant: data.extracted_merchant,
      extractedDate: data.extracted_date,
      linkedTransactionId: data.linked_transaction_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async linkTransaction(userId: string, receiptId: string, transactionId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('receipts')
      .update({
        linked_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', receiptId)
      .eq('user_id', userId)
      .select('*')
      .single<Receipt>();

    if (error || !data) {
      throw new HttpError(500, 'RECEIPT_LINK_FAILED', 'Could not link receipt to transaction');
    }

    return {
      id: data.id,
      linkedTransactionId: data.linked_transaction_id,
      updatedAt: data.updated_at,
    };
  },
};
