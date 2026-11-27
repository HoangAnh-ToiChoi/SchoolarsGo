export function getLoadErrorText(error) {
  if (error?.status === 404) return 'Học bổng đã quá hạn hoặc đã bị xóa.';
  return 'Không tải được học bổng.';
}
