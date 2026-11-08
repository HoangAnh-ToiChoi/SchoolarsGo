'use strict';

const { WordPressClient } = require('./wordpressClient');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ghép cấu hình + mapper của một nguồn WordPress thành một Source (xem types.js).
 * Dùng kiểu ghép, không kế thừa: folder nguồn nào hỏng cũng không kéo theo folder khác.
 *
 * @param {{ config: object, mapper: (post: object, config: object) => import('../types').RawPost | null }} spec
 */
function createWordPressSource({ config, mapper }) {
  /** @returns {import('../types').Source} */
  function create({ fetchImpl, now = () => new Date(), delayMs } = {}) {
    const client = new WordPressClient({
      baseUrl: config.baseUrl,
      fetchImpl,
      delayMs: delayMs ?? config.delayMs,
    });

    return {
      name: config.name,
      priority: config.priority,
      async *fetchPosts({ limit = Infinity } = {}) {
        const after = new Date(now().getTime() - config.maxAgeDays * DAY_MS).toISOString().slice(0, 19);
        const seen = new Set();
        let count = 0;
        for (const query of config.queries) {
          for await (const post of client.posts({ maxPages: config.maxPages, ...query, after })) {
            if (seen.has(post.id)) continue;
            seen.add(post.id);
            const raw = mapper(post, config);
            if (!raw) continue;
            yield raw;
            if (++count >= limit) return;
          }
        }
      },
    };
  }

  return { config, create };
}

module.exports = { createWordPressSource };
