import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-[200px] overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
