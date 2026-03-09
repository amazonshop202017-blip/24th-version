import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { SharedNavbar } from '@/components/landing/SharedNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface Feature {
  text: string;
  included: boolean;
}

const plans: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: Feature[];
  cta: string;
  highlighted: boolean;
}[] = [
  {
    name: 'Solo',
    price: '₹499',
    period: '/month',
    description: 'Everything you need to begin your journaling discipline.',
    features: [
      { text: 'Advance Analytics', included: true },
      { text: 'Exit Analyzer', included: true },
      { text: 'Can add upto 1 account', included: true },
      { text: 'Add upto 3 Setups', included: true },
      { text: 'Upto 3 Tag Categories', included: true },
      { text: 'Mentor Mode', included: false },
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹799',
    period: '/month',
    description: 'For traders who are serious about finding their edge.',
    features: [
      { text: 'Advance Analytics', included: true },
      { text: 'Exit Analyzer', included: true },
      { text: 'Can add Unlimited Accounts', included: true },
      { text: 'Add unlimited setups', included: true },
      { text: 'Unlimited Tag Categories', included: true },
      { text: 'Mentor Mode', included: true },
    ],
    cta: 'Go Professional',
    highlighted: true,
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Absolutely. Upgrade or downgrade whenever you want. Changes take effect immediately with prorated billing.',
  },
  {
    q: 'Is my trading data secure?',
    a: 'Your data is stored locally in your browser. You have complete control. No third-party servers, no data sharing.',
  },
  {
    q: 'Do you support my broker/platform?',
    a: 'We support MT5 imports and CSV imports that work with most platforms. More direct integrations are coming soon.',
  },
  {
    q: 'What if I need help getting started?',
    a: 'We offer guides and documentation to help you set up. Professional plan includes priority support.',
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SharedNavbar />

      {/* Hero */}
      <section className="pt-20 pb-16 lg:pt-24 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4"
          >
            Pricing
          </motion.p>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Invest in Your
            <br />
            <span className="text-slate-400">Trading Growth</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="mt-6 text-lg text-slate-500 max-w-xl mx-auto"
          >
            One profitable trade insight pays for years of journaling. Start free, upgrade when you're ready.
          </motion.p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                className={`rounded-2xl p-8 border ${
                  plan.highlighted
                    ? 'bg-slate-950 text-white border-slate-800 relative'
                    : 'bg-white border-slate-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-amber-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className={`text-sm ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat.text} className="flex items-start gap-2 text-sm">
                      {feat.included ? (
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? 'text-amber-400' : 'text-emerald-500'
                          }`}
                        />
                      ) : (
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                      )}
                      <span className={`${plan.highlighted ? 'text-slate-300' : 'text-slate-600'} ${!feat.included ? 'text-slate-400' : ''}`}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/entering"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 lg:py-28 bg-slate-50/70">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-5 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Your Next Profitable Trade Starts With Self-Awareness
          </h2>
          <Link
            to="/entering"
            className="group inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
          >
            Start Journaling Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Pricing;
