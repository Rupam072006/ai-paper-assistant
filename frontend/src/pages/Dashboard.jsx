import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Cpu,
  Database,
  Lightbulb,
  Network,
  ArrowRight,
  Eye,
  MessageSquare,
  UploadCloud,
  Sparkles,
  Loader2,
  Trash2,
  BarChart2,
  Target,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Tag,
  Award,
  Zap,
  ShieldCheck,
  TrendingUp,
  Table as TableIcon
} from 'lucide-react';
import { paperService } from '../services/api';
import CustomPaperDropdown from '../components/CustomPaperDropdown';

export default function Dashboard({
  papers = [],
  analytics,
  onNavigate,
  onPaperSelect,
  onUploadClick,
  onDeletePaper,
  currentProject,
  onReload
}) {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(''); // '' = All Uploaded Papers
  const paperCount = papers.length;

  const handleLoadDemo = async () => {
    if (!currentProject) return;
    setLoadingDemo(true);
    try {
      await paperService.seedDemo(currentProject.id);
      if (onReload) await onReload();
    } catch (err) {
      console.error('Failed to seed demo papers', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  // Determine active papers list based on selected filter
  const isSinglePaperMode = selectedPaperId !== '';
  const activePaper = isSinglePaperMode ? papers.find((p) => p.id === selectedPaperId) : null;
  const filteredPapers = isSinglePaperMode && activePaper ? [activePaper] : papers;

  // Calculate dynamic metrics for the active scope
  const algorithmsList = Array.from(
    new Set(
      filteredPapers.flatMap((p) =>
        p.analysis?.algorithms
          ? p.analysis.algorithms.split(',').map((a) => a.trim()).filter(Boolean)
          : []
      )
    )
  );

  const datasetsList = Array.from(
    new Set(filteredPapers.map((p) => p.analysis?.dataset_name).filter(Boolean))
  );

  const gapCount = filteredPapers.filter(
    (p) => p.analysis?.limitations && p.analysis.limitations.trim().length > 0
  ).length;

  // Single paper specific score vs multi-paper average
  const scoresRaw = filteredPapers
    .map((p) => {
      const an = p.analysis || {};
      const val = parseFloat(an.f1_score || an.accuracy || an.auc_score || '');
      return isNaN(val) ? null : val;
    })
    .filter((v) => v !== null);

  const avgScore = scoresRaw.length > 0
    ? (scoresRaw[0] <= 1.0
        ? `${(scoresRaw.reduce((a, b) => a + b, 0) / scoresRaw.length * 100).toFixed(1)}%`
        : `${(scoresRaw.reduce((a, b) => a + b, 0) / scoresRaw.length).toFixed(1)}%`)
    : null;

  if (paperCount === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <UploadCloud className="w-8 h-8 animate-bounce text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Research Papers Uploaded Yet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Upload 3–5 research papers or load demo benchmark papers to generate the interactive literature review matrix and research gap analysis.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onUploadClick}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Research Papers</span>
          </button>
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-bold px-6 py-3 rounded-xl border border-indigo-500/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loadingDemo ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400" />
            )}
            <span>Load Demo Benchmark Papers</span>
          </button>
        </div>
      </div>
    );
  }

  // Extract metrics helper for a given paper analysis object
  const getMetricsList = (an = {}) => {
    const list = [];
    if (an.accuracy) list.push({ label: 'Accuracy', value: an.accuracy, color: 'emerald' });
    if (an.f1_score) list.push({ label: 'F1-Score', value: an.f1_score, color: 'cyan' });
    if (an.precision_score || an.precision) list.push({ label: 'Precision', value: an.precision_score || an.precision, color: 'blue' });
    if (an.recall_score || an.recall) list.push({ label: 'Recall', value: an.recall_score || an.recall, color: 'indigo' });
    if (an.auc_score) list.push({ label: 'AUC-ROC', value: an.auc_score, color: 'purple' });
    if (an.rouge_score) list.push({ label: 'ROUGE', value: an.rouge_score, color: 'amber' });
    if (an.bleu_score) list.push({ label: 'BLEU', value: an.bleu_score, color: 'teal' });
    if (an.rmse) list.push({ label: 'RMSE', value: an.rmse, color: 'rose' });
    if (an.mae) list.push({ label: 'MAE', value: an.mae, color: 'rose' });
    if (an.r2_score) list.push({ label: 'R²', value: an.r2_score, color: 'emerald' });
    if (an.map_score) list.push({ label: 'mAP', value: an.map_score, color: 'violet' });
    return list;
  };

  const getMetricBadgeClass = (color) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'cyan':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50';
      case 'blue':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/50';
      case 'indigo':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50';
      case 'purple':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/50';
      case 'amber':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'teal':
        return 'bg-teal-950/60 text-teal-300 border-teal-700/50';
      case 'rose':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/50';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      {/* Top Header & Dynamic Scope Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>AI Research Literature Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSinglePaperMode
              ? `Filtered Deep-Dive View for: "${activePaper?.title}"`
              : 'Multi-Paper Literature Review & Technical Synthesis Dashboard'}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          {/* Custom Scope Filter Dropdown */}
          <CustomPaperDropdown
            papers={papers}
            selectedPaperId={selectedPaperId}
            onSelect={(id) => setSelectedPaperId(id)}
          />

          {isSinglePaperMode && (
            <button
              type="button"
              onClick={() => setSelectedPaperId('')}
              className="flex items-center space-x-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Reset to All Uploaded Papers"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Show All</span>
            </button>
          )}

          <button
            onClick={onUploadClick}
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Dynamic Top Stat Counters with Glow Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isSinglePaperMode ? 'Active Scope' : 'Total Papers'}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-2 truncate font-mono">
            {isSinglePaperMode ? '1 Paper' : `${paperCount} Papers`}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Algorithms
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-2 font-mono">
            {algorithmsList.length} Model{algorithmsList.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Datasets
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-2 font-mono">
            {datasetsList.length} Corpus
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-pink-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Gaps Found
            </span>
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-2 font-mono">
            {gapCount} Identified
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isSinglePaperMode ? 'Metric Score' : 'Avg Score'}
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Network className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-2 font-mono">
            {avgScore || (activePaper?.analysis?.f1_score ? `F1: ${activePaper.analysis.f1_score}` : (activePaper?.analysis?.accuracy ? `Acc: ${activePaper.analysis.accuracy}` : 'Reported'))}
          </p>
        </div>
      </div>

      {/* SINGLE PAPER DEEP-DIVE VIEW */}
      {isSinglePaperMode && activePaper ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Paper Overview Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/20 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-4xl">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider shadow-sm">
                    Target Paper Synthesis
                  </span>
                  {activePaper.publication_year && (
                    <span className="text-xs text-slate-400 font-mono">Year: {activePaper.publication_year}</span>
                  )}
                  {activePaper.journal_conference && (
                    <span className="text-xs text-slate-500"> • {activePaper.journal_conference}</span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-white leading-snug">{activePaper.title}</h2>
                <p className="text-xs text-slate-300 font-medium">Authors: {activePaper.authors || 'Unknown Authors'}</p>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onPaperSelect(activePaper)}
                  className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Analysis</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('chat', activePaper?.id)}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI in Copilot</span>
                </button>
              </div>
            </div>

            {/* Abstract / Executive Summary */}
            {(activePaper.analysis?.summary || activePaper.analysis?.short_summary || activePaper.abstract) && (
              <div className="p-4.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] block mb-1">
                  Executive Summary & Research Problem
                </span>
                {activePaper.analysis?.research_problem ? (
                  <p className="mb-2 text-slate-200"><strong className="text-indigo-300">Problem: </strong>{activePaper.analysis.research_problem}</p>
                ) : null}
                <p>{activePaper.analysis?.summary || activePaper.analysis?.short_summary || activePaper.abstract}</p>
              </div>
            )}
          </div>

          {/* 2-COLUMN TECHNICAL SYNTHESIS & EVALUATION LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT COLUMN: Evaluation Metrics & Key Findings Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Evaluation Metrics & Key Findings</h3>
                    <p className="text-[11px] text-slate-400">Quantitative benchmarks and experimental validation</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Quantitative
                </span>
              </div>

              {/* Structured Performance Metric Badges */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reported Performance Metrics
                </span>
                {getMetricsList(activePaper.analysis).length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {getMetricsList(activePaper.analysis).map((metric, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 shadow-sm ${getMetricBadgeClass(
                          metric.color
                        )}`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-80">{metric.label}:</span>
                        <span className="font-mono font-bold tracking-tight">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Empirical performance detailed across qualitative baseline evaluations.</span>
                  </div>
                )}
              </div>

              {/* Summary Callout Box: Key Experimental Results & Baseline Comparison */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 border border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Key Experimental Results & Baseline Comparison
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePaper.analysis?.results_summary ||
                    activePaper.analysis?.evaluation_metrics ||
                    'Empirically validated against state-of-the-art baselines demonstrating competitive domain performance.'}
                </p>
                {activePaper.analysis?.evaluation_metrics && activePaper.analysis?.results_summary && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <strong className="text-indigo-300">Metric Formulation: </strong>
                    {activePaper.analysis.evaluation_metrics}
                  </div>
                )}
              </div>

              {/* Additional Model Pipeline Details */}
              {algorithmsList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Core Algorithmic Frameworks
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {algorithmsList.map((algo, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                      >
                        {algo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Datasets & Methodological Rigor Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-emerald-500/20 text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Datasets & Methodological Rigor</h3>
                    <p className="text-[11px] text-slate-400">Experimental setup, data pipelines, and research boundaries</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Methodology
                </span>
              </div>

              {/* 4 Structured Breakdown Sections */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Primary Datasets Used & Sample Sizes */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5" />
                    <span>Primary Datasets & Sample Sizes</span>
                  </div>
                  <div className="text-slate-200 mt-1 space-y-0.5">
                    <p><strong className="text-slate-400">Dataset Name:</strong> {activePaper.analysis?.dataset_name || 'Standard academic benchmark'}</p>
                    <p><strong className="text-slate-400">Sample Size / Scope:</strong> {activePaper.analysis?.dataset_size || 'Refer to paper methodology section'}</p>
                    {activePaper.analysis?.dataset_domain && (
                      <p><strong className="text-slate-400">Domain:</strong> {activePaper.analysis.dataset_domain}</p>
                    )}
                  </div>
                </div>

                {/* 2. Key Preprocessing & Feature Extraction Methods */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Preprocessing & Feature Extraction Methods</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {activePaper.analysis?.features ||
                      activePaper.analysis?.methodology ||
                      'Standardized tokenization, data normalization, and feature vector transformation.'}
                  </p>
                </div>

                {/* 3. Primary Limitations & Research Gaps Identified */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Primary Limitations & Research Gaps</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {activePaper.analysis?.limitations || 'No critical limitations or severe edge cases documented in abstract analysis.'}
                  </p>
                  {activePaper.analysis?.future_work && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <strong className="text-indigo-300">Future Work: </strong>{activePaper.analysis.future_work}
                    </p>
                  )}
                </div>

                {/* 4. Novel Contributions / Strengths */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Novel Contributions & Strengths</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {activePaper.analysis?.proposed_solution ||
                      activePaper.analysis?.objectives ||
                      'Presents a robust architectural paradigm and rigorous empirical benchmark evaluation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-PAPER GLOBAL MATRIX VIEW */
        <>
          {/* Uploaded Papers Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-wide">
                Uploaded Research Papers ({papers.length})
              </h2>
              <span className="text-xs text-slate-400">Click any paper to focus deep-dive synthesis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {papers.map((paper) => {
                const an = paper.analysis || {};
                return (
                  <div
                    key={paper.id}
                    onClick={() => setSelectedPaperId(paper.id)}
                    className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between transition duration-200 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {paper.publication_year || 2024}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {paper.authors || 'Authors'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-3 group-hover:text-indigo-300 transition">
                        {paper.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        <p><span className="text-slate-400 font-medium">Method:</span> {an.algorithms || 'NLP / ML Architecture'}</p>
                        <p><span className="text-slate-400 font-medium">Dataset:</span> {an.dataset_name || 'Benchmark Dataset'}</p>
                        <p><span className="text-slate-400 font-medium">Metric:</span> <span className="text-emerald-400 font-semibold">{an.f1_score ? `F1: ${an.f1_score}` : (an.accuracy ? `Acc: ${an.accuracy}` : (an.evaluation_metrics || 'Reported'))}</span></p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPaperId(paper.id);
                        }}
                        className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('chat', paper.id);
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask AI in Copilot</span>
                      </button>
                      {onDeletePaper && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeletePaper(paper.id);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg transition cursor-pointer"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC COMPARATIVE MATRIX SUMMARY (Replaces Bar Charts & Generic Box) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <TableIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Comparative Matrix Summary</h3>
                  <p className="text-[11px] text-slate-400">Side-by-side technical evaluation across all {papers.length} uploaded papers</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                Click any row to view single-paper technical breakdown
              </span>
            </div>

            {/* Side-by-Side Table Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Paper Title & Year</th>
                    <th className="py-3 px-4">Primary Algorithms / Models</th>
                    <th className="py-3 px-4">Dataset & Sample Size</th>
                    <th className="py-3 px-4">Key Performance Metrics</th>
                    <th className="py-3 px-4">Limitations / Research Gap</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {papers.map((paper) => {
                    const an = paper.analysis || {};
                    const metrics = getMetricsList(an);
                    return (
                      <tr
                        key={paper.id}
                        onClick={() => setSelectedPaperId(paper.id)}
                        className="hover:bg-slate-800/40 transition cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-semibold text-white max-w-[220px]">
                          <p className="line-clamp-1 group-hover:text-indigo-300 transition">{paper.title}</p>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {paper.publication_year || '2024'} • {paper.authors ? paper.authors.split(',')[0] + ' et al.' : 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[180px]">
                          <span className="line-clamp-2 text-indigo-300 font-medium">
                            {an.algorithms || 'NLP / Deep Learning'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[180px]">
                          <p className="font-semibold text-slate-200 truncate">{an.dataset_name || 'Benchmark Dataset'}</p>
                          <span className="text-[10px] text-slate-400">{an.dataset_size || 'Standard sample'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {metrics.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {metrics.slice(0, 2).map((m, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getMetricBadgeClass(m.color)}`}
                                >
                                  {m.label}: {m.value}
                                </span>
                              ))}
                              {metrics.length > 2 && (
                                <span className="text-[10px] text-slate-400 self-center">+{metrics.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Reported in text</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[220px]">
                          <p className="line-clamp-2 text-xs text-rose-300/90">
                            {an.limitations || 'No critical gaps documented.'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaperId(paper.id);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-semibold transition"
                          >
                            <span>Synthesize</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Comparing <strong className="text-white">{papers.length}</strong> research papers</span>
              <span className="text-[11px] text-slate-500">Live synthesis matrix</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

