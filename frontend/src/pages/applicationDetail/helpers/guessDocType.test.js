import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { guessDocType } from './guessDocType.js';

describe('guessDocType', () => {
  it('đoán loại tài liệu từ tên mục checklist, không phân biệt hoa thường', () => {
    assert.equal(guessDocType('CV'), 'cv');
    assert.equal(guessDocType('Curriculum Vitae'), 'cv');
    assert.equal(guessDocType('Statement of Purpose'), 'sop');
    assert.equal(guessDocType('Bảng điểm đại học'), 'transcript');
    assert.equal(guessDocType('2 thư giới thiệu'), 'recommendation_letter');
  });

  it('hiện trạng: "cv" phải đứng riêng mới nhận là CV (mẫu ^cv$ trong DOC_TYPE_PATTERNS)', () => {
    assert.equal(guessDocType('CV xin việc kèm ảnh'), 'other');
  });

  it('không khớp mẫu nào trả "other"', () => {
    assert.equal(guessDocType('Hộ chiếu'), 'other');
    assert.equal(guessDocType(''), 'other');
  });
});
