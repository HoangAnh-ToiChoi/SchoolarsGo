if (typeof window === 'undefined') {
  globalThis.window = { location: { origin: 'http://localhost' } };
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPrimaryLink } from './getPrimaryLink.js';

describe('getPrimaryLink', () => {
  it('prioritizes application_url as primary and shows source_url as secondary link', () => {
    const scholarship = {
      application_url: 'https://university.edu/apply',
      source_url: 'https://scholarship-board.com/post/123',
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, 'https://university.edu/apply');
    assert.equal(result.primary.label, 'Nộp hồ sơ ngay');
    assert.equal(result.primary.isExternal, true);
    assert.equal(result.label, 'Nộp hồ sơ ngay');
    assert.equal(result.href, 'https://university.edu/apply');
    assert.equal(result.isExternal, true);
    assert.equal(result.sourceUrl, 'https://scholarship-board.com/post/123');
    assert.equal(result.showSourceLink, true);
  });

  it('uses source_url as primary when application_url is missing, hiding secondary link', () => {
    const scholarship = {
      application_url: null,
      source_url: 'https://scholarship-board.com/post/123',
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, 'https://scholarship-board.com/post/123');
    assert.equal(result.primary.label, 'Xem bài đăng gốc');
    assert.equal(result.primary.isExternal, true);
    assert.equal(result.sourceUrl, 'https://scholarship-board.com/post/123');
    assert.equal(result.showSourceLink, false);
  });

  it('handles scholarship with only application_url', () => {
    const scholarship = {
      application_url: 'https://university.edu/apply',
      source_url: null,
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, 'https://university.edu/apply');
    assert.equal(result.primary.label, 'Nộp hồ sơ ngay');
    assert.equal(result.primary.isExternal, true);
    assert.equal(result.sourceUrl, null);
    assert.equal(result.showSourceLink, false);
  });

  it('falls back to "Tạo đơn ứng tuyển" when neither URL is present', () => {
    const scholarship = {
      application_url: null,
      source_url: null,
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, null);
    assert.equal(result.primary.label, 'Tạo đơn ứng tuyển');
    assert.equal(result.primary.isExternal, false);
    assert.equal(result.label, 'Tạo đơn ứng tuyển');
    assert.equal(result.href, null);
    assert.equal(result.isExternal, false);
    assert.equal(result.sourceUrl, null);
    assert.equal(result.showSourceLink, false);
  });

  it('falls back to "Tạo đơn ứng tuyển" when both URLs are invalid or dangerous', () => {
    const scholarship = {
      application_url: 'javascript:alert(1)',
      source_url: 'data:text/html;base64,PHNjcmlwdD4=',
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, null);
    assert.equal(result.primary.label, 'Tạo đơn ứng tuyển');
    assert.equal(result.primary.isExternal, false);
    assert.equal(result.sourceUrl, null);
    assert.equal(result.showSourceLink, false);
  });

  it('handles empty strings and whitespace safely', () => {
    const scholarship = {
      application_url: '   ',
      source_url: '',
    };
    const result = getPrimaryLink(scholarship);

    assert.equal(result.primary.href, null);
    assert.equal(result.primary.label, 'Tạo đơn ứng tuyển');
    assert.equal(result.primary.isExternal, false);
    assert.equal(result.sourceUrl, null);
    assert.equal(result.showSourceLink, false);
  });

  it('handles null / undefined parameter gracefully without throwing', () => {
    const fromNull = getPrimaryLink(null);
    assert.equal(fromNull.primary.label, 'Tạo đơn ứng tuyển');
    assert.equal(fromNull.primary.href, null);
    assert.equal(fromNull.primary.isExternal, false);
    assert.equal(fromNull.sourceUrl, null);
    assert.equal(fromNull.showSourceLink, false);

    const fromUndefined = getPrimaryLink(undefined);
    assert.equal(fromUndefined.primary.label, 'Tạo đơn ứng tuyển');
    assert.equal(fromUndefined.primary.href, null);
    assert.equal(fromUndefined.primary.isExternal, false);
    assert.equal(fromUndefined.sourceUrl, null);
    assert.equal(fromUndefined.showSourceLink, false);
  });
});
