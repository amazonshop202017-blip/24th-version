import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const homeLinks = [
  { label: 'Home 1', path: '/' },
  { label: 'Home 2', path: '/home-2' },
  { label: 'Home 3', path: '/home-3' },
  { label: 'Home 4', path: '/home-4' },
  { label: 'Home 5', path: '/home-5' },
];

const pricingLinks = [
  { label: 'Pricing 1', path: '/pricing' },
  { label: 'Pricing 2', path: '/pricing-2' },
];

const navLinks = [
  { label: 'Features', path: '/features' },
  { label: 'Supported Platforms', path: '/supported-platforms' },
];

export const LandingNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileHomeOpen, setMobileHomeOpen] = useState(false);
  const [mobilePricingOpen, setMobilePricingOpen] = useState(false);
  const location = useLocation();

  const isHomePage = ['/', '/home-2', '/home-3', '/home-4', '/home-5'].includes(location.pathname);
  const isPricingPage = ['/pricing', '/pricing-2'].includes(location.pathname);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="TradeValley" className="h-8" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {/* Home Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1 outline-none",
                isHomePage ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              )}>
                Home <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {homeLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link
                      to={link.path}
                      className={cn(
                        "w-full cursor-pointer",
                        location.pathname === link.path && "font-semibold"
                      )}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Pricing Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1 outline-none",
                isPricingPage ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              )}>
                Pricing <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {pricingLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link
                      to={link.path}
                      className={cn(
                        "w-full cursor-pointer",
                        location.pathname === link.path && "font-semibold"
                      )}
                    >
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/entering"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              to="/entering"
              className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {/* Mobile Home Accordion */}
              <button
                onClick={() => setMobileHomeOpen(!mobileHomeOpen)}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-600 hover:text-slate-900 py-2"
              >
                Home <ChevronDown className={cn("w-4 h-4 transition-transform", mobileHomeOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {mobileHomeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 space-y-1 overflow-hidden"
                  >
                    {homeLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block text-sm py-1.5",
                          location.pathname === link.path
                            ? "text-slate-900 font-semibold"
                            : "text-slate-500"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link
                  to="/entering"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-slate-600 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/entering"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-sm font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-lg"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
