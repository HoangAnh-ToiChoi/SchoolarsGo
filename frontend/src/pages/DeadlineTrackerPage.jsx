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
import { AuroraBackground } from '../components/landing/AuroraBackground';

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
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex justify-center gap-0.5">
            {dayDeadlines.slice(0, 3).map((d, i) => (
              <div key={i} className={cn(
                'w-1.5 h-1.5 rounded-full shadow-sm',
                d.color === 'red' ? 'bg-rose-500 shadow-rose-500/50' :
                d.color === 'orange' ? 'bg-amber-400 shadow-amber-400/50' :
                'bg-cyan-400 shadow-cyan-400/50'
              )} />
            ))}
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
        return 'has-deadline relative pb-3';
      }
    }
    return null;
  };

  if (isLoading) return <div className="landing-theme min-h-screen bg-[#050510] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="landing-theme min-h-screen relative overflow-hidden bg-[#050510] text-white pb-24">
      <AuroraBackground />
      
      <div className="container-page relative z-10 pt-24 md:pt-32 mb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-100">Lịch trình của bạn</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Theo Dõi Deadline
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
            Quản lý các hạn nộp học bổng và không bỏ lỡ bất kỳ cột mốc quan trọng nào.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.1)] h-full">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                Lịch deadline
              </h3>

              <div className="calendar-container p-4 bg-black/20 rounded-2xl border border-white/5">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="w-full"
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 text-sm text-white/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
                  <span>Hạn nộp học bổng</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                  <span>Hạn nộp (chưa ứng tuyển)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                  <span>Theo dõi đơn ứng tuyển</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Details */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-6 pb-4 border-b border-white/10">
                {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h3>

              {selectedDateDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateDeadlines.map(deadline => (
                    <div key={deadline.id} className="p-4 bg-black/20 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-lg',
                          deadline.color === 'red' ? 'bg-rose-500 shadow-rose-500/50' :
                          deadline.color === 'orange' ? 'bg-amber-400 shadow-amber-400/50' :
                          'bg-cyan-400 shadow-cyan-400/50'
                        )} />
                        <div className="flex-1">
                          <p className="text-base font-bold text-white/90">
                            {deadline.title}
                          </p>
                          <p className="text-sm text-white/50 mt-1.5 uppercase tracking-wider font-semibold text-xs">
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
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 italic">
                    Không có sự kiện nào trong ngày này
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] pointer-events-none" />
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
                Sắp đến hạn
                <span className="text-sm font-normal text-white/40 ml-auto">(7 ngày tới)</span>
              </h3>

              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {upcomingDeadlines.map(deadline => (
                    <div key={deadline.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                      <div className={cn(
                        'w-3 h-3 rounded-full flex-shrink-0 shadow-lg',
                        deadline.color === 'red' ? 'bg-rose-500 shadow-rose-500/50' :
                        deadline.color === 'orange' ? 'bg-amber-400 shadow-amber-400/50' :
                        'bg-cyan-400 shadow-cyan-400/50'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white/90 truncate">
                          {deadline.title}
                        </p>
                        <p className="text-xs text-white/50 mt-1 font-mono tracking-widest">
                          {format(deadline.date, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 relative z-10">
                  <p className="text-white/40 italic">
                    Không có deadline sắp đến
                  </p>
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