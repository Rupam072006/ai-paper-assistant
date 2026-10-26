import React, { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, ShieldCheck, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { analyticsService } from '../services/api';

export default function ResearchGaps({ currentProject }) {
  const [gapsData, setGapsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('gaps'); // 'gaps' | 'author_future'

  useEffect(() => {
    if (currentProject) {
      fetchGaps();
    }
  }, [currentProject]);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getResearchGaps(currentProject.id);
      setGapsData(data);
    } catch (err) {
      console.error('Failed to fetch research gaps', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (level) => {
    if (level === 'High') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Confidence: High</span>;
    }
    if (level === 'Medium') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Confidence: Medium</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Confidence: Low</span>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Research Gap & Opportunity Discovery</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cross-paper limitation analysis, underexplored methodologies, and AI-assisted research directions with evidence scoring
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab('gaps')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'gaps' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Research Gap Directions
        </button>
        <button
          onClick={() => setTab('author_future')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'author_future' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Author-Stated Future Work
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs">Analyzing cross-paper limitations & synthesizing research gaps...</p>
        </div>
      ) : (
        gapsData && (
          <div className="space-y-8">
            {tab === 'gaps' ? (
              <>
                {/* Common Limitations Across Papers */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-3">
                    <AlertTriangle className="w-5 h-5" />
                    <h2 className="text-base font-bold text-white">Common Limitations Across Analyzed Papers</h2>
                  </div>

                  <div className="space-y-3">
                    {gapsData.common_limitations.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{item.limitation}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Affected Papers: {item.affected_papers ? item.affected_papers.join(', ') : 'All uploaded papers'}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 shrink-0">
                          {item.evidence_count} Paper(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Potential Research Directions */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5" />
                    <h2 className="text-base font-bold text-white">AI-Suggested Potential Research Directions</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {gapsData.potential_research_directions.map((d, idx) => (
                      <div key={idx} className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {getConfidenceBadge(d.confidence_level)}
                            <span className="text-[10px] text-slate-400">Evidence: {d.evidence_count} paper(s)</span>
                          </div>

                          <h3 className="text-sm font-bold text-white leading-snug mb-2">{d.title}</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">{d.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 text-[10px] text-indigo-400 font-medium">
                          AI-generated potential research direction
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Author-Stated Future Work */
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                  <Lightbulb className="w-5 h-5" />
                  <h2 className="text-base font-bold text-white">Author-Stated Future Work (Extracted Directly)</h2>
                </div>

                <div className="space-y-4">
                  {gapsData.author_stated_future_work.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                      <h4 className="font-bold text-indigo-300">{item.paper_title}</h4>
                      <p className="text-slate-300 leading-relaxed">{item.future_work}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
