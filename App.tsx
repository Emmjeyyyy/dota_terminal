import React, { useState, useEffect } from 'react';
import PlayerForm from './components/PlayerForm';
import PlayerHub from './components/PlayerHub';
import MatchDetailView from './components/MatchDetailView';
import GlobalView from './components/GlobalView';
import { Globe, Search, Loader2, Settings, X, Terminal } from 'lucide-react';
import { ensureHeroData } from './services/heroService';

type ViewType = 'HOME' | 'PLAYER' | 'MATCH' | 'GLOBAL';

interface AppState {
  view: ViewType;
  params: {
    accountId?: number;
    matchId?: number;
  };
}

const THEMES = [
  { name: 'Phosphor Green', value: '#4ade80' },
  { name: 'Amber', value: '#fbbf24' },
  { name: 'Crimson', value: '#f87171' },
  { name: 'Cyber Blue', value: '#60a5fa' },
  { name: 'Neon Purple', value: '#c084fc' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ view: 'HOME', params: {} });
  const [appReady, setAppReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [themeColor, setThemeColor] = useState(localStorage.getItem('crt-theme') || '#4ade80');

  useEffect(() => {
    ensureHeroData().then(() => setAppReady(true));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
    localStorage.setItem('crt-theme', themeColor);
  }, [themeColor]);

  const navigateToPlayer = (id: number) => {
    setState({ view: 'PLAYER', params: { accountId: id } });
  };

  const navigateToMatch = (id: number) => {
    setState({ view: 'MATCH', params: { matchId: id } });
  };

  const navigateToGlobal = () => {
    setState({ view: 'GLOBAL', params: {} });
  };

  const goHome = () => {
    setState({ view: 'HOME', params: {} });
  };

  if (!appReady) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-theme">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-mono animate-pulse">BOOT SEQUENCE INITIATED...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-mono text-sm">
      {/* CRT Overlays */}
      <div className="scanlines pointer-events-none" />
      <div className="crt-overlay pointer-events-none" />
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-black border border-theme p-6 max-w-sm w-full shadow-[0_0_20px_rgba(0,0,0,0.8)] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-theme hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-theme-dim pb-2">
              <Settings className="w-5 h-5" /> SYSTEM CONFIG
            </h2>
            <div className="space-y-4">
              <label className="block text-xs uppercase tracking-widest text-theme-dim mb-2">Phosphor Color</label>
              <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
                {THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => setThemeColor(theme.value)}
                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                      themeColor === theme.value 
                        ? 'bg-theme text-black border-theme font-bold' 
                        : 'bg-transparent text-theme-dim border-theme-dim hover:border-theme hover:text-theme'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: theme.value }} />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-theme-dim sticky top-0 z-50 bg-black/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
             className="flex items-center gap-3 cursor-pointer group"
             onClick={goHome}
          >
             <div className="w-8 h-8 border border-theme flex items-center justify-center group-hover:bg-theme group-hover:text-black transition-colors shrink-0">
                <Terminal className="w-5 h-5" />
             </div>
             <span className="text-lg font-bold tracking-tight glow-text hidden sm:block">DOTA_TERMINAL</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
             <button 
                onClick={navigateToGlobal} 
                className="text-theme-dim hover:text-theme flex items-center gap-2 transition-colors uppercase text-xs tracking-wider"
             >
                <Globe className="w-4 h-4" /> <span className="hidden sm:inline">[GLOBAL_DATA]</span><span className="sm:hidden">[DATA]</span>
             </button>
             {state.view !== 'HOME' && (
               <button 
                  onClick={goHome}
                  className="text-theme-dim hover:text-theme flex items-center gap-2 transition-colors uppercase text-xs tracking-wider"
               >
                 <Search className="w-4 h-4" /> <span className="hidden sm:inline">[SEARCH]</span>
               </button>
             )}
             <button
                onClick={() => setShowSettings(true)}
                className="text-theme-dim hover:text-theme transition-colors p-1"
                title="System Settings"
             >
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="container mx-auto px-4 py-8 relative z-10 crt-flicker">
        
        {state.view === 'HOME' && (
           <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-fade-in w-full">
              <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 glow-text tracking-tighter break-words">
                DOTA_TERMINAL
              </h1>
              <div className="h-px w-32 bg-theme mb-8 opacity-50"></div>
              <p className="text-theme-dim text-center max-w-lg mb-10 text-base md:text-lg font-light px-4">
                ACCESSING DOTA DATABASE...<br/>
                ENTER ACCOUNT ID BELOW.
              </p>
              
              <PlayerForm onSubmit={navigateToPlayer} isLoading={false} />

              <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                  <button onClick={navigateToGlobal} className="hover-bg-theme border border-theme text-theme px-6 py-3 font-bold transition-all uppercase tracking-widest text-xs w-full sm:w-auto text-center">
                      [BROWSE_HEROES]
                  </button>
                  <button onClick={() => navigateToMatch(7562624925)} className="hover-bg-theme-dim border border-theme-dim text-theme-dim px-6 py-3 font-bold transition-all uppercase tracking-widest text-xs hover:text-theme hover:border-theme w-full sm:w-auto text-center">
                      [SAMPLE_MATCH]
                  </button>
              </div>
           </div>
        )}

        {state.view === 'PLAYER' && state.params.accountId && (
           <PlayerHub 
              accountId={state.params.accountId} 
              onMatchClick={navigateToMatch}
              onPeerClick={navigateToPlayer}
           />
        )}

        {state.view === 'MATCH' && state.params.matchId && (
           <MatchDetailView 
              matchId={state.params.matchId} 
              onPlayerClick={navigateToPlayer}
              onBack={() => {
                   if(state.params.accountId) navigateToPlayer(state.params.accountId);
                   else goHome();
              }}
           />
        )}

        {state.view === 'GLOBAL' && (
           <GlobalView onMatchClick={navigateToMatch} />
        )}

      </main>

      <footer className="border-t border-theme-dim py-8 text-center text-theme-dim text-[10px] md:text-xs uppercase tracking-widest opacity-50 relative z-10 px-4">
         <p>SYSTEM STATUS: ONLINE // DATA SOURCE: OPENDOTA API</p>
      </footer>
    </div>
  );
};

export default App;