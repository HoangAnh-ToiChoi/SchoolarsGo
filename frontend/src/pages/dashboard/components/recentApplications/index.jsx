import { ArrowRight, Circle } from 'lucide-react';
import { Card, CardContent, Badge } from '~/components/legacy';
import { STATUS_BADGE_COLORS, STATUS_BADGE_LABELS } from '~/pages/dashboard/constants';
import { formatDate } from '~/utils/format';

export default function RecentApplications({ applications }) {
  return (
    <section>
      <h2 className="heading-3 mb-4">Ứng tuyển gần đây</h2>
      <div className="space-y-3">
        {applications.map((app) => (
          <Card key={app.id} className="hover">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className="w-2 h-2 flex-shrink-0 text-primary-400" />
                    <p className="font-semibold text-ink-100 truncate">{app.scholarship?.title || 'Không xác định'}</p>
                  </div>
                  <p className="text-sm text-ink-300 mb-3">
                    Ứng tuyển lúc: {formatDate(app.created_at, 'dd/MM/yyyy HH:mm')}
                  </p>
                  <Badge color={STATUS_BADGE_COLORS[app.status]}>{STATUS_BADGE_LABELS[app.status]}</Badge>
                </div>
                <ArrowRight className="w-5 h-5 text-ink-500 flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
