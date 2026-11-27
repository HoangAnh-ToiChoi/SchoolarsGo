// Lỗi tải chunk trang (deploy bản mới, chunk cũ 404): React.lazy giữ kết quả reject,
// render lại không giúp được gì, phải tải lại cả trang.
const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = String(error.message || '');
  return CHUNK_ERROR_PATTERNS.some(pattern => pattern.test(message));
}
