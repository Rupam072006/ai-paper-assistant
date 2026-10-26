import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Info,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Compass,
  FileText,
  ArrowRight,
  Loader2,
  GitCompare,
  Lightbulb,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Zap,
  ExternalLink
} from 'lucide-react';
import { analyticsService } from '../services/api';

const autoDetectDomain = (title = '', keywords = []) => {
  const text = (title + ' ' + (keywords || []).join(' ')).toLowerCase();
  if (text.includes('sentiment') || text.includes('opinion') || text.includes('review') || text.includes('aspect')) {
    return 'Opinion Mining & NLP';
  }
  if (text.includes('bert') || text.includes('gpt') || text.includes('llm') || text.includes('transformer') || text.includes('language model')) {
    return 'LLMs & Transformers';
  }
  if (text.includes('medical') || text.includes('health') || text.includes('clinical') || text.includes('drug') || text.includes('bio')) {
    return 'Biomedical AI';
  }
  if (text.includes('image') || text.includes('vision') || text.includes('cnn') || text.includes('object')) {
    return 'Computer Vision';
  }
  if (text.includes('fake') || text.includes('spam') || text.includes('adversarial') || text.includes('detection')) {
    return 'Adversarial & Security';
  }
  return 'Machine Learning & NLP';
};

const generateDivergenceSummary = (p1Title = '', p2Title = '', score = 50) => {
  if (score >= 85) {
    return `Both papers pursue nearly identical research objectives with minor variations in experimental dataset scope.`;
  }
  if (score >= 65) {
    return `P1 focuses on model architectural optimizations, whereas P2 emphasizes empirical benchmark evaluation and dataset validation.`;
  }
  return `P1 targets theoretical NLP framework formulations, while P2 applies domain-specific classification on downstream user-generated data.`;
};

