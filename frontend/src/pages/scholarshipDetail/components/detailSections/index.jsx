import { useEffect, useRef, useState } from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import SectionBlock from '~/pages/scholarshipDetail/components/detailSections/sectionBlock';
import SectionNav from '~/pages/scholarshipDetail/components/detailSections/sectionNav';

// Cột nội dung: mục lục dính + các mục. Chỉ nhận những mục có dữ liệu (xem buildSections trong helper.js).
export default function DetailSections({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  // Sau khi bấm tab, giữ tab đó một lúc: mục cuối thường không cuộn lên tới đỉnh được
  // nên bộ theo dõi cuộn sẽ tô nhầm sang mục trước nó.
  const lockedUntil = useRef(0);

  const handleSelect = (id) => {
    lockedUntil.current = Date.now() + 1000;
    setActiveId(id);
  };

  // Tô đậm tab của mục đang đọc: mục nào chạm dải phía trên màn hình (ngay dưới mục lục) là mục đang đọc
  useEffect(() => {
    const elements = sections.map((section) => document.getElementById(section.id)).filter(Boolean);
    if (elements.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockedUntil.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px' }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-tile border border-dashed border-line bg-surface px-6 py-10 text-center">
        <DocumentMagnifyingGlassIcon className="size-10 text-brand-200" aria-hidden="true" />
        <p className="mt-3 text-block-title text-heading">Chưa có mô tả chi tiết</p>
        <p className="mt-1 max-w-md text-sm text-fg-muted">
          Nguồn tin chưa đăng quyền lợi, điều kiện và hồ sơ của học bổng này. Hãy xem trang của nhà tài trợ để có thông tin mới nhất.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionNav sections={sections} activeId={activeId} onSelect={handleSelect} />
      {sections.map((section, i) => (
        <SectionBlock key={section.id} section={section} isFirst={i === 0} />
      ))}
    </div>
  );
}
