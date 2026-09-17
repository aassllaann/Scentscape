import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Mono } from 'next/font/google';
import { AppProvider } from '@/lib/store';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scentscape — 香水气味可视化',
  description: '将无形的嗅觉体验，转化为可见的视觉语言',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${cormorant.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <AppProvider>
          <div className="noise-overlay" aria-hidden="true" />
          <main className="relative z-10 min-h-full">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
