import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

// Giả lập SDK @google/genai: ghi lại khóa API và tham số gửi đi, trả chữ cố định
const calls = { apiKeys: [], params: [] };
mock.module('@google/genai', {
  namedExports: {
    ApiError: class ApiError extends Error {},
    GoogleGenAI: class {
      constructor({ apiKey }) {
        calls.apiKeys.push(apiKey);
        this.models = {
          async generateContent(params) {
            calls.params.push(params);
            // Giả lập SDK thật khi treo: chỉ kết thúc lúc abortSignal nổ, ném AbortError
            if (params.contents === 'treo') {
              await new Promise((_resolve, reject) => {
                const abort = () => reject(new DOMException('This operation was aborted', 'AbortError'));
                params.config.abortSignal.addEventListener('abort', abort);
              });
            }
            return { text: '{"ok":true}' };
          },
        };
      }
    },
  },
});

process.env.GEMINI_MODEL = 'gemini-test-model';
delete process.env.GEMINI_API_KEY;
const { getJsonModel } = await import('~/services/gemini.service.js');
const { resolveError } = await import('~/utils/resolveError.js');

test('không có GEMINI_API_KEY → null (CV báo AI_UNAVAILABLE, ingestion chạy luật thuần)', () => {
  assert.equal(getJsonModel(), null);
});

test('có khóa: gửi đúng model, prompt, cấu hình JSON; trả về giao diện cũ response.text()', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  const model = getJsonModel();
  const result = await model.generateContent('Trích JSON');
  assert.equal(result.response.text(), '{"ok":true}');
  assert.deepEqual(calls.params.at(-1), {
    model: 'gemini-test-model',
    contents: 'Trích JSON',
    config: { responseMimeType: 'application/json', temperature: 0 },
  });
  assert.deepEqual(calls.apiKeys, ['test-key']);
});

test('cấu hình riêng (CV) được truyền nguyên; client tạo một lần', async () => {
  const config = { responseMimeType: 'application/json', temperature: 0.1 };
  await getJsonModel(config).generateContent('x');
  assert.deepEqual(calls.params.at(-1).config, config);
  assert.equal(calls.apiKeys.length, 1);
});

test('có timeoutMs: gửi abortSignal để hủy hẳn request HTTP khi quá giờ; không có thì cấu hình giữ nguyên', async () => {
  await getJsonModel().generateContent('x', { timeoutMs: 5000 });
  const { abortSignal, ...rest } = calls.params.at(-1).config;
  assert.ok(abortSignal instanceof AbortSignal);
  assert.equal(abortSignal.aborted, false);
  assert.deepEqual(rest, { responseMimeType: 'application/json', temperature: 0 });
  await getJsonModel().generateContent('y');
  assert.equal('abortSignal' in calls.params.at(-1).config, false);
});

test('quá giờ → lỗi trả ra thành 504 AI_TIMEOUT, không phải 500', async () => {
  // AbortSignal.timeout không giữ event loop: giữ tiến trình test sống tới khi tín hiệu nổ
  const keepAlive = setTimeout(() => {}, 1000);
  const error = await getJsonModel().generateContent('treo', { timeoutMs: 20 }).catch((e) => e);
  clearTimeout(keepAlive);
  const resolved = resolveError(error);
  assert.equal(resolved.statusCode, 504);
  assert.equal(resolved.errorCode, 'AI_TIMEOUT');
});
