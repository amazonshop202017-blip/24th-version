import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const SharedNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        borderBottom: scrolled ? '1px solid #EBEBEB' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark */}
          <Link to="/" className="text-lg tracking-tight" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <span className="font-normal" style={{ color: '#0F0F0F' }}>Trade</span>
            <span className="font-bold" style={{ color: '#0F0F0F' }}>Valley</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-10">
            {['Home', 'Features', 'Pricing', 'How It Works'].map((label) => (
              <Link
                key={label}
                to={label === 'Home' ? '/' : label === 'How It Works' ? '#how-it-works' : label === 'Pricing' ? '/pricing' : `/${label.toLowerCase()}`}
                className="text-sm transition-colors"
                style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F0F0F')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8A8A8A')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/entering"
              className="text-sm font-semibold px-5 py-2.5 transition-colors"
              style={{
                background: '#0F0F0F',
                color: '#FFFFFF',
                borderRadius: 0,
              }}
            >
              Get Started
            </Link>
            <Link
              to="/entering"
              className="text-sm font-medium px-4 py-2.5 transition-colors"
              style={{ color: '#0F0F0F', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8A8A8A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#0F0F0F')}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
