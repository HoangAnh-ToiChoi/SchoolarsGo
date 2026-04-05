import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Merge Tailwind classes để tránh conflict
export const cn = (...inputs) => twMerge(clsx(inputs));

// Format date theo locale tiếng Việt
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '';
  return format(new Date(date), pattern, { locale: vi });
};

// Format relative time (VD: "3 ngày trước")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Truncate text
export const truncate = (str, length = 100) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

// Status badge color
export const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-primary-50 text-primary-700',
    under_review: 'bg-warning-50 text-warning-700',
    interview: 'bg-secondary-50 text-secondary-700',
    accepted: 'bg-success-50 text-success-700',
    rejected: 'bg-danger-50 text-danger-700',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// Status label tiếng Việt
export const getStatusLabel = (status) => {
  const labels = {
    draft: 'Nháp',
    submitted: 'Đã nộp',
    under_review: 'Đang xét duyệt',
    interview: 'Phỏng vấn',
    accepted: 'Được nhận',
    rejected: 'Từ chối',
    withdrawn: 'Đã rút',
  };
  return labels[status] || status;
};
