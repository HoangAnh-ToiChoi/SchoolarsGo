import { formatCurrency } from '../../../utils/format.js';
import { TONE_CLASS } from '../../../utils/palette.js';
import {
  COUNTRY_LABELS,
  DEGREE_LABELS,
  getDeadlineLabel,
  labelOf,
} from '../../../utils/scholarship.js';
import { HEADER_LABELS, UNKNOWN_LABEL } from '../constants/index.js';

/**
 * Định dạng an toàn cho mức tài trợ, phòng ngừa trường hợp currency không hợp lệ
 * hoặc null/rỗng gây lỗi RangeError trong Intl.NumberFormat.
 *
 * @param {number|string} amount
 * @param {string} [currency]
 * @returns {string|null}
 */
function formatFundingAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === '' || Number.isNaN(Number(amount))) {
    return null;
  }
  const normalizedCurrency =
    typeof currency === 'string' && currency.trim() ? currency.trim() : 'USD';

  try {
    return formatCurrency(amount, normalizedCurrency);
  } catch (_error) {
    const formattedNumber = Number(amount).toLocaleString('en-US');
    return `${formattedNumber} ${normalizedCurrency}`.trim();
  }
}

/**
 * Xây dựng danh sách 4 ô thông tin chính của đầu trang chi tiết học bổng:
 * [Quốc gia, Bậc học, Tài trợ, Hạn nộp].
 *
 * @param {Object} scholarship - Dữ liệu học bổng
 * @param {Object|Date} [options={}] - Tùy chọn hoặc mốc ngày today (phục vụ test & R8)
 * @returns {Array<{ label: string, value: string, note: string|null, tone: string, valueClass?: string }>}
 */
export function buildHeaderTiles(scholarship, options = {}) {
  const s = scholarship || {};
  const today = options instanceof Date ? options : options?.today;

  const {
    country,
    city,
    language,
    degree,
    intake,
    field_of_study: field,
    coverage,
    amount,
    currency,
    deadline,
  } = s;

  // 1. Quốc gia & địa điểm (thành phố, ngôn ngữ)
  const countryValue = country ? labelOf(COUNTRY_LABELS, country) : UNKNOWN_LABEL;
  const countryParts = [city, language && `Ngôn ngữ: ${language}`].filter(Boolean);
  const countryNote = countryParts.length > 0 ? countryParts.join(' · ') : null;

  // 2. Bậc học & kỳ nhập học / ngành học
  const degreeValue = degree ? labelOf(DEGREE_LABELS, degree) : UNKNOWN_LABEL;
  let degreeNote = null;
  if (intake) {
    degreeNote = `Nhập học ${intake}`;
  } else if (field) {
    degreeNote = field;
  }

  // 3. Mức tài trợ & giá trị tiền tệ
  const fundingValue = coverage || UNKNOWN_LABEL;
  const fundingNote = formatFundingAmount(amount, currency);

  // 4. Hạn nộp hồ sơ
  const deadlineLabel = getDeadlineLabel(deadline, today);

  return [
    {
      label: HEADER_LABELS.country,
      value: countryValue,
      note: countryNote,
      tone: 'neutral',
    },
    {
      label: HEADER_LABELS.degree,
      value: degreeValue,
      note: degreeNote,
      tone: 'neutral',
    },
    {
      label: HEADER_LABELS.funding,
      value: fundingValue,
      note: fundingNote,
      tone: 'neutral',
    },
    {
      label: HEADER_LABELS.deadline,
      value: deadlineLabel.short,
      note: deadlineLabel.note || null,
      tone: deadlineLabel.tone,
      valueClass: TONE_CLASS[deadlineLabel.tone]?.text,
    },
  ];
}
