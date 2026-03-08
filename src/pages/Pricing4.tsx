import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// ─── Animations ───
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ─── Navbar ───
const Pricing4Navbar = () => {
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
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.95)',
        borderBottom: scrolled ? '1px solid #EBEBEB' : '1px solid transparent',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/home-4" className="text-lg tracking-tight" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <span className="font-normal" style={{ color: '#0F0F0F' }}>Trade</span>
            <span className="font-bold" style={{ color: '#0F0F0F' }}>Valley</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            {['Home', 'Features', 'Pricing', 'How It Works'].map((label) => (
              <Link
                key={label}
                to={label === 'Home' ? '/home-4' : label === 'Pricing' ? '/pricing-4' : label === 'How It Works' ? '/home-4#how-it-works' : `/${label.toLowerCase()}`}
                className="text-sm transition-colors"
                style={{ color: label === 'Pricing' ? '#0F0F0F' : '#8A8A8A', fontFamily: "'DM Sans', 'Inter', sans-serif", fontWeight: label === 'Pricing' ? 500 : 400 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F0F0F')}
                onMouseLeave={e => { if (label !== 'Pricing') e.currentTarget.style.color = '#8A8A8A'; }}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            to="/entering"
            className="hidden md:inline-flex text-sm font-semibold px-5 py-2.5 transition-colors"
            style={{ background: '#0F0F0F', color: '#FFFFFF', borderRadius: 0 }}
          >
            Start Free — 14 Days
          </Link>
        </div>
      </div>
    </nav>
  );
};

// ─── Toggle Component ───
const BillingToggle = ({ isAnnual, onToggle }: { isAnnual: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-center gap-1" style={{ marginTop: 36 }}>
    <div
      className="flex items-center rounded-full p-1"
      style={{ background: '#F0F0F0', border: '1px solid #EBEBEB' }}
    >
      <button
        onClick={() => !isAnnual || onToggle()}
        className="px-5 py-2 rounded-full text-sm transition-all"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          background: !isAnnual ? '#0F0F0F' : 'transparent',
          color: !isAnnual ? '#FFFFFF' : '#8A8A8A',
        }}
      >
        Monthly
      </button>
      <button
        onClick={() => isAnnual || onToggle()}
        className="px-5 py-2 rounded-full text-sm transition-all flex items-center gap-2"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          background: isAnnual ? '#0F0F0F' : 'transparent',
          color: isAnnual ? '#FFFFFF' : '#8A8A8A',
        }}
      >
        Annual
        {isAnnual && (
        <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.12)' }}
          >
            Save 20%
          </span>
        )}
      </button>
    </div>
  </div>
);

// ─── Comparison Table ───
const comparisonRows: { feature: string; solo: string; pro: string }[] = [
  { feature: 'Exit Analyzer', solo: '★', pro: '★' },
  { feature: 'Performance dashboard', solo: '✓', pro: '✓' },
  { feature: 'Psychology & pattern insights', solo: '✓', pro: '✓' },
  { feature: 'Trade log & full history', solo: '✓', pro: '✓' },
  { feature: 'Session & day analytics', solo: '✓', pro: '✓' },
  { feature: 'CSV & broker file import', solo: '✓', pro: '✓' },
  { feature: 'Privacy mode', solo: '✓', pro: '✓' },
  { feature: 'Trading accounts', solo: '1', pro: '3' },
  { feature: 'Setups', solo: '3', pro: '10' },
  { feature: 'Mentor mode', solo: '—', pro: '✓' },
  { feature: 'Priority support', solo: '—', pro: '✓' },
];

const faqs = [
  { q: 'Can I import trades from my broker?', a: 'Yes. File import is supported for Zerodha, Upstox, Angel One, MT5, Tradovate and more. Auto-sync is coming soon after launch.' },
  { q: 'What happens when my free trial ends?', a: 'Nothing automatic. No charges, no surprises. You choose your plan when you\'re ready. No card needed to start.' },
  { q: 'Is my trading data private and secure?', a: 'Completely. Your data is never sold, shared, or used for anything beyond showing you your own patterns.' },
  { q: 'Can I switch plans or cancel anytime?', a: 'Yes to both. Upgrade or downgrade instantly. Cancel in one click — no calls, no forms, no friction of any kind.' },
];

