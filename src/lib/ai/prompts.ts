// AI system prompts and output schemas for transaction analysis

export const SYSTEM_PROMPT = `You are a financial analyst AI that analyzes credit card transaction data to provide comprehensive financial insights.

Your task:
1. Analyze the CSV transaction data provided
2. Identify the column structure (date, amount, description/merchant, etc.)
3. Categorize EVERY transaction into appropriate categories
4. Identify recurring subscriptions separately
5. Calculate totals, breakdowns, and insights

TRANSACTION CATEGORIES (use these exactly):
Recurring Payments: Subscription, Bill & Utility, Rent, EMI & Loan, Insurance
Daily Spending: Food & Dining, Groceries, Shopping, Transportation, Fuel, Entertainment, Healthcare, Education, Travel, Personal Care
Credits: Refund, Cashback, Payment
Default: Other

SUBSCRIPTION CATEGORIES (for recurring services):
Streaming, Music, Cloud Storage, Productivity, Gaming, News & Reading, Fitness, Finance, Shopping, Food & Delivery, Transportation, Other

Rules:
- Categorize ALL transactions, not just subscriptions
- Debit transactions (negative or charges) are spending
- Credit transactions (positive) are typically refunds, cashback, or payments made to the card
- Subscriptions are recurring debits that appear 2+ times with regular intervals
- Normalize merchant names (e.g., "GOOGLE *YOUTUBEPREMIU" → "YouTube Premium")
- Convert all amounts to positive numbers
- Detect subscription frequency: weekly (~7 days), monthly (~30 days), quarterly (~90 days), yearly (~365 days)
- Provide cancel instructions for known subscription services`;

export const OUTPUT_SCHEMA = `Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "summary": {
    "totalSpending": 62340,
    "totalCredits": 2500,
    "subscriptionTotal": 4847,
    "currency": "USD",
    "transactionCount": 156
  },
  "subscriptions": [
    {
      "id": "sub-1",
      "name": "Netflix",
      "amount": 15.99,
      "currency": "USD",
      "frequency": "monthly",
      "category": "Streaming",
      "firstSeen": "2024-01-15",
      "lastSeen": "2024-06-15",
      "occurrences": 6,
      "totalSpent": 95.94,
      "cancelInstructions": ["Go to netflix.com/account", "Click Cancel Membership"],
      "merchantPattern": "NETFLIX.COM"
    }
  ],
  "transactions": [
    {
      "id": "txn-1",
      "date": "2024-06-15",
      "description": "AMAZON PURCHASE",
      "amount": 45.99,
      "type": "debit",
      "category": "Shopping",
      "isRecurring": false,
      "merchantName": "Amazon",
      "confidence": 0.95
    }
  ],
  "spendingByCategory": [
    { "category": "Shopping", "totalAmount": 1850, "count": 45 }
  ],
  "topMerchants": [
    { "name": "Amazon", "totalSpent": 850, "count": 25, "category": "Shopping" }
  ],
  "dateRange": { "from": "2024-01-01", "to": "2024-06-30" },
  "analyzedRows": 156
}`;

export const PDF_EXTRACTION_PROMPT = `You are a document parser. Extract transaction data from this credit card statement PDF text.

Rules:
- Date should be in YYYY-MM-DD format
- Amount should be a positive number
- Type should be "debit" or "credit"
- Include ALL transactions you can find
- If unsure about type, use "debit" for negative amounts and "credit" for positive

Return ONLY the CSV data, starting with the header row. No explanations.`;

export function buildAnalysisPrompt(csvContent: string): string {
  return `${SYSTEM_PROMPT}

Analyze the following credit card transaction data:

\`\`\`csv
${csvContent}
\`\`\`

${OUTPUT_SCHEMA}`;
}

export function buildPDFExtractionPrompt(pdfText: string): string {
  return `${PDF_EXTRACTION_PROMPT}

PDF Content:
${pdfText}

Extract all transactions and return them as a CSV string with these columns:
Date,Description,Amount,Type`;
}
