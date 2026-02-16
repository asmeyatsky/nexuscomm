import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { ToastProvider } from '@/lib/toast-provider';

export const metadata: Metadata = {
  title: 'NexusComm - Unified Communication Hub',
  description:
    'NexusComm is a unified communication platform that brings WhatsApp, SMS, email, Instagram, LinkedIn, Telegram, and Slack into a single inbox. Manage all your conversations in one place with real-time messaging, smart routing, and team collaboration.',
  keywords: [
    'unified inbox',
    'omnichannel messaging',
    'customer communication',
    'WhatsApp business',
    'SMS',
    'email',
    'team inbox',
    'multi-channel support',
    'real-time chat',
    'NexusComm',
  ],
  authors: [{ name: 'NexusComm Team' }],
  openGraph: {
    title: 'NexusComm - Unified Communication Hub',
    description:
      'Manage WhatsApp, SMS, email, Instagram, LinkedIn, Telegram, and Slack conversations in a single unified inbox.',
    type: 'website',
    siteName: 'NexusComm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexusComm - Unified Communication Hub',
    description:
      'All your messaging channels in one place. Real-time, unified, and collaborative.',
  },
  icons: {
    icon: '/icon.svg',
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
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
