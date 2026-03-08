import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, BarChart3, Target, BookOpen, Calendar, 
  TrendingUp, Shield, Zap, LineChart, Eye, Crosshair,
  CheckCircle2, ChevronRight, Star
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: BarChart3,
    title: 'Precision Dashboard',
    description: 'Net P&L, win rate, profit factor, and cumulative equity — all distilled into one decisive view.',
  },
  {
    icon: Calendar,
    title: 'Day-by-Day Dissection',
    description: 'Replay every trading day. See intraday P&L curves, individual entries, and daily patterns that reveal your rhythm.',
  },
  {
    icon: BookOpen,
    title: 'Structured Diary',
    description: 'Attach rich notes to any trade or day. Link emotions to outcomes. Build the self-awareness that separates pros from amateurs.',
  },
  {
    icon: Target,
    title: 'Setup Mastery',
    description: 'Define your setups, tag every trade, and let the data show which strategies actually make you money.',
  },
  {
    icon: Crosshair,
    title: 'Exit Analyzer',
    description: 'Automated and manual analysis of your exits. Discover if you\'re leaving money on the table or holding losers too long.',
  },
  {
    icon: Eye,
    title: 'Chart Room Analytics',
    description: 'Drawdown curves, consecutive streaks, holding time analysis, risk distribution — 10+ deep-dive chart modules.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Record Every Trade',
    description: 'Log your entries and exits with precision. Add setups, tags, and notes that capture the full context of every decision.',
  },
  {
    number: '02',
    title: 'Confront the Data',
    description: 'Your dashboard doesn\'t lie. See win rates, profit factors, and equity curves that reveal exactly where you stand.',
  },
  {
    number: '03',
    title: 'Identify the Patterns',
    description: 'Which setups win? What time of day costs you? How long should you hold? The answers are in your data.',
  },
  {
    number: '04',
    title: 'Evolve Into a Professional',
    description: 'Eliminate what doesn\'t work. Double down on what does. This is how amateurs become professionals — through relentless self-review.',
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <LandingNavbar />

      {/* ====== HERO ====== */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-slate-100/80 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-50/60 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 uppercase tracking-wider mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Premium Trading Journal
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Trades Tell
              <br />
              a Story.{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                  Read It.
                </span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-amber-300/40 -z-0 rounded" />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-8 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            >
              Most traders know they should journal. Few do it well enough to transform. 
              TradeJournal is the professional-grade tool that turns your raw data into 
              the self-awareness that separates profitable traders from everyone else.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/entering"
                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30"
              >
                Start Journaling Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 px-6 py-4 text-base font-medium transition-colors"
              >
                Explore Features
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Hero Visual — App Preview Mockup */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="bg-slate-950 rounded-2xl p-2 shadow-2xl shadow-slate-900/30">
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[11px] text-slate-500 bg-slate-800 px-4 py-1 rounded-md">app.tradejournal.com</span>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                      <LineChart className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Dashboard</div>
                      <div className="text-sm font-semibold text-white">Track your trading performance</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: 'Net P&L', value: '+$12,847', color: 'text-emerald-400' },
                      { label: 'Win Rate', value: '64.2%', color: 'text-sky-400' },
                      { label: 'Profit Factor', value: '2.31', color: 'text-amber-400' },
                      { label: 'Avg Win', value: '$487', color: 'text-emerald-400' },
                      { label: 'Avg Loss', value: '-$198', color: 'text-red-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-slate-800/60 rounded-lg p-3">
                        <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
                        <div className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Equity curve placeholder */}
                  <div className="bg-slate-800/40 rounded-lg p-4 h-40 flex items-end gap-1">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const h = 20 + Math.sin(i * 0.3) * 15 + (i / 30) * 60;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-sky-500/40 to-sky-400/80"
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-200/20 via-transparent to-sky-200/20 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ====== SOCIAL PROOF BAR ====== */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">10,000+</div>
              <div className="text-xs text-slate-500 mt-0.5">Trades Journaled</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div>
              <div className="text-2xl font-bold text-slate-900">30+</div>
              <div className="text-xs text-slate-500 mt-0.5">Analytics Modules</div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div>
              <div className="flex items-center gap-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Loved by Serious Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PHILOSOPHY ====== */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
            >
              The Philosophy
            </motion.p>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Profitable Trading Starts With{' '}
              <span className="italic text-slate-500">Brutal Honesty</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="mt-6 text-lg text-slate-500 leading-relaxed"
            >
              Every losing streak has a cause. Every winning pattern has a signature. 
              The difference between amateurs and professionals isn't talent — it's the discipline 
              to study their own behavior. TradeJournal gives you the mirror.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section className="py-24 lg:py-32 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Capabilities
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Everything You Need. Nothing You Don't.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-5 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              The Process
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Four Steps to Professional Trading
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative"
              >
                <div className="text-6xl font-black text-slate-100 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIAL / QUOTE ====== */}
      <section className="py-24 lg:py-32 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              "I stopped guessing and started knowing. The data showed me I was profitable on 
              three setups and bleeding on seven. Within a month, my equity curve changed direction."
            </blockquote>
            <p className="mt-8 text-slate-400 text-sm font-medium">
              — A Dedicated Trader Who Made the Shift
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== DETAILED FEATURE SHOWCASE ====== */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-24">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Performance At a Glance</p>
              <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                A Dashboard That Demands Honesty
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Win rate gauge, profit factor ring, cumulative P&L, net daily charts, monthly calendar — 
                your entire trading reality in one screen. No hiding from the numbers.
              </p>
              <ul className="space-y-3">
                {['Real-time stats: P&L, win rate, profit factor', 'Monthly performance calendar', 'Long/short & instrument breakdown'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="bg-slate-100 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center"
            >
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Dashboard Preview</p>
              </div>
            </motion.div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="bg-slate-100 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center order-2 lg:order-1"
            >
              <div className="text-center">
                <Target className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Setup Analytics Preview</p>
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Setup Intelligence</p>
              <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Know Exactly Which Setups Make You Money
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Define your trading setups, categorize every trade, and let the numbers speak. 
                See cumulative P&L per strategy, win rates by setup, and identify which patterns 
                are worth your capital.
              </p>
              <ul className="space-y-3">
                {['Per-setup P&L tracking', 'Detailed strategy statistics', 'Category & tag system'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Deep Analytics</p>
              <h3 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                10+ Chart Room Modules to Dissect Every Angle
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Drawdown analysis, consecutive winners/losers, exit quality scoring, holding time 
                optimization, risk distribution, performance by time of day — if there's a pattern, 
                we'll surface it.
              </p>
              <ul className="space-y-3">
                {['Drawdown & risk analysis', 'Time-of-day performance', 'Exit analyzer with auto & manual modes'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="bg-slate-100 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center"
            >
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Chart Room Preview</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Stop Trading Blind.
              <br />
              <span className="text-slate-400">Start Trading Aware.</span>
            </h2>
            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
              The best traders in the world review their performance obsessively. 
              TradeJournal makes that process effortless and illuminating.
            </p>
            <Link
              to="/entering"
              className="group inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
            >
              Begin Your Journal
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-sm text-slate-400">Free to start. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Landing;
