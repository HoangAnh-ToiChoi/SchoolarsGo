'use strict';

const FIELDS = ['id', 'date_gmt', 'link', 'title', 'excerpt', 'content', 'categories', 'class_list'];
const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} khi gọi ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.retryable = status === 429 || status >= 500;
  }
}

/**
 * Client gọi REST API của WordPress (/wp-json/wp/v2/posts), dùng chung cho các nguồn là WordPress.
 * Lịch sự với máy chủ: nghỉ giữa các trang, tự thử lại khi bị 429/5xx.
 */
class WordPressClient {
  #baseUrl;
  #fetch;
  #delayMs;
  #userAgent;
  #timeoutMs;
  #retries;
  #sleep;

  constructor({
    baseUrl,
    fetchImpl = globalThis.fetch,
    delayMs = 600,
    userAgent = 'ScholarsGoBot/1.0 (+https://scholarsgo.app)',
    timeoutMs = 20000,
    retries = 3,
    sleepImpl = defaultSleep,
  }) {
    if (!baseUrl) throw new Error('WordPressClient cần baseUrl');
    this.#baseUrl = baseUrl.replace(/\/+$/, '');
    this.#fetch = fetchImpl;
    this.#delayMs = delayMs;
    this.#userAgent = userAgent;
    this.#timeoutMs = timeoutMs;
    this.#retries = retries;
    this.#sleep = sleepImpl;
  }

  /**
   * Lấy lần lượt các bài, mới nhất trước.
   * @param {{ categories?: number[], search?: string, perPage?: number, maxPages?: number, after?: string }} query
   */
  async *posts({ categories, search, perPage = 50, maxPages = 3, after } = {}) {
    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        per_page: String(perPage),
        page: String(page),
        orderby: 'date',
        order: 'desc',
        _fields: FIELDS.join(','),
      });
      if (categories?.length) params.set('categories', categories.join(','));
      if (search) params.set('search', search);
      if (after) params.set('after', after);

      const response = await this.#request(`${this.#baseUrl}/wp-json/wp/v2/posts?${params}`, page > 1);
      if (!response) return; // vượt quá số trang

      const posts = await response.json();
      for (const post of posts) yield post;

      const totalPages = Number(response.headers.get('x-wp-totalpages') || 1);
      if (page >= totalPages || posts.length < perPage) return;
      await this.#sleep(this.#delayMs);
    }
  }

  /** @returns {Promise<Response|null>} null khi WordPress báo hết trang (HTTP 400 ở trang > 1) */
  async #request(url, emptyOnBadRequest) {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.#fetch(url, {
          headers: { 'User-Agent': this.#userAgent, Accept: 'application/json' },
          signal: AbortSignal.timeout(this.#timeoutMs),
          redirect: 'follow',
        });
        if (response.status === 400 && emptyOnBadRequest) return null;
        if (!response.ok) throw new HttpError(response.status, url);
        return response;
      } catch (error) {
        const retryable = error.retryable ?? isNetworkError(error);
        if (!retryable || attempt >= this.#retries) throw error;
        await this.#sleep(backoffMs(attempt));
      }
    }
  }
}

function isNetworkError(error) {
  return error.name === 'TimeoutError' || error.name === 'AbortError' || error instanceof TypeError;
}

function backoffMs(attempt) {
  return 1000 * 2 ** attempt;
}

module.exports = { WordPressClient, HttpError };
