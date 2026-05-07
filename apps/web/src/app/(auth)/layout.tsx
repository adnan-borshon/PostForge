import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium tracking-tight">PostForge</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and schedule your video uploads</p>
        </div>
        {children}
      </div>
    </div>
  );
}
