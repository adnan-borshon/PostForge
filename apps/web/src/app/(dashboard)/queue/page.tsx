'use client';

import { Clock } from 'lucide-react';

export default function QueuePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <div className="p-4 bg-muted rounded-full">
        <Clock className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-medium">Publishing Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time worker status and active publishing jobs will appear here.</p>
      </div>
    </div>
  );
}
