import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toChatHtml } from './toChatHtml.js';

describe('toChatHtml', () => {
  it('đổi **đậm** và xuống dòng', () => {
    assert.equal(toChatHtml('Chào **bạn**\nhỏi đi'), 'Chào <strong>bạn</strong><br/>hỏi đi');
  });

  it('chấm đầu dòng thành &bull; kèm khoảng trắng', () => {
    assert.equal(toChatHtml('A\n• một\n• hai'), 'A<br/>&bull;&nbsp;một<br/>&bull;&nbsp;hai');
  });

  it('không đụng tới chữ thường', () => {
    assert.equal(toChatHtml('không có gì'), 'không có gì');
  });
});
