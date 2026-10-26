import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { paperService, jobService } from '../services/api';

export default function Upload({ currentProject, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.pdf'));
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const filesArr = Array.from(e.target.files).filter((f) => f.name.endsWith('.pdf'));
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async () => {
    let activeProj = currentProject;
    if (!activeProj) {
      try {
        const list = await projectService.list();
        if (list && list.length > 0) {
          activeProj = list[0];
        } else {
          activeProj = await projectService.create('Research Session', 'Default AI Research Session');
        }
      } catch (e) {
        console.error('Auto project init error:', e);
      }
    }

    if (!activeProj) {
      setErrorMsg('Could not connect to backend service. Please verify the server is active.');
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least 1 PDF research paper.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const resp = await paperService.upload(activeProj.id, selectedFiles);
      const jobId = resp.job_id;

      // Start polling job status
      const interval = setInterval(async () => {
        try {
          const statusData = await jobService.getStatus(jobId);
          setJobStatus(statusData);

          if (statusData.status === 'complete') {
            clearInterval(interval);
            setTimeout(() => {
              setIsProcessing(false);
              onUploadSuccess();
            }, 1000);
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            setIsProcessing(false);
            setErrorMsg(statusData.error_message || 'Processing failed.');
          }
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg(err.response?.data?.detail || 'File upload failed.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-indigo-400" />
          <span>Upload Research Papers</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload multi-disciplinary research papers in PDF format for instant semantic extraction, vector indexing, and literature review synthesis.
        </p>
      </div>

      {!isProcessing ? (
        <div className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 backdrop-blur-md ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
                : 'border-slate-800/90 bg-slate-900/40 hover:border-indigo-500/40 hover:bg-slate-900/60'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-lg shadow-indigo-500/10">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Drag and drop research papers here</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              Supports PDF documents up to 25MB each. Upload 3–5 papers for optimal comparative matrix analysis.
            </p>

            <label className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:scale-[1.02]">
              <Sparkles className="w-4 h-4" />
              <span>Browse Local Files</span>
              <input type="file" multiple accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4 glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800/80 pb-3">
                <span className="font-bold text-white">Selected Research Papers ({selectedFiles.length})</span>
                <span className="text-indigo-400 font-medium">Ready for AI Processing</span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {errorMsg && (
                <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                <button
                  onClick={handleUploadSubmit}
                  className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs px-7 py-3.5 rounded-xl shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Processing & Vector Indexing</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Real-Time Processing Live Progress Screen */
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 max-w-xl mx-auto space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto animate-pulse shadow-lg shadow-indigo-500/20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-1.5">Processing Research Papers...</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Extracting structured information, generating semantic embeddings & building RAG vector index
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900/90 rounded-full h-3 border border-slate-800 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${jobStatus?.progress_pct || 15}%` }}
            />
          </div>

          <div className="text-xs font-mono text-indigo-300 font-medium">
            {jobStatus?.step || 'Initializing paper parsing pipeline...'}
          </div>

          {/* Processing Workflow Checklist */}
          <div className="text-left space-y-2.5 bg-slate-900/70 p-5 rounded-2xl border border-slate-800/90 text-xs text-slate-300">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Uploading PDFs & computing SHA-256 fingerprints</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Extracting full text, section headers, and page structures</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Detecting research domain & methodological ontology</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className={`w-4 h-4 ${(jobStatus?.progress_pct || 0) > 40 ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
              <span>Domain-adaptive extraction (Problem, Methods, Metrics, Gaps)</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className={`w-4 h-4 ${(jobStatus?.progress_pct || 0) > 70 ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
              <span>Generating Sentence Transformer embeddings</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className={`w-4 h-4 ${(jobStatus?.progress_pct || 0) >= 95 ? 'text-emerald-400' : 'text-slate-600'} shrink-0`} />
              <span>Building FAISS vector index & literature matrix</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
