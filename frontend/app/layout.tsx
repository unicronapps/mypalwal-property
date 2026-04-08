import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HelpFAB from '@/components/ui/HelpFAB';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MyPalwal — Buy, Sell & Rent Properties in Palwal | Haryana Real Estate',
  description: 'Find verified property listings in Palwal, Haryana. Buy, sell, and rent flats, plots, houses and commercial spaces. Direct owner contact. MyPalwal.com',
  metadataBase: new URL('https://mypalwal.com'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'MyPalwal — Palwal\'s #1 Property Portal',
    description: 'Buy, sell, and rent properties in Palwal, Haryana. Verified listings, direct owner contact. Visit mypalwal.com',
    type: 'website',
    url: 'https://mypalwal.com',
    siteName: 'MyPalwal',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <HelpFAB />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
