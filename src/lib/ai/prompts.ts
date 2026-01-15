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

KNOWN SUBSCRIPTION SERVICES (always identify as subscriptions even with single occurrence):
- Streaming: Netflix, Disney+, Hulu, HBO Max, Amazon Prime, YouTube Premium, Spotify, Apple Music, Apple TV+
- Productivity/SaaS: Slack, Notion, GitHub, GitLab, Figma, Canva, Adobe, Microsoft 365, Google Workspace, Zoom, 1Password, LastPass, Dropbox, Trello, Asana, Monday.com, Jira, Confluence, Linear, Retool
- AI Tools: OpenAI, ChatGPT, Claude, Anthropic, Midjourney, Jasper, Codeium, Sourcegraph, Cursor
- Development: Vercel, Netlify, Heroku, DigitalOcean, AWS, Azure, Google Cloud, Cloudflare, GitHub Copilot, JetBrains, BrowserStack, Instawp, Gridpane, SpinupWP, NitroPack
- Marketing/Sales: HubSpot, Mailchimp, SendGrid, Twilio, Apollo, Hunter, Instantly, Ahrefs, SEMrush, Moz, Hotjar, Typeform, Intercom, Help Scout, CallHippo, HighLevel, ActiveCampaign
- Hosting/Infrastructure: Cloudways, WP Engine, Kinsta, Flywheel, Pagely, SiteGround
- Design: Framer, Webflow, Sketch, InVision, Principle, Lottie, Freepik
- Business Tools: DocuSign, Float, TrackingTime, Uptime.com, PandaDoc, HelloSign
- WordPress: RankMath, AffiliateWP, Freemius, Edwiser, WooCommerce extensions

Rules:
- Categorize ALL transactions, not just subscriptions
- Debit transactions (negative or charges) are spending
- Credit transactions (positive) are typically refunds, cashback, or payments made to the card
- IMPORTANT: Identify subscriptions using BOTH methods:
  1. Recurring pattern: debits that appear 2+ times with regular intervals
  2. Known services: ANY payment to known subscription services (listed above) should be marked as subscription, even if it appears only once
- Look for category hints in the data (e.g., columns named "Category", "Mercury Category", "Type" with values like "Software", "Subscription")
- If a column indicates "Software" or "SaaS", those are almost always subscriptions
- For business/company statements, most software payments are monthly subscriptions
- Normalize merchant names (e.g., "GOOGLE *YOUTUBEPREMIU" → "YouTube Premium", "OPENAI *CHATGPT SUBSCR" → "OpenAI ChatGPT")
- Convert all amounts to positive numbers
- Detect subscription frequency: weekly (~7 days), monthly (~30 days), quarterly (~90 days), yearly (~365 days)
- If only one occurrence exists, assume "monthly" frequency for known subscription services
- Provide cancel instructions for known subscription services
- For failed transactions, still include them but note they didn't complete`;

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
    },
    {
      "id": "sub-2",
      "name": "GitHub",
      "amount": 20.00,
      "currency": "USD",
      "frequency": "monthly",
      "category": "Productivity",
      "firstSeen": "2024-01-08",
      "lastSeen": "2024-01-08",
      "occurrences": 1,
      "totalSpent": 20.00,
      "cancelInstructions": ["Go to github.com/settings/billing", "Click Cancel plan"],
      "merchantPattern": "GITHUB, INC."
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
    },
    {
      "id": "txn-2",
      "date": "2024-01-08",
      "description": "GITHUB, INC.",
      "amount": 20.00,
      "type": "debit",
      "category": "Subscription",
      "isRecurring": true,
      "merchantName": "GitHub",
      "confidence": 0.98
    }
  ],
  "spendingByCategory": [
    { "category": "Subscription", "totalAmount": 2500, "count": 35 },
    { "category": "Shopping", "totalAmount": 1850, "count": 45 }
  ],
  "topMerchants": [
    { "name": "Amazon", "totalSpent": 850, "count": 25, "category": "Shopping" }
  ],
  "dateRange": { "from": "2024-01-01", "to": "2024-06-30" },
  "analyzedRows": 156
}

IMPORTANT NOTES:
- For known SaaS/subscription services, include them in "subscriptions" array even with occurrences: 1
- Mark transactions for subscription services with "isRecurring": true and category: "Subscription"
- The "subscriptionTotal" in summary should be the monthly total (sum of all subscription amounts, converting yearly/quarterly to monthly equivalent)
- Detect currency from the data (look for "Currency" column, or infer from amounts and merchant patterns)`;

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
