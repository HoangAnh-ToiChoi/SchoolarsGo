import { Search } from 'lucide-react';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '~/pages/admin/users/constants';

export default function UserFilters({ searchInput, setSearchInput, submitSearch, role, changeRole, status, changeStatus }) {
  return (
    <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <form onSubmit={submitSearch} className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btnPrimary btnSm">Tìm</button>
      </form>
      <div className="flex gap-2">
        <select value={role} onChange={(e) => changeRole(e.target.value)} className="input">
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={status} onChange={(e) => changeStatus(e.target.value)} className="input">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
