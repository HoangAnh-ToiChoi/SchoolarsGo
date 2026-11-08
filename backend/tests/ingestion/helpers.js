'use strict';

const NOW = new Date('2026-11-08T00:00:00Z');

/** Tạo RawPost mẫu, ghi đè các trường cần thử. */
function rawPost(overrides = {}) {
  return {
    sourceName: 'testSource',
    priority: 1,
    externalId: '1',
    title: 'Example University Scholarships for International Students',
    link: 'https://example.org/example-university-scholarships/',
    publishedAt: new Date('2026-10-20T00:00:00Z'),
    excerpt: 'Short excerpt.',
    contentText: 'Deadline: 15 January 2027\nStudy in: Germany\nMaster degree.',
    categories: [],
    signals: [],
    ...overrides,
  };
}

module.exports = { NOW, rawPost };
