import { useState } from 'react';
import { ExternalLink, Clock, Newspaper } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { Card, CardContent, Badge } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';

const CATEGORIES = ['Tất cả', 'Học bổng', 'Du học', 'Visa', 'Giáo dục'];

const TAG_STYLE = {
  'Học bổng': 'bg-primary-50 text-primary-700',
  'Visa': 'bg-success-50 text-success-700',
  'Du học': 'bg-secondary-50 text-secondary-700',
  'Giáo dục': 'bg-gray-100 text-gray-600',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80';

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
};

const NewsCard = ({ item }) => (
  <a href={item.link} target="_blank" rel="noopener noreferrer" className="group block">
    <Card hover className="h-full overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={item.imageUrl || FALLBACK_IMG}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG_STYLE[item.category] || TAG_STYLE['Giáo dục']}`}>
            {item.category}
          </span>
          <span className="text-xs text-gray-400">{item.source}</span>
        </div>
        <h3 className="line-clamp-2 font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{item.description}</p>
        )}
        <p className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDate(item.pubDate)}
          <ExternalLink className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary-500" />
        </p>
      </CardContent>
    </Card>
  </a>
);

const NewsPage = () => {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const { data, isLoading } = useNews({ limit: 40 });

  const allNews = data?.data || [];
  const filtered = activeCategory === 'Tất cả'
    ? allNews
    : allNews.filter((n) => n.category === activeCategory);

  return (
    <div className="bg-slate-50 min-h-screen">
      <PageHeader
        title="Tin tức giáo dục & học bổng"
        description="Cập nhật tin tức mới nhất về học bổng, du học, visa và giáo dục quốc tế từ các nguồn uy tín."
        icon={Newspaper}
      />

      <div className="container-page py-8">
        {/* Filter tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto self-center text-sm text-gray-400">
            {filtered.length} tin
          </span>
        </div>

        {isLoading && <div className="flex justify-center py-20"><LoadingSpinner /></div>}

        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center text-center text-gray-500">
              Không có tin tức nào trong danh mục này.
            </CardContent>
          </Card>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Sources */}
        {!isLoading && (
          <p className="mt-10 text-center text-xs text-gray-400">
            Nguồn: VnExpress Giáo dục · Tuổi Trẻ Giáo dục · Study International · ICEF Monitor
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
