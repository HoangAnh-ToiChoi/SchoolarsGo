// Dấu đầu dòng hay gặp trong dữ liệu cào về: "- ", "• ", "* ", "1. ", "2) "
const BULLET = /^\s*(?:[-•*·+]|\d+[.)])\s*/;

// DB lưu quyền lợi/điều kiện/hồ sơ dạng text, mỗi ý một dòng. Tách thành danh sách để hiển thị.
// Phòng khi API trả mảng thì dùng luôn.
export function toListItems(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, '').trim())
    .filter(Boolean);
}

// Các mục nội dung của trang chi tiết. Mục nào không có dữ liệu thì bỏ hẳn (cả tab mục lục),
// vì nhiều học bổng cào về chỉ có tóm tắt.
export function buildSections(scholarship) {
  const overview = (scholarship.description || scholarship.summary || '').trim();
  const eligibility = [
    ...toListItems(scholarship.eligibility),
    scholarship.min_gpa && `GPA tối thiểu ${Number(scholarship.min_gpa).toFixed(1)}/4.0`,
    scholarship.min_ielts && `IELTS tối thiểu ${scholarship.min_ielts}`,
  ].filter(Boolean);

  return [
    { id: 'overview', title: 'Tổng quan', text: overview },
    { id: 'benefits', title: 'Quyền lợi', items: toListItems(scholarship.benefits) },
    { id: 'eligibility', title: 'Điều kiện', items: eligibility },
    { id: 'documents', title: 'Hồ sơ cần nộp', items: toListItems(scholarship.requirements) },
  ].filter((section) => section.text || section.items?.length > 0);
}
