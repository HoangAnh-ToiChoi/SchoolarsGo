import { Button } from '~/components/ui/button';

// Chân bảng bộ lọc: đặt lại + tìm
export default function FilterActions({ activeCount, onReset }) {
  return (
    <div className="mt-[18px] flex items-center justify-between gap-2 border-t border-line-soft pt-4">
      <span className="text-[13px] text-fg-muted">
        {activeCount > 0 ? `Đang chọn ${activeCount} bộ lọc` : 'Chưa chọn bộ lọc nào'} · nhấn Esc để đóng
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onReset} className="h-9">
          Đặt lại
        </Button>
        <Button type="submit" className="h-9 px-4">
          Tìm học bổng
        </Button>
      </div>
    </div>
  );
}
