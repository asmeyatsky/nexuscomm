import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-hidden bg-white dark:bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}
