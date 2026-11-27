import { useState } from 'react';
import { buildUserFilters } from '~/pages/admin/users/helpers';

// Bộ lọc danh sách người dùng: đổi điều kiện lọc nào cũng quay về trang 1
export function useUserFilters() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const changeRole = (value) => {
    setRole(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  return {
    filters: buildUserFilters({ page, search, role, status }),
    setPage,
    searchInput,
    setSearchInput,
    submitSearch,
    role,
    changeRole,
    status,
    changeStatus,
  };
}
