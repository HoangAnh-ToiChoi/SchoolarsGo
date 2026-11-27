// Hằng số của đơn ứng tuyển (application.service)

// Trạng thái hiện tại → các trạng thái được phép chuyển tới
const APPLICATION_VALID_TRANSITIONS = Object.freeze({
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['interview', 'rejected', 'withdrawn'],
  interview: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
});

// Mọi trạng thái của đơn (thống kê admin đếm đủ, kể cả trạng thái bằng 0)
const APPLICATION_STATUSES = Object.freeze(Object.keys(APPLICATION_VALID_TRANSITIONS));

// Đơn đã nộp thì không xóa, chỉ được rút
const APPLICATION_UNDELETABLE_STATUSES = Object.freeze(['submitted', 'under_review', 'interview', 'accepted']);

// Giới hạn đầu vào của đơn: không có thì một request lưu được hàng nghìn mục / hàng MB vào cột jsonb
const APPLICATION_CHECKLIST_MAX_ITEMS = 50;
const APPLICATION_CHECKLIST_ITEM_MAX_LENGTH = 300;
const APPLICATION_NOTES_MAX_LENGTH = 5000;
const APPLICATION_DOCUMENTS_USED_MAX = 20;

export {
  APPLICATION_VALID_TRANSITIONS,
  APPLICATION_STATUSES,
  APPLICATION_UNDELETABLE_STATUSES,
  APPLICATION_CHECKLIST_MAX_ITEMS,
  APPLICATION_CHECKLIST_ITEM_MAX_LENGTH,
  APPLICATION_NOTES_MAX_LENGTH,
  APPLICATION_DOCUMENTS_USED_MAX,
};
