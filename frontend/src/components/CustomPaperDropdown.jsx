import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Check, FileText } from 'lucide-react';

export default function CustomPaperDropdown({
  papers = [],
  selectedPaperId = '',
  onSelect
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);
  const selectedLabel = selectedPaper
    ? (selectedPaper.title.length > 38 ? `${selectedPaper.title.slice(0, 38)}...` : selectedPaper.title)
    : 'All Uploaded Papers';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between space-x-2.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 border border-slate-700/80 hover:border-indigo-500/50 px-3.5 py-2 rounded-xl text-xs font-medium shadow-md shadow-indigo-500/5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-md"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 truncate max-w-[200px] sm:max-w-[280px]">
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Dark Themed Glass Options Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="listbox"
        >
          <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
            <span>Filter Paper Scope</span>
            <span className="text-slate-500 font-mono text-[10px]">{papers.length} paper{papers.length === 1 ? '' : 's'}</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* All Papers Option */}
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                selectedPaperId === ''
                  ? 'bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-violet-600/5 text-indigo-300 font-semibold border-l-2 border-indigo-500'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
              role="option"
              aria-selected={selectedPaperId === ''}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>All Uploaded Papers</span>
              </div>
              {selectedPaperId === '' && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            </button>

            {/* Individual Paper Options */}
            {papers.map((p) => {
              const isSelected = selectedPaperId === p.id;
              const year = p.year || p.publication_year;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-violet-600/5 text-indigo-300 font-semibold border-l-2 border-indigo-500'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-start space-x-2 truncate pr-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <div className="truncate">{p.title}</div>
                      {year && <div className="text-[10px] text-slate-500">Year: {year}</div>}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
