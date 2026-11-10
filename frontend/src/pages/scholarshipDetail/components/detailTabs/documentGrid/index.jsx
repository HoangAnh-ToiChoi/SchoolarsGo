import { DocumentTextIcon } from '@heroicons/react/20/solid';

// Hồ sơ cần nộp: mỗi giấy tờ một ô, tự xếp cột theo chiều rộng
export default function DocumentGrid({ items }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-2.5">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex items-center gap-2.5 rounded-inner border border-line-soft bg-canvas px-3 py-2.5 text-[13.5px] text-heading">
          <DocumentTextIcon className="size-[18px] shrink-0 text-fg-muted" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}
