'use strict';
const Parser = require('rss-parser');

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

class NewsService {
  #parser;
  #cache = { data: null, ts: 0 };

  constructor() {
    this.#parser = new Parser({
      timeout: 10000,
      customFields: { item: ['media:content', 'media:thumbnail', 'enclosure'] },
    });
  }

  #detectCategory(title = '', desc = '') {
    const text = (title + ' ' + desc).toLowerCase();
    if (/visa|thị thực|nhập cảnh|immigration/.test(text)) return 'Visa';
    if (/học bổng|scholarship|fellowship|grant/.test(text)) return 'Học bổng';
    if (/du học|study abroad|international student|overseas/.test(text)) return 'Du học';
    return 'Giáo dục';
  }

  #extractImage(item) {
    if (item['media:content']?.['$']?.url) return item['media:content']['$'].url;
    if (item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url;
    if (item.enclosure?.url) return item.enclosure.url;
    const match = (item.content || item.summary || '').match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : null;
  }

  async #fetchFeed(feed) {
    try {
      const result = await this.#parser.parseURL(feed.url);
      return (result.items || []).slice(0, 15).map((item) => ({
        id: Buffer.from(item.link || item.guid || item.title || '').toString('base64').slice(0, 20),
        title: (item.title || '').trim(),
        description: (item.contentSnippet || item.summary || '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
        link: item.link || item.guid || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        imageUrl: this.#extractImage(item),
        source: feed.source,
        category: this.#detectCategory(item.title, item.contentSnippet || item.summary || ''),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Lấy danh sách tin tức, có hỗ trợ lọc theo category.
   * Logic lọc category được chuyển từ Controller vào đây (SRP).
   *
   * @param {number} [limit=20]
   * @param {string|null} [category=null]
   * @returns {Promise<Array>}
   */
  getNews = async (limit = 20, category = null) => {
    let all;

    if (this.#cache.data && Date.now() - this.#cache.ts < CACHE_TTL) {
      all = this.#cache.data;
    } else {
      const results = await Promise.allSettled(FEEDS.map(f => this.#fetchFeed(f)));
      all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
      all.sort((a, b) => b.pubDate - a.pubDate);
      this.#cache = { data: all, ts: Date.now() };
    }

    if (category) {
      all = all.filter((n) => n.category === category);
    }

    return all.slice(0, limit);
  };
}

module.exports = NewsService;
