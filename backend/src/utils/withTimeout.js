import AppError from '~/utils/AppError.js';

// Promise.race không hủy được việc đang chạy, chỉ giúp API trả lời sớm thay vì treo
async function withTimeout(promise, ms, code) {
  let timerId;
  const timeoutError = new AppError('Xử lý quá lâu', 504, code);
  const timeout = new Promise((_resolve, reject) => {
    timerId = setTimeout(reject, ms, timeoutError);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timerId);
  }
}

export default withTimeout;
