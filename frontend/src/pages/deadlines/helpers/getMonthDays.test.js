import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMonthDays } from './getMonthDays.js';

describe('getMonthDays', () => {
  it('lưới tháng bắt đầu thứ Hai, kết thúc Chủ nhật, đủ tuần', () => {
    const days = getMonthDays(new Date(2026, 10, 15)); // tháng 11/2026: ngày 1 là Chủ nhật
    assert.equal(days[0].getDay(), 1);
    assert.equal(days.at(-1).getDay(), 0);
    assert.equal(days.length % 7, 0);
  });

  it('gồm ngày tràn của tháng trước và tháng sau', () => {
    const days = getMonthDays(new Date(2026, 10, 15));
    assert.deepEqual([days[0].getMonth(), days[0].getDate()], [9, 26]);
    assert.deepEqual([days.at(-1).getMonth(), days.at(-1).getDate()], [11, 6]);
    assert.equal(days.length, 42);
  });

  it('các ngày liên tiếp, không trùng', () => {
    const days = getMonthDays(new Date(2026, 1, 1));
    const gaps = days.slice(1).map((d, i) => Math.round((d - days[i]) / 864e5));
    assert.ok(gaps.every((g) => g === 1));
  });
});
