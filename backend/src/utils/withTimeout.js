import { AppError } from '~/constants/errors.js';

// Promise.race không hủy được việc đang chạy, chỉ giúp API trả lời sớm thay vì treo.
// errorDef là mã lỗi dựng sẵn trong constants/errors.js
async function withTimeout(promise, ms, errorDef) {
  let timerId;
  const timeoutError = new AppError(errorDef);
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
