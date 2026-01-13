# Cancelit

**Find your hidden subscriptions and stop money leaks.**

Cancelit is a privacy-first web app that analyzes your bank statement to discover forgotten subscriptions. Upload a CSV or PDF, see all your recurring payments categorized by type, and get step-by-step instructions to cancel them.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

## Features

- **AI-Powered Analysis** — Uses Google Gemini to intelligently detect subscription patterns
- **CSV & PDF Support** — Upload bank statements in either format
- **Privacy First** — Your data never leaves your device. Nothing is stored on servers.
- **Categorized Results** — Subscriptions grouped by type (Streaming, Music, Gaming, Fitness, etc.)
- **Spending Breakdown** — See total monthly and yearly costs at a glance
- **Cancel Instructions** — Step-by-step guides to cancel each subscription
- **Beautiful UI** — Clean, brutalist minimal design with responsive layout

## Tech Stack

| Category  | Technology                        |
| --------- | --------------------------------- |
| Framework | Next.js 16.1 (App Router)         |
| Language  | TypeScript 5                      |
| UI        | React 19, Tailwind CSS 4          |
| AI        | Google Gemini via AI SDK          |
| Parsing   | Papa Parse (CSV), pdf-parse (PDF) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/analyze/        # AI analysis API route
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
    ├── parsers/            # CSV and PDF parsers
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

1. Export your bank statement as a **CSV** or **PDF** file
2. Drop the file onto Cancelit (or click to browse)
3. Wait for AI analysis (usually 5-15 seconds)
4. Review your subscriptions organized by category
5. Follow the cancel instructions for any subscription you want to stop

## Supported File Formats

### CSV Files

The AI automatically detects column structures, so most bank CSV formats work. Common columns recognized:

- Date, Description, Amount
- Transaction Date, Merchant, Debit/Credit
- And many other variations

### PDF Statements

PDF bank statements are parsed server-side. Works best with text-based PDFs (not scanned images).

### Tested Banks

- **India**: HDFC, ICICI, SBI, Axis, Kotak
- **USA**: Chase, Bank of America, Wells Fargo, Citi
- **UK**: Barclays, HSBC, Lloyds, NatWest
- **Others**: Most banks with standard CSV/PDF export

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cancelit&env=GEMINI_API_KEY)

### Manual Deployment

```bash
npm run build
vercel deploy --prod
```

Remember to set `GEMINI_API_KEY` in your Vercel environment variables.

## Environment Variables

| Variable         | Required | Description                |
| ---------------- | -------- | -------------------------- |
| `GEMINI_API_KEY` | Yes      | Your Google Gemini API key |

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
