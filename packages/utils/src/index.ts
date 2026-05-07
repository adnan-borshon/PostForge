/**
 * Shared utility functions
 */

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const truncateString = (str: string, num: number) => {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
};
