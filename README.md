# Cancelit

**Find your hidden subscriptions and stop money leaks.**

Cancelit is a privacy-first web app that analyzes your bank statement to discover forgotten subscriptions. Upload a CSV, see all your recurring payments, and get instructions to cancel them.

## Features

- **AI-Powered Analysis** — Uses Google Gemini to intelligently detect subscription patterns
- **Privacy First** — Your data never leaves your device. Nothing is stored.
- **Categorized Results** — Subscriptions grouped by type (Streaming, Music, Gaming, etc.)
- **Cancel Instructions** — Step-by-step guides to cancel each subscription
- **Beautiful UI** — Clean, brutalist minimal design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 1.5 Flash
- **CSV Parsing**: Papa Parse

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cancelit.git
   cd cancelit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Export your bank statement as a CSV file
2. Drop the file onto Cancelit
3. Wait for AI analysis
4. Review your subscriptions by category
5. Follow cancel instructions to stop unwanted payments

## Supported Banks

The AI automatically detects CSV column structures, so most bank formats should work. Tested with:

- **India**: HDFC, ICICI, SBI, Axis, Kotak
- **USA**: Chase, Bank of America, Wells Fargo, Citi

## Privacy

Your financial data is sensitive. Here's how we handle it:

- ✅ CSV is parsed in your browser
- ✅ Only transaction text is sent to AI (no account numbers)
- ✅ No data is stored on any server
- ✅ Analysis results are only in your browser memory
- ✅ Refreshing the page clears everything

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cancelit&env=GEMINI_API_KEY)

Or manually:

```bash
npm run build
vercel deploy
```

Remember to set `GEMINI_API_KEY` in your Vercel environment variables.

## License

MIT

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.

---

Built for people tired of forgotten subscriptions.
