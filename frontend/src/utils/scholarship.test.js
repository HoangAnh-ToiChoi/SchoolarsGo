import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDeadlineLabel } from './scholarship.js';

describe('getDeadlineLabel', () => {
  const fixedToday = new Date('2026-11-21T00:00:00.000Z');

  it('handles null / undefined / empty deadline (Chưa công bố)', () => {
    const resultNull = getDeadlineLabel(null, fixedToday);
    assert.equal(resultNull.daysLeft, null);
    assert.equal(resultNull.tone, 'neutral');
    assert.equal(resultNull.short, 'Chưa công bố');
    assert.equal(resultNull.note, 'Theo dõi bài đăng gốc');
    assert.equal(resultNull.badge, 'Chưa công bố');
    assert.equal(resultNull.actionTitle, 'Chưa công bố');
    assert.equal(resultNull.hasDeadline, false);

    const resultUndefined = getDeadlineLabel(undefined, fixedToday);
    assert.equal(resultUndefined.short, 'Chưa công bố');
    assert.equal(resultUndefined.hasDeadline, false);

    const resultEmpty = getDeadlineLabel('', fixedToday);
    assert.equal(resultEmpty.short, 'Chưa công bố');
    assert.equal(resultEmpty.hasDeadline, false);
  });

  it('handles deadline expiring today (daysLeft === 0: Hết hạn hôm nay)', () => {
    const deadline = '2026-11-21';
    const result = getDeadlineLabel(deadline, fixedToday);
    assert.equal(result.daysLeft, 0);
    assert.equal(result.tone, 'urgent');
    assert.equal(result.short, 'Hết hạn hôm nay');
    assert.match(result.note, /21\/11\/2026/);
    assert.match(result.badge, /21\/11\/2026 · Hết hạn hôm nay/);
    assert.equal(result.actionDesc, 'Hôm nay là ngày cuối cùng');
    assert.equal(result.hasDeadline, true);
  });

  it('handles positive days left (n > 0: còn n ngày)', () => {
    // 5 days left -> urgent (<= 10)
    const deadline5 = '2026-11-26';
    const result5 = getDeadlineLabel(deadline5, fixedToday);
    assert.equal(result5.daysLeft, 5);
    assert.equal(result5.tone, 'urgent');
    assert.equal(result5.short, 'còn 5 ngày');
    assert.match(result5.note, /26\/11\/2026/);
    assert.match(result5.badge, /26\/11\/2026 · còn 5 ngày/);
    assert.equal(result5.actionDesc, 'Còn 5 ngày để chuẩn bị hồ sơ');
    assert.equal(result5.hasDeadline, true);

    // 20 days left -> soon (11 - 30)
    const deadline20 = '2026-12-11';
    const result20 = getDeadlineLabel(deadline20, fixedToday);
    assert.equal(result20.daysLeft, 20);
    assert.equal(result20.tone, 'soon');
    assert.equal(result20.short, 'còn 20 ngày');

    // 40 days left -> open (> 30)
    const deadline40 = '2026-12-31';
    const result40 = getDeadlineLabel(deadline40, fixedToday);
    assert.equal(result40.daysLeft, 40);
    assert.equal(result40.tone, 'open');
    assert.equal(result40.short, 'còn 40 ngày');
  });

  it('handles numeric daysLeft input directly', () => {
    const result0 = getDeadlineLabel(0);
    assert.equal(result0.daysLeft, 0);
    assert.equal(result0.short, 'Hết hạn hôm nay');

    const result5 = getDeadlineLabel(5);
    assert.equal(result5.daysLeft, 5);
    assert.equal(result5.short, 'còn 5 ngày');
  });

  it('handles invalid date strings and objects gracefully without throwing', () => {
    const invalidInputs = ['invalid', 'not-a-date', '2026-99-99', 'NaN', new Date('invalid'), NaN];
    for (const input of invalidInputs) {
      const result = getDeadlineLabel(input, fixedToday);
      assert.equal(result.daysLeft, null);
      assert.equal(result.tone, 'neutral');
      assert.equal(result.short, 'Chưa công bố');
      assert.equal(result.badge, 'Chưa công bố');
      assert.equal(result.actionTitle, 'Chưa công bố');
      assert.equal(result.hasDeadline, false);
    }
  });
});
