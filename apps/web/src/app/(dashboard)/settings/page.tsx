'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Youtube, Plus, Trash2, AlertCircle, CheckCircle2, Cloud } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { StatusBadge } from '@/components/ui/status-badge';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      setToast({ message: 'Account connected successfully!', type: 'success' });
    } else if (error) {
      setToast({ message: `Connection failed: ${error}`, type: 'error' });
    }

    if (success || error) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const { data: accountsRes, isLoading } = useQuery({
    queryKey: ['platform-accounts'],
    queryFn: () => api.getPlatformAccounts(),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => api.disconnectAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accounts'] });
      setToast({ message: 'Account disconnected.', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.message || 'Failed to disconnect.', type: 'error' });
    }
  });

  const accounts = accountsRes?.data || [];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and platform connections</p>
      </div>

      {toast && (
        <div className={cn(
          "p-4 rounded-lg border-0.5 flex items-center gap-3 animate-in slide-in-from-top-4",
          toast.type === 'success' 
            ? "bg-success-bg border-[#D4E2C5] text-success-text" 
            : "bg-failed-bg border-[#F7DADA] text-failed-text"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white border-0.5 border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Platform Connections</h2>
              <p className="text-xs text-muted-foreground mt-1">Connect your YouTube channels to start scheduling</p>
            </div>
            <button 
              onClick={() => api.connectYouTube()}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </button>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-12 space-y-4">
                <div className="h-12 bg-muted animate-pulse rounded" />
                <div className="h-12 bg-muted animate-pulse rounded" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF0000]/10 rounded-full flex items-center justify-center text-[#FF0000]">
                      <Youtube className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{account.accountName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">YouTube</span>
                        <div className={cn("w-1.5 h-1.5 rounded-full", account.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="text-[10px] text-muted-foreground">{account.isActive ? 'Connected' : 'Token Expired'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect this account?')) {
                        disconnectMutation.mutate(account.id);
                      }
                    }}
                    disabled={disconnectMutation.isPending}
                    className="p-2 hover:bg-failed-bg text-muted-foreground hover:text-failed-text rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border-0.5 border-border rounded-lg p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Storage Status</h2>
              <p className="text-xs text-muted-foreground">Your video assets are stored in ClipFlow Storage</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Spark Plan</p>
            <p className="text-[10px] text-muted-foreground uppercase opacity-80">Free tier</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
