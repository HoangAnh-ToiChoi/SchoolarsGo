// Tin gửi server: bỏ lời chào dựng sẵn ở FE (skip), chỉ giữ role + content, lấy `limit` tin cuối
export function buildApiMessages(messages, { skip, limit }) {
  const sent = messages.filter((m) => m !== skip);
  const plain = sent.map((m) => ({ role: m.role, content: m.content }));
  return plain.slice(-limit);
}
