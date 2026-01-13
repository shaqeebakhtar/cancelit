// File: ./src/app/layout.tsx
import type { Metadata } from 'next';
import { Bebas_Neue, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cancelit — Find Your Hidden Subscriptions',
  description:
    'Upload your bank statement and discover forgotten subscriptions draining your wallet. Free, private, and secure — your data never leaves your device.',
  keywords: [
    'subscription tracker',
    'cancel subscriptions',
    'bank statement analyzer',
    'money leaks',
    'subscription finder',
  ],
  authors: [{ name: 'Cancelit' }],
  openGraph: {
    title: 'Cancelit — Find Your Hidden Subscriptions',
    description:
      'Upload your bank statement and discover forgotten subscriptions draining your wallet.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
