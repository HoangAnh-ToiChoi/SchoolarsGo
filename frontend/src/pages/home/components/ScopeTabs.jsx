import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';

const SCOPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'international', label: 'Du học' },
  { value: 'domestic', label: 'Trong nước' },
];

export default function ScopeTabs({ value, onChange }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-control rounded-inner bg-track p-1">
        {SCOPES.map((s) => (
          <TabsTrigger
            key={s.value}
            value={s.value}
            className="h-full rounded-[7px] px-4 text-[13px] text-fg-secondary data-[state=active]:font-semibold data-[state=active]:text-fg"
          >
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
