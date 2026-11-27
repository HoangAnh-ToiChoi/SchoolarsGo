import test from 'node:test';
import assert from 'node:assert/strict';

import { clientIpKey } from '~/utils/clientIp.js';

const key = ip => clientIpKey({ ip });

test('IPv4 giữ nguyên, IPv4 dạng ánh xạ IPv6 bỏ tiền tố', () => {
  assert.equal(key('203.0.113.7'), '203.0.113.7');
  assert.equal(key('::ffff:203.0.113.7'), '203.0.113.7');
});

test('các địa chỉ IPv6 cùng dải /64 cho cùng một khóa (không đổi địa chỉ để lách giới hạn)', () => {
  const a = key('2001:db8:abcd:12:1111:2222:3333:4444');
  const b = key('2001:db8:abcd:12::9');
  const c = key('2001:DB8:ABCD:12:ffff::1');
  assert.equal(a, '2001:db8:abcd:12::/64');
  assert.equal(b, a);
  assert.equal(c, a);
});

test('dải /64 khác thì khóa khác; "::" ở đầu và zone id được xử lý', () => {
  assert.notEqual(key('2001:db8:abcd:13::1'), key('2001:db8:abcd:12::1'));
  assert.equal(key('::1'), '0:0:0:0::/64');
  assert.equal(key('fe80::1%eth0'), 'fe80:0:0:0::/64');
});
