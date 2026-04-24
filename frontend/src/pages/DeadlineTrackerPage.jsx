import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, isSameDay, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useApplications } from '../hooks/useApplication';
import { useScholarships } from '../hooks/useScholarship';
import { cn, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { PageHeader, Card, CardContent, Badge } from '../components/ui';

const DeadlineTrackerPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: applications, isLoading: appsLoading } = useApplications();
  const { data: scholarships, isLoading: scholarshipsLoading } = useScholarships({ limit: 100 });

  const isLoading = appsLoading || scholarshipsLoading;

  // Combine deadlines from applications and scholarships
  const deadlines = useMemo(() => {
    const deadlineItems = [];

    // Application deadlines (follow-up dates, interview dates, etc.)
    applications?.data?.forEach(app => {
      if (app.applied_at) {
        // Add follow-up reminder (2 weeks after application)
        const followUpDate = new Date(app.applied_at);
        followUpDate.setDate(followUpDate.getDate() + 14);

        deadlineItems.push({
          id: `app-${app.id}-followup`,
          type: 'application_followup',
          title: `Theo dõi đơn: ${app.scholarship?.title}`,
          date: followUpDate,
          item: app,
          color: 'blue'
        });
      }

      // Add scholarship deadline if application is still active
      if (app.scholarship?.deadline && ['draft', 'submitted', 'under_review'].includes(app.status)) {
        const deadlineDate = parseISO(app.scholarship.deadline);
        if (isAfter(deadlineDate, new Date())) {
          deadlineItems.push({
            id: `app-${app.id}-deadline`,
            type: 'scholarship_deadline',
            title: `Hạn nộp: ${app.scholarship.title}`,
            date: deadlineDate,
            item: app.scholarship,
            color: 'red'
          });
        }
      }
    });

    // Scholarship deadlines (for scholarships user hasn't applied to yet)
    scholarships?.data?.forEach(scholarship => {
      if (scholarship.deadline) {
        const deadlineDate = parseISO(scholarship.deadline);
        if (isAfter(deadlineDate, new Date())) {
          // Check if user already applied
          const hasApplied = applications?.data?.some(app => app.scholarship_id === scholarship.id);
          if (!hasApplied) {
            deadlineItems.push({
              id: `scholarship-${scholarship.id}`,
              type: 'scholarship_deadline',
              title: `Hạn nộp: ${scholarship.title}`,
              date: deadlineDate,
              item: scholarship,
              color: 'orange'
            });
          }
        }
      }
    });

    return deadlineItems.sort((a, b) => a.date - b.date);
  }, [applications, scholarships]);

  // Get deadlines for selected date
  const selectedDateDeadlines = useMemo(() => {
    return deadlines.filter(deadline =>
      isSameDay(deadline.date, selectedDate)
    );
  }, [deadlines, selectedDate]);

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const today = startOfDay(new Date());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return deadlines.filter(deadline =>
      isAfter(deadline.date, today) && isBefore(deadline.date, nextWeek)
    ).slice(0, 5); // Show top 5
  }, [deadlines]);

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));
      if (dayDeadlines.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              dayDeadlines.some(d => d.color === 'red') ? 'bg-danger-500' :
              dayDeadlines.some(d => d.color === 'orange') ? 'bg-warning-500' :
              'bg-primary-500'
            )} />
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile class name
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));
      if (dayDeadlines.length > 0) {
        return 'has-deadline';
      }
    }
    return null;
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container-page py-8">
      <PageHeader
        title="Theo dõi deadline"
        description="Quản lý các hạn nộp học bổng và deadline quan trọng"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-heading-3 text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Lịch deadline
              </h3>

              <div className="calendar-container">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="w-full border-none"
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-body-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <span>Hạn nộp học bổng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <span>Hạn nộp (chưa ứng tuyển)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span>Theo dõi đơn ứng tuyển</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-heading-4 text-gray-900 mb-4">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h3>

              {selectedDateDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateDeadlines.map(deadline => (
                    <div key={deadline.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full mt-1.5 flex-shrink-0',
                          deadline.color === 'red' ? 'bg-danger-500' :
                          deadline.color === 'orange' ? 'bg-warning-500' :
                          'bg-primary-500'
                        )} />
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-gray-900">
                            {deadline.title}
                          </p>
                          <p className="text-caption text-gray-600 mt-1">
                            {deadline.type === 'application_followup' ? 'Theo dõi tiến độ' :
                             deadline.type === 'scholarship_deadline' ? 'Hạn nộp học bổng' :
                             'Deadline'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-gray-500 italic">
                  Không có deadline nào trong ngày này
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-heading-4 text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sắp đến hạn (7 ngày)
              </h3>

              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map(deadline => (
                    <div key={deadline.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={cn(
                        'w-3 h-3 rounded-full flex-shrink-0',
                        deadline.color === 'red' ? 'bg-danger-500' :
                        deadline.color === 'orange' ? 'bg-warning-500' :
                        'bg-primary-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-gray-900 truncate">
                          {deadline.title}
                        </p>
                        <p className="text-caption text-gray-600">
                          {format(deadline.date, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-gray-500 italic">
                  Không có deadline sắp đến
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeadlineTrackerPage;