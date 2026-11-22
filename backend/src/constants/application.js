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

// Đơn đã nộp thì không xóa, chỉ được rút
const APPLICATION_UNDELETABLE_STATUSES = Object.freeze(['submitted', 'under_review', 'interview', 'accepted']);

export { APPLICATION_VALID_TRANSITIONS, APPLICATION_UNDELETABLE_STATUSES };
