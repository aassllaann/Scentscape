import type { Metadata } from 'next';
import { AppProvider } from '@/lib/store';
import MoodCanvas from '@/components/MoodCanvas';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scentscape — 香水气味可视化',
  description: '将无形的嗅觉体验，转化为可见的视觉语言',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="h-full">
      <body className="h-full antialiased">
        <AppProvider>
          <MoodCanvas />
          <main className="relative z-10 h-full">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
