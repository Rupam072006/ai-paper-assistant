import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Trash2, CheckCircle2 } from 'lucide-react';

export default function Settings({ user, currentProject, onDeleteProject }) {
  const [provider, setProvider] = useState(() => localStorage.getItem('llm_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('llm_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('llm_provider', provider);
    localStorage.setItem('llm_api_key', apiKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings & LLM Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Generative AI LLM providers and API keys
        </p>
      </div>

      {/* LLM Provider Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">Generative AI Provider Settings</h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2">Select LLM Provider</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'gemini', label: 'Google Gemini (Recommended)', sub: 'Gemini 2.5 Flash' },
                { id: 'openai', label: 'OpenAI GPT-4o', sub: 'GPT-4o / GPT-4o-mini' },
                { id: 'ollama', label: 'Local Ollama LLM', sub: 'http://localhost:11434' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setProvider(item.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    provider === item.id
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">API Key / Connection</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'ollama' ? 'http://localhost:11434' : `Enter your ${provider.toUpperCase()} API key...`}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * If no API key is provided, the platform automatically uses its built-in local heuristic AI synthesizer — all features remain 100% operational.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>LLM provider configuration saved successfully.</span>
            </div>
          )}

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
          >
            Save LLM Settings
          </button>
        </form>
      </div>

      {/* Clear Data */}
      {currentProject && (
        <div className="glass-card p-6 rounded-2xl border border-rose-500/20 space-y-4">
          <div className="flex items-center space-x-2 text-rose-400 border-b border-slate-800 pb-3">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Clear All Research Data</h2>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-200">Reset & Clear All Uploaded Papers</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Permanently removes all uploaded papers, extractions, vector embeddings, chat history, and reports.
              </p>
            </div>

            <button
              onClick={() => onDeleteProject(currentProject.id)}
              className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold px-4 py-2 rounded-xl transition shrink-0"
            >
              Clear All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
