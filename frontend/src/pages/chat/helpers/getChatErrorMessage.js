const MESSAGE_BY_STATUS = {
  429: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút rồi thử lại.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  503: 'Dịch vụ AI đang bảo trì. Vui lòng thử lại sau.',
};
const CONNECTION_ERROR = 'Mình gặp sự cố kết nối. Bạn thử lại nhé.';

// apiClient thường reject bằng Error kèm `status` (không có `response`)
export function getChatErrorMessage(err) {
  const status = err?.status ?? err?.response?.status;
  return MESSAGE_BY_STATUS[status] ?? CONNECTION_ERROR;
}
