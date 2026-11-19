import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

// Ghi chú riêng của sinh viên cho đơn này. Chỉ lưu khi bấm nút để tránh gọi API mỗi lần gõ.
export default function NotesCard({ notes, saving, onSave }) {
  const [draft, setDraft] = useState(null);
  const value = draft ?? notes ?? '';
  const dirty = draft !== null && draft !== (notes ?? '');

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <label htmlFor="application-notes" className="text-block-title text-heading">
        Ghi chú
      </label>
      <textarea
        id="application-notes"
        rows={6}
        maxLength={5000}
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Hạn nội bộ, người viết thư giới thiệu, giấy tờ cần bổ sung…"
        className="mt-3 w-full resize-y rounded-inner border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-muted focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[12px] text-fg-muted" aria-live="polite">
          {dirty ? 'Chưa lưu' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave(value, { onSuccess: () => setDraft(null) })}
        >
          {saving ? 'Đang lưu…' : 'Lưu ghi chú'}
        </Button>
      </div>
    </Card>
  );
}
