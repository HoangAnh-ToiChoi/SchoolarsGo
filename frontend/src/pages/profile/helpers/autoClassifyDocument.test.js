import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { autoClassifyDocument } from './autoClassifyDocument.js';

describe('autoClassifyDocument', () => {
  it('PDF phân loại theo tên: cv/resume → cv, sop/statement → sop, còn lại cv', () => {
    assert.equal(autoClassifyDocument('My_Resume.pdf'), 'cv');
    assert.equal(autoClassifyDocument('Personal-Statement.PDF'), 'sop');
    assert.equal(autoClassifyDocument('tai-lieu.pdf'), 'cv');
  });

  it('doc/docx → cv, txt → sop, đuôi khác → other', () => {
    assert.equal(autoClassifyDocument('a.docx'), 'cv');
    assert.equal(autoClassifyDocument('a.doc'), 'cv');
    assert.equal(autoClassifyDocument('note.txt'), 'sop');
    assert.equal(autoClassifyDocument('photo.png'), 'other');
  });

  it('nhận cả đối tượng File; thiếu tên trả other', () => {
    assert.equal(autoClassifyDocument({ name: 'SOP.pdf' }), 'sop');
    assert.equal(autoClassifyDocument(undefined), 'other');
    assert.equal(autoClassifyDocument({}), 'other');
  });
});
