// Đặc tả ghi học bổng kéo về trên DB thật: admin đã sửa / ẩn thì cron không đụng tới (R08), kỳ năm sau làm mới dòng cũ (R09).
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { closeDb, createScholarship, registerAdmin, sql, startServer, stopServer } from './helpers/app.js';
import * as database from '~/configs/database.config.js';
import { createStore, saveRows } from '~/ingestion/save.js';

const store = createStore(database);
const NOW = new Date();
const NEXT_YEAR = new Date(Date.now() + 120 * 864e5);
let admin;

before(async () => {
  await startServer();
  admin = await registerAdmin('ingestAdmin');
});

after(async () => {
  await stopServer();
  await database.pool.end();
  await closeDb();
});

function unique(tag) {
  return `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Dòng học bổng như module kéo dữ liệu tạo ra (toRow)
function pulledRow(overrides) {
  return {
    title: unique('Pulled Scholarship'),
    provider: 'Pulled Org',
    country: 'Japan',
    degree: 'Master',
    deadline: NEXT_YEAR,
    summary: 'Tóm tắt từ bài đăng',
    source: 'testSource',
    source_priority: 1,
    published_at: NOW,
    relevance_score: 50,
    is_active: true,
    is_featured: false,
    ...overrides,
  };
}

describe('Kéo học bổng không ghi đè admin (R08)', () => {
  it('học bổng admin đã ẩn không bật lại khi bài gốc còn hạn', async () => {
    const url = `https://pulled.test/${unique('hidden')}/`;
    const s = await createScholarship({ source_url: url, dedup_key: unique('k'), deadline: NEXT_YEAR });
    const del = await admin.client.request('DELETE', `/api/admin/scholarships/${s.id}`);
    assert.equal(del.status, 200, JSON.stringify(del.json));

    const stats = await saveRows(store, [pulledRow({ source_url: url })], { now: NOW });
    const [row] = await sql('SELECT is_active, admin_locked_at FROM scholarships WHERE id = $1', [s.id]);
    assert.equal(row.is_active, false, 'cron bật lại học bổng admin đã ẩn');
    assert.ok(row.admin_locked_at);
    assert.equal(stats.skipped, 1);
  });

  it('học bổng admin đã sửa không bị bài gốc ghi đè hạn nộp và tóm tắt', async () => {
    const url = `https://pulled.test/${unique('edited')}/`;
    const s = await createScholarship({ source_url: url, dedup_key: unique('k'), summary: 'Tóm tắt đã duyệt' });
    const adminDeadline = new Date(Date.now() + 90 * 864e5).toISOString();
    const edit = await admin.client.request('PATCH', `/api/admin/scholarships/${s.id}`, { body: { deadline: adminDeadline } });
    assert.equal(edit.status, 200, JSON.stringify(edit.json));

    await saveRows(store, [pulledRow({ source_url: url, summary: 'Bài gốc', deadline: new Date(Date.now() + 5 * 864e5) })], { now: NOW });
    const [row] = await sql('SELECT summary, deadline FROM scholarships WHERE id = $1', [s.id]);
    assert.equal(row.summary, 'Tóm tắt đã duyệt');
    assert.ok(row.deadline > new Date(Date.now() + 60 * 864e5), 'hạn nộp admin sửa bị cron ghi đè');
  });

  it('admin PATCH không có trường hợp lệ nào → 400, không phải 500', async () => {
    const s = await createScholarship({});
    const res = await admin.client.request('PATCH', `/api/admin/scholarships/${s.id}`, { body: { summary: 'không có trong schema' } });
    assert.equal(res.status, 400, JSON.stringify(res.json));
  });

  it('học bổng admin chưa đụng tới vẫn được làm mới theo bài gốc', async () => {
    const url = `https://pulled.test/${unique('fresh')}/`;
    const s = await createScholarship({ source_url: url, dedup_key: unique('k'), summary: 'cũ' });
    const stats = await saveRows(store, [pulledRow({ source_url: url, summary: 'mới' })], { now: NOW });
    const [row] = await sql('SELECT summary FROM scholarships WHERE id = $1', [s.id]);
    assert.equal(row.summary, 'mới');
    assert.equal(stats.updated, 1);
  });
});

