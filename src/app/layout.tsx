import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import Header from '@/components/Header';
import PollutionAlertBanner from '@/components/PollutionAlertBanner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Aura Optima',
    default: 'Aura Optima — Fund Clean Air for Almaty',
  },
  description:
    'Aura Optima is a civic and institutional micro-investment platform funding air purification towers across Almaty, Kazakhstan. Breathe tomorrow. Invest today.',
  keywords: ['Almaty', 'air quality', 'clean air', 'investment', 'Kazakhstan', 'green infrastructure'],
  openGraph: {
    title: 'Aura Optima — Fund Clean Air for Almaty',
    description: 'Join the movement funding air purification towers across Almaty, Kazakhstan.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌱</text></svg>" />
      </head>
      <body className={`${geistSans.variable} font-sans bg-[#0a0f1e] text-[#f0f4ff] antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PollutionAlertBanner />
          <Header />
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
