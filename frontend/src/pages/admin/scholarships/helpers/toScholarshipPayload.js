// Dữ liệu gửi API: số tiền đổi sang số, ô trống (số tiền, hạn nộp) thì bỏ hẳn để server không nhận chuỗi rỗng
export function toScholarshipPayload(form, id) {
  const payload = { ...form };
  if (payload.amount === '') delete payload.amount;
  else payload.amount = Number(payload.amount);
  if (!payload.deadline) delete payload.deadline;
  return id ? { id, ...payload } : payload;
}
