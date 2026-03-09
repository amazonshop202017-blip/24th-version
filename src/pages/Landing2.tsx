import { SharedNavbar } from '@/components/landing/SharedNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const Landing2 = () => {
  return (
    <div className="min-h-screen bg-white">
      <SharedNavbar />
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
          Home 2 — Coming Soon
        </p>
      </div>
      <LandingFooter />
    </div>
  );
};

export default Landing2;