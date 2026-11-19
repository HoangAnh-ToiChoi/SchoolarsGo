import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BellIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdownMenu';
import NotificationItem from '~/layouts/userLayout/components/notificationMenu/notificationItem';
import { useNotifications } from '~/hooks/useNotifications';
import { selectIsAuthenticated } from '~/store/slices/authSlice';

// Chuông trên header: bấm là sổ danh sách thông báo ngay tại chỗ, không có trang thông báo riêng.
export default function NotificationMenu() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { items, unreadCount, isLoading, isError, refetch, markRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
          className="relative text-fg-soft hover:border-line hover:bg-hover hover:text-fg-soft data-[state=open]:bg-hover"
        >
          <BellIcon aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-destructive px-1 text-[10.5px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[360px] max-w-[calc(100vw-24px)] rounded-xl border-line p-1.5 shadow-menu"
      >
        <div className="flex items-center justify-between gap-2 px-2.5 pb-2 pt-1.5">
          <p className="text-block-title text-heading">Thông báo</p>
          {unreadCount > 0 && (
            <DropdownMenuItem
              // Giữ menu mở sau khi đánh dấu để thấy các chấm chưa đọc biến mất
              onSelect={(event) => {
                event.preventDefault();
                markAllRead();
              }}
              className="h-7 rounded-control px-2 text-xs font-semibold text-brand-600 focus:bg-brand-50 focus:text-brand-600"
            >
              Đánh dấu đã đọc
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator className="-mx-1.5 bg-line-soft" />

        {!isAuthenticated ? (
          <EmptyState text="Đăng nhập để nhận nhắc hạn nộp của học bổng đã lưu.">
            <DropdownMenuItem asChild className="mt-3 h-8 justify-center rounded-control px-3 text-[13px] font-semibold text-brand-600 focus:bg-brand-50">
              <Link to="/login">Đăng nhập</Link>
            </DropdownMenuItem>
          </EmptyState>
        ) : isLoading ? (
          <EmptyState text="Đang tải thông báo…" />
        ) : isError ? (
          <EmptyState text="Không tải được thông báo.">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                refetch();
              }}
              className="mt-3 h-8 justify-center rounded-control px-3 text-[13px] font-semibold text-brand-600 focus:bg-brand-50"
            >
              Thử lại
            </DropdownMenuItem>
          </EmptyState>
        ) : items.length === 0 ? (
          <EmptyState text="Chưa có thông báo. Lưu học bổng để được nhắc trước hạn nộp 14, 7 và 1 ngày." />
        ) : (
          <div className="max-h-[min(420px,calc(100dvh-140px))] overflow-y-auto py-1">
            {items.map((item) => (
              <NotificationItem key={item.id} item={item} onRead={() => markRead(item.id)} />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <BellIcon className="size-6 text-fg-muted" aria-hidden="true" />
      <p className="mt-2 text-[13px] text-fg-muted">{text}</p>
      {children}
    </div>
  );
}
