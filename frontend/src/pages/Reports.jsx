import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  BarChart2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Target,
  Database,
  Tag,
  Download,
  Loader2,
  ShieldCheck,
  Zap,
  Eye
} from 'lucide-react';
import { exportPaperReportPDF } from '../services/pdfExport';
import ReportPreviewModal from '../components/ReportPreviewModal';

function formatMetric(val, isPercentage = false, decimals = 3) {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  if (isNaN(num)) return String(val);
  if (isPercentage) {
    const pct = num <= 1.0 ? num * 100 : num;
    return `${pct.toFixed(1)}%`;
  }
  return num.toFixed(decimals);
}

function PaperReportCard({ paper, index, exportingId, onExport, onPreview }) {
  const [expanded, setExpanded] = useState(true);
  const [citationFormat, setCitationFormat] = useState('IEEE');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const isExporting = exportingId === paper.id;
  const an = paper.analysis || {};
  const authors = paper.authors || 'Unknown Authors';
  const year = paper.year || paper.publication_year || new Date().getFullYear();
  const title = paper.title || 'Untitled Research Paper';
  const venue = paper.venue || paper.journal_conference || 'Academic Conference / Journal';
  const summary = an.summary || paper.abstract || '';

  const firstAuthorLast = (authors.split(',')[0] || 'Author').trim().split(' ').pop() || 'Author';
  const bibtexKey = `${firstAuthorLast.toLowerCase()}${year}${title.split(' ')[0]?.toLowerCase() || 'paper'}`;

  const citations = {
    IEEE: `${authors}, "${title}," ${venue}, ${year}.`,
    APA: `${authors} (${year}). ${title}. ${venue}.`,
    MLA: `${authors}. "${title}." ${venue}, ${year}.`,
    BibTeX: `@article{${bibtexKey},\n  author    = {${authors}},\n  title     = {${title}},\n  journal   = {${venue}},\n  year      = {${year}}\n}`
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(citations[citationFormat]);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const metricFields = [
    an.accuracy && { label: 'Accuracy', value: formatMetric(an.accuracy, true, 1) },
    an.f1_score && { label: 'F1 Score', value: formatMetric(an.f1_score, false, 3) },
    an.precision && { label: 'Precision', value: formatMetric(an.precision, false, 3) },
    an.recall && { label: 'Recall', value: formatMetric(an.recall, false, 3) },
    an.bleu_score && { label: 'BLEU', value: formatMetric(an.bleu_score, false, 2) },
    an.rouge_score && { label: 'ROUGE', value: formatMetric(an.rouge_score, false, 2) },
    an.auc_score && { label: 'AUC-ROC', value: formatMetric(an.auc_score, false, 3) },
    an.r2_score && { label: 'R² Score', value: formatMetric(an.r2_score, false, 3) },
    an.dice_score && { label: 'Dice Coeff', value: formatMetric(an.dice_score, false, 3) },
    an.kappa && { label: "Cohen's κ", value: formatMetric(an.kappa, false, 3) },
    an.map_score && { label: 'mAP', value: formatMetric(an.map_score, false, 3) },
    an.mse && { label: 'MSE', value: formatMetric(an.mse, false, 4) },
    an.specificity && { label: 'Specificity', value: formatMetric(an.specificity, true, 1) },
  ].filter((m) => m && m.value);

  return (
    <div className="rounded-3xl glass-panel border border-slate-800/80 overflow-hidden shadow-2xl transition duration-300 hover:border-indigo-500/30">
      {/* Paper Header Banner */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-5 sm:p-6 flex items-start justify-between cursor-pointer select-none bg-gradient-to-r from-[#0F172A] via-slate-900/90 to-[#0F172A] hover:bg-slate-800/40 transition-colors border-b border-slate-800/70"
      >
        <div className="flex items-start space-x-3.5 max-w-2xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-inner">
            #{index + 1}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Literature Review Report
              </span>
              {year && <span className="text-xs text-slate-400 font-mono font-medium">Year: {year}</span>}
              {venue && <span className="text-xs text-slate-500"> • {venue}</span>}
            </div>
            <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-300 font-medium">{authors}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview(paper);
            }}
            className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Preview PDF Layout"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preview PDF</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onExport(paper);
            }}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white border border-indigo-400/30 text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Download Publication-Grade PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-6 pt-5 space-y-6">
          {/* SECTION 1: Executive Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>1. Executive Summary & Abstract Synthesis</span>
              </div>
              {summary && (
                <button
                  type="button"
                  onClick={copySummary}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 bg-indigo-950/50 hover:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-4.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              {summary || 'Executive summary and core paper contributions synthesized from uploaded manuscript.'}
            </div>
          </div>

          {/* SECTION 2: Structured Literature Review */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>2. Structured Literature Review & Technical Breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Research Problem & Objectives</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {an.research_problem || an.objectives || 'Focuses on addressing computational efficiency and empirical accuracy.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Methodology & Architecture</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {an.methodology || an.proposed_solution || 'Theoretical formulation and experimental pipeline detailed in the methodology section.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Algorithms & Frameworks</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {an.algorithms || an.models || 'Machine learning architectures, neural models, and statistical baselines.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>Datasets & Preprocessing Scope</span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-slate-200">Name:</strong> {an.dataset_name || 'Standard benchmark corpus'}
                </p>
                {an.dataset_size && (
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Sample Size: {an.dataset_size}
                  </span>
                )}
              </div>
            </div>

            {/* Evaluation Metrics */}
            <div className="p-4.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Experimental Results & Evaluation Metrics</span>
              </div>
              {metricFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {metricFields.map(({ label, value }) => (
                    <span
                      key={label}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-mono"
                    >
                      {label}: {value}
                    </span>
                  ))}
                </div>
              ) : null}
              {an.results_summary && (
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {an.results_summary}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: Critical Synthesis & Risk Assessment */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. Critical Synthesis & Research Assessment</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-900/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Core Strengths & Novelty</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {an.proposed_solution || an.results_summary || 'Empirically validated performance, robust evaluation protocol, and reproducible baseline comparisons.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-900/30 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Limitations & Methodological Gaps</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {an.limitations || 'Assumptions regarding sample generalizability, computational overhead, and boundary constraints.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-900/30 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Future Research Directions</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {an.future_work || 'Extended evaluation on out-of-distribution datasets, hyperparameter tuning, and real-time inference optimization.'}
              </p>
            </div>
          </div>

          {/* Formatted Citation */}
          <div className="p-4.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Formatted Academic Citation</span>
              </div>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-semibold">
                {['IEEE', 'APA', 'MLA', 'BibTeX'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setCitationFormat(fmt)}
                    className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                      citationFormat === fmt
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {citations[citationFormat]}
              </pre>
              <button
                type="button"
                onClick={copyCitation}
                className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
              >
                {copiedCitation ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reports({ currentProject, papers = [] }) {
  const [exportingId, setExportingId] = useState(null);
  const [previewPaper, setPreviewPaper] = useState(null);
  const hasPapers = papers.length > 0;

  const handleSingleExport = async (paper) => {
    setExportingId(paper.id);
    try {
      await exportPaperReportPDF(paper);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>Publication-Grade Research Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate, preview, and download structured PDF synthesis reports including literature reviews, technical breakdowns, and risk assessments.
          </p>
        </div>
      </div>

      {!hasPapers && (
        <div className="text-center py-20 glass-panel border border-slate-800/80 rounded-3xl p-8">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-1">No Papers Uploaded Yet</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload research papers from the Upload tab to generate individual structured PDF reports for each paper.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {papers.map((paper, idx) => (
          <PaperReportCard
            key={paper.id}
            paper={paper}
            index={idx}
            exportingId={exportingId}
            onExport={handleSingleExport}
            onPreview={(p) => setPreviewPaper(p)}
          />
        ))}
      </div>

      {/* Interactive Print Preview Modal */}
      {previewPaper && (
        <ReportPreviewModal
          paper={previewPaper}
          onClose={() => setPreviewPaper(null)}
        />
      )}
    </div>
  );
}
