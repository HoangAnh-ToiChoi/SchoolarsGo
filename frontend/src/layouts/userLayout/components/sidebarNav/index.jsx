import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '~/layouts/userLayout/components/sidebarNav/navConfig';
import { cn } from '~/utils/cn';

// Danh sách mục điều hướng, dùng chung cho sidebar (máy tính) và menu trượt (điện thoại).
// onNavigate: menu trượt cần đóng lại sau khi bấm một mục.
export default function SidebarNav({ onNavigate }) {
  return NAV_SECTIONS.map((section) => (
    <div key={section.title} className="mb-5 flex flex-col gap-0.5">
      <span className="px-3 pb-2 text-xs font-semibold text-fg-muted">{section.title}</span>
      {section.items.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex h-nav items-center gap-3 rounded-control px-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40',
              isActive ? 'bg-brand-50 font-semibold text-brand-600' : 'text-fg-soft hover:bg-hover hover:text-fg'
            )
          }
        >
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          {label}
          {badge && (
            <span className="ml-auto rounded-[6px] bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">{badge}</span>
          )}
        </NavLink>
      ))}
    </div>
  ));
}
