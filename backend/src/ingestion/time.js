// Thời gian dùng chung trong module kéo học bổng (lọc theo tuổi bài, chấm điểm, nghỉ giữa các lượt gọi mạng).

const DAY_MS = 24 * 60 * 60 * 1000;

/** Chờ thật; nơi gọi nhận `sleep` qua tham số để test thay bằng hàm không chờ. */
const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export { DAY_MS, defaultSleep };
