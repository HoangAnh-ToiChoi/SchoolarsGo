// Nạp trước mọi test (node --import). Model/service xuất sẵn bản dùng chung nên chạy ngay lúc import:
// đặt biến môi trường giả để không cần .env hay DB thật. Giá trị thật (nếu có) được giữ nguyên.
process.env.SUPABASE_URL ||= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-chars-long';
