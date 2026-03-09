import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { useState, useEffect } from 'react';
import { SharedNavbar } from '@/components/landing/SharedNavbar';

// ─── Animations ───
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] as const },
  }),
};



// ─── Heatmap Mock UI Card ───
const HeatmapCard = ({ large = false }: { large?: boolean }) => {
  const heatmapData = [
    [32, 41, 55, 48, 37, 29],
    [45, 58, 72, 65, 52, 40],
    [38, 67, 89, 78, 61, 44],
    [50, 74, 85, 92, 70, 53],
    [42, 60, 76, 82, 68, 46],
    [35, 48, 62, 58, 50, 38],
  ];

  const getColor = (val: number) => {
    if (val >= 80) return '#059669';
    if (val >= 65) return '#34d399';
    if (val >= 55) return '#6ee7b7';
    if (val >= 45) return '#fcd34d';
    if (val >= 35) return '#fdba74';
    return '#fb923c';
  };

  return (
    <div
      className={`bg-white ${large ? 'p-8' : 'p-7'} w-full`}
      style={{
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        border: '1px solid #EBEBEB',
        borderRadius: '2px',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>Exit Analyzer</p>
          <p className="text-base font-bold mt-0.5" style={{ color: '#0F0F0F' }}>SL / TP Heatmap</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8A8A8A' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#059669' }} /> High
          <span className="w-2.5 h-2.5 rounded-full ml-2" style={{ background: '#fb923c' }} /> Low
        </div>
      </div>

      {/* TP Labels */}
      <div className="flex gap-1.5 mb-1.5 pl-12">
        {['0.5', '1.0', '1.5', '2.0', '2.5', '3.0'].map(tp => (
          <div key={tp} className="flex-1 text-center text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8A8A8A' }}>{tp}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1.5">
        {heatmapData.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1.5">
            <div className="w-10 text-right text-[11px] pr-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8A8A8A' }}>
              {['0.3', '0.5', '0.8', '1.0', '1.5', '2.0'][ri]}
            </div>
            {row.map((val, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (ri * 6 + ci) * 0.025, duration: 0.35 }}
                className="flex-1 aspect-square flex items-center justify-center"
                style={{ background: getColor(val), borderRadius: '2px' }}
              >
                <span className="text-[11px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.9)' }}>{val}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="mt-6 pt-5" style={{ borderTop: '1px solid #EBEBEB' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>Exit Score Trend</p>
        <div className="h-20 relative">
          <svg viewBox="0 0 200 50" className="w-full h-full">
            <path d="M0,45 Q30,38 50,35 T100,25 T150,17 T200,10" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
            {[10, 30, 55, 75, 95, 120, 140, 160, 185].map((x, i) => (
              <circle key={i} cx={x} cy={45 - i * 3.5 + Math.sin(i) * 4} r="3" fill="#059669" opacity="0.6" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard Mock Card (for Product Reveal) ───
const DashboardMockCard = () => {
  return (
    <div
      className="bg-white w-full"
      style={{
        boxShadow: '0 12px 60px rgba(0,0,0,0.1)',
        border: '1px solid #EBEBEB',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: '1px solid #EBEBEB' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#E5E5E5' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#E5E5E5' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#E5E5E5' }} />
        <div className="ml-4 h-5 rounded-sm flex-1 max-w-[200px]" style={{ background: '#F5F5F5' }} />
      </div>

      <div className="p-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total P&L', value: '+₹47,250', color: '#059669' },
            { label: 'Win Rate', value: '62.4%', color: '#0F0F0F' },
            { label: 'Profit Factor', value: '1.87', color: '#0F0F0F' },
            { label: 'Avg RRR', value: '1:2.3', color: '#0F0F0F' },
          ].map((stat) => (
            <div key={stat.label} className="p-4" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: '2px' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</p>
              <p className="text-lg font-bold" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cumulative P&L */}
          <div className="p-4" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: '2px' }}>
            <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>Cumulative P&L</p>
            <svg viewBox="0 0 200 60" className="w-full h-16">
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,30 L120,25 L140,18 L160,15 L180,12 L200,8" fill="none" stroke="#059669" strokeWidth="2" />
              <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,30 L120,25 L140,18 L160,15 L180,12 L200,8 L200,60 L0,60 Z" fill="url(#pnlGrad)" />
            </svg>
          </div>

          {/* Win/Loss distribution */}
          <div className="p-4" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: '2px' }}>
            <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>Win / Loss</p>
            <div className="flex items-end gap-1 h-16">
              {[35, 55, -20, 45, -15, 60, 30, -25, 50, 40, -10, 55, 25, -30, 45].map((v, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    height: `${Math.abs(v)}%`,
                    background: v > 0 ? '#059669' : '#ef4444',
                    borderRadius: '1px',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Pain cards data ───
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
    title: 'Your best and worst days feel random',
    body: "They aren't random. There's a session, a setup, a mental state behind every pattern. It's already in your data. You just haven't been shown it yet.",
  },
  {
    title: "You've tried journaling — and quit",
    body: "Not because you lack discipline. Because the tools buried you in 50 metrics and gave you zero clarity on what to actually do differently tomorrow.",
  },
];


// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
const Landing4 = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ color: '#0F0F0F' }}>
      <Landing4Navbar />

      {/* ════════════════════════════════════════
          SECTION 2 — HERO
      ════════════════════════════════════════ */}
      <section className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-start">
            {/* Left column */}
            <div>
              {/* Tagline mark */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8 pt-1.5">
                <div className="flex items-center gap-2 text-xs lg:text-sm tracking-[0.15em]" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                  <span className="font-normal" style={{ color: '#8A8A8A' }}>Look inward</span>
                  <span className="text-base font-light" style={{ color: '#059669' }}>/</span>
                  <span className="font-bold" style={{ color: '#0F0F0F' }}>Trade forward</span>
                </div>
                <p className="mt-2 text-xs lg:text-[0.8rem] italic max-w-md" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                  The traders who improve fastest aren't the ones who study markets harder. They're the ones who study themselves.
                </p>
                <div className="w-full h-px" style={{ background: '#EBEBEB', marginTop: '40px', marginBottom: '29px' }} />
              </motion.div>

              {/* Headline */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <h1 className="flex flex-col" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <span className="italic font-medium text-2xl sm:text-3xl lg:text-[2rem] leading-[1.3]" style={{ color: '#8A8A8A' }}>
                    Most traders have data.
                  </span>
                  <span className="italic font-medium text-2xl sm:text-3xl lg:text-[2.3rem] leading-[1.3] mt-1" style={{ color: '#8A8A8A' }}>
                    Almost none have answers.
                  </span>
                  <span className="font-bold text-3xl sm:text-4xl lg:text-[3rem] leading-[1.15] mt-3" style={{ color: '#0F0F0F' }}>
                    TradeValley gives you both.
                  </span>
                </h1>
              </motion.div>

              {/* Sub-headline */}
              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="mt-6 text-base lg:text-lg whitespace-nowrap"
                style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
              >
                Your past trades know things about you that you don't.
              </motion.p>

              {/* CTA block */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mt-10 flex flex-col items-start gap-3">
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 transition-colors"
                  style={{ background: '#0F0F0F', color: '#FFFFFF', borderRadius: 0 }}
                >
                  Discover Your Edge Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                  <Play className="w-3.5 h-3.5" /> Watch 2-min Demo
                </button>
              </motion.div>

              {/* Micro-stats */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-14 flex flex-wrap items-stretch gap-0 text-xs" style={{ color: '#8A8A8A' }}>
                <div className="flex flex-col pr-7" style={{ borderRight: '1px solid #EBEBEB' }}>
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>₹499/month</span>
                  <span className="mt-0.5">Half the alternatives</span>
                </div>
                <div className="flex flex-col px-7" style={{ borderRight: '1px solid #EBEBEB' }}>
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>14-day free trial</span>
                  <span className="mt-0.5">No card needed</span>
                </div>
                <div className="flex flex-col pl-7">
                  <span className="font-bold text-sm" style={{ color: '#0F0F0F', fontFamily: "'JetBrains Mono', monospace" }}>8+ brokers</span>
                  <span className="mt-0.5">File import now · Auto-sync soon</span>
                </div>
              </motion.div>
            </div>

            {/* Right column — Exit Analyzer visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-end pt-12"
            >
              <div className="w-full max-w-[370px]">
                <HeatmapCard />
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════
          SECTION 4 — PAIN
      ════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8" style={{ background: '#F8F7F5' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#0F0F0F' }}>
              The market isn't the problem.
            </h2>
            <p className="mt-5 text-base max-w-[560px] mx-auto leading-relaxed" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
              These aren't signs of a bad trader. They're signs of a trader who's been flying without instruments.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {painCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="bg-white p-8 hover:shadow-lg hover:shadow-slate-100/80 transition-shadow duration-300"
                style={{ border: '1px solid #E0E0E0', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <h3 className="font-bold text-sm mb-4" style={{ color: '#0F0F0F' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{card.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={5}
            className="text-center mt-16 text-lg italic"
            style={{ fontFamily: "'Playfair Display', serif", color: '#8A8A8A' }}
          >
            "Your edge isn't missing. It's just been invisible."
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5 — PRODUCT REVEAL
      ════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#0F0F0F' }}>
              This is what clarity looks like.
            </h2>
            <p className="mt-4 text-base" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
              Your entire trading behaviour. Laid out. Honestly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <DashboardMockCard />
          </motion.div>

          <p className="text-center mt-6 text-[11px] tracking-wider" style={{ color: '#BEBEBE', fontFamily: "'JetBrains Mono', monospace" }}>
            Actual TradeValley dashboard · Your data will look different · Better.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 6 — EXIT ANALYZER
      ════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 lg:py-28 px-6 lg:px-8" style={{ background: '#F8F7F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <motion.div variants={fadeUp} custom={0} className="mb-7">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5"
                  style={{ color: '#8A8A8A', border: '1px solid #EBEBEB', borderRadius: '2px' }}
                >
                  <Sparkles className="w-3 h-3" /> Exclusive to TradeValley · Not available in any other journal
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUp} custom={1}
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="italic font-medium" style={{ color: '#8A8A8A' }}>"You had the right entry."</span>
                <br />
                <span className="italic font-bold" style={{ color: '#0F0F0F' }}>"Did you have the right exit?"</span>
              </motion.h2>

              <motion.p variants={fadeUp} custom={2} className="mt-6 text-base leading-relaxed max-w-lg" style={{ color: '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                Run automated heatmaps across every SL/TP combination. Test manual scenarios. Score every exit from 0 to 100. For the first time — see exactly what your exit decisions are costing you, on every single trade.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-7 space-y-3">
                {[
                  'Automated SL/TP heatmap across all your historical trades',
                  'Manual scenario testing — "What if I held 15 more minutes?"',
                  'Scatter plot of your exit quality trend over time',
                  'Per-trade Exit Score from 0 to 100',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 text-sm" style={{ color: '#0F0F0F' }}>
                    <span style={{ color: '#059669' }}>→</span>
                    <span>{line}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-10">
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 transition-colors"
                  style={{ background: '#0F0F0F', color: '#FFFFFF', borderRadius: 0 }}
                >
                  Analyze Your First Trade Free <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Large heatmap */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-end"
            >
              <div className="w-full max-w-lg">
                <p className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: '#8A8A8A', fontFamily: "'JetBrains Mono', monospace" }}>
                  EXIT ANALYZER — LIVE PREVIEW
                </p>
                <HeatmapCard large />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 7 — NUMBER SECTION
      ════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8" style={{ background: '#0F0F0F' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.2em] mb-14" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            What happens when traders finally see their patterns.
          </p>

          <div className="grid grid-cols-3 gap-8">
            {[
              { number: '+14%', label: 'Average win rate improvement', sub: 'after 30 days' },
              { number: '34 → 61', label: 'Avg exit score improvement', sub: 'in 90 days' },
              { number: '5 min', label: 'Time to first insight', sub: '' },
            ].map((stat, i) => (
              <motion.div
                key={stat.number}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.number}
                </p>
                <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
                {stat.sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.sub}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 px-6 lg:px-8" style={{ background: '#0D3D2A' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#FFFFFF' }}
          >
            The only trader you can truly improve is yourself.
          </motion.h2>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="mt-5 text-base"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', 'Inter', sans-serif" }}
          >
            Start with your data. See your patterns. Trade better.
          </motion.p>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            className="mt-10"
          >
            <Link
              to="/entering"
              className="inline-flex items-center gap-2.5 text-base font-semibold px-10 py-4 transition-colors"
              style={{ background: '#FFFFFF', color: '#0D3D2A', borderRadius: 0 }}
            >
              Start Free for 14 Days <ArrowRight className="w-5 h-5" />
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

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={4}
            className="mt-12"
          >
            <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Playfair Display', serif" }}>
              Look inward <span style={{ color: '#34d399' }}>/</span> Trade forward
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ background: '#0F0F0F' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <p className="text-lg tracking-tight mb-2">
                <span className="font-normal" style={{ color: '#FFFFFF' }}>Trade</span>
                <span className="font-bold" style={{ color: '#FFFFFF' }}>Valley</span>
              </p>
              <p className="text-sm italic mb-3" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Playfair Display', serif" }}>
                Look inward / Trade forward
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                The trading journal for traders who refuse to stay average.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Features</Link></li>
                <li><Link to="/pricing" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Pricing</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/entering" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Get Started</Link></li>
                <li><a href="#how-it-works" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>How It Works</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Legal</h4>
              <ul className="space-y-3">
                <li><span className="text-sm cursor-default" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy Policy</span></li>
                <li><span className="text-sm cursor-default" style={{ color: 'rgba(255,255,255,0.3)' }}>Terms of Service</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} TradeValley. All rights reserved.</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Built by traders, for traders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing4;
