import { AlertCircle, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '~/components/legacy';
import { URGENCY_CLASS } from '~/pages/dashboard/constants';
import { getDaysUntil, getDeadlineUrgency } from '~/pages/dashboard/helpers';
import { cn } from '~/utils/cn';
import { formatDate } from '~/utils/format';

export default function UpcomingDeadlines({ scholarships, now }) {
  return (
    <section>
      <h2 className="heading-3 mb-4">Sắp tới hạn</h2>
      <div className="space-y-3">
        {scholarships.map((scholarship) => {
          const daysUntil = getDaysUntil(scholarship.deadline, now);
          const urgency = URGENCY_CLASS[getDeadlineUrgency(daysUntil)];
          return (
            <Card key={scholarship.id} className={cn('hover', urgency.border)}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={cn('w-5 h-5 flex-shrink-0', urgency.icon)} />
                      <p className="font-semibold text-ink-100 truncate">{scholarship.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-ink-300 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {scholarship.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDate(scholarship.deadline, 'dd/MM/yyyy')}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-4 h-4" />
                        {daysUntil} ngày
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
