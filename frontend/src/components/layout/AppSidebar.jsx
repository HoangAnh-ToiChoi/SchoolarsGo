import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '~/components/layout/navConfig';
import { cn } from '~/lib/utils';

export default function AppSidebar() {
  return (
    <nav aria-label="Điều hướng chính" className="w-sidebar shrink-0 border-r border-line bg-surface px-3 py-5">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-5 flex flex-col gap-0.5">
          <span className="px-3 pb-2 text-xs font-semibold text-fg-muted">{section.title}</span>
          {section.items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-nav items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150',
                  isActive ? 'bg-brand-50 font-semibold text-brand-600' : 'text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-fg'
                )
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              {label}
              {badge && (
                <span className="ml-auto rounded-[6px] bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
