import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { Card, CardContent } from './ui';
import LoadingSpinner from './LoadingSpinner';

const CATEGORY_COLOR = {
  'Học bổng': 'blue',
  'Visa': 'green',
  'Du học': 'purple',
  'Giáo dục': 'gray',
};

const TAG_STYLE = {
  'Học bổng': 'bg-primary-50 text-primary-700 dark:bg-purple-500/20 dark:text-purple-200',
  'Visa': 'bg-success-50 text-success-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  'Du học': 'bg-secondary-50 text-secondary-700 dark:bg-purple-500/20 dark:text-purple-200',
  'Giáo dục': 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
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
  const { data, isLoading } = useNews({ limit: 5 });
  const news = data?.data || [];

  const featured = news[0] || null;
  const sideItems = news.slice(1, 5);

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!news.length) return null;

  return (
    <section className="py-section bg-slate-50 dark:bg-transparent">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-purple-300">Cập nhật mới nhất</p>
            <h2 className="section-title mt-2 dark:text-white">Tin tức giáo dục & học bổng</h2>
          </div>
          <Link to="/news" className="btn-ghost self-start md:self-auto dark:text-gray-300 dark:hover:bg-white/8 dark:hover:text-white">
            Xem tất cả tin tức
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Featured article */}
          {featured && (
            <a href={featured.link} target="_blank" rel="noopener noreferrer" className="group block">
              <Card hover className="h-full overflow-hidden">
                <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-gray-800 sm:h-64">
                  <img
                    src={featured.imageUrl || FALLBACK_IMG}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <NewsTag category={featured.category} />
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.source} · {formatDate(featured.pubDate)}
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors">
                    {featured.title}
                  </h3>
                  {featured.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{featured.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-purple-300 group-hover:gap-2 transition-all">
                    Đọc thêm <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </CardContent>
              </Card>
            </a>
          )}

          {/* Side list */}
          <Card className="divide-y divide-gray-100 dark:divide-white/5">
            {sideItems.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 p-4 bg-transparent transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <NewsTag category={item.category} />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.source}</span>
                  </div>
                  <h4 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white group-hover:text-purple-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
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
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LatestNewsSection;
