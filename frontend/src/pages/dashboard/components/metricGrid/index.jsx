import { Card, CardContent } from '~/components/legacy';
import { cn } from '~/utils/cn';
import { METRICS } from '~/pages/dashboard/constants';

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
