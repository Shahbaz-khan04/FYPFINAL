import { sql } from "../config/db.js";
import { convertAmount, fetchRates } from "../services/fxService.js";

const getMonthRange = (monthParam) => {
  const now = new Date();
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const prevStart = new Date(Date.UTC(year, month - 1, 1));
  const prevEnd = new Date(Date.UTC(year, month, 1));

  const fmt = (d) => d.toISOString().slice(0, 10);
  const monthLabel = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    monthLabel,
    start: fmt(start),
    end: fmt(end),
    prevStart: fmt(prevStart),
    prevEnd: fmt(prevEnd),
    year,
    month,
  };
};

export async function buildDashboardData(userId, targetCurrency, monthParam) {
  const currency = (targetCurrency || "USD").toUpperCase();
  const { monthLabel, start, end, prevStart, prevEnd, year, month } = getMonthRange(monthParam);
  const ratesData = await fetchRates(currency);

  const currentRows = await sql`
    SELECT amount, currency, category, created_at
    FROM transactions
    WHERE user_id = ${userId}
    AND created_at >= ${start}
    AND created_at < ${end}
    ORDER BY created_at ASC
  `;

  const previousRows = await sql`
    SELECT amount, currency
    FROM transactions
    WHERE user_id = ${userId}
    AND created_at >= ${prevStart}
    AND created_at < ${prevEnd}
  `;

  const trendRows = await sql`
    SELECT to_char(created_at, 'YYYY-MM') AS month_key, amount, currency
    FROM transactions
    WHERE user_id = ${userId}
    AND created_at >= ${(new Date(Date.UTC(year, month - 5, 1))).toISOString().slice(0, 10)}
    AND created_at < ${end}
    ORDER BY created_at ASC
  `;

  const toTarget = (amount, rowCurrency) =>
    convertAmount(
      Number(amount),
      (rowCurrency || "USD").toUpperCase(),
      currency,
      ratesData.base,
      ratesData.rates
    );

  const computeTotals = (rows) => {
    let balance = 0;
    let income = 0;
    let expenses = 0;
    for (const row of rows) {
      const val = toTarget(row.amount, row.currency);
      balance += val;
      if (val > 0) income += val;
      if (val < 0) expenses += val;
    }
    return { balance, income, expenses };
  };

  const currentTotals = computeTotals(currentRows);
  const previousTotals = computeTotals(previousRows);

  const changeVsLastMonth =
    previousTotals.balance === 0
      ? null
      : ((currentTotals.balance - previousTotals.balance) / Math.abs(previousTotals.balance)) * 100;

  const spendingMap = new Map();
  const incomeMap = new Map();
  for (const row of currentRows) {
    const val = toTarget(row.amount, row.currency);
    if (val < 0) {
      const absVal = Math.abs(val);
      spendingMap.set(row.category, (spendingMap.get(row.category) || 0) + absVal);
    } else if (val > 0) {
      incomeMap.set(row.category, (incomeMap.get(row.category) || 0) + val);
    }
  }

  const toTopArray = (map) => {
    const total = [...map.values()].reduce((a, b) => a + b, 0);
    return [...map.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const trendMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    trendMap.set(key, 0);
  }
  for (const row of trendRows) {
    const key = row.month_key;
    if (!trendMap.has(key)) continue;
    trendMap.set(key, trendMap.get(key) + toTarget(row.amount, row.currency));
  }

  return {
    month: monthLabel,
    currency,
    summary: {
      ...currentTotals,
      changeVsLastMonth,
    },
    trend: [...trendMap.entries()].map(([monthKey, value]) => ({ month: monthKey, balance: value })),
    topSpendingCategories: toTopArray(spendingMap),
    topIncomeCategories: toTopArray(incomeMap),
    ratesAsOf: ratesData.asOf,
    ratesStale: ratesData.stale || false,
  };
}

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const targetCurrency = req.query.currency?.toUpperCase();

    const transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
      `;

    if (!targetCurrency) {
      return res.status(200).json(transactions);
    }

    const ratesData = await fetchRates(targetCurrency);
    const mapped = transactions.map((tx) => {
      const sourceCurrency = (tx.currency || "USD").toUpperCase();
      const convertedAmount = convertAmount(
        Number(tx.amount),
        sourceCurrency,
        targetCurrency,
        ratesData.base,
        ratesData.rates
      );

      return { ...tx, converted_amount: convertedAmount, display_currency: targetCurrency };
    });

    res.status(200).json(mapped);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    const {
      title,
      amount,
      category,
      user_id,
      currency = "USD",
      paymentMethod = null,
      tags = null,
      receiptId = null,
      date = null,
    } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedTags = Array.isArray(tags) ? tags : null;
    const normalizedDate = date || null;

    const transaction = await sql`
      INSERT INTO transactions(user_id,title,amount,category,currency,payment_method,tags,receipt_id,created_at)
      VALUES (
        ${user_id},
        ${title},
        ${amount},
        ${category},
        ${currency.toUpperCase()},
        ${paymentMethod},
        ${normalizedTags},
        ${receiptId},
        COALESCE(${normalizedDate}, CURRENT_DATE::text)::date
      )
      RETURNING *
    `;

    console.log(transaction);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log("Error creating the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;
    const targetCurrency = req.query.currency?.toUpperCase();

    const totalsByCurrency = await sql`
      SELECT currency, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${userId}
      GROUP BY currency
    `;

    const incomeByCurrency = await sql`
      SELECT currency, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${userId} AND amount > 0
      GROUP BY currency
    `;

    const expenseByCurrency = await sql`
      SELECT currency, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ${userId} AND amount < 0
      GROUP BY currency
    `;

    if (!targetCurrency) {
      const balance = totalsByCurrency.reduce((acc, row) => acc + Number(row.total), 0);
      const income = incomeByCurrency.reduce((acc, row) => acc + Number(row.total), 0);
      const expenses = expenseByCurrency.reduce((acc, row) => acc + Number(row.total), 0);

      return res.status(200).json({ balance, income, expenses, currency: "USD" });
    }

    const ratesData = await fetchRates(targetCurrency);
    const sumConverted = (rows) =>
      rows.reduce(
        (acc, row) =>
          acc +
          convertAmount(
            Number(row.total),
            (row.currency || "USD").toUpperCase(),
            targetCurrency,
            ratesData.base,
            ratesData.rates
          ),
        0
      );

    const balance = sumConverted(totalsByCurrency);
    const income = sumConverted(incomeByCurrency);
    const expenses = sumConverted(expenseByCurrency);

    res.status(200).json({
      balance,
      income,
      expenses,
      currency: targetCurrency,
      ratesAsOf: ratesData.asOf,
      ratesStale: ratesData.stale || false,
    });
  } catch (error) {
    console.log("Error gettin the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDashboardByUserId(req, res) {
  try {
    const { userId } = req.params;
    const payload = await buildDashboardData(userId, req.query.currency || "USD", req.query.month);
    return res.status(200).json(payload);
  } catch (error) {
    console.log("Error getting dashboard data", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
