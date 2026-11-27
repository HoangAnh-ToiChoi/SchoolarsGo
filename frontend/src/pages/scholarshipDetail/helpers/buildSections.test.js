import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSections } from './buildSections.js';

describe('buildSections', () => {
  it('học bổng chỉ có tóm tắt thì chỉ còn mục Tổng quan', () => {
    const sections = buildSections({ summary: '  Học bổng toàn phần  ' });
    assert.deepEqual(sections, [{ id: 'overview', title: 'Tổng quan', text: 'Học bổng toàn phần' }]);
  });

  it('điều kiện gộp danh sách chữ với GPA và IELTS tối thiểu', () => {
    const sections = buildSections({ eligibility: '- Công dân Việt Nam', min_gpa: '3', min_ielts: 6.5 });
    const eligibility = sections.find((s) => s.id === 'eligibility');
    assert.deepEqual(eligibility.items, ['Công dân Việt Nam', 'GPA tối thiểu 3.0/4.0', 'IELTS tối thiểu 6.5']);
  });

  it('mô tả được ưu tiên hơn tóm tắt; thứ tự mục cố định', () => {
    const sections = buildSections({ description: 'Mô tả', summary: 'Tóm tắt', benefits: 'a', requirements: 'b' });
    assert.equal(sections[0].text, 'Mô tả');
    assert.deepEqual(sections.map((s) => s.id), ['overview', 'benefits', 'documents']);
  });

  it('không có dữ liệu gì thì không có mục nào', () => {
    assert.deepEqual(buildSections({}), []);
  });
});
