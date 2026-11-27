import { BookmarkIcon, ClipboardCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '~/components/legacy';
import { cn } from '~/utils/cn';

const METRICS = [
  { id: 'total-apps', label: 'Tổng đơn ứng tuyển', key: 'totalApps', icon: ClipboardCheck, color: 'text-primary-400' },
  { id: 'saved-scholarships', label: 'Học bổng đã lưu', key: 'savedCount', icon: BookmarkIcon, color: 'text-warning-400' },
  { id: 'profile-completion', label: 'Hoàn thành profile', key: 'completion', icon: ClipboardCheck, color: 'text-success-400' },
  { id: 'upcoming-deadlines', label: 'Sắp tới hạn', key: 'upcomingCount', icon: AlertCircle, color: 'text-danger-400' },
];

export default function MetricGrid({ stats }) {
  return (
    <section>
      <h2 className="heading-3 mb-4">Tổng quan</h2>
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ id, label, key, icon: Icon, color }) => (
          <Card key={id} className="hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-300 mb-2">{label}</p>
                  <p className="text-2xl font-bold text-primary-400">{stats[key]}</p>
                </div>
                <Icon className={cn('w-8 h-8', color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
