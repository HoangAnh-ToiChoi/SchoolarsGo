import { TabsList, TabsTrigger } from '~/components/ui/tabs';

// Thanh tab dính dưới header (top 64px). Radix lo bàn phím (mũi tên trái/phải) và vai trò tablist cho trình đọc màn hình.
export default function TabBar({ sections }) {
  return (
    <TabsList className="sticky top-16 z-10 flex h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-line bg-canvas p-0 text-fg-secondary">
      {sections.map((section) => (
        <TabsTrigger
          key={section.id}
          value={section.id}
          className="-mb-px h-[46px] shrink-0 rounded-none border-b-2 border-transparent px-0.5 py-0 text-sm font-medium transition-colors duration-150 hover:text-brand-600 focus-visible:ring-inset focus-visible:ring-brand-600/40 focus-visible:ring-offset-0 data-[state=active]:border-brand-600 data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-brand-600 data-[state=active]:shadow-none"
        >
          {section.title}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
