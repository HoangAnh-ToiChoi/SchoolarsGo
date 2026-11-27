import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApiMessages } from './buildApiMessages.js';

describe('buildApiMessages', () => {
  const welcome = { role: 'assistant', content: 'Xin chào' };

  it('bỏ lời chào theo tham chiếu, giữ tin bot khác cùng nội dung', () => {
    const messages = [welcome, { role: 'user', content: 'Hi', id: 1 }, { role: 'assistant', content: 'Xin chào' }];
    assert.deepEqual(buildApiMessages(messages, { skip: welcome, limit: 20 }), [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Xin chào' },
    ]);
  });

  it('chỉ lấy `limit` tin cuối', () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({ role: 'user', content: String(i) }));
    assert.deepEqual(buildApiMessages(messages, { skip: welcome, limit: 2 }).map((m) => m.content), ['3', '4']);
  });
});
