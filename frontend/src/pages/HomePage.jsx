import { useState } from 'react';
import { useScholarships } from '../hooks/useScholarship';
import { AuroraBackground } from '../components/landing/AuroraBackground';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { ScholarshipPreview } from '../components/landing/ScholarshipPreview';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const { data: featured, isLoading } = useScholarships({ featured: 'true', limit: 6 });
  const featuredScholarships = featured?.data || [];

  return (
    <div className="landing-theme min-h-screen relative overflow-hidden bg-landing-background selection:bg-landing-primary/30">
      {/* Animated Aurora Background */}
      <AuroraBackground />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Scholarship Preview */}
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <ScholarshipPreview scholarships={featuredScholarships} />
      )}
    </div>
  );
};

export default HomePage;
