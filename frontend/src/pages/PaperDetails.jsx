import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Cpu,
  Database,
  BarChart2,
  AlertTriangle,
  Lightbulb,
  Tag,
  Bookmark,
  ArrowLeft,
  CheckCircle,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';

export default function PaperDetails({ paper, onBack, onNavigate }) {
  const [summaryMode, setSummaryMode] = useState('short'); // 'short' | 'detailed' | 'technical' | 'section'
  const [copied, setCopied] = useState(false);

  if (!paper) {
    return (
      <div className="p-8 text-center text-slate-400">
        No paper selected. <button onClick={onBack} className="text-indigo-400 underline">Return to Dashboard</button>
      </div>
    );
  }

  const an = paper.analysis || {};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Top Header & Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-indigo-400 font-semibold mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {paper.publication_year || 2024}
              </span>
              <span className="text-xs text-slate-400">{paper.journal_conference || 'Academic Conference'}</span>
            </div>

            <h1 className="text-2xl font-extrabold text-white leading-snug">{paper.title}</h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">Authors: {paper.authors || 'Not specified'}</p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('chat', paper.id)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask AI in Copilot</span>
              </button>
            )}

            <button
              onClick={() => copyToClipboard(paper.title)}
              className="self-start bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Title'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Mode Switcher */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">AI Paper Summary</h2>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {['short', 'detailed', 'technical', 'section'].map((mode) => (
              <button
                key={mode}
                onClick={() => setSummaryMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  summaryMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'section' ? 'Section-wise' : `${mode} Summary`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Content Display */}
        <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
          {summaryMode === 'short' && (
            <p>{an.short_summary || paper.abstract || 'Short summary unavailable.'}</p>
          )}
          {summaryMode === 'detailed' && (
            <p className="whitespace-pre-line">{an.detailed_summary || paper.abstract || 'Detailed summary unavailable.'}</p>
          )}
          {summaryMode === 'technical' && (
            <p className="whitespace-pre-line font-mono">{an.technical_summary || 'Technical summary unavailable.'}</p>
          )}
          {summaryMode === 'section' && (
            <div className="space-y-4">
              {an.section_summaries ? (
                Object.entries(an.section_summaries).map(([sec, text]) => (
                  <div key={sec}>
                    <h4 className="font-bold text-indigo-400 mb-1">{sec}</h4>
                    <p className="text-slate-300">{text}</p>
                  </div>
                ))
              ) : (
                <p>Section summaries unavailable.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid Breakdown Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Research Problem & Objectives */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Research Problem & Objectives</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Research Problem</span>
              <p className="text-slate-200 mt-1">{an.research_problem || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Objectives</span>
              <p className="text-slate-200 mt-1">{an.objectives || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Proposed Solution</span>
              <p className="text-slate-200 mt-1">{an.proposed_solution || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Technical & Methodology */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Technical Methodology</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Algorithms & Models</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {an.algorithms ? (
                  an.algorithms.split(',').map((algo, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                      {algo.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Deep Learning Pipeline</span>
                )}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Methodology Overview</span>
              <p className="text-slate-200 mt-1 line-clamp-4">{an.methodology || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Dataset & Setup */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Dataset & Experimental Setup</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Dataset Name</span>
              <p className="text-slate-200 mt-1 font-medium">{an.dataset_name || 'Benchmark Dataset'}</p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Dataset Size</span>
              <p className="text-slate-200 mt-1 font-mono">{an.dataset_size || 'Not reported'}</p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Domain</span>
              <p className="text-slate-200 mt-1">{an.dataset_domain || 'AI / NLP'}</p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Key Features</span>
              <p className="text-slate-200 mt-1">{an.features || 'Textual Context'}</p>
            </div>
          </div>
        </div>

        {/* Evaluation Metrics & Results */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Results & Evaluation Metrics</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reported Metrics</span>
              <p className="text-slate-200 mt-1 font-medium">{an.evaluation_metrics || 'Accuracy, F1-score'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {an.f1_score && (
                <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                  <span className="text-[10px] text-slate-400 block">F1-Score</span>
                  <span className="font-bold text-sm">{an.f1_score}</span>
                </div>
              )}
              {an.accuracy && (
                <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <span className="font-bold text-sm">{an.accuracy}</span>
                </div>
              )}
              {an.bleu_score && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  <span className="text-[10px] text-slate-400 block">BLEU</span>
                  <span className="font-bold text-sm">{an.bleu_score}</span>
                </div>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Results Summary</span>
              <p className="text-slate-200 mt-1">{an.results_summary || 'Outperforms existing baselines.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations & Author Future Work */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Author-Stated Limitations</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {an.limitations || 'No explicit limitations reported by authors.'}
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Lightbulb className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Author-Stated Future Work</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {an.future_work || 'No explicit future work specified by authors.'}
          </p>
        </div>
      </div>

      {/* Keywords & References */}
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Tag className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white">Extracted Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {an.keywords ? (
              an.keywords.split(',').map((kw, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700">
                  {kw.trim()}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Keywords unavailable.</span>
            )}
          </div>
        </div>

        {/* References */}
        {an.references_data && an.references_data.length > 0 && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Bookmark className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Extracted Bibliography & References ({an.references_data.length})</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs text-slate-300">
              {an.references_data.map((ref, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-[11px]">
                  <span className="text-indigo-400 font-bold mr-2">{ref.ref_id}</span>
                  <span>{ref.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
