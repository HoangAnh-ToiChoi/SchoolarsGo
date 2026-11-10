import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import CheckList from '~/pages/scholarshipDetail/components/detailTabs/checkList';
import DocumentGrid from '~/pages/scholarshipDetail/components/detailTabs/documentGrid';
import EmptyDetail from '~/pages/scholarshipDetail/components/detailTabs/emptyDetail';
import TextContent from '~/pages/scholarshipDetail/components/detailTabs/textContent';

// Nội dung chi tiết chia tab: mỗi lúc chỉ hiện một mục nên trang ngắn, không phải cuộn qua hết các mục.
// Chỉ nhận những mục có dữ liệu (xem buildSections trong helper.js).
export default function DetailTabs({ sections }) {
  if (sections.length === 0) return <EmptyDetail />;

  return (
    <Tabs defaultValue={sections[0].id} className="mt-6">
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {sections.map((section) => (
          <TabsTrigger key={section.id} value={section.id}>
            {section.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="mt-5">
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
