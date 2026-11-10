import { useRef, useState } from 'react';
import { Tabs, TabsContent } from '~/components/ui/tabs';
import CheckList from '~/pages/scholarshipDetail/components/detailTabs/checkList';
import DocumentGrid from '~/pages/scholarshipDetail/components/detailTabs/documentGrid';
import EmptyDetail from '~/pages/scholarshipDetail/components/detailTabs/emptyDetail';
import TabBar from '~/pages/scholarshipDetail/components/detailTabs/tabBar';
import TextContent from '~/pages/scholarshipDetail/components/detailTabs/textContent';

// Chiều cao header dính (64px) — thanh tab dính ngay bên dưới
const HEADER_HEIGHT = 64;

// Nội dung chi tiết chia tab: mỗi lúc chỉ hiện một mục để trang ngắn, không phải cuộn qua hết các mục.
// Chỉ nhận những mục có dữ liệu (xem buildSections trong helper.js).
export default function DetailTabs({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const rootRef = useRef(null);

  // Đang cuộn sâu (thanh tab đã dính trên đầu) mà đổi tab thì đưa về đầu nội dung tab mới,
  // nếu không người dùng sẽ thấy giữa chừng hoặc khoảng trống khi tab mới ngắn hơn.
  const handleChange = (id) => {
    setActiveId(id);
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top >= HEADER_HEIGHT) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + top - HEADER_HEIGHT, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  if (sections.length === 0) return <EmptyDetail />;

  return (
    <Tabs ref={rootRef} value={activeId} onValueChange={handleChange} className="mt-2">
      <TabBar sections={sections} />
      {sections.map((section) => (
        <TabsContent
          key={section.id}
          value={section.id}
          className="mt-0 py-6 duration-200 animate-in fade-in-0 focus-visible:ring-brand-600/40 focus-visible:ring-offset-0 motion-reduce:animate-none"
        >
          <SectionPanel section={section} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

// Chọn cách hiển thị theo loại dữ liệu của mục
function SectionPanel({ section }) {
  const { id, text, items = [] } = section;
  if (text) return <TextContent>{text}</TextContent>;
  // Dữ liệu chỉ có một đoạn văn (không xuống dòng) thì hiện như đoạn văn, không ép thành danh sách
  if (items.length === 1) return <TextContent>{items[0]}</TextContent>;
  if (id === 'documents') return <DocumentGrid items={items} />;
  return <CheckList items={items} tone={id === 'benefits' ? 'success' : 'brand'} />;
}
