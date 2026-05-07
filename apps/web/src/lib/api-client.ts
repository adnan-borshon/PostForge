import axios from 'axios';
import { IProject, IMedia, IPlatformPost, IScheduledJob, IPlatformAccount, Platform, ApiResponse } from '@postforge/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('postforge_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('postforge_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (dto: any) => apiClient.post('/auth/login', dto),
  register: async (dto: any) => apiClient.post('/auth/register', dto),

  // Users
  getMe: async () => apiClient.get('/users/me'),

  // Projects
  getProjects: async (): Promise<ApiResponse<IProject[]>> => apiClient.get('/projects'),
  createProject: async (dto: any): Promise<ApiResponse<IProject>> => apiClient.post('/projects', dto),
  getProject: async (id: string): Promise<ApiResponse<IProject>> => apiClient.get(`/projects/${id}`),
  updateProject: async (id: string, dto: any): Promise<ApiResponse<IProject>> => apiClient.patch(`/projects/${id}`, dto),
  deleteProject: async (id: string): Promise<ApiResponse<void>> => apiClient.delete(`/projects/${id}`),

  // Media
  getUploadUrl: async (dto: any): Promise<ApiResponse<any>> => apiClient.post('/media/upload-url', dto),
  confirmUpload: async (mediaId: string): Promise<ApiResponse<IMedia>> => apiClient.post(`/media/${mediaId}/confirm`),
  getProjectMedia: async (projectId: string): Promise<ApiResponse<IMedia[]>> => apiClient.get(`/projects/${projectId}/media`),

  // Platform posts
  createPlatformPost: async (projectId: string, dto: any): Promise<ApiResponse<IPlatformPost>> => 
    apiClient.post(`/projects/${projectId}/posts`, dto),
  getProjectPosts: async (projectId: string): Promise<ApiResponse<IPlatformPost[]>> => 
    apiClient.get(`/projects/${projectId}/posts`),
  updatePlatformPost: async (id: string, dto: any): Promise<ApiResponse<IPlatformPost>> => 
    apiClient.patch(`/platform-posts/${id}`, dto),

  // Scheduling
  schedulePost: async (dto: any): Promise<ApiResponse<any>> => apiClient.post('/scheduling/schedule', dto),
  cancelSchedule: async (platformPostId: string): Promise<ApiResponse<any>> => 
    apiClient.delete(`/scheduling/${platformPostId}`),
  getScheduleStatus: async (platformPostId: string): Promise<ApiResponse<any>> => 
    apiClient.get(`/scheduling/status/${platformPostId}`),

  // Platforms
  getPlatformAccounts: async (): Promise<ApiResponse<IPlatformAccount[]>> => apiClient.get('/platforms/accounts'),
  disconnectAccount: async (id: string): Promise<ApiResponse<void>> => apiClient.delete(`/platforms/accounts/${id}`),
  connectYouTube: () => {
    window.location.href = `${API_URL}/platforms/auth/youtube`;
  }
};
