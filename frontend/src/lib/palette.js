// Đọc 5 màu gốc từ src/index.css lúc chạy, cho những chỗ bắt buộc dùng màu dạng giá trị JS
// (biểu đồ recharts, hiệu ứng framer-motion, toast). Class Tailwind thì không cần file này.
const readChannels = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim().split(/\s+/).map(Number);

// color('primary') · color('neutral', { mix: 60 }) = 60% màu + 40% trắng · color('danger', { alpha: 0.2 })
export function color(name, { mix = 100, alpha = 1 } = {}) {
  const [r, g, b] = readChannels(name).map((c) => Math.round(c * (mix / 100) + 255 * (1 - mix / 100)));
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
