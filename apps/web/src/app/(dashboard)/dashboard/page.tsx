'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { UploadModal } from '@/components/upload/upload-modal';
import { Plus, Video, Calendar, CheckCircle, ExternalLink, Play } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { IProject } from '@postforge/types';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(searchParams.get('openUpload') === 'true');

  const { data: projectRes, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  useEffect(() => {
    if (searchParams.get('openUpload') === 'true') {
      setIsUploadModalOpen(true);
      // Clear the param
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('openUpload');
      router.replace(`/dashboard?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  const projects = projectRes?.data || [];

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: Video },
    { 
      label: 'Scheduled', 
      value: projects.filter(p => p.status === 'SCHEDULED' || p.status === 'READY').length, 
      icon: Calendar 
    },
    { 
      label: 'Published', 
      value: projects.filter(p => p.status === 'PUBLISHED').length, 
      icon: CheckCircle 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back to PostForge</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border-0.5 border-border rounded-lg p-6 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-medium mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Recent Projects</h3>
        
        <div className="bg-white border-0.5 border-border rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-sm">No projects found. Start by creating one!</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="btn btn-ghost mt-4 text-xs"
              >
                Upload your first video
              </button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-10 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                          {project.media?.[0]?.thumbnailUrl ? (
                            <img src={project.media[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Play className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{project.media?.[0]?.fileName || 'No media'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="btn btn-ghost p-1 h-8 w-8 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
