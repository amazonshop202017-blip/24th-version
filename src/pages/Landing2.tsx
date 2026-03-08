import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, TrendingDown, Timer, HelpCircle, XCircle, Sparkles } from 'lucide-react';
import { LandingFooter } from '@/components/landing/LandingFooter';
import logo from '@/assets/logo.svg';
import { useState, useEffect } from 'react';

// ─── Animations ───
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ─── Navbar (custom for Landing2) ───
const Landing2Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl transition-all duration-300 ${scrolled ? 'border-b border-slate-200/60' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/home-2" className="flex items-center gap-2">
            <img src={logo} alt="TradeValley" className="h-8" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</Link>
            <a href="#how-it-works" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">How It Works</a>
          </div>

          <Link
            to="/entering"
            className="hidden md:inline-flex text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 rounded-lg transition-colors"
          >
            Start Free — 14 Days
          </Link>
        </div>
      </div>
    </nav>
  );
};

// ─── Heatmap Visual (simplified representation) ───
const HeatmapVisual = () => {
  const heatmapData = [
    [32, 41, 55, 48, 37, 29],
    [45, 58, 72, 65, 52, 40],
    [38, 67, 89, 78, 61, 44],
    [50, 74, 85, 92, 70, 53],
    [42, 60, 76, 82, 68, 46],
    [35, 48, 62, 58, 50, 38],
  ];

  const getColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 65) return 'bg-emerald-400';
    if (val >= 55) return 'bg-emerald-300/80';
    if (val >= 45) return 'bg-amber-300/70';
    if (val >= 35) return 'bg-orange-300/70';
    return 'bg-orange-400/70';
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Exit Analyzer</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">SL / TP Heatmap</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> High
          <span className="w-2 h-2 rounded-full bg-orange-400 ml-2" /> Low
        </div>
      </div>

      {/* TP Labels */}
      <div className="flex gap-1 mb-1 pl-10">
        {['0.5', '1.0', '1.5', '2.0', '2.5', '3.0'].map(tp => (
          <div key={tp} className="flex-1 text-center text-[10px] font-mono text-slate-400">{tp}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {heatmapData.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1">
            <div className="w-8 text-right text-[10px] font-mono text-slate-400 pr-1">{['0.3', '0.5', '0.8', '1.0', '1.5', '2.0'][ri]}</div>
            {row.map((val, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + (ri * 6 + ci) * 0.02, duration: 0.3 }}
                className={`flex-1 aspect-square rounded-md ${getColor(val)} flex items-center justify-center`}
              >
                <span className="text-[9px] font-mono font-semibold text-white/90">{val}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Scatter plot hint */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Exit Score Trend</p>
        <div className="h-12 relative">
          <svg viewBox="0 0 200 40" className="w-full h-full">
            <path d="M0,35 Q30,30 50,28 T100,20 T150,14 T200,8" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
            {[10, 30, 55, 75, 95, 120, 140, 160, 185].map((x, i) => (
              <circle key={i} cx={x} cy={35 - i * 3 + Math.sin(i) * 4} r="2.5" fill="#059669" opacity="0.6" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Pain Cards ───
const painCards = [
  {
    icon: TrendingDown,
    title: 'Exiting winners too early',
    body: "It's not impatience. It's the absence of data showing you what your best exits actually look like. Once you see it — you can't unsee it.",
  },
  {
    icon: Timer,
    title: 'Holding losers longer than planned',
    body: "Nobody does this intentionally. It happens when there's no clear record of how many times hope has cost more than a clean cut would have.",
  },
  {
    icon: HelpCircle,
    title: "Not knowing why some days work and others don't",
    body: "The difference between your best and worst trading days isn't luck. It's a pattern. It's in your data. You just haven't been shown it yet.",
  },
  {
    icon: XCircle,
    title: 'Trying journals before — and quitting',
    body: "Not because you lack discipline. Because the tools gave you 50 metrics and zero clarity on what to actually do differently tomorrow.",
  },
];

// ─── Testimonials ───
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

// ─── MAIN PAGE ───
const Landing2 = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Landing2Navbar />

      {/* ════════════════════════════════════════════
          SECTION 2 — HERO
      ════════════════════════════════════════════ */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-6"
              >
                For Traders Who Are Done Guessing
              </motion.p>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight flex flex-col" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <span className="text-slate-400 leading-[1.15]">"Most traders have data."</span>
                  <span className="text-slate-400 leading-[1.15]">"Almost none have answers."</span>
                  <span className="text-slate-900 leading-[1.15] mt-3">TradeValley gives you both.</span>
                </h1>
              </motion.div>

              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="mt-6 text-base lg:text-lg text-slate-500 leading-relaxed max-w-xl"
              >
                TradeValley turns your complete trade history into clear, brutally honest insights — so you stop repeating the same mistakes and start building a real edge.
              </motion.p>


              {/* Buttons */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-6 py-3 rounded-lg transition-colors"
                >
                  Discover Your Edge Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-5 py-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <Play className="w-4 h-4" /> Watch 2-min Demo
                </button>
              </motion.div>

              {/* Micro Stats */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={5}
                className="mt-8 flex flex-wrap items-center gap-0 text-xs text-slate-400"
              >
                <div className="flex flex-col pr-5 border-r border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">₹499/month</span>
                  <span>Half the cost of every alternative</span>
                </div>
                <div className="flex flex-col px-5 border-r border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">14-day free trial</span>
                  <span>No card needed</span>
                </div>
                <div className="flex flex-col pl-5">
                  <span className="font-bold text-slate-700 text-sm">8+ brokers supported</span>
                  <span>File import ready · Auto-sync coming</span>
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
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-slate-50/70">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              The market isn't the problem.
            </h2>
            <p className="mt-4 text-base lg:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              These aren't signs of a bad trader. They're signs of a trader who's been flying without instruments.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {painCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-100/80 transition-shadow duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <card.icon className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{card.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={5}
            className="text-center mt-12 text-base italic text-slate-500"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "Your edge isn't missing. It's just been invisible."
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — EXIT ANALYZER
      ════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 lg:py-28 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> Exclusive to TradeValley · Not available in any other journal
                </span>
              </motion.div>

              <motion.h2 variants={fadeUp} custom={1}
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span className="text-slate-900">"You had the right entry."</span>
                <br />
                <span className="text-slate-400">"Did you have the right exit?"</span>
              </motion.h2>

              <motion.p variants={fadeUp} custom={2}
                className="mt-5 text-base text-slate-500 leading-relaxed max-w-lg"
              >
                Run automated heatmaps across every SL/TP combination. Test manual scenarios. Score every exit. For the first time — see exactly what your exit decisions are costing you, on every single trade.
              </motion.p>

              <motion.ul variants={fadeUp} custom={3}
                className="mt-6 space-y-3"
              >
                {[
                  'Automated SL/TP heatmap across all your historical trades',
                  'Manual scenario testing — "What if I held 15 more minutes?"',
                  'Scatter plot showing your exit quality trend over time',
                  'Per-trade Exit Score from 0 to 100',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {line}
                  </li>
                ))}
              </motion.ul>

              <motion.div variants={fadeUp} custom={4} className="mt-8">
                <Link
                  to="/entering"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-6 py-3 rounded-lg transition-colors"
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
              <HeatmapVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5 — SOCIAL PROOF
      ════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-slate-50/70">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              What changes when you finally see your patterns.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i}
                className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col hover:shadow-lg hover:shadow-slate-100/80 transition-shadow duration-300"
              >
                <p className="text-sm text-slate-600 leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6 — FINAL CTA
      ════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-6 lg:px-8 bg-emerald-900">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The only trader you can truly improve is yourself.
          </motion.h2>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="mt-4 text-base text-emerald-200/80"
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
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 bg-white hover:bg-emerald-50 px-7 py-3.5 rounded-lg transition-colors"
            >
              Start Free for 14 Days <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={3}
            className="mt-5 text-xs text-emerald-300/60"
          >
            No credit card · Cancel anytime · Up and running in under 5 minutes
          </motion.p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Landing2;
