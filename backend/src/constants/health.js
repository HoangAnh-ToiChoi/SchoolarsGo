// Hằng số của health check (health.service)

// Railway chờ /api/health tối đa 100 giây khi deploy; DB không trả lời trong 3 giây coi như hỏng
const HEALTH_DB_TIMEOUT_MS = 3000;

// Giữ kết quả kiểm DB trong 5 giây: gọi dồn /api/health không chạy thêm truy vấn
const HEALTH_CACHE_MS = 5000;

// Tắt server: chờ request đang chạy xong tối đa 10 giây rồi thoát hẳn
const SHUTDOWN_TIMEOUT_MS = 10_000;

export { HEALTH_DB_TIMEOUT_MS, HEALTH_CACHE_MS, SHUTDOWN_TIMEOUT_MS };
