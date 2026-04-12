import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Circle Rates Palwal 2024-25 | Collector Rate Palwal Haryana | MyPalwal',
  description:
    'Official circle rates (सर्किल रेट) for Palwal district, Haryana 2024-25. Check residential, commercial & agricultural collector rates for all areas in Palwal. Updated rates for stamp duty calculation.',
  keywords: [
    'circle rates palwal',
    'collector rate palwal',
    'सर्किल रेट पलवल',
    'palwal property registration rate',
    'stamp duty palwal haryana',
    'palwal plot rate 2024',
    'haryana circle rate 2024-25',
  ],
  openGraph: {
    title: 'Circle Rates Palwal 2024-25 — MyPalwal',
    description:
      'Check official collector circle rates for all areas in Palwal, Haryana. Residential, commercial and agricultural rates for 2024-25.',
    url: 'https://mypalwal.com/circle-rates/palwal',
    siteName: 'MyPalwal',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mypalwal.com/circle-rates/palwal',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
