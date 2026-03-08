import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, Target, BookOpen, Calendar,
  TrendingUp, Shield, Zap, Eye, Crosshair, LineChart,
  ListOrdered, FileText, Sliders, ChevronRight, CheckCircle2,
  Clock, Tag, MessageSquare, Ruler, GitMerge, DollarSign
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const coreFeatures = [
  {
    icon: BarChart3,
    title: 'Performance Dashboard',
    description: 'Net P&L, win rate gauge, profit factor ring, average win/loss ratio, cumulative equity curve, net daily P&L, monthly performance calendar, instrument analysis, and long/short breakdown — all in one place.',
    highlights: ['5 key stat cards', 'Equity curve', 'Monthly calendar heatmap'],
  },
  {
    icon: ListOrdered,
    title: 'Trade Log',
    description: 'Every trade documented with entry, exit, size, P&L, duration, setup, tags, and notes. Fully sortable, filterable, and customizable columns. Import from MT5 and other platforms.',
    highlights: ['Custom column visibility', 'Multi-account support', 'CSV import/export'],
  },
  {
    icon: Calendar,
    title: 'Day View',
    description: 'Review each trading day with intraday P&L charts, individual trade breakdowns, and a sidebar calendar to navigate your history effortlessly.',
    highlights: ['Intraday P&L curve', 'Per-trade detail cards', 'Calendar navigation'],
  },
  {
    icon: BookOpen,
    title: 'Trading Diary',
    description: 'A rich-text diary with folder organization. Link notes to specific trades or days. Attach context, emotions, market observations — everything that matters beyond the numbers.',
    highlights: ['Rich text editor', 'Trade linking', 'Folder organization'],
  },
  {
    icon: Target,
    title: 'Setup Management',
    description: 'Define your trading setups with checklists. Track cumulative P&L per strategy. See detailed stats to know exactly which approaches work and which don\'t.',
    highlights: ['Strategy checklists', 'Per-setup P&L curves', 'Detailed statistics'],
  },
  {
    icon: FileText,
    title: 'Reports Center',
    description: 'Yearly and monthly overviews, wins vs. losses breakdowns, and a powerful compare tool to benchmark different filters, time periods, or strategies against each other.',
    highlights: ['Yearly calendar', 'Compare tool', 'Custom filter groups'],
  },
];

const chartRoomModules = [
  { icon: TrendingUp, name: 'Drawdown Analysis', desc: 'Visualize drawdown curves and understand risk exposure over time.' },
  { icon: Zap, name: 'Consecutive Streaks', desc: 'Track winning and losing streaks to spot momentum and tilt patterns.' },
  { icon: Crosshair, name: 'Exit Analysis', desc: 'Evaluate the quality of your exits — are you leaving money on the table?' },
  { icon: Clock, name: 'Holding Time', desc: 'Discover optimal trade durations for your strategies.' },
  { icon: LineChart, name: 'Performance by Symbol', desc: 'See which instruments you trade best — and which cost you.' },
  { icon: Target, name: 'Performance by Setup', desc: 'Compare setups side-by-side with detailed metrics.' },
  { icon: Clock, name: 'Performance by Time', desc: 'Find your best and worst trading hours.' },
  { icon: Tag, name: 'Tags & Comments', desc: 'Analyze performance by tags and trade comments.' },
  { icon: Shield, name: 'Risk Distribution', desc: 'Understand how you distribute risk across trades.' },
  { icon: Sliders, name: 'Trade Management', desc: 'Analyze scaling, partial exits, and position management.' },
];

const settingsFeatures = [
  { icon: DollarSign, name: 'Multi-Currency', desc: 'Trade in any currency — USD, EUR, GBP, and more.' },
  { icon: GitMerge, name: 'Multi-Account', desc: 'Manage multiple trading accounts with separate tracking.' },
  { icon: Tag, name: 'Custom Tags & Categories', desc: 'Organize trades with your own taxonomy.' },
  { icon: Ruler, name: 'Tick Size & Fees', desc: 'Configure symbol tick sizes, commissions, and fee structures.' },
  { icon: MessageSquare, name: 'Trade Comments', desc: 'Standardized comment templates for consistent journaling.' },
  { icon: Eye, name: 'Privacy Mode', desc: 'Hide monetary values when sharing your screen.' },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
          >
            Features
          </motion.p>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for Traders Who
            <br />
            <span className="text-slate-400">Take This Seriously</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Every feature exists for one reason: to help you find the truth in your trading data and act on it.
          </motion.p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="space-y-20">
            {coreFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}
              >
                <div className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-5">
                    <feature.icon className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed mb-5">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-slate-50 rounded-2xl p-10 aspect-[4/3] flex items-center justify-center border border-slate-100 ${i % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                  <div className="text-center">
                    <feature.icon className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 font-medium">{feature.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Room */}
      <section className="py-20 lg:py-28 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Chart Room</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              10 Specialized Analytics Modules
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Deep-dive into every dimension of your trading performance.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {chartRoomModules.map((mod, i) => (
              <motion.div
                key={mod.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.5}
                className="bg-white rounded-xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all"
              >
                <mod.icon className="w-5 h-5 text-slate-400 mb-3" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">{mod.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exit Analyzer */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Signature Feature</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Exit Analyzer
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                The most sophisticated exit analysis in any journaling platform. Run automated heatmaps 
                to see how different TP/SL ratios would have performed, or manually configure scenarios 
                to test your exit thesis.
              </p>
              <ul className="space-y-3">
                {['Automated SL/TP heatmap grid', 'Manual scenario testing', 'Scatter plot visualization', 'Per-trade exit quality scoring'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950 rounded-2xl p-10 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <Crosshair className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Exit Analyzer Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Settings & Customization */}
      <section className="py-20 lg:py-28 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Customization</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Configured Your Way
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsFeatures.map((feat, i) => (
              <motion.div
                key={feat.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-white rounded-xl p-6 border border-slate-100"
              >
                <feat.icon className="w-5 h-5 text-slate-400 mb-3" />
                <h4 className="text-base font-bold text-slate-900 mb-1">{feat.name}</h4>
                <p className="text-sm text-slate-500">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to See What Your Trades Are Really Telling You?
          </h2>
          <p className="text-slate-500 mb-10">
            Start for free. No credit card required.
          </p>
          <Link
            to="/entering"
            className="group inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Features;
