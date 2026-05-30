import { useState } from 'react';
import { ExternalLink, Clock, Newspaper } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { Card, CardContent } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/ui/PageHeader';

const CATEGORIES = ['Tất cả', 'Học bổng', 'Du học', 'Visa', 'Giáo dục'];

const TAG_STYLE = {
  'Học bổng': 'bg-primary-400/10 text-primary-400',
  'Visa': 'bg-success-500/10 text-success-400',
  'Du học': 'bg-blue-500/10 text-blue-400',
  'Giáo dục': 'bg-ink-800 text-ink-300',
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
    <Card hover className="h-full overflow-hidden bg-ink-900 border border-ink-800">
      <div className="relative h-44 overflow-hidden bg-ink-800">
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
          <span className="text-xs text-ink-500">{item.source}</span>
        </div>
        <h3 className="line-clamp-2 font-bold text-ink-100 group-hover:text-primary-400 transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-400">{item.description}</p>
        )}
        <p className="mt-3 flex items-center gap-1 text-xs text-ink-500">
          <Clock className="w-3 h-3" />
          {formatDate(item.pubDate)}
          <ExternalLink className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
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
    <div className="bg-ink-950 min-h-screen">
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
                  ? 'bg-primary-400 text-ink-950'
                  : 'bg-ink-900 text-ink-400 border border-ink-800 hover:border-primary-400/50 hover:text-primary-400'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto self-center text-sm text-ink-500">
            {filtered.length} tin
          </span>
        </div>

        {isLoading && <div className="flex justify-center py-20"><LoadingSpinner /></div>}

        {!isLoading && filtered.length === 0 && (
          <Card className="bg-ink-900 border border-ink-800">
            <CardContent className="flex min-h-48 items-center justify-center text-center text-ink-400">
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
          <p className="mt-10 text-center text-xs text-ink-500">
            Nguồn: VnExpress Giáo dục · Tuổi Trẻ Giáo dục · Study International · ICEF Monitor
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
