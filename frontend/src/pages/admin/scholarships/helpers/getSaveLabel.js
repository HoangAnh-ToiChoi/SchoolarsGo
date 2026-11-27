export function getSaveLabel(isSaving, isEdit) {
  if (isSaving) return 'Đang lưu...';
  return isEdit ? 'Lưu thay đổi' : 'Thêm học bổng';
}