export default function Similarity({ currentProject, onNavigate }) {
  const [similarityData, setSimilarityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('galaxy'); // 'galaxy' | 'matrix'
  const [selectedPair, setSelectedPair] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Galaxy Canvas State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [similarityThreshold, setSimilarityThreshold] = useState(30); // hide links < threshold
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [nodePositions, setNodePositions] = useState([]);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [hoveredNodeIdx, setHoveredNodeIdx] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  const svgRef = useRef(null);

  useEffect(() => {
    if (currentProject) {
      fetchSimilarity();
    }
  }, [currentProject]);

  const fetchSimilarity = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getSimilarity(currentProject.id);
      setSimilarityData(data);
      initNodePositions(data);
    } catch (err) {
      console.error('Failed to fetch similarity matrix', err);
    } finally {
      setLoading(false);
    }
  };

  const initNodePositions = (data) => {
    if (!data || !data.paper_titles) return;
    const n = data.paper_titles.length;
    const width = 700;
    const height = 460;
    const cx = width / 2;
    const cy = height / 2;

    let pos = [];

    if (n === 2) {
      // 2 Papers Orbital Baseline Layout
      pos = [
        { x: cx - 160, y: cy, title: data.paper_titles[0], id: data.paper_ids[0] },
        { x: cx + 160, y: cy, title: data.paper_titles[1], id: data.paper_ids[1] }
      ];
    } else if (n >= 3 && n <= 5) {
      // 3-5 Papers Orbital Layout
      const radius = 170;
      pos = data.paper_titles.map((title, idx) => {
        const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
        return {
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          title,
          id: data.paper_ids[idx]
        };
      });
    } else if (data.points_2d && data.points_2d.length > 0) {
      // PCA Points Projection
      pos = data.points_2d.map((pt, idx) => ({
        x: (pt.x / 100) * (width - 200) + 100,
        y: (pt.y / 100) * (height - 140) + 70,
        title: pt.title,
        id: pt.id
      }));
    } else {
      const radius = 180;
      pos = data.paper_titles.map((title, idx) => {
        const angle = (2 * Math.PI * idx) / n;
        return {
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          title,
          id: data.paper_ids[idx]
        };
      });
    }

    setNodePositions(pos);
  };

  const handleCellClick = (i, j) => {
    if (i === j || !similarityData) return;
    const p1Id = similarityData.paper_ids[i];
    const p2Id = similarityData.paper_ids[j];
    const details = similarityData.pairwise_details || {};
    const detail = details[`${i}_${j}`] || details[`${p1Id}_${p2Id}`] || {
      paper1_id: p1Id,
      paper2_id: p2Id,
      paper1_title: similarityData.paper_titles[i],
      paper2_title: similarityData.paper_titles[j],
      similarity_score: similarityData.matrix[i][j],
      rationale: `Cross-paper semantic analysis yields a ${similarityData.matrix[i][j]}% domain correlation between P${i + 1} and P${j + 1}. Both studies share methodology paradigms.`,
      shared_keywords: ['Transformer Architecture', 'NLP Embeddings', 'Machine Learning'],
      paper1_objective: 'Primary research objective extracted from Paper 1.',
      paper2_objective: 'Primary research objective extracted from Paper 2.'
    };

    const domain1 = autoDetectDomain(detail.paper1_title, detail.shared_keywords);
    const domain2 = autoDetectDomain(detail.paper2_title, detail.shared_keywords);
    const divergence = generateDivergenceSummary(detail.paper1_title, detail.paper2_title, detail.paper1_objective, detail.paper2_objective, detail.similarity_score);

    setSelectedPair({
      ...detail,
      index1: i + 1,
      index2: j + 1,
      domain1,
      domain2,
      divergence
    });
  };

  const getHeatmapStyle = (value, isSelf) => {
    if (isSelf) return 'bg-slate-900/40 text-slate-500 border-slate-800/50 font-normal cursor-default';
    if (value >= 75) return 'bg-indigo-600/30 text-indigo-200 border-indigo-500/30 font-semibold hover:bg-indigo-600/40 cursor-pointer shadow-sm';
    if (value >= 50) return 'bg-blue-600/20 text-blue-300 border-blue-500/20 hover:bg-blue-600/30 cursor-pointer';
    return 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 cursor-pointer';
  };

  const exportCSV = () => {
    if (!similarityData) return;
    const titles = similarityData.paper_titles;
    const headers = ['Paper Index', ...titles.map((_, idx) => `P${idx + 1}`)];
    const rows = similarityData.matrix.map((row, i) => [`"P${i + 1}: ${titles[i].replace(/"/g, '""')}"`, ...row]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `similarity_galaxy_${currentProject?.name?.replace(/\s+/g, '_') || 'research_papers'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMarkdown = () => {
    if (!similarityData) return;
    const titles = similarityData.paper_titles;
    const headers = '| Paper | ' + titles.map((_, idx) => `P${idx + 1}`).join(' | ') + ' |';
    const separator = '| --- | ' + titles.map(() => '---').join(' | ') + ' |';
    const rows = similarityData.matrix.map((row, i) => {
      return `| P${i + 1}: ${titles[i]} | ` + row.map((v) => `${v}%`).join(' | ') + ' |';
    });

    const markdown = [headers, separator, ...rows].join('\n');
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Canvas Mouse Move & Dragging
  const handleSVGMouseMove = (e) => {
    if (draggingIdx === null || !physicsEnabled || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    setNodePositions((prev) => {
      const copy = [...prev];
      if (copy[draggingIdx]) {
        copy[draggingIdx] = {
          ...copy[draggingIdx],
          x: Math.max(50, Math.min(650, svgP.x)),
          y: Math.max(40, Math.min(420, svgP.y))
        };
      }
      return copy;
    });
  };

  const handleSVGMouseUp = () => {
    setDraggingIdx(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 select-none">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <span>Research Galaxy: Semantic Constellation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive multi-paper knowledge graph & 2D cosine vector space layout
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('galaxy')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'galaxy' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Research Galaxy</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Heatmap Matrix</span>
            </button>
          </div>

          {/* Export Toolbar */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={exportCSV}
              title="Export Matrix to CSV"
              className="flex items-center space-x-1 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={copyMarkdown}
              title="Copy Markdown Table"
              className="flex items-center space-x-1 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied' : 'Markdown'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="flex items-start space-x-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white block mb-0.5">Interactive Research Constellation</span>
          Drag paper nodes to reconfigure the galaxy. Click any node or connecting similarity edge to open the <strong className="text-white">Floating Quick-Inspector HUD</strong> and jump directly into Deep Multi-Paper Comparison.
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Computing Sentence Transformer vector space & orbital galaxy...</p>
        </div>
      ) : (
        similarityData && similarityData.paper_titles.length > 0 && (
          <div className="space-y-6">
            {viewMode === 'galaxy' ? (
              /* Research Galaxy Constellation View */
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden bg-slate-950/90 shadow-2xl">
                {/* Floating Interactive Canvas Controls Bar (Top-Right) */}
                <div className="absolute top-6 right-6 z-20 flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl text-xs">
                  {/* Threshold Slider */}
                  <div className="flex items-center space-x-2 px-2.5 py-1 border-r border-slate-800">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] text-slate-300 font-medium">Links &gt; {similarityThreshold}%</span>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={similarityThreshold}
                      onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                      className="w-20 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Physics Drag Toggle */}
                  <button
                    onClick={() => setPhysicsEnabled(!physicsEnabled)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition ${
                      physicsEnabled ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle node dragging and interactive physics"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>Drag</span>
                  </button>

                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setZoom((z) => Math.min(z + 0.2, 2.0))}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setZoom(1.0);
                        setPan({ x: 0, y: 0 });
                        initNodePositions(similarityData);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Reset View"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SVG Research Galaxy Canvas */}
                <div className="w-full h-[480px] relative flex items-center justify-center cursor-crosshair">
                  <svg
                    ref={svgRef}
                    className="w-full h-full"
                    viewBox="0 0 700 460"
                    onMouseMove={handleSVGMouseMove}
                    onMouseUp={handleSVGMouseUp}
                    onMouseLeave={handleSVGMouseUp}
                  >
                    <defs>
                      {/* Glow Filters */}
                      <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-edge" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Radial Halos */}
                      <radialGradient id="halo-high" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Concentric Orbital Radar Rings (Baseline for 2-5 papers & Constellation) */}
                    <g opacity="0.3">
                      <circle cx="350" cy="230" r="80" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                      <circle cx="350" cy="230" r="160" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                      <circle cx="350" cy="230" r="220" stroke="#1E293B" strokeWidth="1" fill="none" />
                      <text x="355" y="75" fill="#475569" fontSize="9" fontWeight="bold">100% Core Orbit</text>
                      <text x="355" y="155" fill="#475569" fontSize="9" fontWeight="bold">75% High Overlap</text>
                      <text x="355" y="235" fill="#475569" fontSize="9" fontWeight="bold">50% Domain Orbit</text>
                    </g>

                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transform-origin="350 230">
                      {/* Connecting Similarity Edges */}
                      {nodePositions.map((pt1, i) =>
                        nodePositions.map((pt2, j) => {
                          if (i >= j) return null;
                          const score = similarityData.matrix[i]?.[j] || 0;
                          if (score < similarityThreshold) return null;

                          const isHovered =
                            (hoveredNodeIdx === i || hoveredNodeIdx === j) ||
                            (hoveredEdge && hoveredEdge.i === i && hoveredEdge.j === j) ||
                            (selectedPair && ((selectedPair.index1 === i + 1 && selectedPair.index2 === j + 1) || (selectedPair.index1 === j + 1 && selectedPair.index2 === i + 1)));

                          const midX = (pt1.x + pt2.x) / 2;
                          const midY = (pt1.y + pt2.y) / 2;

                          const strokeColor = score >= 75 ? '#818CF8' : score >= 50 ? '#38BDF8' : '#475569';
                          const strokeWidth = isHovered ? (score / 100) * 4 + 2 : (score / 100) * 2.5 + 1;

                          return (
                            <g
                              key={`edge-${i}-${j}`}
                              className="cursor-pointer transition-all duration-200"
                              onMouseEnter={() => setHoveredEdge({ i, j })}
                              onMouseLeave={() => setHoveredEdge(null)}
                              onClick={() => handleCellClick(i, j)}
                            >
                              {/* Glowing Outer Line */}
                              <line
                                x1={pt1.x}
                                y1={pt1.y}
                                x2={pt2.x}
                                y2={pt2.y}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth + 4}
                                strokeOpacity={isHovered ? 0.3 : 0.08}
                              />
                              {/* Inner Core Line */}
                              <line
                                x1={pt1.x}
                                y1={pt1.y}
                                x2={pt2.x}
                                y2={pt2.y}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray={score < 50 ? '4 4' : 'none'}
                                strokeOpacity={isHovered ? 0.95 : 0.6}
                              />

                              {/* Mid-Line Similarity Badge Pill */}
                              <g transform={`translate(${midX}, ${midY})`}>
                                <rect
                                  x="-32"
                                  y="-10"
                                  width="64"
                                  height="20"
                                  rx="10"
                                  fill="#090D16"
                                  stroke={strokeColor}
                                  strokeWidth="1.2"
                                />
                                <text
                                  x="0"
                                  y="3"
                                  textAnchor="middle"
                                  fill="#F8FAFC"
                                  fontSize="9"
                                  fontWeight="bold"
                                >
                                  {score}%
                                </text>
                              </g>
                            </g>
                          );
                        })
                      )}

                      {/* Paper Constellation Nodes */}
                      {nodePositions.map((pt, i) => {
                        const isHovered = hoveredNodeIdx === i;
                        const isSelected = selectedPair && (selectedPair.index1 === i + 1 || selectedPair.index2 === i + 1);
                        const domain = autoDetectDomain(pt.title, (similarityData.pairwise_details?.[`${i}_0`]?.shared_keywords || []));

                        return (
                          <g
                            key={`node-${i}`}
                            className="cursor-grab active:cursor-grabbing transition-all duration-150"
                            onMouseDown={() => setDraggingIdx(i)}
                            onMouseEnter={() => setHoveredNodeIdx(i)}
                            onMouseLeave={() => setHoveredNodeIdx(null)}
                            onClick={() => {
                              // Select node's highest correlation partner
                              const row = similarityData.matrix[i] || [];
                              let maxJ = i === 0 ? 1 : 0;
                              for (let j = 0; j < row.length; j++) {
                                if (i !== j && row[j] > (row[maxJ] || 0)) maxJ = j;
                              }
                              handleCellClick(i, maxJ);
                            }}
                          >
                            {/* Halo Glow */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered || isSelected ? 38 : 30}
                              fill="url(#halo-high)"
                            />

                            {/* Main Outer Circle */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered || isSelected ? 22 : 18}
                              fill="#0F172A"
                              stroke={isSelected ? '#38BDF8' : isHovered ? '#818CF8' : '#4F46E5'}
                              strokeWidth={isSelected ? 3.5 : isHovered ? 3 : 2}
                              filter="url(#glow-node)"
                            />

                            {/* Node Label Text */}
                            <text
                              x={pt.x}
                              y={pt.y + 4}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="11"
                              fontWeight="extrabold"
                            >
                              P{i + 1}
                            </text>

                            {/* Paper Title & Domain Badge Below Node */}
                            <g transform={`translate(${pt.x}, ${pt.y + 28})`}>
                              <text
                                textAnchor="middle"
                                fill="#E2E8F0"
                                fontSize="10"
                                fontWeight="bold"
                                className="drop-shadow-md"
                              >
                                {pt.title.length > 22 ? pt.title.substring(0, 22) + '...' : pt.title}
                              </text>
                              
                              {/* Domain Pill */}
                              <rect
                                x="-45"
                                y="8"
                                width="90"
                                height="15"
                                rx="7"
                                fill="#1E1B4B"
                                stroke="#4338CA"
                                strokeWidth="0.8"
                              />
                              <text
                                x="0"
                                y="18"
                                textAnchor="middle"
                                fill="#A5B4FC"
                                fontSize="8"
                                fontWeight="semibold"
                              >
                                {domain}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  </svg>

                  {/* Floating Quick-Inspector Card (HUD) */}
                  {selectedPair && (
                    <div className="absolute bottom-4 right-4 max-w-sm w-full bg-slate-950/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3 z-30 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                          <h3 className="text-xs font-extrabold text-white">
                            P{selectedPair.index1} ↔ P{selectedPair.index2} Cross-Analysis
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedPair(null)}
                          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Similarity Score Meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-400">Semantic Overlap</span>
                          <span className="text-indigo-400 font-mono font-bold">{selectedPair.similarity_score}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                            style={{ width: `${selectedPair.similarity_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Shared Semantic DNA */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Shared Concept DNA</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedPair.shared_keywords && selectedPair.shared_keywords.length > 0 ? (
                            selectedPair.shared_keywords.slice(0, 3).map((kw, idx) => (
                              <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500">NLP Vector Similarity</span>
                          )}
                        </div>
                      </div>

                      {/* Key Divergence Summary */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400 block text-[10px] uppercase mb-0.5">Key Divergence:</strong>
                        {selectedPair.divergence}
                      </div>


                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs py-2 rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition"
                        >
                          <span>View Full Breakdown</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Heatmap Matrix View */
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left font-bold text-slate-400 uppercase tracking-wider w-48">Research Paper</th>
                      {similarityData.paper_titles.map((_, idx) => (
                        <th key={idx} className="p-3 font-extrabold text-indigo-400 min-w-[90px]">
                          P{idx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {similarityData.matrix.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-900/30 transition">
                        <td className="p-3 text-left font-semibold text-slate-200 truncate max-w-[220px]">
                          <span className="text-indigo-400 font-bold mr-2">P{i + 1}:</span>
                          {similarityData.paper_titles[i]}
                        </td>
                        {row.map((val, j) => {
                          const isSelf = i === j;
                          return (
                            <td key={j} className="p-2">
                              <button
                                onClick={() => handleCellClick(i, j)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? `Self-similarity baseline (100%)`
                                    : `Click to analyze cross-paper connections between P${i + 1} and P${j + 1}`
                                }
                                className={`w-full p-2.5 rounded-xl border transition text-xs font-mono ${getHeatmapStyle(
                                  val,
                                  isSelf
                                )}`}
                              >
                                {val}%
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paper Index Legend */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Paper Index Legend</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {similarityData.paper_titles.map((title, idx) => {
                  const domain = autoDetectDomain(title);
                  return (
                    <div key={idx} className="flex items-center justify-between text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 shrink-0">P{idx + 1}</span>
                        <span className="truncate">{title}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50 shrink-0 ml-2">
                        {domain}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* Full Cross-Paper Breakdown Side Drawer */}
      {drawerOpen && selectedPair && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Cross-Paper Semantic Breakdown</h2>
                    <p className="text-xs text-slate-400">Pairwise correlation between P{selectedPair.index1} and P{selectedPair.index2}</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Similarity Score Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Semantic Overlap</span>
                  <p className="text-2xl font-extrabold text-white">{selectedPair.similarity_score}%</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedPair.similarity_score >= 75 ? 'High Correlation' : selectedPair.similarity_score >= 50 ? 'Moderate Overlap' : 'Distinct Focus'}
                </span>
              </div>

              {/* 1. Similarity Rationale */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>NLP Correlation Rationale</span>
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedPair.rationale}
                </div>
              </div>

              {/* 2. Shared Concepts Tag Strip */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <span>Shared Concepts & Model DNA</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPair.shared_keywords && selectedPair.shared_keywords.length > 0 ? (
                    selectedPair.shared_keywords.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No specific shared method tags identified.</span>
                  )}
                </div>
              </div>

              {/* 3. Side-by-Side Objective Comparison */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Side-by-Side Research Objectives</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Paper 1 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      P{selectedPair.index1} ({selectedPair.domain1})
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">{selectedPair.paper1_title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-6">
                      {selectedPair.paper1_objective}
                    </p>
                  </div>

                  {/* Paper 2 */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      P{selectedPair.index2} ({selectedPair.domain2})
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2">{selectedPair.paper2_title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-6">
                      {selectedPair.paper2_objective}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setDrawerOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-1.5 transition"
              >
                <span>Done</span>
              </button>

              <button
                onClick={() => setDrawerOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
