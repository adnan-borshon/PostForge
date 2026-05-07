# PostForge System Architecture & Fundamentals

Welcome to the PostForge project! This document outlines the architecture, data flows, fundamental concepts, and future roadmap of the system. It is designed to onboard new developers and provide a comprehensive overview of how the application operates.

## 1. System Overview

**PostForge** is a full-stack, scalable video publishing and scheduling platform. It allows users to upload video content, connect external platform accounts (e.g., YouTube), and schedule those videos to be published automatically at a specified date and time. 

The system relies on a deferred-execution model using background workers to handle heavy tasks like video fetching and uploading to third-party APIs without blocking the main web servers.

## 2. Monorepo Architecture

The project is structured as a monorepo (using npm workspaces / Turborepo) containing multiple distinct applications and shared packages.

### Apps (`/apps`)

*   **`web` (Next.js 14 Client)**: 
    *   The frontend dashboard.
    *   Uses React (Client Components), Tailwind CSS for styling, and React Query for server state management.
    *   Follows a "Linear/Notion-inspired" clean, dark-sidebar design system.
*   **`api` (NestJS REST API)**: 
    *   The main backend interface for the web app.
    *   Handles authentication, CRUD operations for projects, generating pre-signed upload URLs, initiating OAuth flows, and enqueuing background tasks.
*   **`worker` (NestJS Background Worker)**: 
    *   A headless application that consumes jobs from a Redis-backed queue (e.g., BullMQ).
    *   Responsible for the actual publishing mechanics: downloading video files from storage, refreshing OAuth tokens, and uploading to platforms like YouTube.

### Packages (`/packages`)

*   **`types`**: Shared TypeScript interfaces, types, and DTOs used across `web`, `api`, and `worker`.
*   **`platform-adapters`**: A modular library containing the business logic to interact with external APIs (currently YouTube). Implements a standard interface to easily add new platforms (TikTok, Instagram, etc.) in the future.

## 3. Core Technologies

*   **Frontend**: Next.js, React Query, Zustand (if needed), Tailwind CSS, React Hook Form + Zod, Axios.
*   **Backend**: NestJS, Prisma ORM, PostgreSQL.
*   **Queues**: Bull / BullMQ (Redis).
*   **Storage**: S3-compatible object storage (AWS S3, Cloudflare R2, MinIO).
*   **Authentication**: Custom JWT-based auth.
*   **Security**: AES-256-CBC encryption for storing OAuth integration tokens.

## 4. Key Workflows

### A. Video Upload Flow (Direct-to-S3)
To prevent the API from becoming a bottleneck during large file uploads, we use a pre-signed URL approach:
1.  **Client** requests an upload URL from the API (`/media/upload-url`), providing filename, size, and mimetype.
2.  **API** generates an S3 Pre-signed PUT URL and returns it to the client with a pending `mediaId`.
3.  **Client** uses `XMLHttpRequest` or `fetch` to PUT the file directly to the Storage Bucket, tracking progress natively.
4.  **Client** calls the API (`/media/:id/confirm`) once the PUT request succeeds.
5.  **API** marks the media as available in the database.

### B. OAuth Connection Flow (YouTube)
1.  User clicks "Connect YouTube" on the frontend, redirecting them to the API (`/platforms/auth/youtube`).
2.  **API** constructs a Google OAuth URL with offline access scopes and redirects the user to Google.
3.  User approves access, Google redirects back to the API's callback endpoint `/platforms/auth/youtube/callback` with a `code`.
4.  **API** exchanges the `code` for an `access_token` and `refresh_token`.
5.  **API** encrypts these tokens using the `CryptoService` (AES-256-CBC) and saves them in the `PlatformAccount` PostgreSQL table.

### C. Scheduling & Publishing Flow
1.  User configures a post (title, description, date) and submits.
2.  **API** saves a `PlatformPost` record with `status='READY'` or `SCHEDULED` and a `scheduledAt` timestamp.
3.  A cron job or a specialized queue scheduler picks up the pending post when `scheduledAt <= NOW()`.
4.  A job is pushed to the Redis queue (`platform-publish`).
5.  **Worker** picks up the job:
    *   Verifies the OAuth token's validity; dynamically refreshes it and updates the DB if expired.
    *   Downloads the video chunks from S3.
    *   Initializes the `PlatformAdapter` (YouTube).
    *   Uploads the video using the platform's API via chunked/resumable upload.
    *   Updates the `PlatformPost` status to `PUBLISHED` (or `FAILED` on error).

## 5. Security & Logic Fundamentals

*   **Token Encryption**: Because third-party OAuth access and refresh tokens grant control over user accounts, they are NEVER stored in plain text. `CryptoService` uses the `JWT_SECRET` (or a dedicated key) to encrypt and decrypt them symmetrically just-in-time when the Worker needs them.
*   **Stateless Frontend**: The Next.js app relies on `localStorage` to hold the JWT. Axios interceptors automatically attach this token to every outgoing request and redirect to `/login` upon receiving `401 Unauthorized`.
*   **Adapter Pattern**: Integrating new social platforms should never require changing the Worker's core logic. The Worker uses a `PlatformAdapterFactory` to get a generalized interface (`upload()`, `validateToken()`, `refreshToken()`) and executes it blindly.

## 6. Current Capabilities

*   [x] User Registration & JWT Authentication.
*   [x] Project & Media Creation Workflows.
*   [x] Direct-to-bucket video uploads with progress indicators.
*   [x] YouTube OAuth Integration (OAuth2 Offline Access).
*   [x] Token encryption and automatic proactive/reactive token refreshing.
*   [x] Scheduling posts.
*   [x] Next.js Dashboard UI (Upload Modal, Projects Grid, Schedule Timeline, Settings).

## 7. Future Work & Scaling Roadmap

For anyone picking up the project, here are the most impactful areas for immediate future development:

1.  **Multiple Media Per Project**: The DB supports it, but the UI currently restricts users to a single video per project.
2.  **More Platforms**: Implement adapters for TikTok, Instagram Reels, LinkedIn, and Twitter/X. Add OAuth endpoints for each.
3.  **Video Processing & Pipelines (FFmpeg)**: 
    *   Add a new worker queue for `video-processing`.
    *   Auto-generate thumbnails using FFmpeg.
    *   Compress/transcode videos to match strict platform requirements (e.g., resizing horizontal videos for Instagram Reels).
4.  **Webhooks & Notifications**: Notify the user (via email or in-app Push/Socket.io) when a post successfully goes live or fails.
5.  **Multi-Tenant / Workspaces**: Expand the data model to allow multiple users to manage the same set of platform accounts (Team collaboration).
6.  **Analytics & Insights**: Pull view/like data from the published YouTube videos back into PostForge using background cron jobs.
7.  **Resumable Uploads in Worker**: If uploading multi-gigabyte files to YouTube, ensure the worker utilizes Google's resumable upload sessions to recover from transient network drops without downloading the file from S3 again.
