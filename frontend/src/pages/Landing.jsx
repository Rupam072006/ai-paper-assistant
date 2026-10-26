import React from 'react';
import { Sparkles, FileSearch, BookOpen, MessageSquare, Lightbulb, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/80 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-tight">AI Research Assistant</span>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
        >
          Access Platform
        </button>
      </header>

      {/* Main Hero */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-950/60 border border-indigo-500/30 px-4 py-1.5 rounded-full mb-8">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300">
            Works across Medical, Agricultural, Engineering, Social Sciences & All Research Fields
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          Multi-Paper Literature Review & <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
            Research Intelligence Platform
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Upload research papers and receive structured NLP analysis, multi-paper comparison matrices, semantic similarity heatmaps, source-grounded RAG Q&A, and AI research gap discovery.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
          >
            <span>Start Literature Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-6xl">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Universal Domain Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically detects and adapts to your research field — Medical, Agricultural, Engineering, Social Sciences, Computer Science, Environmental Science, and more. Extracts domain-appropriate metrics, methods, and terminology.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">In-Depth Paper Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get a complete structured breakdown of each paper — research problem, methodology, datasets, evaluation metrics, limitations, and future directions — all automatically extracted.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Research Gap Discovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Identifies common weaknesses, methodological gaps, and unexplored directions across papers with evidence-backed confidence scoring — for any academic discipline.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        AI Research Assistant • Literature Review Platform
      </footer>
    </div>
  );
}
