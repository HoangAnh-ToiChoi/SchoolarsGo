import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildHeaderTiles } from './buildHeaderTiles.js';
import { HEADER_LABELS, UNKNOWN_LABEL } from '../constants/index.js';

describe('buildHeaderTiles', () => {
  const fixedToday = new Date('2026-11-21T00:00:00.000Z');

  const completeScholarship = {
    country: 'UK',
    city: 'London',
    language: 'Tiếng Anh',
    degree: 'Master',
    intake: '09/2026',
    field_of_study: 'Khoa học máy tính',
    coverage: 'Toàn phần',
    amount: 25000,
    currency: 'GBP',
    deadline: '2026-12-31',
  };

  it('correctly maps full scholarship data into 4 tiles', () => {
    const tiles = buildHeaderTiles(completeScholarship, fixedToday);
    assert.equal(tiles.length, 4);

    // Country tile
    assert.equal(tiles[0].label, HEADER_LABELS.country);
    assert.equal(tiles[0].value, 'Anh');
    assert.equal(tiles[0].note, 'London · Ngôn ngữ: Tiếng Anh');

    // Degree tile
    assert.equal(tiles[1].label, HEADER_LABELS.degree);
    assert.equal(tiles[1].value, 'Thạc sĩ');
    assert.equal(tiles[1].note, 'Nhập học 09/2026');

    // Funding tile
    assert.equal(tiles[2].label, HEADER_LABELS.funding);
    assert.equal(tiles[2].value, 'Toàn phần');
    assert.match(tiles[2].note, /25,000/);

    // Deadline tile
    assert.equal(tiles[3].label, HEADER_LABELS.deadline);
    assert.equal(tiles[3].value, 'còn 40 ngày');
    assert.match(tiles[3].note, /31\/12\/2026/);
    assert.equal(tiles[3].tone, 'open');
    assert.equal(tiles[3].valueClass, 'text-open-fg');
  });

  it('handles missing city (language only in note)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, city: null }, fixedToday);
    assert.equal(tiles[0].note, 'Ngôn ngữ: Tiếng Anh');
  });

  it('handles missing language (city only in note)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, language: null }, fixedToday);
    assert.equal(tiles[0].note, 'London');
  });

  it('handles missing both city and language (note is null)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, city: null, language: null }, fixedToday);
    assert.equal(tiles[0].note, null);
  });

  it('handles missing intake, falling back to field_of_study', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, intake: null }, fixedToday);
    assert.equal(tiles[1].note, 'Khoa học máy tính');
  });

  it('handles missing both intake and field_of_study (degree note is null)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, intake: null, field_of_study: null }, fixedToday);
    assert.equal(tiles[1].note, null);
  });

  it('handles missing amount (funding note is null)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, amount: null }, fixedToday);
    assert.equal(tiles[2].value, 'Toàn phần');
    assert.equal(tiles[2].note, null);
  });

  it('handles missing coverage, falling back to UNKNOWN_LABEL', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, coverage: null }, fixedToday);
    assert.equal(tiles[2].value, UNKNOWN_LABEL);
    assert.match(tiles[2].note, /25,000/);
  });

  it('handles null / undefined / empty deadline (Chưa công bố)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, deadline: null }, fixedToday);
    assert.equal(tiles[3].value, 'Chưa công bố');
    assert.equal(tiles[3].note, 'Theo dõi bài đăng gốc');
    assert.equal(tiles[3].tone, 'neutral');
    assert.equal(tiles[3].valueClass, 'text-heading');
  });

  it('handles deadline expiring today (Hết hạn hôm nay)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, deadline: '2026-11-21' }, fixedToday);
    assert.equal(tiles[3].value, 'Hết hạn hôm nay');
    assert.equal(tiles[3].tone, 'urgent');
    assert.equal(tiles[3].valueClass, 'text-urgent-fg');
  });

  it('handles deadline expiring soon (còn 5 ngày)', () => {
    const tiles = buildHeaderTiles({ ...completeScholarship, deadline: '2026-11-26' }, fixedToday);
    assert.equal(tiles[3].value, 'còn 5 ngày');
    assert.equal(tiles[3].tone, 'urgent');
    assert.equal(tiles[3].valueClass, 'text-urgent-fg');
  });

  it('handles empty scholarship object safely without throwing', () => {
    const tiles = buildHeaderTiles({}, fixedToday);
    assert.equal(tiles.length, 4);
    assert.equal(tiles[0].value, UNKNOWN_LABEL);
    assert.equal(tiles[0].note, null);
    assert.equal(tiles[1].value, UNKNOWN_LABEL);
    assert.equal(tiles[1].note, null);
    assert.equal(tiles[2].value, UNKNOWN_LABEL);
    assert.equal(tiles[2].note, null);
    assert.equal(tiles[3].value, 'Chưa công bố');
    assert.equal(tiles[3].tone, 'neutral');
  });

  it('handles null or undefined parameter gracefully', () => {
    const tilesNull = buildHeaderTiles(null, fixedToday);
    assert.equal(tilesNull.length, 4);
    assert.equal(tilesNull[2].value, UNKNOWN_LABEL);

    const tilesUndefined = buildHeaderTiles(undefined, fixedToday);
    assert.equal(tilesUndefined.length, 4);
    assert.equal(tilesUndefined[2].value, UNKNOWN_LABEL);
  });

  it('accepts options object with today property', () => {
    const tiles = buildHeaderTiles(completeScholarship, { today: fixedToday });
    assert.equal(tiles[3].value, 'còn 40 ngày');
  });

  it('safely handles null, empty, and unusual currency without throwing RangeError', () => {
    // null currency defaults to USD
    const tilesNull = buildHeaderTiles({ ...completeScholarship, currency: null }, fixedToday);
    assert.match(tilesNull[2].note, /25,000/);

    // empty string currency defaults to USD
    const tilesEmpty = buildHeaderTiles({ ...completeScholarship, currency: '' }, fixedToday);
    assert.match(tilesEmpty[2].note, /25,000/);

    // invalid currency code safely falls back to formatted amount + currency
    const tilesInvalid = buildHeaderTiles({ ...completeScholarship, currency: 'INVALID' }, fixedToday);
    assert.equal(tilesInvalid[2].note, '25,000 INVALID');

    // non-ISO currency symbol like 'đ' safely falls back
    const tilesDong = buildHeaderTiles({ ...completeScholarship, currency: 'đ' }, fixedToday);
    assert.equal(tilesDong[2].note, '25,000 đ');

    // unusual currency string
    const tilesUnusual = buildHeaderTiles({ ...completeScholarship, currency: 'unusual' }, fixedToday);
    assert.equal(tilesUnusual[2].note, '25,000 unusual');
  });

  it('guarantees consistent schema { label, value, note, tone } across all 4 tiles', () => {
    const tiles = buildHeaderTiles(completeScholarship, fixedToday);
    assert.equal(tiles.length, 4);
    for (const tile of tiles) {
      assert.ok('label' in tile && typeof tile.label === 'string');
      assert.ok('value' in tile && typeof tile.value === 'string');
      assert.ok('note' in tile && (tile.note === null || typeof tile.note === 'string'));
      assert.ok('tone' in tile && typeof tile.tone === 'string');
    }
    assert.equal(tiles[0].tone, 'neutral');
    assert.equal(tiles[1].tone, 'neutral');
    assert.equal(tiles[2].tone, 'neutral');
    assert.equal(tiles[3].tone, 'open');
  });
});
