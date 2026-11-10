import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';

const SCOPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'international', label: 'Du học' },
  { value: 'domestic', label: 'Trong nước' },
];

export default function ScopeTabs({ value, onChange }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList>
        {SCOPES.map((s) => (
          <TabsTrigger key={s.value} value={s.value}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
