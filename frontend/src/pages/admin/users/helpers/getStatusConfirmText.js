import { isUserActive } from './isUserActive';

// Chữ của hộp xác nhận khóa / mở tài khoản
export function getStatusConfirmText(user) {
  const name = user?.full_name || user?.email;
  if (isUserActive(user)) {
    return {
      title: 'Khóa tài khoản',
      description: `Tài khoản "${name}" sẽ bị khóa và không thể đăng nhập.`,
      confirmLabel: 'Khóa',
      confirmClass: 'btnDanger',
    };
  }
  return {
    title: 'Mở tài khoản',
    description: `Tài khoản "${name}" sẽ được mở lại.`,
    confirmLabel: 'Mở tài khoản',
    confirmClass: 'btnPrimary',
  };
}
