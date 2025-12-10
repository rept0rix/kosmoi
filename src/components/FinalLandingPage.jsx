import React, { useState } from 'react';
import { ArrowRight, Zap, CheckCircle, Shield, TrendingUp, Users, Menu, X, Globe, Bot, BarChart3, Quote, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
const FinalLandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCTA = () => {
    // Navigate to the dashboard app
    navigate('/app');
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white">
      {/* Navbar */}
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img src="/kosmoi_logo_blue.svg" alt="Kosmoi" className="h-9 w-auto group-hover:opacity-80 transition-opacity" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/about" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">About</Link>
              <Link to="/team" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Team</Link>
              <Link to="/business-info" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Business Info</Link>
              <Link to="/pricing" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Plans & Pricing</Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all flex items-center gap-1 focus:outline-none">
                    Legal <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-slate-100 shadow-xl rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/legal/terms" className="cursor-pointer">Terms of Service</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/legal/privacy" className="cursor-pointer">Privacy Policy</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/legal/accessibility" className="cursor-pointer">Accessibility</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/app"
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-blue-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Enter App
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none bg-slate-50 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute w-full left-0 top-20 shadow-2xl z-40 animate-in slide-in-from-top-2">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link to="/about" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">About</Link>
              <Link to="/team" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Team</Link>
              <Link to="/business-info" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Business Info</Link>
              <Link to="/pricing" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Plans & Pricing</Link>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Legal</p>
                <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                  <Link to="/legal/terms" className="block py-2 text-sm text-slate-600 hover:text-blue-600">Terms of Service</Link>
                  <Link to="/legal/privacy" className="block py-2 text-sm text-slate-600 hover:text-blue-600">Privacy Policy</Link>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link to="/app" className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-lg">
                  Enter App
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header id="vision" className="relative overflow-hidden pt-16 pb-24 lg:pt-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">The Island's Digital Infrastructure</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
              Powering Koh Samui with <br className="hidden sm:block" />
              <span className="relative inline-block text-blue-600">
                Intelligent Autonomy
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              We architect the digital nervous system for the island's leading businesses.
              From autonomous booking agents to predictive operational management.
              <span className="block mt-4 font-semibold text-slate-900">Experience the future of work with our Pilot Program.</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/business-info"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-600 hover:transform hover:-translate-y-1 transition-all flex items-center justify-center"
              >
                Partner With Us <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={() => scrollToSection('challenge')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold text-lg rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-all"
              >
                View Pilot Program
              </button>
            </div>
          </div>
        </div>

        {/* Decorative background elements - Abstract Data Flow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-72 sm:w-96 h-72 sm:h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-72 sm:w-96 h-72 sm:h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        </div>
      </header>

      {/* The Ecosystem Logic */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why an OS for an Island?</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Fragmented services slow everyone down. We create synergy between businesses, locals, and tourists through a unified digital layer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Global-Local Bridge", desc: "Seamless translation and visa assistance for expats, integrated into your service flow." },
              { icon: Zap, title: "Rapid Deployment", desc: "We identify one key problem and solve it in under 48 hours. No lengthy contracts." },
              { icon: Users, title: "Community Engine", desc: "We connect people, services, and opportunities in a seamless, organic way." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition hover:-translate-y-1">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
                  <item.icon className="text-yellow-400 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Menu */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-yellow-500 font-bold uppercase tracking-wider">The Menu</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">What can we solve for $1?</h2>
            </div>
            <p className="md:max-w-md text-slate-600 mt-4 md:mt-0">
              Choose one of these pilots. We customize it to your data and branding.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-yellow-400 transition-colors">
              <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
              <div className="mb-4 text-4xl">💬</div>
              <h3 className="text-xl font-bold mb-2">Auto-Reply Agent</h3>
              <p className="text-slate-600 text-sm mb-4">Instantly answer "What are your hours?" or "Do you have availability?" on WhatsApp/FB.</p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 24/7 Response</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Multi-language</li>
              </ul>
            </div>

            <div className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-yellow-400 transition-colors">
              <div className="mb-4 text-4xl">⭐</div>
              <h3 className="text-xl font-bold mb-2">Review Booster</h3>
              <p className="text-slate-600 text-sm mb-4">Automatically send polite follow-ups to recent customers asking for a Google Review.</p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Increase Rating</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Filter Negative Feedback</li>
              </ul>
            </div>

            <div className="group relative bg-white border border-slate-200 rounded-2xl p-8 hover:border-yellow-400 transition-colors">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="text-xl font-bold mb-2">Menu Translator</h3>
              <p className="text-slate-600 text-sm mb-4">Digitize your menu into 5 languages with AI-perfected descriptions.</p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Russian, Chinese, German</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> QR Code Ready</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Locals Love Us */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Locals Love Us</h2>
            <p className="mt-4 text-lg text-slate-600">See what happens when you connect your business to the OS.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "I didn't believe the $1 offer until I saw the bot answering customers while I slept. Game changer.", author: "Sarah T.", role: "Villa Manager" },
              { text: "The menu translator saved us so much time. We used to use Google Translate and it was embarrassing. This is pro.", author: "K. Nop", role: "Restaurant Owner" },
              { text: "Kosmoi is like having a digital manager. It just works. Highly recommend the Review Booster.", author: "James B.", role: "Tour Operator" }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <Quote className="w-8 h-8 text-yellow-400 mb-4 opacity-50" />
                <p className="text-slate-700 mb-6 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-slate-900">{t.author}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - The $1 Challenge */}
      <section id="challenge" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-yellow-500 rounded-full opacity-20 filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500 rounded-full opacity-20 filter blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to upgrade your business?</h2>
          <p className="text-xl text-slate-300 mb-10">
            It costs less than a bottle of water to see the future.
            <br className="hidden md:block" />Let's build something great together.
          </p>
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 inline-block w-full max-w-md">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <span className="text-slate-300">One Pilot Solution</span>
              <span className="text-2xl font-bold text-white">$1.00</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center text-slate-300"><CheckCircle className="w-5 h-5 mr-3 text-yellow-400" /> Setup within 48 hours</li>
              <li className="flex items-center text-slate-300"><CheckCircle className="w-5 h-5 mr-3 text-yellow-400" /> No credit card required upfront</li>
              <li className="flex items-center text-slate-300"><CheckCircle className="w-5 h-5 mr-3 text-yellow-400" /> Cancel anytime</li>
            </ul>
            <button
              onClick={handleCTA}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xl rounded-xl transition-all transform hover:scale-105 shadow-xl"
            >
              Start Now
            </button>
          </div>
          <p
            className="mt-6 text-slate-400 text-sm cursor-pointer hover:text-white transition"
            onClick={() => window.open('https://wa.me/66000000000?text=I%20need%20help', '_blank')}
          >
            Questions? Message our AI agent on WhatsApp.
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FinalLandingPage;