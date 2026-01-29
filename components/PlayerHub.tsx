import React, { useEffect, useState } from 'react';
import { PlayerProfile, WinLoss, MatchSummary, Peer, PlayerHeroStats } from '../types';
import { getPlayerProfile, getPlayerWL, getRecentMatches, getPlayerPeers, getPlayerHeroes } from '../services/api';
import { Loader2, Users, History, LayoutGrid, AlertCircle, HardDrive } from 'lucide-react';
import MatchList from './MatchList';
import { getHeroImageUrl, getHeroName } from '../services/heroService';

interface PlayerHubProps {
  accountId: number;
  onMatchClick: (id: number) => void;
  onPeerClick: (id: number) => void;
}

type Tab = 'overview' | 'heroes' | 'peers';

const PlayerHub: React.FC<PlayerHubProps> = ({ accountId, onMatchClick, onPeerClick }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [wl, setWl] = useState<WinLoss | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const [peers, setPeers] = useState<Peer[]>([]);
  const [heroes, setHeroes] = useState<PlayerHeroStats[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      const [p, w, m] = await Promise.all([
        getPlayerProfile(accountId),
        getPlayerWL(accountId),
        getRecentMatches(accountId)
      ]);
      if (mounted) {
        setProfile(p);
        setWl(w);
        setMatches(m);
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [accountId]);

  useEffect(() => {
    const loadTabData = async () => {
        if (activeTab === 'peers' && peers.length === 0) {
            setLoadingTab(true);
            const data = await getPlayerPeers(accountId);
            setPeers(data);
            setLoadingTab(false);
        } else if (activeTab === 'heroes' && heroes.length === 0) {
            setLoadingTab(true);
            const data = await getPlayerHeroes(accountId);
            setHeroes(data);
            setLoadingTab(false);
        }
    };
    loadTabData();
  }, [activeTab, accountId]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-theme">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <div className="uppercase tracking-widest text-xs animate-pulse">Retrieving_Subject_Data...</div>
        </div>
    );
  }

  if (!profile || !profile.profile) {
      return (
          <div className="text-center py-20 border border-dashed border-theme-dim m-4">
              <AlertCircle className="w-12 h-12 text-theme opacity-50 mx-auto mb-4" />
              <h2 className="text-xl font-bold uppercase text-theme">Subject_Not_Found</h2>
              <p className="text-theme-dim text-xs mt-2">Check ID Input Coordinates.</p>
          </div>
      );
  }

  const winRate = wl ? ((wl.win / (wl.win + wl.lose)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-box p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden">
         <div className="absolute inset-0 bg-theme-dim opacity-5 pointer-events-none"></div>
         <img 
            src={profile.profile.avatarfull} 
            alt={profile.profile.personaname} 
            className="w-24 h-24 border border-theme z-10 shrink-0"
         />
         <div className="text-center md:text-left flex-1 z-10 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-theme mb-1 uppercase tracking-tight glow-text break-words">{profile.profile.personaname}</h1>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 text-xs text-theme-dim font-mono">
               {profile.profile.loccountrycode && (
                   <span className="flex items-center gap-1 border border-theme-dim px-2 py-0.5">
                      LOC: {profile.profile.loccountrycode}
                   </span>
               )}
               <a href={profile.profile.profileurl} target="_blank" rel="noreferrer" className="hover:text-theme hover:underline uppercase">Steam_Link_Protocol</a>
            </div>
         </div>
         
         <div className="grid grid-cols-3 gap-2 md:gap-4 text-center z-10 w-full md:w-auto">
            <div className="bg-black/50 px-2 py-2 border border-theme-dim">
               <div className="text-[9px] md:text-[10px] text-theme-dim uppercase tracking-wider mb-1">Wins</div>
               <div className="text-theme font-bold text-base md:text-lg">{wl?.win || 0}</div>
            </div>
            <div className="bg-black/50 px-2 py-2 border border-theme-dim">
               <div className="text-[9px] md:text-[10px] text-theme-dim uppercase tracking-wider mb-1">Losses</div>
               <div className="text-theme opacity-70 font-bold text-base md:text-lg">{wl?.lose || 0}</div>
            </div>
            <div className="bg-black/50 px-2 py-2 border border-theme-dim">
               <div className="text-[9px] md:text-[10px] text-theme-dim uppercase tracking-wider mb-1">Ratio</div>
               <div className="font-bold text-base md:text-lg text-theme glow-text">
                   {winRate}%
               </div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-dim bg-black/40 overflow-x-auto custom-scrollbar">
         <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 md:px-6 py-3 text-xs font-bold uppercase flex items-center gap-2 border-r border-theme-dim transition-all whitespace-nowrap shrink-0 ${activeTab === 'overview' ? 'bg-theme text-black' : 'text-theme-dim hover:text-theme hover:bg-theme-dim'}`}
         >
            <History className="w-4 h-4" /> [Log]
         </button>
         <button 
            onClick={() => setActiveTab('heroes')}
            className={`px-4 md:px-6 py-3 text-xs font-bold uppercase flex items-center gap-2 border-r border-theme-dim transition-all whitespace-nowrap shrink-0 ${activeTab === 'heroes' ? 'bg-theme text-black' : 'text-theme-dim hover:text-theme hover:bg-theme-dim'}`}
         >
            <LayoutGrid className="w-4 h-4" /> [Arsenal]
         </button>
         <button 
            onClick={() => setActiveTab('peers')}
            className={`px-4 md:px-6 py-3 text-xs font-bold uppercase flex items-center gap-2 border-r border-theme-dim transition-all whitespace-nowrap shrink-0 ${activeTab === 'peers' ? 'bg-theme text-black' : 'text-theme-dim hover:text-theme hover:bg-theme-dim'}`}
         >
            <Users className="w-4 h-4" /> [Network]
         </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px] terminal-box p-4 border-t-0">
         {activeTab === 'overview' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <h3 className="text-xs font-bold text-theme uppercase mb-4 flex items-center gap-2"><HardDrive className="w-4 h-4"/> Recent_Activity_Feed</h3>
                   <MatchList matches={matches} onMatchClick={onMatchClick} />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-theme uppercase mb-4">Performance_Metrics</h3>
                    <div className="bg-black/50 p-4 border border-theme-dim text-xs text-theme-dim font-mono">
                        <p className="mb-4 uppercase border-b border-theme-dim pb-2">Analysis Scope: Last 50 Matches</p>
                        <ul className="space-y-3">
                            <li className="flex justify-between">
                                <span className="uppercase">KDA_Factor</span>
                                <span className="text-theme font-bold">
                                    {(matches.reduce((a, b) => a + (b.kills + b.assists) / (b.deaths || 1), 0) / (matches.length || 1)).toFixed(2)}
                                </span>
                            </li>
                            <li className="flex justify-between">
                                <span className="uppercase">Avg_Duration</span>
                                <span className="text-theme font-bold">
                                    {(matches.reduce((a, b) => a + b.duration, 0) / (matches.length || 1) / 60).toFixed(0)} MIN
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
             </div>
         )}

         {activeTab === 'heroes' && (
             <div>
                {loadingTab ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-theme" /> : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs min-w-[450px]">
                           <thead className="bg-theme-dim text-black font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-3">Unit_Designation</th>
                                <th className="p-3 text-center">Deployments</th>
                                <th className="p-3 text-center">Success_Rate</th>
                                <th className="p-3 text-center">Last_Active</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-theme-dim">
                              {heroes.slice(0, 20).map(h => {
                                  const wr = (h.win / h.games) * 100;
                                  return (
                                    <tr key={h.hero_id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 flex items-center gap-3">
                                            <img src={getHeroImageUrl(h.hero_id)} className="w-8 h-auto border border-theme-dim opacity-80" alt="" />
                                            <span className="font-bold text-theme uppercase truncate max-w-[150px]">{getHeroName(h.hero_id)}</span>
                                        </td>
                                        <td className="p-3 text-center text-theme-dim font-mono">{h.games}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-12 h-1 bg-theme-dim">
                                                    <div className="h-full bg-theme" style={{width: `${wr}%`}} />
                                                </div>
                                                <span className="text-theme font-mono">{wr.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center text-theme-dim font-mono">
                                            {new Date(h.last_played * 1000).toLocaleDateString()}
                                        </td>
                                    </tr>
                                  )
                              })}
                           </tbody>
                        </table>
                    </div>
                )}
             </div>
         )}

         {activeTab === 'peers' && (
            <div>
                 {loadingTab ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-theme" /> : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs min-w-[450px]">
                           <thead className="bg-theme-dim text-black font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-3">Ally_Identity</th>
                                <th className="p-3 text-center">Co_Ops</th>
                                <th className="p-3 text-center">Synergy</th>
                                <th className="p-3 text-center">Last_Contact</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-theme-dim">
                              {peers.slice(0, 25).map(p => { 
                                  const wr = (p.with_win / p.with_games) * 100;
                                  return (
                                    <tr key={p.account_id} className="hover:bg-white/5 cursor-pointer transition-colors group" onClick={() => onPeerClick(p.account_id)}>
                                        <td className="p-3 flex items-center gap-3">
                                            <img src={p.avatar} className="w-8 h-8 rounded-full border border-theme-dim opacity-80 group-hover:opacity-100" alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32'} />
                                            <span className="font-bold text-theme uppercase group-hover:underline truncate max-w-[150px]">{p.personaname}</span>
                                        </td>
                                        <td className="p-3 text-center text-theme-dim font-mono">{p.with_games}</td>
                                        <td className="p-3 text-center">
                                            <span className="text-theme font-mono">{wr.toFixed(0)}%</span>
                                        </td>
                                        <td className="p-3 text-center text-theme-dim font-mono">
                                            {new Date(p.last_played * 1000).toLocaleDateString()}
                                        </td>
                                    </tr>
                                  )
                              })}
                              {peers.length === 0 && (
                                  <tr><td colSpan={4} className="p-8 text-center text-theme-dim uppercase text-xs">No network data detected.</td></tr>
                              )}
                           </tbody>
                        </table>
                    </div>
                 )}
            </div>
         )}
      </div>
    </div>
  );
};

export default PlayerHub;