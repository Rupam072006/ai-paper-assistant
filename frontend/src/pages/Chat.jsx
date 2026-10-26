import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, Layers, Loader2, Trash2, Terminal } from 'lucide-react';
import { chatService } from '../services/api';
import { askGemini, getContextualFollowUps } from '../services/gemini';
import CustomPaperDropdown from '../components/CustomPaperDropdown';

const SLASH_COMMANDS = [
  {
    command: '/summarize',
    label: '/summarize',
    desc: 'Structured abstract & key contributions',
    prompt: 'Provide a comprehensive and structured abstract summary of this paper, detailing the core problem, proposed methodology, key findings, and main contributions.'
  },
  {
    command: '/critique',
    label: '/critique',
    desc: 'Analyze limitations & research gaps',
    prompt: 'Perform a critical analysis of this research paper, highlighting its methodology weaknesses, potential biases, dataset constraints, and open research gaps.'
  },
  {
    command: '/data',
    label: '/data',
    desc: 'Extract dataset details & preprocessing',
    prompt: 'Extract all dataset specifics, sample sizes, preprocessing steps, feature distributions, and evaluation benchmarks used in this research.'
  }
];

export default function Chat({ papers = [], currentProject, initialPaperId = '' }) {
  const [question, setQuestion] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState(initialPaperId || ''); // '' = All papers
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('research_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const promptSectionRef = useRef(null);

  // Auto-scroll to bottom on new messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Synchronize when initialPaperId changes, clear old context, and smooth-scroll
  useEffect(() => {
    if (initialPaperId) {
      setSelectedPaperId(initialPaperId);
      setChatHistory([]);
      try {
        localStorage.removeItem('research_chat_history');
      } catch (e) {
        console.warn(e);
      }
    }

    const timer = setTimeout(() => {
      if (promptSectionRef.current) {
        promptSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [initialPaperId]);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('research_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.warn('Could not save chat history to localStorage:', e);
    }
  }, [chatHistory]);

  const handleClearChat = () => {
    setChatHistory([]);
    try {
      localStorage.removeItem('research_chat_history');
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePaperSelect = (id) => {
    setSelectedPaperId(id);
    setChatHistory([]);
    try {
      localStorage.removeItem('research_chat_history');
    } catch (e) {
      console.warn(e);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);

  const samplePrompts = selectedPaper
    ? [
        `Summarize key methodology of "${selectedPaper.title ? (selectedPaper.title.slice(0, 32) + (selectedPaper.title.length > 32 ? '...' : '')) : 'this paper'}"`,
        `What datasets, sample sizes, and evaluation metrics were used?`,
        `List main limitations, biases, and research gaps in this paper`,
        `What are the novel contributions and baseline comparison results?`
      ]
    : [
        'Summarize key methodology across papers',
        'What datasets and evaluation metrics were used?',
        'List main limitations and future research directions',
        'What are the core contributions and findings?'
      ];

  const handleSend = async (queryText = question) => {
    const trimmed = (queryText || '').trim();
    if (!trimmed || loading) return;

    // Handle Slash Command expansion
    let userDisplayPrompt = trimmed;
    let aiPrompt = trimmed;

    const matchedSlash = SLASH_COMMANDS.find(
      (sc) => sc.command === trimmed.toLowerCase() || trimmed.toLowerCase().startsWith(sc.command + ' ')
    );
    if (matchedSlash) {
      const extraText = trimmed.slice(matchedSlash.command.length).trim();
      aiPrompt = extraText ? `${matchedSlash.prompt}\n\nAdditional User Request: ${extraText}` : matchedSlash.prompt;
      userDisplayPrompt = trimmed;
    }

    const userMessage = {
      role: 'user',
      content: userDisplayPrompt
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      // 1. Try direct Gemini API with paper context
      const geminiResult = await askGemini(aiPrompt, papers, selectedPaperId || null);

      if (geminiResult && geminiResult.answer) {
        const followUps = (geminiResult.followUpQuestions && geminiResult.followUpQuestions.length > 0)
          ? geminiResult.followUpQuestions
          : getContextualFollowUps(aiPrompt, selectedPaper);

        const assistantMessage = {
          role: 'assistant',
          content: geminiResult.answer,
          model: 'Gemini 2.5 Flash',
          followUps: followUps,
          sources: []
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      } else if (currentProject) {
        // 2. Fallback to backend RAG vector search
        const resp = await chatService.ask(currentProject.id, aiPrompt, selectedPaperId || null);
        const followUps = getContextualFollowUps(aiPrompt, selectedPaper);

        const assistantMessage = {
          role: 'assistant',
          content: resp.answer,
          followUps: followUps,
          sources: resp.sources
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Please upload a research paper first or configure a Gemini API key in Settings.',
            followUps: samplePrompts.slice(0, 3),
            sources: []
          }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while analyzing the paper context. Please try again.',
          followUps: samplePrompts.slice(0, 3),
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col justify-between space-y-4">
      {/* Header & Scope Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>AI Research Q&A Chat</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Ask any question about your uploaded research paper — powered by Gemini & Literature RAG
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Custom Dark Themed Scope Dropdown */}
          <CustomPaperDropdown
            papers={papers}
            selectedPaperId={selectedPaperId}
            onSelect={handlePaperSelect}
          />

          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {chatHistory.length === 0 ? (
          <div ref={promptSectionRef} className="h-full flex flex-col justify-center items-center text-center p-6 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/15">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-medium text-slate-200">
                {selectedPaper ? `Ask about "${selectedPaper.title}"` : 'Ask anything about your research papers'}
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                {selectedPaper
                  ? 'Grounded Q&A powered by Gemini & vector retrieval strictly using this paper\'s full text context.'
                  : 'Every response is clearly explained in simple, easy-to-understand language tailored to your research papers.'}
              </p>
            </div>

            {/* Prompt Suggestions / Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full text-left">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="py-3 px-4 rounded-2xl bg-slate-900/70 hover:bg-indigo-950/40 border border-slate-800/90 hover:border-indigo-500/40 text-sm font-normal text-slate-300 hover:text-white transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md hover:shadow-indigo-500/10 hover:scale-[1.01]"
                >
                  <span className="text-indigo-400 mr-1.5 font-semibold text-sm">Q:</span>
                  <span>"{prompt}"</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, msgIdx) => (
            <div
              key={msgIdx}
              className={`flex flex-col space-y-2 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all ${
                  msg.role === 'user'
                    ? 'bg-slate-800/95 border border-slate-700/80 text-white rounded-br-none shadow-md'
                    : 'bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 text-slate-200 rounded-bl-none shadow-lg shadow-indigo-500/5'
                }`}
              >
                {msg.model && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-800/80">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{msg.model}</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>

              {/* Dynamic Suggested Follow-up Questions */}
              {msg.role === 'assistant' && (
                <div className="max-w-2xl w-full pt-1 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Suggested Follow-up Questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(msg.followUps && msg.followUps.length > 0
                      ? msg.followUps
                      : getContextualFollowUps(msg.content, selectedPaper)
                    ).map((fu, fuIdx) => (
                      <button
                        key={fuIdx}
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setQuestion(fu);
                          handleSend(fu);
                        }}
                        className="text-left text-xs bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white border border-indigo-500/25 hover:border-indigo-400/50 px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md hover:shadow-indigo-500/20 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{fu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-indigo-300 p-4 glass-card rounded-2xl max-w-sm border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-white">Gemini is analyzing paper...</span>
              <span className="text-[10px] text-slate-400">Extracting real-time citations & grounded insights</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar & Quick Starters */}
      <div className="pt-2 border-t border-slate-800/80 shrink-0 space-y-2.5 relative">
        {/* Floating Slash Commands Shortcut Menu */}
        {question.startsWith('/') && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl p-2.5 shadow-2xl z-20 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 py-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shortcut Commands</span>
            </div>
            {SLASH_COMMANDS.filter((cmd) =>
              cmd.command.toLowerCase().startsWith(question.toLowerCase().split(' ')[0])
            ).map((cmd) => (
              <button
                key={cmd.command}
                type="button"
                onClick={() => {
                  setQuestion(cmd.command);
                  handleSend(cmd.command);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-950/60 hover:border-indigo-500/30 border border-transparent flex items-center justify-between text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                    {cmd.label}
                  </span>
                  <span className="text-slate-300 text-[11px] truncate">{cmd.desc}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">↵ Run</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Starters Carousel Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 no-scrollbar">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> QUICK PROMPTS:
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuestion(prompt);
                handleSend(prompt);
              }}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-2xl focus-within:border-indigo-500/60 focus-within:shadow-lg focus-within:shadow-indigo-500/10 backdrop-blur-md transition-all duration-200"
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            disabled={loading}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              loading
                ? "Gemini is analyzing paper..."
                : (selectedPaper
                    ? `Ask about "${selectedPaper.title.slice(0, 30)}...", or type /summarize...`
                    : "Ask a custom question, or type /summarize, /critique, /data...")
            }
            className="flex-1 bg-transparent px-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition-all duration-200 hover:scale-105 cursor-pointer"
            title="Send Message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
