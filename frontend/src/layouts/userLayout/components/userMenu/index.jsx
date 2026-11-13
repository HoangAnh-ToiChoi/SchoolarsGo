import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ArrowRightStartOnRectangleIcon, BellIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdownMenu';
import { useLogout } from '~/hooks/useAuth';
import { getInitials } from '~/layouts/userLayout/helper';
import { selectUser } from '~/store/slices/authSlice';

const ROLE_LABELS = { admin: 'Quản trị viên', user: 'Sinh viên' };

// Bấm avatar → sổ menu tài khoản. Cài đặt và đăng xuất nằm trong menu, không để ở sidebar.
export default function UserMenu() {
  const user = useSelector(selectUser);
  const logout = useLogout();

  if (!user) {
    return (
      <Button asChild className="h-control rounded-inner px-3 sm:px-4">
        <Link to="/login">Đăng nhập</Link>
      </Button>
    );
  }

  const initials = getInitials(user.full_name || 'SG');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Tài khoản" className="flex h-control items-center gap-2.5 rounded-inner pl-1 pr-1 md:pr-2 outline-none transition-colors duration-200 hover:bg-hover focus-visible:ring-2 focus-visible:ring-brand-600/30 data-[state=open]:bg-hover">
        <Initials value={initials} />
        <span className="hidden flex-col items-start leading-tight md:flex">
          <span className="text-[13.5px] font-semibold">{user.full_name}</span>
          <span className="text-xs text-fg-muted">{ROLE_LABELS[user.role] ?? ROLE_LABELS.user}</span>
        </span>
        <ChevronDownIcon className="hidden size-4 text-fg-muted md:block" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[248px] rounded-xl border-line p-1.5 shadow-menu">
        <div className="flex items-center gap-2.5 px-2 pb-2.5 pt-2">
          <Initials value={initials} className="size-9" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.full_name}</div>
          </div>
        </div>
        <DropdownMenuSeparator className="-mx-1.5 bg-line-soft" />
        <MenuLink to="/dashboard" icon={UserIcon}>Hồ sơ cá nhân</MenuLink>
        <MenuLink to="/settings" icon={Cog6ToothIcon}>Cài đặt</MenuLink>
        <MenuLink to="/settings/notifications" icon={BellIcon}>Cài đặt thông báo</MenuLink>
        <DropdownMenuSeparator className="-mx-1.5 bg-line-soft" />
        <DropdownMenuItem
          onSelect={() => logout.mutate()}
          className="h-9 gap-2.5 rounded-control px-2.5 text-sm text-urgent-fg focus:bg-urgent-bg focus:text-urgent-fg"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <DropdownMenuItem asChild className="h-9 gap-2.5 rounded-control px-2.5 text-sm text-fg focus:bg-hover">
      <Link to={to}>
        <Icon className="size-4 text-fg-muted" aria-hidden="true" />
        {children}
      </Link>
    </DropdownMenuItem>
  );
}

function Initials({ value, className = 'size-8' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 ${className}`}>
      {value}
    </span>
  );
}
