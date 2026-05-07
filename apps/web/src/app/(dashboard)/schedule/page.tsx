'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { Calendar as CalendarIcon, Clock, X, Youtube, ChevronRight } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { IProject } from '@postforge/types';

export default function SchedulePage() {
  const queryClient = useQueryClient();

  const { data: projectsRes, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const projects = projectsRes?.data || [];
  
  // Extract all posts with schedules
  const scheduledPosts = projects.flatMap(proj => 
    (proj.posts || []).map(post => ({
      ...post,
      projectTitle: proj.title,
      projectId: proj.id,
      thumbnail: proj.media?.[0]?.thumbnailUrl
    }))
  ).filter(p => !!p.scheduledAt)
   .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  // Group by date
  const groupedPosts: Record<string, typeof scheduledPosts> = {};
  scheduledPosts.forEach(post => {
    const dateKey = format(new Date(post.scheduledAt!), 'yyyy-MM-dd');
    if (!groupedPosts[dateKey]) groupedPosts[dateKey] = [];
    groupedPosts[dateKey].push(post);
  });

  const dates = Object.keys(groupedPosts).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-medium">Publishing Schedule</h1>
        <p className="text-sm text-muted-foreground">Monitor when your content goes live</p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-white border-0.5 border-border rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border-0.5 border-border border-dashed rounded-lg">
          <CalendarIcon className="w-8 h-8 text-muted-foreground mb-4" />
          <h3 className="text-sm font-medium">No scheduled posts</h3>
          <p className="text-xs text-muted-foreground mt-1">Visit your projects to set a publishing schedule</p>
        </div>
      ) : (
        <div className="space-y-12">
          {dates.map((dateKey) => {
            const date = parseISO(dateKey);
            const isToday = isSameDay(date, new Date());

            return (
              <div key={dateKey} className="space-y-4">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2">
                  <h3 className={cn(
                    "text-sm font-medium",
                    isToday ? "text-primary flex items-center gap-2" : "text-foreground"
                  )}>
                    {format(date, 'EEEE, MMMM do')}
                    {isToday && <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded uppercase">Today</span>}
                  </h3>
                </div>

                <div className="space-y-3">
                  {groupedPosts[dateKey].map((post) => (
                    <div key={post.id} className="group bg-white border-0.5 border-border rounded-lg p-4 flex items-center gap-6 shadow-sm hover:border-primary/50 transition-all duration-200">
                      <div className="flex items-center gap-3 w-32 shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{format(new Date(post.scheduledAt!), 'p')}</span>
                      </div>

                      <div className="flex-1 flex items-center gap-4 min-w-0">
                        <div className="w-12 h-8 bg-muted rounded overflow-hidden shrink-0">
                          {post.thumbnail && <img src={post.thumbnail} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{post.title}</p>
                          <Link href={`/projects/${post.projectId}`} className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                            {post.projectTitle} <ChevronRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-48 shrink-0 justify-end">
                        <div className="flex items-center gap-1.5 text-[#FF0000] bg-[#FF0000]/5 px-2 py-1 rounded border border-[#FF0000]/10">
                          <Youtube className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium font-mono">YOUTUBE</span>
                        </div>
                        <StatusBadge status={post.status} />
                        {post.status === 'READY' && (
                          <button 
                            onClick={() => {
                              if (confirm('Cancel this schedule?')) cancelMutation.mutate(post.id);
                            }}
                            className="p-1 hover:bg-failed-bg text-muted-foreground hover:text-failed-text rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple helper for CN if not imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
