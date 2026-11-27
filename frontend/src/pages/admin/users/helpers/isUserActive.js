// Tài khoản cũ có thể thiếu is_active: chỉ coi là bị khóa khi đúng bằng false
export function isUserActive(user) {
  return user?.is_active !== false;
}
