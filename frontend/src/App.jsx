import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import PaperDetails from './pages/PaperDetails';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { projectService, paperService, authService } from './services/api';
import { Sparkles } from 'lucide-react';

const DEFAULT_USER = {
  id: 'default-user',
  email: 'researcher@ai.local',
  full_name: 'AI Researcher'
};

export default function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' | 'app'
  const [activeTab, setActiveTab] = useState('upload');
  const [currentProject, setCurrentProject] = useState(null);
  const [papers, setPapers] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_research_papers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chatPaperId, setChatPaperId] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [user] = useState(DEFAULT_USER);
  const [initializing, setInitializing] = useState(true);

  // Navigation handler with optional paper context
  const handleNavigate = (tab, paperId = null) => {
    setSelectedPaper(null);
    setActiveTab(tab);
    if (tab === 'chat') {
      setChatPaperId(paperId || '');
    }
  };

  // Sync papers to localStorage
  useEffect(() => {
    try {
      if (papers && papers.length > 0) {
        localStorage.setItem('saved_research_papers', JSON.stringify(papers));
      }
    } catch (e) {
      console.warn('Could not save papers to localStorage:', e);
    }
  }, [papers]);

  // Initialize auto-project in background
  useEffect(() => {
    const initApp = async () => {
      try {
        let list = await projectService.list();
        if (list.length === 0) {
          const newProj = await projectService.create(
            'Research Session',
            'Default AI Research Session'
          );
          list = [newProj];
        }
        setCurrentProject(list[0]);
        if (list[0]) {
          const pData = await paperService.getByProject(list[0].id);
          if (pData && pData.length > 0) {
            setPapers(pData);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitializing(false);
      }
    };
    initApp();
  }, []);

  const loadPapers = async (projId) => {
    try {
      const data = await paperService.getByProject(projId);
      setPapers(data);
      try {
        localStorage.setItem('saved_research_papers', JSON.stringify(data));
      } catch (e) {
        console.warn(e);
      }
    } catch (err) {
      console.error('Failed to load papers', err);
    }
  };

  const handleUploadSuccess = () => {
    if (currentProject) {
      loadPapers(currentProject.id);
    }
    setActiveTab('dashboard');
  };

  const handleClearData = async (projId) => {
    try {
      await projectService.delete(projId);
      const newProj = await projectService.create(
        'Research Session',
        'Default AI Research Session'
      );
      setCurrentProject(newProj);
      setPapers([]);
      setSelectedPaper(null);
      try {
        localStorage.removeItem('saved_research_papers');
        localStorage.removeItem('research_chat_history');
      } catch (e) {
        console.warn(e);
      }
      setActiveTab('upload');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePaper = async (paperId) => {
    try {
      await paperService.delete(paperId);
    } catch (err) {
      console.error('Failed to delete paper from backend:', err);
    }
    setPapers((prev) => {
      const updated = prev.filter((p) => p.id !== paperId);
      try {
        localStorage.setItem('saved_research_papers', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    setSelectedPaper((prev) => (prev && prev.id === paperId ? null : prev));
  };

  // 1. Initializing Screen
  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
            <Sparkles className="w-6 h-6 animate-pulse text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 animate-pulse">Initializing AI Research Assistant...</p>
        </div>
      </div>
    );
  }

  // 2. Landing Page View
  if (viewMode === 'landing') {
    return <Landing onGetStarted={() => setViewMode('app')} />;
  }

  // 3. Main App View
  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedPaper(null);
          setActiveTab(tab);
        }}
        onPaperSelect={(p) => setSelectedPaper(p)}
        onDeletePaper={handleDeletePaper}
        papers={papers}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onGoHome={() => setViewMode('landing')}
          onUploadClick={() => setActiveTab('upload')}
        />

        <main className="flex-1 overflow-y-auto">
          {selectedPaper ? (
            <PaperDetails
              paper={selectedPaper}
              onBack={() => setSelectedPaper(null)}
              onNavigate={handleNavigate}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  papers={papers}
                  onNavigate={handleNavigate}
                  onPaperSelect={(p) => setSelectedPaper(p)}
                  onUploadClick={() => handleNavigate('upload')}
                  onDeletePaper={handleDeletePaper}
                  currentProject={currentProject}
                  onReload={() => currentProject && loadPapers(currentProject.id)}
                />
              )}

              {activeTab === 'upload' && (
                <Upload
                  currentProject={currentProject}
                  onUploadSuccess={handleUploadSuccess}
                />
              )}

              {activeTab === 'chat' && (
                <Chat papers={papers} currentProject={currentProject} initialPaperId={chatPaperId} />
              )}

              {activeTab === 'reports' && (
                <Reports
                  currentProject={currentProject}
                  papers={papers}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  user={user}
                  currentProject={currentProject}
                  onDeleteProject={handleClearData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
