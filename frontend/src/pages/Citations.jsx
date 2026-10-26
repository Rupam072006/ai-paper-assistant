import React, { useState, useEffect } from 'react';
import { Bookmark, Copy, Check, Loader2 } from 'lucide-react';
import { analyticsService } from '../services/api';

export default function Citations({ currentProject }) {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (currentProject) {
      fetchCitations();
    }
  }, [currentProject]);

  const fetchCitations = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getCitations(currentProject.id);
      setCitations(data);
    } catch (err) {
      console.error('Failed to fetch citations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Citation & Reference Generator</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated academic citation generator for APA, IEEE, MLA, and BibTeX bibliography formats
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs">Generating bibliography & formatted citations...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {citations.map((item, idx) => (
            <div key={item.paper_id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>{item.paper_title}</span>
              </h3>

              {/* Formats Grid */}
              <div className="grid grid-cols-1 gap-3 text-xs">
                {/* APA */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] block mb-0.5">APA Format</span>
                    <p className="text-slate-300 font-serif">{item.apa}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.apa, `apa-${idx}`)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                  >
                    {copiedKey === `apa-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* IEEE */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-cyan-400 uppercase tracking-wider text-[10px] block mb-0.5">IEEE Format</span>
                    <p className="text-slate-300 font-mono text-[11px]">{item.ieee}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.ieee, `ieee-${idx}`)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                  >
                    {copiedKey === `ieee-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* MLA */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block mb-0.5">MLA Format</span>
                    <p className="text-slate-300">{item.mla}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(item.mla, `mla-${idx}`)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                  >
                    {copiedKey === `mla-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* BibTeX */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                  <div className="w-full">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">BibTeX Entry</span>
                    <pre className="text-slate-300 font-mono text-[10px] bg-slate-950 p-2.5 rounded border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                      {item.bibtex}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopy(item.bibtex, `bib-${idx}`)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 mt-4"
                  >
                    {copiedKey === `bib-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
