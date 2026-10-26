import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Table2,
  Sparkles,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';

const navItems = [
  { id: 'upload', label: 'Upload Papers', icon: UploadCloud },
  { id: 'dashboard', label: 'Literature Matrix', icon: Table2 },
  { id: 'chat', label: 'Research Copilot', icon: Sparkles },
  { id: 'reports', label: 'Export Reports', icon: FileText },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  onPaperSelect,
  onDeletePaper,
  papers = []
}) {
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    // Show uploaded papers as quick-access links
    let initialItems = [];
    if (papers && papers.length > 0) {
      papers.forEach((p) => {
        initialItems.push({
          id: `paper-${p.id}`,
          type: 'paper',
          title: p.title,
          icon: FileText,
          paper: p
        });
      });
    }
    setHistoryItems(initialItems);
  }, [papers]);

  const handleClearAllHistory = () => {
    setHistoryItems([]);
  };

  return (
    <aside className="w-72 bg-[#0F172A] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30 relative shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-900/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm text-white tracking-wide truncate">
            AI Research Assistant
          </h1>
          <p className="text-[11px] text-slate-400 font-medium truncate">Literature Review Platform</p>
        </div>
      </div>

      {/* 4 Clean Navigation Links */}
      <div className="px-3 pt-5 pb-2 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Primary Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl text-base font-medium transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-slate-800/80 text-white font-semibold border-l-4 border-indigo-500 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Uploaded Papers List */}
      <div className="flex-1 px-3 py-4 space-y-3 overflow-y-auto min-h-0 border-t border-slate-800/80 mt-3">
        <div className="flex items-center justify-between px-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Uploaded Papers</span>
          </div>
          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearAllHistory();
              }}
              className="text-xs text-slate-400 hover:text-rose-400 font-medium transition cursor-pointer"
              title="Clear all history"
            >
              Clear All
            </button>
          )}
        </div>

        {historyItems.length === 0 ? (
          <div className="px-3 py-6 text-center text-slate-400 text-xs">
            No papers uploaded yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {historyItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onPaperSelect && item.paper) {
                      onPaperSelect(item.paper);
                    }
                  }}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-200 hover:bg-slate-800/60 hover:text-white cursor-pointer transition-all duration-150 border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
                    <span className="truncate max-w-[200px] text-sm font-medium text-slate-200 group-hover:text-white">{item.title}</span>
                  </div>
                  {onDeletePaper && item.paper && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeletePaper(item.paper.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all shrink-0 ml-1.5 cursor-pointer"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
