// Dấu hiệu secret là chuỗi mẫu công khai (từng nằm trong .env.example, script test, tài liệu trên GitHub).
// Ai đọc được chuỗi mẫu là ký được token giả nếu production lỡ dùng nó.
const JWT_SAMPLE_SECRET_PATTERN = /at-least-32|change-?me|your[-_]|replace[-_]with|example|placeholder|secret-key|test-(access|refresh)/i;
// Chuỗi ngẫu nhiên 32+ ký tự hầu như luôn có ≥ 10 ký tự khác nhau; "aaaa…", "abab…" thì không
const JWT_MIN_DISTINCT_CHARS = 10;

export { JWT_SAMPLE_SECRET_PATTERN, JWT_MIN_DISTINCT_CHARS };
