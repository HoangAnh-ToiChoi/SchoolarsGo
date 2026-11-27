import { Shield, ShieldOff, Lock, Unlock } from 'lucide-react';
import { isUserActive } from '~/pages/admin/users/helpers';
import { cn } from '~/utils/cn';
import { formatDate } from '~/utils/format';

export default function UserRow({ user, onChangeRole, isRolePending, onToggleStatus, isStatusPending }) {
  const isActive = isUserActive(user);
  return (
    <tr className="hover:bg-ink-800/40 transition-colors">
      <td className="px-4 py-4">
        <p className="font-semibold text-ink-100">{user.full_name || '—'}</p>
        <p className="text-xs text-ink-500 mt-0.5">{user.email}</p>
      </td>
      <td className="px-4 py-4">
        <span className={user.role === 'admin' ? 'badgePrimary' : 'badgeDefault'}>{user.role}</span>
      </td>
      <td className="px-4 py-4">
        <span className={isActive ? 'badgeSuccess' : 'badgeDefault'}>{isActive ? 'Hoạt động' : 'Vô hiệu'}</span>
      </td>
      <td className="px-4 py-4 text-ink-500 text-xs">{formatDate(user.created_at)}</td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          {user.role === 'user' ? (
            <button
              onClick={() => onChangeRole(user.id, 'admin')}
              disabled={isRolePending}
              title="Nâng lên Admin"
              className="p-1.5 rounded-button text-primary-400 hover:bg-primary-400/10 transition-colors disabled:opacity-40"
            >
              <Shield className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onChangeRole(user.id, 'user')}
              disabled={isRolePending}
              title="Hạ xuống User"
              className="p-1.5 rounded-button text-ink-400 hover:bg-ink-800 transition-colors disabled:opacity-40"
            >
              <ShieldOff className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onToggleStatus(user)}
            disabled={isStatusPending}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-button text-xs font-medium transition-colors disabled:opacity-40',
              isActive ? 'text-danger-500 hover:bg-danger-500/10' : 'text-success-500 hover:bg-success-500/10'
            )}
          >
            {isActive ? <><Lock className="w-3.5 h-3.5" /> Khóa</> : <><Unlock className="w-3.5 h-3.5" /> Mở</>}
          </button>
        </div>
      </td>
    </tr>
  );
}
