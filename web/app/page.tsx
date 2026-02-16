'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { MessageSquare, Mail, Smartphone, Send, Zap, Users, ArrowRight } from 'lucide-react';

const CHANNELS = [
  { name: 'WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  { name: 'Email', icon: Mail, color: 'text-amber-500' },
  { name: 'SMS', icon: Smartphone, color: 'text-blue-500' },
  { name: 'Telegram', icon: Send, color: 'text-cyan-500' },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Unified Inbox',
    description: 'All your messaging channels in a single, organized view. No more switching between apps.',
  },
  {
    icon: Zap,
    title: 'Real-Time Messaging',
    description: 'Instant message delivery with live typing indicators and read receipts across all channels.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign conversations, leave internal notes, and collaborate seamlessly with your team.',
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap size={14} />
          Omnichannel communication, simplified
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
          Every conversation.
          <br />
          <span className="text-primary">One inbox.</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          NexusComm brings WhatsApp, SMS, email, Instagram, LinkedIn, Telegram, and Slack
          into a single unified inbox. Stop switching between apps and start having
          better conversations.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get started
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-accent transition-colors"
          >
            Create account
          </Link>
        </div>

        {/* Channel badges */}
        <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
          {CHANNELS.map(({ name, icon: Icon, color }) => (
            <div
              key={name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm"
            >
              <Icon size={16} className={color} />
              <span className="text-foreground font-medium">{name}</span>
            </div>
          ))}
          <span className="text-sm text-muted-foreground">+ 3 more</span>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        NexusComm &mdash; Unified Communication Hub
      </footer>
    </div>
  );
}
