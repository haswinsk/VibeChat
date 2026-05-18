import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { MessageSquare, Music, Radio, Shield, Zap, ChevronRight, Sparkles, Users } from 'lucide-react';

const CAROUSEL_ITEMS = [
  {
    icon: <MessageSquare className="w-8 h-8 text-primary" />,
    title: "Lightning Fast Chat",
    description: "Instantaneous one-to-one messaging with real-time typing indicators, read receipts, and flawless delivery."
  },
  {
    icon: <Music className="w-8 h-8 text-pink-500" />,
    title: "Synchronized Listening",
    description: "Invite friends to private music rooms. Play, pause, and seek together with sub-second audio sync."
  },
  {
    icon: <Radio className="w-8 h-8 text-purple-500" />,
    title: "Voice Notes & Previews",
    description: "Record crisp voice messages with instant waveform preview and background transcoding support."
  },
  {
    icon: <Shield className="w-8 h-8 text-emerald-500" />,
    title: "Enterprise Reliability",
    description: "Built on rock-solid Socket.IO architecture with automatic reconnection and state recovery."
  }
];

const Landing = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [activeSlide, setActiveSlide] = useState(0);

  // If user is already authenticated, redirect them to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0b101a] text-white overflow-x-hidden selection:bg-primary selection:text-white font-sans">
      {/* Background Gradient Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0b101a]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="font-extrabold text-xl tracking-wider text-white">V</span>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            VibeChat
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-primary/10 border border-primary/30 text-primary-100 hidden sm:inline-block">
            Realtime 2.0
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link 
            to="/signup"
            className="text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary-100 mb-8 text-xs sm:text-sm font-medium shadow-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>The next generation social messaging experience</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.15] bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
          Connect, Share & Listen <br />
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            In Perfect Harmony.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
          Experience real-time one-to-one chat, high-fidelity voice notes, instant media sharing, 
          and synchronized private music rooms where you and your friends vibe to the exact same beat.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch VibeChat Free</span>
            <Zap className="w-5 h-5 fill-current" />
          </Link>
          <Link 
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-dark-surface border border-dark-border text-white hover:bg-dark-surface/80 font-bold text-lg transition-all"
          >
            Already have an account?
          </Link>
        </div>
      </header>

      {/* Interactive Lightweight Carousel Showcase */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Designed for Ultimate Responsiveness</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Swipe or click through our lightweight, dependency-free CSS carousel showcasing robust core modules.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory custom-scrollbar scroll-smooth">
            {CAROUSEL_ITEMS.map((item, idx) => (
              <div 
                key={idx}
                className="snap-center shrink-0 w-[300px] sm:w-[350px] p-8 rounded-3xl bg-dark-surface/60 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-primary/50 transition-all hover:-translate-y-2 group"
                onMouseEnter={() => setActiveSlide(idx)}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-4">
            {CAROUSEL_ITEMS.map((_, idx) => (
              <div 
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${idx === activeSlide ? 'bg-primary w-8' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl p-12 bg-gradient-to-r from-primary/20 via-purple-600/20 to-pink-600/20 border border-white/15 overflow-hidden text-center backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-[80px] -z-10" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to upgrade your conversations?
          </h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-8 font-light">
            Join thousands of users enjoying seamless private music playback and instant social connection. No credit card required.
          </p>
          <Link 
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-extrabold text-sm sm:text-base hover:bg-gray-200 transition-all shadow-lg hover:scale-105"
          >
            <Users className="w-5 h-5" />
            <span>Create Account Now</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs sm:text-sm text-gray-500 bg-[#0b101a]">
        <p>© {new Date().getFullYear()} VibeChat Platform. All rights reserved. Built for flawless real-time collaboration.</p>
      </footer>
    </div>
  );
};

export default Landing;
