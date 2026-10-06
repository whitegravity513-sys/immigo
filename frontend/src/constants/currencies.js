// Comprehensive international currency list with codes and labels

export const POPULAR_CURRENCIES = [
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "QAR", label: "QAR - Qatari Riyal" },
  { code: "OMR", label: "OMR - Omani Rial" },
  { code: "KWD", label: "KWD - Kuwaiti Dinar" },
  { code: "BHD", label: "BHD - Bahraini Dinar" },
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "INR", label: "INR - Indian Rupee (₹)" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "SGD", label: "SGD - Singapore Dollar" },
  { code: "MYR", label: "MYR - Malaysian Ringgit" },
  { code: "PLN", label: "PLN - Polish Złoty" },
  { code: "RON", label: "RON - Romanian Leu" },
  { code: "JPY", label: "JPY - Japanese Yen (¥)" },
  { code: "KRW", label: "KRW - South Korean Won (₩)" },
  { code: "CHF", label: "CHF - Swiss Franc" },
  { code: "NZD", label: "NZD - New Zealand Dollar" },
  { code: "PHP", label: "PHP - Philippine Peso (₱)" },
  { code: "PKR", label: "PKR - Pakistani Rupee" },
  { code: "BDT", label: "BDT - Bangladeshi Taka" },
  { code: "NPR", label: "NPR - Nepalese Rupee" },
  { code: "ZAR", label: "ZAR - South African Rand" },
];

export const CURRENCY_CODES = POPULAR_CURRENCIES.map((c) => c.code);

export default POPULAR_CURRENCIES;
