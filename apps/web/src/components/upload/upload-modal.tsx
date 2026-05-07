'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Check, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const youtubeSchema = z.object({
  ytTitle: z.string().min(1, 'YouTube title is required'),
  ytDescription: z.string().optional(),
  tags: z.string().optional(),
  accountId: z.string().min(1, 'Platform account is required'),
});

const scheduleSchema = z.object({
  scheduledAt: z.string().min(1, 'Schedule date is required'),
});

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form states
  const projectForm = useForm({ resolver: zodResolver(projectSchema) });
  const youtubeForm = useForm({ resolver: zodResolver(youtubeSchema) });
  const scheduleForm = useForm({ resolver: zodResolver(scheduleSchema) });

  const fetchAccounts = async () => {
    try {
      const res = await api.getPlatformAccounts();
      setAccounts(res.data);
      if (res.data.length > 0) {
        youtubeForm.setValue('accountId', res.data[0].id);
      }
    } catch (e) {}
  };

  const handleCreateProject = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.createProject(data);
      setProjectId(res.data.id);
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !projectId) return;
    setIsLoading(true);
    setUploadError(null);
    try {
      // 1. Get Presigned URL
      const res = await api.getUploadUrl({
        projectId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      const { uploadUrl, mediaId: mId } = res.data;
      setMediaId(mId);

      // 2. Upload to S3
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      // 3. Confirm
      await api.confirmUpload(mId);
      
      setStep(3);
      fetchAccounts();
      youtubeForm.setValue('ytTitle', projectForm.getValues('title'));
    } catch (e) {
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformDetails = async (data: any) => {
    setStep(4);
  };

  const handleSchedule = async (data: any) => {
    if (!projectId || !mediaId) return;
    setIsLoading(true);
    try {
      // 1. Create Platform Post
      const postRes = await api.createPlatformPost(projectId, {
        title: youtubeForm.getValues('ytTitle'),
        description: youtubeForm.getValues('ytDescription'),
        tags: youtubeForm.getValues('tags')?.split(',').map(t => t.trim()).filter(Boolean) || [],
        platformAccountId: youtubeForm.getValues('accountId'),
      });

      // 2. Schedule it
      await api.schedulePost({
        platformPostId: postRes.data.id,
        scheduledAt: data.scheduledAt,
      });

      setStep(5);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Scheduling failed. Possibly media is still processing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">New Video Project</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Step {step} of 4
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Title</label>
                  <input
                    {...projectForm.register('title')}
                    type="text"
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none"
                    placeholder="My Awesome Video"
                  />
                  {projectForm.formState.errors.title?.message && (
                    <p className="text-xs text-failed-text mt-1">{String(projectForm.formState.errors.title.message)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    {...projectForm.register('description')}
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none h-24 resize-none"
                    placeholder="What is this video about?"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={projectForm.handleSubmit(handleCreateProject)}
                  disabled={isLoading}
                  className="btn btn-primary min-w-[120px]"
                >
                  {isLoading ? 'Creating...' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                  isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50",
                  file && "bg-muted/50 border-primary"
                )}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-success-bg text-success-text rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium mb-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">Drag & drop your video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV up to 10GB</p>
                  </div>
                )}
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{uploadProgress < 100 ? 'Uploading...' : 'Upload Complete'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-failed-bg text-failed-text rounded-md text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="btn btn-ghost" disabled={isLoading}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isLoading}
                  className="btn btn-primary min-w-[120px]"
                >
                  {isLoading ? 'Processing...' : 'Upload & Continue'} <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">YouTube Account</label>
                  <select
                    {...youtubeForm.register('accountId')}
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none bg-white"
                  >
                    {accounts.length === 0 ? (
                      <option disabled>No accounts connected</option>
                    ) : (
                      accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                      ))
                    )}
                  </select>
                  {accounts.length === 0 && (
                    <button 
                      type="button"
                      onClick={() => api.connectYouTube()}
                      className="text-xs text-primary mt-2 hover:underline inline-flex items-center"
                    >
                      Connect YouTube Account
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">YouTube Title</label>
                  <input
                    {...youtubeForm.register('ytTitle')}
                    type="text"
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none"
                    placeholder="Catchy YouTube Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">YouTube Description</label>
                  <textarea
                    {...youtubeForm.register('ytDescription')}
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none h-24 resize-none"
                    placeholder="Video description, links, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (Comma separated)</label>
                  <input
                    {...youtubeForm.register('tags')}
                    type="text"
                    className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none"
                    placeholder="gaming, tutorial, v-log"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="btn btn-ghost">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  onClick={youtubeForm.handleSubmit(handlePlatformDetails)}
                  className="btn btn-primary min-w-[120px]"
                >
                  Save & Schedule <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg border-0.5 border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Schedule settings</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Publish Date & Time</label>
                    <input
                      {...scheduleForm.register('scheduledAt')}
                      type="datetime-local"
                      min={format(new Date(Date.now() + 10 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")}
                      className="w-full px-3 py-2 border-0.5 border-border rounded-md shadow-sm focus:ring-1 focus:ring-ring outline-none bg-white"
                    />
                  </div>
                  
                  <div className="p-4 bg-white rounded-md border-0.5 border-border space-y-2">
                    <p className="text-xs font-medium">Wait, check this before confirming:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>Your video will be uploaded as Private first if scheduled</li>
                      <li>It will be public exactly on the set time</li>
                      <li>Current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(3)} className="btn btn-ghost" disabled={isLoading}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  onClick={scheduleForm.handleSubmit(handleSchedule)}
                  disabled={isLoading}
                  className="btn btn-primary min-w-[120px]"
                >
                  {isLoading ? 'Scheduling...' : 'Confirm Schedule'} <Check className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="py-12 text-center space-y-6 animate-in zoom-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-success-bg text-success-text rounded-full flex items-center justify-center mx-auto scale-110">
                <Check className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-medium">Post scheduled successfully!</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                  Your video is being processed and will be published to YouTube on your selected date.
                </p>
              </div>
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="btn btn-primary px-10"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
