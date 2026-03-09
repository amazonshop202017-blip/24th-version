import { Link } from 'react-router-dom';
import { SharedNavbar } from '@/components/landing/SharedNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Check, Upload, Wifi, Clock, TrendingUp, BarChart3, Landmark, Bitcoin, DollarSign, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const markets = [
  { name: 'Forex', icon: DollarSign, description: 'All major, minor & exotic pairs' },
  { name: 'Stocks', icon: TrendingUp, description: 'Equities across global exchanges' },
  { name: 'Futures', icon: BarChart3, description: 'Commodities, indices & more' },
  { name: 'Crypto', icon: Bitcoin, description: 'Spot & derivatives trading' },
  { name: 'Options', icon: Layers, description: 'Calls, puts & multi-leg strategies' },
];

type SyncStatus = 'available' | 'coming_soon' | 'none';

interface Broker {
  name: string;
  category: string;
  fileImport: boolean;
  autoSync: SyncStatus;
}

const brokers: Broker[] = [
  { name: 'MetaTrader 5', category: 'Forex / CFD', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Match Trader', category: 'Forex / CFD', fileImport: true, autoSync: 'none' },
  { name: 'Tradovate', category: 'Futures', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Zerodha', category: 'Indian Markets', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Angel One', category: 'Indian Markets', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Upstox', category: 'Indian Markets', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Groww', category: 'Indian Markets', fileImport: true, autoSync: 'coming_soon' },
  { name: 'Shoonya', category: 'Indian Markets', fileImport: true, autoSync: 'coming_soon' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const SupportedPlatforms = () => {
  return (
    <div className="min-h-screen bg-white">
      <SharedNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-4">
              Compatibility
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-tight mb-6">
              Your Broker. Your Market.{' '}
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">
                Fully Supported.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Import trades from leading brokers across every major asset class. One journal, every market, zero friction.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Supported Markets */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">
              Supported Markets
            </h2>
            <p className="text-slate-500">
              Every asset class. One unified journal.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {markets.map((market, i) => (
              <motion.div
                key={market.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group relative bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center hover:border-slate-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <market.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-1">{market.name}</h3>
                <p className="text-xs text-slate-400">{market.description}</p>
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Brokers */}
      <section className="py-20 px-6 lg:px-8 bg-slate-50/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">
              Supported Brokers
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Connect your favorite broker and start journaling in minutes. More integrations added regularly.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <Upload className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-slate-600">File Import</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                <Wifi className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-slate-600">Auto Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                <Clock className="w-3 h-3 text-amber-600" />
              </div>
              <span className="text-slate-600">Coming Soon</span>
            </div>
          </div>

          {/* Broker Cards */}
          <div className="grid gap-4">
            {brokers.map((broker, i) => (
              <motion.div
                key={broker.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white border border-slate-100 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                    <Landmark className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">{broker.name}</h3>
                    <span className="text-xs text-slate-400 font-medium">{broker.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  {/* File Import Badge */}
                  {broker.fileImport && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      File Import
                    </div>
                  )}

                  {/* Auto Sync Badge */}
                  {broker.autoSync === 'available' && (
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Auto Sync
                    </div>
                  )}
                  {broker.autoSync === 'coming_soon' && (
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Auto Sync Coming Soon
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* More Coming */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              More brokers being added every month
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
            Don't see your broker?
          </h2>
          <p className="text-slate-500 mb-8 text-lg">
            We're constantly expanding our integrations. Start with file import today and get auto sync when it launches.
          </p>
          <Link
            to="/entering"
            className="inline-flex items-center justify-center text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-8 py-3.5 rounded-xl transition-colors"
          >
            Start Journaling Free
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default SupportedPlatforms;
