import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Navbar({ onGoHome }) {
  return (
    <header className="h-16 bg-[#0F172A]/70 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div
          onClick={onGoHome}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-95 transition group"
          title="Back to Landing Page"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight hidden sm:block">
            AI Research Assistant
          </span>
        </div>
      </div>

      {/* Right side status */}
      <div className="flex items-center space-x-2.5">
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Literature Engine</span>
        </div>
      </div>
    </header>
  );
}
