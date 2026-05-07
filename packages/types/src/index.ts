/**
 * Project: PostForge
 * Shared types, enums and interfaces
 */

// Enums matching Prisma schema
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum MediaStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum Platform {
  YOUTUBE = 'YOUTUBE',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Interfaces
export interface IUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedia {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  storageBucket: string;
  duration: number | null;
  thumbnailKey: string | null;
  status: MediaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformAccount {
  id: string;
  userId: string;
  platform: Platform;
  accountName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlatformPost {
  id: string;
  projectId: string;
  platformAccountId: string;
  platform: Platform;
  status: PostStatus;
  title: string;
  description: string | null;
  tags: string[];
  scheduledAt: Date | null;
  publishedAt: Date | null;
  platformVideoId: string | null;
  platformUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledJob {
  id: string;
  platformPostId: string;
  jobId: string;
  queueName: string;
  scheduledAt: Date;
  status: JobStatus;
  attempts: number;
  lastAttemptAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateProjectDto {
  title: string;
  description?: string;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface CreatePlatformPostDto {
  projectId: string;
  platformAccountId: string;
  title: string;
  description?: string;
  tags?: string[];
  scheduledAt?: Date;
}

export interface SchedulePostDto {
  platformPostId: string;
  scheduledAt: Date;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    count?: number;
  };
}
