'use strict';
const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 10000,
  customFields: { item: ['media:content', 'media:thumbnail', 'enclosure'] },
});

const FEEDS = [
  {
    url: 'https://vnexpress.net/rss/giao-duc.rss',
    source: 'VnExpress',
    defaultCategory: 'Giáo dục',
  },
  {
    url: 'https://tuoitre.vn/rss/giao-duc.rss',
    source: 'Tuổi Trẻ',
    defaultCategory: 'Giáo dục',
  },
  {
    url: 'https://studyinternational.com/feed/',
    source: 'Study International',
    defaultCategory: 'Du học',
  },
  {
    url: 'https://monitor.icef.com/feed/',
    source: 'ICEF Monitor',
    defaultCategory: 'Giáo dục',
  },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 phút
let _cache = { data: null, ts: 0 };

const detectCategory = (title = '', desc = '') => {
  const text = (title + ' ' + desc).toLowerCase();
  if (/visa|thị thực|nhập cảnh|immigration/.test(text)) return 'Visa';
  if (/học bổng|scholarship|fellowship|grant/.test(text)) return 'Học bổng';
  if (/du học|study abroad|international student|overseas/.test(text)) return 'Du học';
  return 'Giáo dục';
};

const extractImage = (item) => {
  if (item['media:content']?.['$']?.url) return item['media:content']['$'].url;
  if (item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url;
  if (item.enclosure?.url) return item.enclosure.url;
  const match = (item.content || item.summary || '').match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
};

const fetchFeed = async (feed) => {
  try {
    const result = await parser.parseURL(feed.url);
    return (result.items || []).slice(0, 15).map((item) => ({
      id: Buffer.from(item.link || item.guid || item.title || '').toString('base64').slice(0, 20),
      title: (item.title || '').trim(),
      description: (item.contentSnippet || item.summary || '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
      link: item.link || item.guid || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      imageUrl: extractImage(item),
      source: feed.source,
      category: detectCategory(item.title, item.contentSnippet || item.summary || ''),
    }));
  } catch {
    return [];
  }
};

const getNews = async (limit = 20) => {
  if (_cache.data && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data.slice(0, limit);
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  all.sort((a, b) => b.pubDate - a.pubDate);

  _cache = { data: all, ts: Date.now() };
  return all.slice(0, limit);
};

module.exports = { getNews };
