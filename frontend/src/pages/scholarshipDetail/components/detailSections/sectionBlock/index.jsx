import { CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/20/solid';
import { cn } from '~/utils/cn';

// Màu dấu tích: quyền lợi = xanh lá (điều có lợi), điều kiện = tím (yêu cầu cần đáp ứng)
const CHECK_COLOR = { benefits: 'text-success-600', eligibility: 'text-brand-600' };

// Một mục nội dung. scroll-mt chừa chỗ cho header (64px) + mục lục dính (46px) khi cuộn tới.
export default function SectionBlock({ section, isFirst }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className={cn('scroll-mt-[128px] py-6', !isFirst && 'border-t border-line-soft')}
    >
      <h2 id={`${section.id}-title`} className="mb-3 text-card-title text-heading">
        {section.title}
      </h2>
      <SectionContent section={section} />
    </section>
  );
}

function SectionContent({ section }) {
  const { id, text, items = [] } = section;
  if (text) return <p className="whitespace-pre-line text-[14.5px] leading-[1.7] text-fg">{text}</p>;
  // Dữ liệu chỉ có một đoạn văn (không xuống dòng) thì hiện như đoạn văn, không ép thành danh sách
  if (items.length === 1) return <p className="whitespace-pre-line text-[14.5px] leading-[1.7] text-fg">{items[0]}</p>;

  if (id === 'documents') {
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

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex gap-2.5 text-sm leading-[1.55] text-fg">
          <CheckCircleIcon className={cn('mt-px size-[18px] shrink-0', CHECK_COLOR[id])} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
