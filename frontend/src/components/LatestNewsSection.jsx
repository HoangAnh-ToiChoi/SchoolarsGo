import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import LoadingSpinner from './LoadingSpinner';

const TAG_STYLE = {
  'Học bổng': 'bg-primary-400/10 text-primary-400',
  'Visa': 'bg-success-500/10 text-success-400',
  'Du học': 'bg-blue-500/10 text-blue-400',
  'Giáo dục': 'bg-ink-800 text-ink-300',
};

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

const NewsTag = ({ category }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG_STYLE[category] || TAG_STYLE['Giáo dục']}`}>
    {category}
  </span>
);

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80';

const LatestNewsSection = () => {
  const { data, isLoading, isError } = useNews({ limit: 5 });
  const news = data?.data || [];

  const featured = news[0] || null;
  const sideItems = news.slice(1, 5);

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (isError) {
    return (
      <section className="py-16 bg-ink-950">
        <div className="container-page">
          <div className="rounded-xl border border-ink-800 bg-ink-900 p-6 text-sm text-ink-400">
            Chưa thể tải tin tức mới nhất. Vui lòng thử lại sau.
          </div>
        </div>
      </section>
    );
  }
  if (!news.length) return null;

  return (
    <section className="py-20 bg-ink-950">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-400">Cập nhật mới nhất</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-ink-100">Tin tức giáo dục & học bổng</h2>
          </div>
          <Link to="/news" className="btn-ghost self-start md:self-auto">
            Xem tất cả tin tức
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Featured article */}
          {featured && (
            <a href={featured.link} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="h-full overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-all duration-300 hover:border-primary-400/40 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="relative h-52 overflow-hidden bg-ink-800 sm:h-64">
                  <img
                    src={featured.imageUrl || FALLBACK_IMG}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <NewsTag category={featured.category} />
                  </div>
                </div>
                <div className="p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-500">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.source} · {formatDate(featured.pubDate)}
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold text-ink-100 group-hover:text-primary-300 transition-colors">
                    {featured.title}
                  </h3>
                  {featured.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-400">{featured.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-400 group-hover:gap-2 transition-all">
                    Đọc thêm <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </a>
          )}

          {/* Side list */}
          <div className="rounded-xl border border-ink-800 bg-ink-900 divide-y divide-ink-800 overflow-hidden">
            {sideItems.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 p-4 transition-colors hover:bg-ink-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <NewsTag category={item.category} />
                    <span className="text-xs text-ink-500">{item.source}</span>
                  </div>
                  <h4 className="line-clamp-2 text-sm font-semibold text-ink-200 group-hover:text-primary-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.pubDate)}
                  </p>
                </div>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LatestNewsSection;
