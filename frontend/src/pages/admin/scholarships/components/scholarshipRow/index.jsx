import { Pencil, Trash2, Star, StarOff } from 'lucide-react';
import { cn } from '~/utils/cn';
import { formatDate } from '~/utils/format';

export default function ScholarshipRow({ scholarship: s, onToggle, isToggling, onEdit, onDelete, isDeleting }) {
  return (
    <tr className="hover:bg-ink-800/40 transition-colors">
      <td className="px-4 py-4 max-w-xs">
        <p className="font-semibold text-ink-100 truncate">{s.title}</p>
        <p className="text-xs text-ink-500 mt-0.5">{s.provider}</p>
      </td>
      <td className="px-4 py-4 text-ink-300">{s.country || '—'}</td>
      <td className="px-4 py-4 text-ink-400 text-xs font-mono">{s.deadline ? formatDate(s.deadline) : '—'}</td>
      <td className="px-4 py-4">
        <button
          onClick={() => onToggle(s)}
          disabled={isToggling}
          title={s.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
          className={cn(
            'p-1.5 rounded-button transition-colors disabled:opacity-40',
            s.is_featured ? 'text-warning-400 hover:bg-warning-400/10' : 'text-ink-600 hover:bg-ink-800'
          )}
        >
          {s.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
        </button>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(s)}
            className="p-1.5 rounded-button text-primary-400 hover:bg-primary-400/10 transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(s)}
            disabled={isDeleting}
            className="p-1.5 rounded-button text-danger-500 hover:bg-danger-500/10 transition-colors disabled:opacity-40"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
