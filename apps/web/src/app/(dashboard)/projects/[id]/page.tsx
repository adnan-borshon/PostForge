'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Play, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  RefreshCcw,
  Youtube
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { IPlatformPost } from '@postforge/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState<string>('');

  const { data: projectRes, isLoading, refetch: refetchProject } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
    refetchInterval: 30000, // Update every 30s as requested
  });

  const { data: postsRes, refetch: refetchPosts } = useQuery({
    queryKey: ['projects', id, 'posts'],
    queryFn: () => api.getProjectPosts(id!),
    enabled: !!id,
    refetchInterval: 30000,
  });

  const cancelMutation = useMutation({
    mutationFn: (postId: string) => api.cancelSchedule(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      refetchProject();
      refetchPosts();
    },
  });

  const project = projectRes?.data;
  const posts = postsRes?.data || [];

  useEffect(() => {
    const timer = setInterval(() => {
      const scheduledPost = posts.find(p => p.status === 'READY');
      if (scheduledPost && scheduledPost.scheduledAt) {
        const date = new Date(scheduledPost.scheduledAt);
        if (date.getTime() > Date.now()) {
          setCountdown(formatDistanceToNow(date, { addSuffix: true }));
        } else {
          setCountdown('Publishing now...');
        }
      } else {
        setCountdown('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [posts]);

  if (isLoading) {
    return <div className="p-8 animate-pulse bg-muted rounded-lg h-96" />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Project not found</h2>
        <Link href="/projects" className="btn btn-ghost mt-4">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="btn btn-ghost p-2 h-9 w-9">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-medium">{project.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={project.status} />
            <span className="text-xs text-muted-foreground">• Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video Preview */}
          <div className="bg-white border-0.5 border-border rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video bg-black relative flex items-center justify-center group">
              {project.media?.[0]?.thumbnailUrl ? (
                <img 
                  src={project.media[0].thumbnailUrl} 
                  alt="" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Play className="w-12 h-12 text-white/20" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="btn btn-primary rounded-full w-14 h-14 p-0">
                   <Play className="w-6 h-6 fill-current" />
                 </button>
              </div>
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{project.media?.[0]?.fileName}</p>
                <p className="text-xs text-muted-foreground">{(project.media?.[0]?.fileSize || 0) / (1024 * 1024).toFixed(2)} MB • {project.media?.[0]?.mimeType}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </div>

          {/* Post Details */}
          <div className="bg-white border-0.5 border-border rounded-lg p-6 space-y-6">
            <h3 className="text-sm font-medium">Platform Posts</h3>
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No posts created for this project yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="p-4 border-0.5 border-border rounded-md flex items-center justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#FF0000]/10 rounded flex items-center justify-center text-[#FF0000]">
                        <Youtube className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{post.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-xs">{post.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div className="hidden md:block">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                        <StatusBadge status={post.status} />
                      </div>
                      {post.scheduledAt && post.status === 'READY' && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Scheduled for</p>
                          <p className="text-xs font-medium">{format(new Date(post.scheduledAt), 'MMM d, p')}</p>
                        </div>
                      )}
                      {post.status === 'PUBLISHED' && (
                        <CheckCircle2 className="w-5 h-5 text-success-text" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Actions */}
        <div className="space-y-6">
          <div className="bg-white border-0.5 border-border rounded-lg p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-medium">Publishing Status</h3>
            
            {posts.some(p => p.status === 'READY' || p.status === 'SCHEDULED') ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-processing-text bg-processing-bg/30 p-4 rounded-md border-0.5 border-[#CDE1F7]">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Scheduled to publish</p>
                    <p className="text-xs opacity-80">{countdown}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    const post = posts.find(p => p.status === 'READY' || p.status === 'SCHEDULED');
                    if (post && confirm('Cancel this scheduled post?')) {
                      cancelMutation.mutate(post.id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="btn btn-ghost w-full border-0.5 border-failed-text/20 text-failed-text hover:bg-failed-bg"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Schedule
                </button>
              </div>
            ) : posts.some(p => p.status === 'PUBLISHED') ? (
              <div className="flex items-center gap-3 text-success-text bg-success-bg/30 p-4 rounded-md border-0.5 border-[#D4E2C5]">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Post live on YouTube</p>
                  <p className="text-xs opacity-80">Completed successfully</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground bg-muted/30 p-4 rounded-md border-0.5 border-border italic">
                <Clock className="w-5 h-5" />
                <p className="text-sm">No active schedule</p>
              </div>
            )}

            <div className="pt-4 border-t border-border mt-4 flex flex-col gap-2">
              <button 
                onClick={() => refetchProject()}
                className="btn btn-ghost w-full text-xs"
              >
                <RefreshCcw className="w-3 h-3 mr-2" /> Refresh Status
              </button>
            </div>
          </div>

          <div className="bg-muted/50 border-0.5 border-border rounded-lg p-6">
            <p className="text-xs font-medium mb-3">Project Metadata</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Internal ID</p>
                <p className="text-xs font-mono break-all">{project.id}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Original File</p>
                <p className="text-xs truncate">{project.media?.[0]?.fileName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
