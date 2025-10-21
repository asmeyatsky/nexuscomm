import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { ToastProvider } from '@/lib/toast-provider';

export const metadata: Metadata = {
  title: 'NexusComm - Unified Communication Hub',
  description: 'Single-pane-of-glass communication platform',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
