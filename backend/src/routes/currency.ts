import { Router } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

// Mock exchange rates - in a real app, you'd use an API like exchangerate-api.com
const exchangeRates: { [key: string]: number } = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
};

const currencyInfo = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  CHF: { symbol: "Fr", name: "Swiss Franc" },
  CNY: { symbol: "¥", name: "Chinese Yuan" },
};

// Get supported currencies
router.get("/currencies", authenticate, async (req, res) => {
  try {
    const currencies = Object.entries(currencyInfo).map(([code, info]) => ({
      code,
      symbol: info.symbol,
      name: info.name,
      rate: exchangeRates[code],
    }));

    res.json(currencies);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    res.status(500).json({ message: "Failed to fetch currencies" });
  }
});

// Get exchange rate between two currencies
router.get("/exchange-rate/:from/:to", authenticate, async (req, res) => {
  try {
    const { from, to } = req.params;

    if (!exchangeRates[from] || !exchangeRates[to]) {
      return res.status(400).json({ message: "Invalid currency code" });
    }

    const rate = exchangeRates[to] / exchangeRates[from];

    res.json({
      from,
      to,
      rate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    res.status(500).json({ message: "Failed to fetch exchange rate" });
  }
});

// Convert amount between currencies
router.post("/convert", authenticate, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      return res.status(400).json({ message: "Invalid currency code" });
    }

    const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    const convertedAmount = amount * rate;

    res.json({
      originalAmount: amount,
      fromCurrency,
      toCurrency,
      exchangeRate: rate,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({ message: "Failed to convert currency" });
  }
});

export default router;
