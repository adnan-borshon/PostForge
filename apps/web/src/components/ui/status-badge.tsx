'use client';

import { cn } from '@/lib/utils';
import { PostStatus, MediaStatus, ProjectStatus } from '@postforge/types';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let styles = "draft";
  
  const statusLower = status.toLowerCase();

  if (['ready', 'published', 'completed'].includes(statusLower)) {
    styles = "bg-success-bg text-success-text border-[#D4E2C5]";
  } else if (['processing', 'publishing', 'scheduled'].includes(statusLower)) {
    styles = "bg-processing-bg text-processing-text border-[#CDE1F7]";
  } else if (['pending', 'draft'].includes(statusLower)) {
    styles = "bg-draft-bg text-draft-text border-[#E2E0D7]";
  } else if (['failed', 'error', 'cancelled'].includes(statusLower)) {
    styles = "bg-failed-bg text-failed-text border-[#F7DADA]";
  }

  return (
    <span className={cn(
      "badge uppercase text-[10px] tracking-wider",
      styles,
      className
    )}>
      {status}
    </span>
  );
}
