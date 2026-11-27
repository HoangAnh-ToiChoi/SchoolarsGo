import { ADMIN_PAGE_SIZE } from '~/utils/constants';

// Bộ lọc gửi API: bỏ hẳn trường rỗng để server không lọc theo chuỗi trống
export function buildUserFilters({ page, search, role, status }) {
  return { page, limit: ADMIN_PAGE_SIZE, ...(search && { search }), ...(role && { role }), ...(status && { status }) };
}
