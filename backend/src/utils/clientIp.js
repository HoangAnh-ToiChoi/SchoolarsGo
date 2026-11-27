// Khóa rate limit theo người gửi. IPv6: một người thường được cấp cả dải /64 và đổi địa chỉ trong dải
// tùy ý, nên đếm theo từng địa chỉ thì lách được giới hạn; gom về /64. IPv4 dạng "::ffff:1.2.3.4" trả về "1.2.3.4".
const IPV4_MAPPED_PREFIX = '::ffff:';

function expandIpv6(ip) {
  const [head, tail = ''] = ip.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = Math.max(8 - headParts.length - tailParts.length, 0);
  return [...headParts, ...Array(missing).fill('0'), ...tailParts];
}

function clientIpKey(req) {
  const ip = String(req.ip ?? '').split('%')[0]; // bỏ zone id "fe80::1%eth0"
  if (ip.startsWith(IPV4_MAPPED_PREFIX) && ip.includes('.')) return ip.slice(IPV4_MAPPED_PREFIX.length);
  if (!ip.includes(':')) return ip;
  const groups = expandIpv6(ip.toLowerCase());
  return `${groups.slice(0, 4).join(':')}::/64`;
}

export { clientIpKey };
