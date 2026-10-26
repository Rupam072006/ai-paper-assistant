import React, { useState } from 'react';
import { X, Download, Loader2, Sparkles, FileText, Target, Cpu, Tag, Database, BarChart2, ShieldCheck, Zap, AlertTriangle, Lightbulb, Bookmark } from 'lucide-react';
import { getPaperReportData, exportPaperReportPDF } from '../services/pdfExport';

export default function ReportPreviewModal({ paper, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!paper) return null;
  const data = getPaperReportData(paper);
  if (!data) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportPaperReportPDF(paper);
    } catch (err) {
      console.error('Download PDF error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">PDF Document Print Preview</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-lg">{data.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: High-Fidelity A4 Print Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 space-y-6">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-8 text-slate-800 max-w-3xl mx-auto space-y-6 font-sans">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white space-y-3">
              <span className="inline-block px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                Scientific Literature Review Report
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                {data.title}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
                <div><strong>Authors:</strong> {data.authors}</div>
                <div><strong>Year:</strong> {data.year}</div>
                <div><strong>Venue:</strong> {data.venue}</div>
                <div><strong>Synthesis Date:</strong> {data.dateStr}</div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Executive Summary & Core Contributions</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {data.summary}
              </div>
            </div>

            {/* Section 2: Structured Literature Review */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Structured Literature Review & Technical Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-indigo-700 uppercase">Research Objectives & Problem</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{data.research_problem}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-sky-700 uppercase">Methodology & Architecture</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{data.methodology}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-purple-700 uppercase">Algorithms & Models</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{data.algorithms}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Datasets & Benchmark Scope</div>
                  <p className="text-xs text-slate-700">
                    <strong>Corpus:</strong> {data.dataset_name}<br/>
                    <strong>Sample Size:</strong> {data.dataset_size}
                  </p>
                </div>
              </div>

              {/* Metrics Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-emerald-600 border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Experimental Results & Metrics</div>
                {data.metricsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.metricsList.map((m) => (
                      <span key={m.label} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {m.label}: <strong>{m.value}</strong>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-700 leading-relaxed">{data.results_summary}</p>
              </div>
            </div>

            {/* Section 3: Critical Synthesis & Assessment */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Critical Synthesis & Research Assessment</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-emerald-500 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Core Strengths & Novelty</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{data.strengths}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-rose-500 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Limitations & Gaps</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{data.limitations}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-indigo-500 border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-indigo-700 uppercase">Future Research Directions</div>
                <p className="text-xs text-slate-700 leading-relaxed">{data.future_work}</p>
              </div>
            </div>

            {/* Section 4: Academic Citation */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-sky-600" />
                <span>4. Academic Citation (IEEE Format)</span>
              </h3>
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-800 leading-relaxed">
                {data.citations.IEEE}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>AI Research Assistant — Automated Scientific Literature Review</span>
              <span>Publication-Grade Synthesis Report</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <span className="text-xs text-slate-400">
            Previewing accurate layout for standard A4 export.
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