describe('Khoá chống trùng (R09)', () => {
  it('kỳ năm sau (link mới, cùng khoá) làm mới dòng cũ đã quá hạn', async () => {
    const key = unique('cycle');
    const old = await createScholarship({ source_url: `https://pulled.test/${key}-2026/`, dedup_key: key, deadline: new Date(Date.now() - 30 * 864e5), is_active: false });
    const newUrl = `https://pulled.test/${key}-2027/`;
    const title = unique('Cycle Scholarship 2027');

    const stats = await saveRows(store, [pulledRow({ source_url: newUrl, dedup_key: key, title })], { now: NOW });
    const [row] = await sql('SELECT source_url, title, is_active, deadline FROM scholarships WHERE id = $1', [old.id]);
    assert.equal(stats.updated, 1, JSON.stringify(stats));
    assert.equal(row.source_url, newUrl);
    assert.equal(row.title, title);
    assert.equal(row.is_active, true);
    const copies = await sql('SELECT id FROM scholarships WHERE dedup_key = $1', [key]);
    assert.equal(copies.length, 1);
  });

  it('kỳ mới có tiêu đề trùng học bổng khác thì giữ tiêu đề cũ, không làm lỗi cả lô', async () => {
    const taken = await createScholarship({ title: unique('Taken Title') });
    const key = unique('clash');
    const old = await createScholarship({ source_url: `https://pulled.test/${key}-old/`, dedup_key: key, deadline: new Date(Date.now() - 30 * 864e5) });
    await saveRows(store, [pulledRow({ source_url: `https://pulled.test/${key}-new/`, dedup_key: key, title: taken.title })], { now: NOW });
    const [row] = await sql('SELECT title, source_url FROM scholarships WHERE id = $1', [old.id]);
    assert.equal(row.title, old.title);
    assert.equal(row.source_url, `https://pulled.test/${key}-new/`);
  });

  it('hai kỳ mới cùng tiêu đề trong một lô không làm lỗi cả lượt kéo', async () => {
    const past = new Date(Date.now() - 30 * 864e5);
    const k1 = unique('dupA');
    const k2 = unique('dupB');
    const a = await createScholarship({ source_url: `https://pulled.test/${k1}-old/`, dedup_key: k1, deadline: past });
    const b = await createScholarship({ source_url: `https://pulled.test/${k2}-old/`, dedup_key: k2, deadline: past });
    const title = unique('Shared New Title');
    const rows = [
      pulledRow({ source_url: `https://pulled.test/${k1}-new/`, dedup_key: k1, title }),
      pulledRow({ source_url: `https://pulled.test/${k2}-new/`, dedup_key: k2, title }),
    ];
    const stats = await saveRows(store, rows, { now: NOW });
    assert.equal(stats.updated, 2, JSON.stringify(stats));
    const titles = await sql('SELECT id, title FROM scholarships WHERE id = ANY($1)', [[a.id, b.id]]);
    const byId = Object.fromEntries(titles.map((r) => [r.id, r.title]));
    assert.equal(byId[a.id], title);
    assert.equal(byId[b.id], b.title);
  });

  it('nhiều bài khoá null cùng được thêm (không dồn vào một khoá rỗng)', async () => {
    const rows = [pulledRow({ source_url: `https://pulled.test/${unique('n1')}/`, dedup_key: null }), pulledRow({ source_url: `https://pulled.test/${unique('n2')}/`, dedup_key: null })];
    const stats = await saveRows(store, rows, { now: NOW });
    assert.equal(stats.inserted, 2, JSON.stringify(stats));
  });
});

describe('Migration 014: khóa học bổng admin đã ẩn từ trước', () => {
  it('dòng ẩn trước hạn (dù nay đã quá hạn) bị khóa; dòng cron tắt sau hạn thì không', async () => {
    const past = new Date(Date.now() - 30 * 864e5);
    // updated_at đặt lúc INSERT: trigger của bảng ghi đè updated_at ở mọi UPDATE
    const hiddenAt = new Date(past.getTime() - 5 * 864e5);
    const expiredAt = new Date(past.getTime() + 864e5);
    const hidden = await createScholarship({ dedup_key: unique('hid'), deadline: past, is_active: false, updated_at: hiddenAt });
    const expired = await createScholarship({ dedup_key: unique('exp'), deadline: past, is_active: false, updated_at: expiredAt });

    const migration = await readFile(new URL('../../scripts/migrations/014_adminLock.sql', import.meta.url), 'utf8');
    await sql(migration);

    const rows = await sql('SELECT id, admin_locked_at FROM scholarships WHERE id = ANY($1)', [[hidden.id, expired.id]]);
    const locked = Object.fromEntries(rows.map((r) => [r.id, Boolean(r.admin_locked_at)]));
    assert.equal(locked[hidden.id], true, 'học bổng admin ẩn trước hạn không bị khóa');
    assert.equal(locked[expired.id], false, 'học bổng cron tắt sau hạn bị khóa, kỳ năm sau không làm mới được');
  });
});
