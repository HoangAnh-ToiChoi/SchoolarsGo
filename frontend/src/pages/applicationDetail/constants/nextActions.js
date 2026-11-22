// Việc tiếp theo cho từng trạng thái: một nút chính + các lựa chọn phụ trong menu "⋯".
// Sinh viên tự cập nhật vì hệ thống không nhận kết quả trực tiếp từ nhà tài trợ.
export const NEXT_ACTIONS = {
  draft: {
    primary: { status: 'submitted', label: 'Đánh dấu đã nộp' },
    more: [],
  },
  submitted: {
    primary: { status: 'under_review', label: 'Đánh dấu đang xét duyệt' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
  under_review: {
    primary: { status: 'interview', label: 'Đánh dấu có phỏng vấn' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
  interview: {
    primary: { status: 'accepted', label: 'Đánh dấu được nhận' },
    more: [{ status: 'rejected', label: 'Bị từ chối' }],
  },
};
