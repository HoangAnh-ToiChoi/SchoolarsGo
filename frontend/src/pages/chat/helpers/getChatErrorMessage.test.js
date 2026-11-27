import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getChatErrorMessage } from './getChatErrorMessage.js';

describe('getChatErrorMessage', () => {
  it('đọc err.status do apiClient gắn', () => {
    assert.match(getChatErrorMessage({ status: 429 }), /quá nhanh/);
    assert.match(getChatErrorMessage({ status: 503 }), /bảo trì/);
  });

  it('vẫn đọc được lỗi axios thô (err.response.status)', () => {
    assert.match(getChatErrorMessage({ response: { status: 401 } }), /hết hạn/);
  });

  it('mã khác hoặc mất mạng thì báo lỗi kết nối', () => {
    assert.equal(getChatErrorMessage({ status: 500 }), 'Mình gặp sự cố kết nối. Bạn thử lại nhé.');
    assert.equal(getChatErrorMessage(new Error('Network Error')), 'Mình gặp sự cố kết nối. Bạn thử lại nhé.');
  });
});
