// Extract IELTS score từ string như "IELTS 7.5" hoặc "TOEFL 100"
const extractIeltsScore = (englishLevel) => {
  if (!englishLevel) return null;

  // IELTS pattern: IELTS X.Y or IELTS X
  const ieltsMatch = englishLevel.match(/IELTS\s*(\d+\.?\d*)/i);
  if (ieltsMatch) {
    const score = parseFloat(ieltsMatch[1]);
    return (score >= 0 && score <= 9) ? score : null;
  }

  // TOEFL pattern: TOEFL XXX (paper) or TOEFL iBT XXX
  const toeflMatch = englishLevel.match(/TOEFL\s*i?BT?\s*(\d+)/i);
  if (toeflMatch) {
    const score = parseInt(toeflMatch[1]);
    // Convert TOEFL to IELTS scale (approximate)
    if (score >= 118) return 9;
    if (score >= 113) return 8.5;
    if (score >= 102) return 8;
    if (score >= 94) return 7.5;
    if (score >= 79) return 7;
    if (score >= 60) return 6;
    if (score >= 40) return 5;
    if (score >= 0) return 4;
  }

  return null;
};

const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDeadline = (deadline) => {
  if (!deadline) return '';
  const date = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Hết hạn ${Math.abs(diffDays)} ngày trước`;
  if (diffDays === 0) return 'Hết hạn hôm nay';
  if (diffDays === 1) return 'Còn 1 ngày';
  if (diffDays <= 7) return `Còn ${diffDays} ngày`;
  if (diffDays <= 30) return `Còn ${Math.ceil(diffDays / 7)} tuần`;
  return `Còn ${Math.ceil(diffDays / 30)} tháng`;
};

const isUuid = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

module.exports = { extractIeltsScore, formatCurrency, formatDeadline, isUuid };
