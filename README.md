# Cancelit

**Find your hidden subscriptions and stop money leaks.**

Cancelit is a privacy-first web app that analyzes your credit card statement to discover forgotten subscriptions. Upload a CSV or PDF, see all your recurring payments categorized by type, and get step-by-step instructions to cancel them.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

## Features

- **AI-Powered Analysis** — Uses Google Gemini to intelligently detect subscription patterns
- **CSV & PDF Support** — Upload credit card statements in either format
- **Privacy First** — Your data never leaves your device. Nothing is stored on servers.
- **Categorized Results** — Subscriptions grouped by type (Streaming, Music, Gaming, Fitness, etc.)
- **Spending Breakdown** — See total monthly and yearly costs at a glance
- **Cancel Instructions** — Step-by-step guides to cancel each subscription
- **Beautiful UI** — Clean, brutalist minimal design with responsive layout

## Tech Stack

| Category    | Technology                        |
| ----------- | --------------------------------- |
| Framework   | Next.js 16.1 (App Router)         |
| Language    | TypeScript 5                      |
| UI          | React 19, Tailwind CSS 4          |
| AI          | Google Gemini via AI SDK          |
| Parsing     | Papa Parse (CSV), pdf-parse (PDF) |
| Background  | Inngest (serverless functions)    |
| Cache/Queue | Upstash Redis                     |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/
│   │   ├── analyze/        # Analysis submission endpoint
│   │   │   └── status/     # Job status polling endpoint
│   │   └── inngest/        # Inngest webhook handler
│   ├── results/            # Results page
│   └── page.tsx            # Home page with upload
├── components/
│   ├── analysis/           # Analysis results components
│   ├── error/              # Error handling views
│   ├── subscriptions/      # Subscription cards and categories
│   ├── ui/                 # Shared UI components
│   └── upload/             # File upload component
└── lib/
    ├── ai/                 # Gemini client and prompts
    ├── errors/             # Error types and handling
    ├── inngest/            # Inngest client and functions
    ├── parsers/            # CSV and PDF parsers
    ├── redis/              # Upstash Redis client and job storage
    ├── types/              # TypeScript type definitions
    ├── utils/              # Utilities (rate limiter, sanitizer)
    └── validators/         # File and content validators
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
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

   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Export your credit card statement as a **CSV** or **PDF** file
2. Drop the file onto Cancelit (or click to browse)
3. Wait for AI analysis (typically 3-5 minutes for comprehensive analysis)
4. Review your subscriptions organized by category
5. Follow the cancel instructions for any subscription you want to stop

**Note**: Analysis runs in the background using Inngest, so you'll see real-time progress updates as your statement is processed.

## Supported File Formats

### CSV Files

The AI automatically detects column structures, so most credit card CSV formats work. Common columns recognized:

- Date, Description, Amount
- Transaction Date, Merchant, Debit/Credit
- And many other variations

### PDF Statements

PDF credit card statements are parsed server-side. Works best with text-based PDFs (not scanned images).

### Tested Credit Card Providers

- **India**: HDFC, ICICI, SBI, Axis, Kotak
- **USA**: Chase, Bank of America, Wells Fargo, Citi
- **UK**: Barclays, HSBC, Lloyds, NatWest
- **Others**: Most credit card providers with standard CSV/PDF export

## Privacy & Security

Your financial data is sensitive. Here's how Cancelit handles it:

| Aspect          | How We Handle It                                                     |
| --------------- | -------------------------------------------------------------------- |
| CSV Parsing     | Done entirely in your browser                                        |
| Data Sent to AI | Only transaction descriptions (no account numbers, no personal info) |
| Server Storage  | Nothing stored — ever                                                |
| Results Storage | Browser session only — cleared on refresh                            |
| PDF Processing  | Processed server-side but not saved                                  |

**TL;DR**: We don't store your data. Refresh the page and it's gone.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cancelit&env=GOOGLE_GENERATIVE_AI_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,INNGEST_EVENT_KEY,INNGEST_SIGNING_KEY)

### Manual Deployment

```bash
npm run build
vercel deploy --prod
```

### Post-Deployment Setup

1. Add all environment variables to your Vercel project settings
2. Register your app with Inngest:
   - Go to [Inngest Dashboard](https://app.inngest.com/)
   - Add your app URL: `https://your-domain.vercel.app/api/inngest`
3. Test the deployment by uploading a sample statement

### Local Development with Inngest

For local development, run the Inngest dev server alongside your Next.js app:

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest dev server
npx inngest-cli@latest dev
```

The Inngest dev server will auto-discover your functions at `http://localhost:3000/api/inngest`.

## Environment Variables

| Variable                      | Required | Description                          |
| ----------------------------- | -------- | ------------------------------------ |
| `GOOGLE_GENERATIVE_AI_API_KEY`| Yes      | Google Gemini API key                |
| `UPSTASH_REDIS_REST_URL`      | Yes      | Upstash Redis REST URL               |
| `UPSTASH_REDIS_REST_TOKEN`    | Yes      | Upstash Redis REST token             |
| `INNGEST_EVENT_KEY`           | Prod     | Inngest event key (production only)  |
| `INNGEST_SIGNING_KEY`         | Prod     | Inngest signing key (production only)|

### Getting API Keys

1. **Google Gemini**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Upstash Redis**: Create a free database at [Upstash Console](https://console.upstash.com/)
3. **Inngest**: Sign up at [Inngest](https://inngest.com/) and get keys from the dashboard

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please open an issue first to discuss significant changes.

## License

MIT

---

Built for people tired of forgotten subscriptions.
