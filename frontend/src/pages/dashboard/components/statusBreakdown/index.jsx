import { Card, CardContent, Badge } from '~/components/legacy';
import { STATUS_BADGE_COLORS, STATUS_BADGE_LABELS } from '~/pages/dashboard/constants';

export default function StatusBreakdown({ statusCounts }) {
  return (
    <section>
      <h2 className="heading-3 mb-4">Phân bố trạng thái</h2>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(STATUS_BADGE_LABELS).map(([status, label]) => (
              <div key={status} className="text-center">
                <p className="text-2xl font-bold text-ink-100 mb-1">{statusCounts[status] ?? 0}</p>
                <Badge color={STATUS_BADGE_COLORS[status]} className="w-full justify-center">
                  {label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
