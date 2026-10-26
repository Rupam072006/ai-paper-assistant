import React, { useState, useEffect } from 'react';
import { TrendingUp, Layers, Cpu, Database, Calendar, Loader2 } from 'lucide-react';
import { analyticsService } from '../services/api';

export default function Trends({ currentProject }) {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProject) {
      fetchTrends();
    }
  }, [currentProject]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getTrends(currentProject.id);
      setTrendsData(data);
    } catch (err) {
      console.error('Failed to fetch trends data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Research Trends & Topic Modeling</h1>
        <p className="text-xs text-slate-400 mt-1">
          Algorithmic evolution timeline, embedding topic clusters, and methodology trends across uploaded papers
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs">Extracting research topics & methodology evolution timeline...</p>
        </div>
      ) : (
        trendsData && (
          <div className="space-y-8">
            {/* Timeline Evolution */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Publication Year Methodology Evolution</h2>
              </div>

              {trendsData.timeline.length > 0 ? (
                <div className="relative border-l-2 border-indigo-500/30 ml-4 space-y-6 pl-6 py-2">
                  {trendsData.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900" />
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-indigo-400 text-sm">{item.year}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {item.paper_count} Paper(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.algorithms.map((algo, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 text-xs border border-indigo-800/40 font-mono">
                              {algo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Timeline data unavailable.</p>
              )}
            </div>

            {/* Topic Modeling Clusters */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Discovered Research Topic Clusters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {trendsData.top_topics.map((t) => (
                  <div key={t.topic_id} className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Topic {t.topic_id}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.paper_count} Papers
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">{t.name}</h3>

                    <div className="flex flex-wrap gap-1.5">
                      {t.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Assigned Papers:</span> {t.papers.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Common Algorithms & Datasets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Cpu className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Top Algorithms</h3>
                </div>
                <div className="space-y-2">
                  {trendsData.top_algorithms.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="font-mono text-emerald-300 font-semibold">{a.algorithm}</span>
                      <span className="text-slate-400">{a.count} Paper(s)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Database className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Top Datasets</h3>
                </div>
                <div className="space-y-2">
                  {trendsData.top_datasets.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="font-medium text-slate-200">{d.dataset}</span>
                      <span className="text-slate-400">{d.count} Paper(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