// ─── Main Page ───
const Pricing4 = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <Pricing4Navbar />

      {/* ════════════════════════════════════════
          SECTION 1 — PRICING HERO
      ════════════════════════════════════════ */}
      <section style={{ paddingTop: 80 + 64, paddingBottom: 60 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: '#8A8A8A', textTransform: 'uppercase' as const }}
          >
            PRICING
          </motion.p>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="mt-5"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(36px, 4vw, 52px)', color: '#0F0F0F', lineHeight: 1.15 }}
          >
            Simple pricing.<br />Serious tools.
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="mx-auto mt-5"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#8A8A8A', maxWidth: 480 }}
          >
            Everything you need to trade with self-awareness. Nothing you don't.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <BillingToggle isAnnual={isAnnual} onToggle={() => setIsAnnual(!isAnnual)} />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2 — PLAN CARDS
      ════════════════════════════════════════ */}
      <section style={{ background: '#F8F7F5', paddingTop: 64, paddingBottom: 80 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-[880px] mx-auto">

            {/* ── SOLO Card (Starter style - white, left yellow border) ── */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className="w-full md:w-[420px] flex flex-col relative"
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '40px 36px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                borderLeft: '4px solid #FCD34D',
              }}
            >
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Solo
              </h3>
              <p className="mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>
                Everything you need to begin your journaling discipline.
              </p>

              {/* Price */}
              <div className="mt-7">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 52, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {isAnnual ? '₹399' : '₹499'}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#9CA3AF', fontWeight: 400 }}>/month</span>
                {isAnnual && (
                  <p className="mt-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9CA3AF' }}>
                    Billed ₹4,788 annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-4 flex-1">
                {[
                  'Unlimited trade logging',
                  'Performance dashboard',
                  'Day view & calendar',
                  'Basic reports',
                  '1 trading account',
                  'Manual trade entry',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                    <span className="flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className="w-full mt-10 transition-all hover:opacity-90"
                style={{
                  background: '#F3F4F6', color: '#0F172A',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  padding: '15px 24px', borderRadius: 50,
                  border: 'none',
                }}
              >
                Start Free
              </button>
            </motion.div>

            {/* ── PRO Card (Most Popular - dark navy) ── */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="w-full md:w-[420px] relative flex flex-col"
              style={{
                background: '#0F172A',
                borderRadius: 16,
                padding: '40px 36px',
                boxShadow: '0 8px 32px rgba(15,23,42,0.35)',
              }}
            >
              {/* Most Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full whitespace-nowrap"
                  style={{
                    background: '#FCD34D',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    boxShadow: '0 2px 8px rgba(252,211,77,0.3)',
                  }}
                >
                  <span style={{ fontSize: 13 }}>✨</span> Most Popular
                </span>
              </div>

              <h3 className="mt-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                Professional
              </h3>
              <p className="mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.5 }}>
                For traders who are serious about finding their edge.
              </p>

              {/* Price */}
              <div className="mt-7">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 52, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {isAnnual ? '₹639' : '₹799'}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#64748B', fontWeight: 400 }}>/month</span>
                {isAnnual && (
                  <p className="mt-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#64748B' }}>
                    Billed ₹7,668 annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-4 flex-1">
                {[
                  'Everything in Solo',
                  'Full Chart Room (10 modules)',
                  'Exit Analyzer (Auto & Manual)',
                  'Trading Diary with rich text',
                  'Setup & strategy tracking',
                  'Multi-account support',
                  'Compare tool & advanced reports',
                  'CSV import/export',
                  'Privacy mode',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#E2E8F0', lineHeight: 1.4 }}>
                    <span className="flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: '#34D399' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className="w-full mt-10 transition-all hover:opacity-90"
                style={{
                  background: '#FFFFFF', color: '#0F172A',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  padding: '15px 24px', borderRadius: 50,
                  border: 'none',
                }}
              >
                Go Professional
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3 — MENTOR MODE
      ════════════════════════════════════════ */}
      <section className="text-center" style={{ background: '#F8F7F5', paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span
              className="inline-block mb-5"
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, color: '#34d399',
                border: '1px solid #34d399', padding: '4px 14px',
              }}
            >
              ✦ PRO EXCLUSIVE
            </span>
          </motion.div>

          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(32px, 3.5vw, 48px)', color: '#0F0F0F' }}
          >
            Mentor Mode.
          </motion.h2>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            className="mx-auto mt-4"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8A8A8A', lineHeight: 1.75, maxWidth: 520 }}
          >
            See your trades the way a coach would. Mentor Mode surfaces your biggest behavioural blind spots
            and gives you structured feedback on what to work on next — like having a trading mentor built
            directly into your journal.
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4 — COMPARISON TABLE
      ════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center mb-10" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: '#8A8A8A', textTransform: 'uppercase' as const }}>
            FULL COMPARISON
          </p>

          <div className="max-w-[680px] mx-auto overflow-x-auto" style={{ border: '1px solid #EBEBEB' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8F7F5' }}>
                  <th className="text-left" style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#0F0F0F', fontWeight: 500 }}></th>
                  <th className="text-center" style={{ padding: '14px 20px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#8A8A8A', fontWeight: 400, letterSpacing: 2 }}>SOLO</th>
                  <th className="text-center" style={{ padding: '14px 20px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#0F0F0F', fontWeight: 700, letterSpacing: 2 }}>PRO</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      background: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
                      borderBottom: '1px solid #EBEBEB',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#0F0F0F', textAlign: 'left' as const }}>
                      {row.feature}
                    </td>
                    <td className="text-center" style={{ padding: '14px 20px', fontSize: 14 }}>
                      <CellValue value={row.solo} />
                    </td>
                    <td className="text-center" style={{ padding: '14px 20px', fontSize: 14 }}>
                      <CellValue value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5 — FAQ
      ════════════════════════════════════════ */}
      <section style={{ background: '#F8F7F5', paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-[640px] mx-auto px-6 lg:px-8">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(28px, 3vw, 40px)', color: '#0F0F0F' }}
          >
            Everything you need to know
          </motion.h2>

          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="mb-9"
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, color: '#0F0F0F', marginBottom: 6 }}>
                {faq.q}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 300, color: '#8A8A8A', lineHeight: 1.7 }}>
                {faq.a}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 6 — FINAL CTA STRIP
      ════════════════════════════════════════ */}
      <section className="text-center" style={{ background: '#0D3D2A', paddingTop: 100, paddingBottom: 100 }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(32px, 4vw, 52px)', color: '#FFFFFF', lineHeight: 1.2 }}
          >
            The only trader you can truly improve is yourself.
          </motion.h2>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="mt-3"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.7)' }}
          >
            Start with your data. See your patterns. Trade better.
          </motion.p>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            className="mt-9"
          >
            <Link
              to="/entering"
              className="inline-flex items-center gap-2.5 font-medium transition-colors"
              style={{
                background: '#FFFFFF', color: '#0D3D2A',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                padding: '14px 36px', borderRadius: 4,
              }}
            >
              Start Free for 14 Days <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={3}
            className="mt-3.5"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
          >
            No credit card · Cancel anytime · Up and running in under 5 minutes
          </motion.p>

          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={4}
            className="mt-12"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
          >
            Look inward / Trade forward
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 7 — FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ background: '#0F0F0F' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <p className="text-lg tracking-tight mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="font-normal" style={{ color: '#FFFFFF' }}>Trade</span>
                <span className="font-bold" style={{ color: '#FFFFFF' }}>Valley</span>
              </p>
              <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Playfair Display', serif" }}>
                Look inward / Trade forward
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Features</Link></li>
                <li><Link to="/pricing-4" className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/entering" className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Get Started</Link></li>
                <li><Link to="/home-4#how-it-works" className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>How It Works</Link></li>
              </ul>
            </div>
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

// ─── Cell Value Helper ───
const CellValue = ({ value }: { value: string }) => {
  if (value === '★') return <span style={{ color: '#34d399', fontSize: 14 }}>★</span>;
  if (value === '✓') return <span style={{ color: '#0F0F0F', fontSize: 14 }}>✓</span>;
  if (value === '—') return <span style={{ color: '#CCCCCC', fontSize: 14 }}>—</span>;
  return <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#0F0F0F' }}>{value}</span>;
};

export default Pricing4;
