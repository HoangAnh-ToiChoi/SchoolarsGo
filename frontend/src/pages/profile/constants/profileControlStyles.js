// Class Tailwind dùng chung cho các ô nhập liệu trong form hồ sơ
export const PROFILE_CONTROL_CLASS =
  'h-nav w-full min-w-0 rounded-control border border-line bg-surface px-3 text-sm text-fg outline-none ' +
  'transition-[border-color,box-shadow] duration-150 placeholder:text-fg-muted ' +
  'focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-ring/40 ' +
  'disabled:cursor-not-allowed disabled:bg-hover';

export const PROFILE_ERROR_CONTROL_CLASS =
  'border-urgent-line focus-visible:border-urgent-fg focus-visible:ring-urgent-fg/20';
