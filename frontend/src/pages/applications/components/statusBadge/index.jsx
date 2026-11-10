import { Badge } from '~/components/ui/badge';
import { STATUS_META } from '~/pages/applications/helper';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
