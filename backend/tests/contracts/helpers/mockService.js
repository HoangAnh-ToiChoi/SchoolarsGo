import { mock } from 'node:test';

/**
 * Giả lập module (service hoặc model xuất sẵn bản dùng chung) để nơi dùng nó nhận bản giả.
 * Phải gọi TRƯỚC khi import module dùng nó (dùng `await import(...)`).
 * Trả về { current }: gán `current` = object có cùng tên hàm với service thật cho từng test.
 */
const mockService = (serviceUrl) => {
  const ref = { current: null };
  mock.module(serviceUrl, {
    defaultExport: new Proxy({}, { get: (_, name) => (...args) => ref.current[name](...args) }),
  });
  return ref;
};

/** Giống mockService nhưng cho service xuất các hàm rời (vd. chat.service). */
const mockServiceFunctions = (serviceUrl, names) => {
  const ref = { current: null };
  mock.module(serviceUrl, {
    namedExports: Object.fromEntries(names.map((name) => [name, (...args) => ref.current[name](...args)])),
  });
  return ref;
};

/** Giả lập configs/supabase.js: model gọi getSupabase() sẽ nhận `ref.current` (Supabase giả). */
const mockSupabase = () => {
  const ref = { current: null };
  mock.module(new URL('../../../src/configs/supabase.js', import.meta.url).href, {
    defaultExport: () => ref.current,
  });
  return ref;
};

/** Đường dẫn file trong src/ dưới dạng URL, dùng cho mock.module. */
const srcUrl = (path) => new URL(`../../../src/${path}`, import.meta.url).href;

export { mockService, mockServiceFunctions, mockSupabase, srcUrl };
