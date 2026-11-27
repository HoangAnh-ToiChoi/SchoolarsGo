import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOW_UP_DAYS } from '../constants';
import { buildDeadlineEvents } from './buildDeadlineEvents.js';

// Dùng giờ địa phương để không lệch ngày theo múi giờ của máy chạy test
const TODAY = new Date(2026, 10, 27, 9, 0);
const day = (offset) => new Date(2026, 10, 27 + offset, 12, 0);
const scholarship = (id, offset) => ({ id, slug: `hb-${id}`, title: `Học bổng ${id}`, deadline: day(offset).toISOString() });

describe('buildDeadlineEvents', () => {
  it('gom hạn của học bổng đã lưu và đơn đang làm, sắp theo ngày', () => {
    const saved = [{ scholarship: scholarship('a', 20) }];
    const applications = [{ id: 1, status: 'draft', scholarship: scholarship('b', 3) }];
    const events = buildDeadlineEvents(saved, applications, TODAY);
    assert.deepEqual(events.map((e) => e.id), ['app-1', 'saved-a']);
    assert.equal(events[0].status, 'draft');
    assert.equal(events[0].tone, 'urgent');
    assert.equal(events[1].tone, 'soon');
  });

  it('học bổng vừa lưu vừa có đơn chỉ hiện một lần (theo đơn)', () => {
    const s = scholarship('c', 40);
    const events = buildDeadlineEvents([{ scholarship: s }], [{ id: 2, status: 'submitted', scholarship: s }], TODAY);
    assert.deepEqual(events.map((e) => e.id), ['app-2']);
    assert.equal(events[0].tone, 'open');
  });

  it(`đơn đã nộp có mốc nhắc theo dõi sau ${FOLLOW_UP_DAYS} ngày, màu brand`, () => {
    const applied = day(-2);
    const events = buildDeadlineEvents([], [{ id: 3, status: 'accepted', applied_at: applied.toISOString(), scholarship: scholarship('d', 5) }], TODAY);
    assert.deepEqual(events.map((e) => e.kind), ['followUp'], 'đơn đã có kết quả không còn mốc hạn nộp');
    assert.equal(events[0].tone, 'brand');
    assert.equal(Math.round((events[0].date - applied) / 864e5), FOLLOW_UP_DAYS);
  });

  it('hạn đã qua đánh dấu isPast, màu trung tính', () => {
    const [event] = buildDeadlineEvents([{ scholarship: scholarship('e', -1) }], [], TODAY);
    assert.equal(event.isPast, true);
    assert.equal(event.tone, 'neutral');
  });

  it('học bổng không có hạn nộp và đầu vào rỗng không tạo mốc', () => {
    assert.deepEqual(buildDeadlineEvents([{ scholarship: { id: 'f', deadline: null } }], [], TODAY), []);
    assert.deepEqual(buildDeadlineEvents(undefined, undefined, TODAY), []);
  });
});
