import { motion } from 'framer-motion';
import { useScholarships } from '../hooks/useScholarship';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { ScholarshipPreview } from '../components/landing/ScholarshipPreview';
import LatestNewsSection from '../components/LatestNewsSection';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const { data: featured, isLoading } = useScholarships({ featured: 'true', limit: 6 });
  const { data: allScholarships } = useScholarships({ limit: 1 });
  const featuredScholarships = featured?.data || [];
  const totalScholarships = allScholarships?.meta?.total ?? null;

  return (
    <motion.div className="min-h-screen bg-ink-950" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Hero totalScholarships={totalScholarships} />
      <Features />
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <ScholarshipPreview scholarships={featuredScholarships} />
      )}
      <LatestNewsSection />
    </motion.div>
  );
};

export default HomePage;
