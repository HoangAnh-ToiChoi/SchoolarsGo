import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format, isSameDay, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useApplications } from '../hooks/useApplication';
import { useScholarships } from '../hooks/useScholarship';
import { cn } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const DeadlineTrackerPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: applications, isLoading: appsLoading } = useApplications();
  const { data: scholarships, isLoading: scholarshipsLoading } = useScholarships({ limit: 100 });

  const isLoading = appsLoading || scholarshipsLoading;

  const deadlines = useMemo(() => {
    const deadlineItems = [];

    applications?.data?.forEach(app => {
      if (app.applied_at) {
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

    scholarships?.data?.forEach(scholarship => {
      if (scholarship.deadline) {
        const deadlineDate = parseISO(scholarship.deadline);
        if (isAfter(deadlineDate, new Date())) {
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

  const selectedDateDeadlines = useMemo(() => {
    return deadlines.filter(deadline => isSameDay(deadline.date, selectedDate));
  }, [deadlines, selectedDate]);

  const upcomingDeadlines = useMemo(() => {
    const today = startOfDay(new Date());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return deadlines.filter(deadline =>
      isAfter(deadline.date, today) && isBefore(deadline.date, nextWeek)
    ).slice(0, 5);
  }, [deadlines]);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));
      if (dayDeadlines.length > 0) {
        return (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex justify-center gap-0.5">
            {dayDeadlines.slice(0, 3).map((d, i) => (
              <div key={i} className={cn(
                'w-1.5 h-1.5 rounded-full',
                d.color === 'red' ? 'bg-danger-600' :
                d.color === 'orange' ? 'bg-warning-600' :
                'bg-primary-600'
              )} />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));
      if (dayDeadlines.length > 0) return 'has-deadline relative pb-3';
    }
    return null;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950 pb-16">
      <div className="bg-ink-950 border-b border-ink-800 py-10">
        <div className="container-page">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900 px-4 py-1.5 text-sm text-ink-300 mb-5">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>Lịch trình của bạn</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-100 mb-3">Theo Dõi Deadline</h1>
          <p className="text-ink-400 max-w-2xl text-lg">
            Quản lý các hạn nộp học bổng và không bỏ lỡ bất kỳ cột mốc quan trọng nào.
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-ink-100 mb-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-400/10 flex items-center justify-center text-primary-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                Lịch deadline
              </h3>

              <div className="calendar-container">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 pt-6 border-t border-ink-800 text-sm text-ink-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger-600" />
                  <span>Hạn nộp học bổng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-600" />
                  <span>Hạn nộp (chưa ứng tuyển)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-600" />
                  <span>Theo dõi đơn ứng tuyển</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-ink-900 border border-ink-800 rounded-card p-6">
              <h3 className="font-semibold text-ink-100 mb-4 pb-3 border-b border-ink-800 capitalize">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h3>

              {selectedDateDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateDeadlines.map(deadline => (
                    <div key={deadline.id} className="p-3 bg-ink-950 border border-ink-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
                          deadline.color === 'red' ? 'bg-danger-600' :
                          deadline.color === 'orange' ? 'bg-warning-600' :
                          'bg-primary-600'
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-100">{deadline.title}</p>
                          <p className="text-xs text-ink-400 mt-1">
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
                <div className="text-center py-8">
                  <CalendarIcon className="w-8 h-8 text-ink-700 mx-auto mb-3" />
                  <p className="text-sm text-ink-500 italic">Không có sự kiện nào trong ngày này</p>
                </div>
              )}
            </div>

            <div className="bg-ink-900 border border-ink-800 rounded-card p-6">
              <h3 className="font-semibold text-ink-100 mb-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary-400/10 flex items-center justify-center text-primary-400">
                  <Clock className="w-5 h-5" />
                </div>
                Sắp đến hạn
                <span className="text-xs font-normal text-ink-500 ml-auto">(7 ngày tới)</span>
              </h3>

              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map(deadline => (
                    <div key={deadline.id} className="flex items-center gap-3 p-3 bg-ink-950 border border-ink-800 rounded-lg">
                      <div className={cn(
                        'w-2.5 h-2.5 rounded-full flex-shrink-0',
                        deadline.color === 'red' ? 'bg-danger-600' :
                        deadline.color === 'orange' ? 'bg-warning-600' :
                        'bg-primary-600'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-100 truncate">{deadline.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{format(deadline.date, 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-ink-500 italic">Không có deadline sắp đến</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeadlineTrackerPage;
