import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

// ─── Animations ───
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ─── SECTION 1: NAVBAR ───
const Landing2Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #EBEBEB' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto" style={{ padding: '0 80px' }}>
        <div className="flex items-center justify-between h-16 max-[768px]:px-6" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
          {/* Logo */}
          <Link to="/home-2" className="flex items-center gap-0 text-xl tracking-tight" style={{ color: '#0F0F0F' }}>
            <span className="font-normal">Trade</span>
            <span className="font-bold">Valley</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium transition-colors" style={{ color: '#8A8A8A' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0F0F0F')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A8A8A')}
            >Features</Link>
            <Link to="/pricing" className="text-sm font-medium transition-colors" style={{ color: '#8A8A8A' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0F0F0F')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A8A8A')}
            >Pricing</Link>
            <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: '#8A8A8A' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0F0F0F')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A8A8A')}
            >How It Works</a>
          </div>

          {/* CTA */}
          <Link
            to="/entering"
            className="hidden md:inline-flex text-sm font-semibold px-5 py-2.5 transition-all duration-200"
            style={{
              backgroundColor: '#0F0F0F',
              color: '#FFFFFF',
              borderRadius: '4px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start Free — 14 Days
          </Link>
        </div>
      </div>
    </nav>
  );
};

// ─── Heatmap Visual ───
const HeatmapVisual = ({ large = false, variant = 'neutral' }: { large?: boolean; variant?: 'neutral' | 'classic' }) => {
  const heatmapData = [
    [32, 41, 55, 48, 37, 29],
    [45, 58, 72, 65, 52, 40],
    [38, 67, 89, 78, 61, 44],
    [50, 74, 85, 92, 70, 53],
    [42, 60, 76, 82, 68, 46],
    [35, 48, 62, 58, 50, 38],
  ];

  const getCellColor = (val: number) => {
    if (variant === 'classic') {
      if (val >= 80) return '#34d399';
      if (val >= 65) return '#6ee7b7';
      if (val >= 55) return '#a7f3d0';
      if (val >= 45) return '#fde68a';
      if (val >= 35) return '#fdba74';
      return '#fb923c';
    }
    if (val >= 80) return '#3d3d3d';
    if (val >= 65) return '#5a5a5a';
    if (val >= 55) return '#7a7a7a';
    if (val >= 45) return '#a0a0a0';
    if (val >= 35) return '#c0c0c0';
    return '#d8d8d8';
  };

  const highColor = variant === 'classic' ? '#34d399' : '#3d3d3d';
  const lowColor = variant === 'classic' ? '#fb923c' : '#d8d8d8';
  const trendStroke = variant === 'classic' ? '#059669' : '#0F0F0F';
  const trendOpacity = variant === 'classic' ? 0.6 : 0.3;
  const dotFill = variant === 'classic' ? '#059669' : '#0F0F0F';
  const dotOpacity = variant === 'classic' ? 0.6 : 0.4;

  return (
    <div
      className={large ? 'w-full' : 'w-full max-w-lg'}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBEBEB',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        borderRadius: '8px',
        padding: large ? '28px' : '24px',
      }}
    >
      {/* Label */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>
        EXIT ANALYZER
      </p>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>SL / TP Heatmap</p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: '#8A8A8A' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3d3d3d' }} /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d8d8d8' }} /> Low</span>
        </div>
      </div>

      {/* TP Labels */}
      <div className="flex gap-1 mb-1 pl-10">
        {['0.5', '1.0', '1.5', '2.0', '2.5', '3.0'].map(tp => (
          <div key={tp} className="flex-1 text-center text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8A8A8A' }}>{tp}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {heatmapData.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1">
            <div className="w-8 text-right text-[10px] pr-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8A8A8A' }}>
              {['0.3', '0.5', '0.8', '1.0', '1.5', '2.0'][ri]}
            </div>
            {row.map((val, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (ri * 6 + ci) * 0.02, duration: 0.25 }}
                className="flex-1 aspect-square flex items-center justify-center"
                style={{ backgroundColor: getCellColor(val), borderRadius: '4px' }}
              >
                <span className="text-[9px] font-semibold text-white/90" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid #EBEBEB' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>
          Exit Score Trend
        </p>
        <div className="h-14 relative">
          <svg viewBox="0 0 200 40" className="w-full h-full">
            <path d="M0,35 Q30,30 50,28 T100,20 T150,14 T200,8" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            {[10, 30, 55, 75, 95, 120, 140, 160, 185].map((x, i) => (
              <circle key={i} cx={x} cy={35 - i * 3 + Math.sin(i) * 4} r="2.5" fill="#0F0F0F" opacity="0.4" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Pain Cards Data ───
const painCards = [
  {
    title: 'Exiting winners too early',
    body: "It's not impatience. It's the absence of data showing you what your best exits actually look like. Once you see it — you can't unsee it.",
  },
  {
    title: 'Holding losers longer than planned',
    body: "Nobody does this intentionally. It happens when there's no clear record of how many times hope has cost more than a clean cut would have.",
  },
  {
    title: "Not knowing why some days work and others don't",
    body: "The difference between your best and worst trading days isn't luck. It's a pattern. It's in your data. You just haven't been shown it yet.",
  },
  {
    title: 'Trying journals before — and quitting',
    body: "Not because you lack discipline. Because the tools gave you 50 metrics and zero clarity on what to actually do differently tomorrow.",
  },
];

// ─── Testimonials Data ───
const testimonials = [
  {
    quote: "I discovered I lose on 71% of my trades in the first 30 minutes of market open. I stopped trading that window entirely. One insight from TradeValley paid for years of subscription.",
    name: 'Arjun M.',
    role: 'Options Trader · Zerodha',
  },
  {
    quote: "My Exit Score was 34 out of 100. I didn't want to believe it until the heatmap proved it trade by trade. Three months later it's 61 — and my monthly P&L reflects that number exactly.",
    name: 'Sneha R.',
    role: 'Futures Trader · Upstox',
  },
  {
    quote: "I've quit every other journal within a week. TradeValley showed me exactly 4 things to fix — nothing more. That restraint is why I still use it every single day.",
    name: 'Vikram T.',
    role: 'Equity Trader · Angel One',
  },
];

// ─── Feature list items for Exit Analyzer section ───
const exitFeatures = [
  'Automated SL/TP heatmap across all your historical trades',
  'Manual scenario testing — "What if I held 15 more minutes?"',
  'Scatter plot showing your exit quality trend over time',
  'Per-trade Exit Score from 0 to 100',
];

// ─── MAIN PAGE ───
const Landing2 = () => {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#FFFFFF', color: '#0F0F0F', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <Landing2Navbar />

      {/* ════════════════════════════════════════════
          SECTION 2 — HERO
      ════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24" style={{ padding: '0 80px' }}>
        <div className="max-w-7xl mx-auto max-[768px]:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy Stack */}
            <div>
              {/* Eyebrow */}
              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-6"
                style={{ color: '#8A8A8A' }}
              >
                For Traders Who Are Done Guessing
              </motion.p>

              {/* Headline — 3 lines, strict hierarchy */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <h1 className="flex flex-col" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <span className="text-2xl sm:text-3xl lg:text-[2.4rem] italic leading-[1.25]" style={{ color: '#555555' }}>
                    "Most traders have data."
                  </span>
                  <span className="text-2xl sm:text-3xl lg:text-[2.4rem] italic leading-[1.25] mt-1" style={{ color: '#555555' }}>
                    "Almost none have answers."
                  </span>
                  <span className="text-3xl sm:text-4xl lg:text-[3.2rem] font-bold leading-[1.15] mt-3" style={{ color: '#0F0F0F' }}>
                    TradeValley gives you both.
                  </span>
                </h1>
              </motion.div>

              {/* Sub-headline */}
              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="mt-5 leading-relaxed"
                style={{ fontSize: '17px', color: '#8A8A8A' }}
              >
                Your past trades know things about you that you don't.
              </motion.p>

              {/* CTA + Demo link */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="mt-8 flex flex-col items-start gap-3"
              >
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 transition-all duration-200"
                  style={{ backgroundColor: '#0F0F0F', color: '#FFFFFF', borderRadius: '4px' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Discover Your Edge Free <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-sm" style={{ color: '#8A8A8A' }}>
                  ▷ Watch 2-min Demo
                </span>
              </motion.div>

              {/* Micro Stats */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-10 flex flex-wrap items-start gap-0"
              >
                <div className="flex flex-col pr-6" style={{ borderRight: '1px solid #EBEBEB' }}>
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>₹499/month</span>
                  <span className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>Half the cost of every alternative</span>
                </div>
                <div className="flex flex-col px-6" style={{ borderRight: '1px solid #EBEBEB' }}>
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>14-day free trial</span>
                  <span className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>No card needed</span>
                </div>
                <div className="flex flex-col pl-6">
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>8+ brokers supported</span>
                  <span className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>File import ready · Auto-sync coming</span>
                </div>
              </motion.div>
            </div>

            {/* Right — Heatmap Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <HeatmapVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — PAIN
      ════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#F8F7F5', padding: '64px 80px' }}>
        <div className="max-w-5xl mx-auto max-[768px]:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#0F0F0F' }}>
              The market isn't the problem.
            </h2>
            <p className="mt-4 text-base leading-relaxed mx-auto" style={{ color: '#8A8A8A', maxWidth: '560px', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
              These aren't signs of a bad trader. They're signs of a trader who's been flying without instruments.
            </p>
          </motion.div>

          {/* 2×2 Grid */}
          <div className="grid sm:grid-cols-2 gap-5">
            {painCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBEBEB',
                  borderRadius: '8px',
                }}
              >
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#0F0F0F' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{card.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Closing line */}
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={5}
            className="text-center mt-12 text-base italic"
            style={{ fontFamily: "'Playfair Display', serif", color: '#8A8A8A' }}
          >
            "Your edge isn't missing. It's just been invisible."
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — EXIT ANALYZER
      ════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 lg:py-24" style={{ backgroundColor: '#FFFFFF', padding: '64px 80px' }}>
        <div className="max-w-7xl mx-auto max-[768px]:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5"
                  style={{
                    color: '#C9943A',
                    border: '1px solid #C9943A',
                    borderRadius: '20px',
                  }}
                >
                  ✦ Exclusive to TradeValley · Not available in any other journal
                </span>
              </motion.div>

              <motion.h2 variants={fadeUp} custom={1}
                className="text-3xl sm:text-4xl tracking-tight leading-[1.15]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="italic" style={{ color: '#8A8A8A' }}>"You had the right entry."</span>
                <br />
                <span className="italic font-bold text-[2.5rem]" style={{ color: '#0F0F0F' }}>"Did you have the right exit?"</span>
              </motion.h2>

              <motion.p variants={fadeUp} custom={2}
                className="mt-5 text-base leading-relaxed max-w-lg"
                style={{ color: '#8A8A8A' }}
              >
                Run automated heatmaps across every SL/TP combination. Test manual scenarios. Score every exit. For the first time — see exactly what your exit decisions are costing you, on every single trade.
              </motion.p>

              {/* Feature list with gold dots */}
              <motion.ul variants={fadeUp} custom={3} className="mt-6 space-y-3">
                {exitFeatures.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm" style={{ color: '#555555' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#C9943A' }} />
                    {line}
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={fadeUp} custom={4} className="mt-8">
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 transition-all duration-200"
                  style={{ backgroundColor: '#0F0F0F', color: '#FFFFFF', borderRadius: '4px' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Analyze Your First Trade Free <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <HeatmapVisual large />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5 — SOCIAL PROOF
      ════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#F8F7F5', padding: '64px 80px' }}>
        <div className="max-w-5xl mx-auto max-[768px]:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#0F0F0F' }}>
              What changes when you finally see your patterns.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="p-6 flex flex-col"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBEBEB',
                  borderRadius: '8px',
                }}
              >
                <p className="text-sm leading-relaxed flex-1 italic" style={{ fontFamily: "'Playfair Display', serif", color: '#555555' }}>
                  "{t.quote}"
                </p>
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid #EBEBEB' }}>
                  <p className="text-sm font-semibold" style={{ color: '#0F0F0F' }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8A8A8A' }}>{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6 — FINAL CTA STRIP
      ════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: '#0D3D2A', padding: '80px' }}>
        <div className="max-w-3xl mx-auto text-center max-[768px]:px-6">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#FFFFFF' }}
          >
            The only trader you can truly improve is yourself.
          </motion.h2>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="mt-4 text-base"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Start with your data. See your patterns. Trade better.
          </motion.p>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            className="mt-8"
          >
            <Link
              to="/entering"
              className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 transition-all duration-200"
              style={{ backgroundColor: '#FFFFFF', color: '#0D3D2A', borderRadius: '4px' }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Start Free for 14 Days <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={3}
            className="mt-5 text-xs"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            No credit card · Cancel anytime · Up and running in under 5 minutes
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#0F0F0F' }}>
        <div className="max-w-7xl mx-auto py-16" style={{ padding: '64px 80px' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-[768px]:px-6">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-0 text-xl tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
                <span className="font-normal">Trade</span>
                <span className="font-bold">Valley</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>
                The trading journal for traders who refuse to stay average.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-sm transition-colors hover:text-white" style={{ color: '#BFBFBF' }}>Features</Link></li>
                <li><Link to="/pricing" className="text-sm transition-colors hover:text-white" style={{ color: '#BFBFBF' }}>Pricing</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/entering" className="text-sm transition-colors hover:text-white" style={{ color: '#BFBFBF' }}>Get Started</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8A8A8A' }}>Legal</h4>
              <ul className="space-y-3">
                <li><span className="text-sm cursor-default" style={{ color: '#666666' }}>Privacy Policy</span></li>
                <li><span className="text-sm cursor-default" style={{ color: '#666666' }}>Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 max-[768px]:px-6" style={{ borderTop: '1px solid #2a2a2a' }}>
            <p className="text-xs" style={{ color: '#666666' }}>© {new Date().getFullYear()} TradeValley. All rights reserved.</p>
            <p className="text-xs" style={{ color: '#666666' }}>Built by traders, for traders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing2;
