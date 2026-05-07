'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { Play, MoreVertical, Trash2, Edit2, ExternalLink, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { UploadModal } from '@/components/upload/upload-modal';

export default function ProjectsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projectRes, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const projects = projectRes?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your video content library</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border-0.5 border-border rounded-lg h-64 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border-0.5 border-border border-dashed rounded-lg">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium">No projects yet</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-6">Upload a video to get started</p>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white border-0.5 border-border rounded-lg overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300">
              {/* Thumbnail Area */}
              <Link href={`/projects/${project.id}`} className="block relative aspect-video bg-muted overflow-hidden">
                {project.media?.[0]?.thumbnailUrl ? (
                  <img 
                    src={project.media[0].thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={project.status} />
                </div>
              </Link>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium truncate pr-4">{project.title}</h3>
                    <div className="dropdown relative group/menu">
                      <button className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border-0.5 border-border rounded-md shadow-lg py-1 z-10 hidden group-hover/menu:block">
                        <Link href={`/projects/${project.id}`} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                          <Edit2 className="w-3 h-3" /> Edit
                        </Link>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this project?')) {
                              deleteMutation.mutate(project.id);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-failed-bg text-failed-text transition-colors w-full text-left"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    {project.media?.[0]?.fileName || 'Draft'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </p>
                  <Link href={`/projects/${project.id}`} className="text-primary text-[10px] font-medium flex items-center gap-1 hover:underline">
                    View Details <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
