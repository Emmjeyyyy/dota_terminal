import React, { useState, useMemo } from 'react';
import { ExtendedMatch, PartyGroup, PlayerProfile } from '../types';
import { groupMatchesByParty } from '../utils/analysis';
import PartyTable from './PartyTable';
import MatchList from './MatchList';
import { Trophy, TrendingUp, AlertTriangle, User } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';

interface DashboardProps {
  profile: PlayerProfile;
  matches: ExtendedMatch[];
  onMatchClick: (matchId: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, matches, onMatchClick }) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  const parties = useMemo(() => groupMatchesByParty(matches), [matches]);

  const bestCombo = useMemo(() => {
    const qualified = parties.filter(p => p.matches.length >= 2 && p.id !== 'SOLO');
    if (qualified.length === 0) return null;
    return qualified.reduce((prev, current) => {
        const prevWinrate = prev.wins / prev.matches.length;
        const currWinrate = current.wins / current.matches.length;
        if (currWinrate > prevWinrate) return current;
        if (currWinrate === prevWinrate && current.matches.length > prev.matches.length) return current;
        return prev;
    });
  }, [parties]);

  const selectedParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-6 terminal-box p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
            <User className="w-20 h-20 md:w-32 md:h-32" />
        </div>
        <div className="relative shrink-0">
            <img 
            src={profile.profile.avatarfull} 
            alt={profile.profile.personaname} 
            className="w-20 h-20 border border-theme opacity-90"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-theme animate-pulse"></div>
        </div>
        <div className="z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-theme uppercase tracking-tight glow-text break-words line-clamp-2">{profile.profile.personaname}</h1>
          <a 
            href={profile.profile.profileurl} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs text-theme-dim hover:text-theme border-b border-dashed border-theme-dim pb-0.5 uppercase tracking-wider block mt-1"
          >
            Link_To_Steam_Profile
          </a>
        </div>
        <div className="md:ml-auto text-center md:text-right z-10 w-full md:w-auto border-t md:border-t-0 border-theme-dim pt-4 md:pt-0 mt-2 md:mt-0">
           <div className="text-[10px] text-theme-dim uppercase tracking-widest mb-1">DATA_SET_SIZE</div>
           <div className="text-3xl font-bold text-theme glow-text">{matches.length}</div>
        </div>
      </div>

      {/* Best Combo Highlight */}
      {bestCombo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="terminal-box p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between">
                <div>
                   <p className="text-theme-dim text-[10px] uppercase tracking-widest mb-1">OPTIMAL_SQUAD</p>
                   <p className="text-3xl font-bold text-theme glow-text">
                     {((bestCombo.wins / bestCombo.matches.length) * 100).toFixed(0)}% <span className="text-sm align-middle opacity-70">WR</span>
                   </p>
                </div>
                <Trophy className="text-theme w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                 {bestCombo.teammates.map((mate) => (
                    <div key={mate.account_id} className="flex items-center gap-1 border border-theme-dim text-theme-dim px-2 py-1 text-xs hover:border-theme hover:text-theme transition-colors cursor-default">
                       <img src={getHeroImageUrl(mate.mostPlayedHeroId)} alt="" className="w-4 h-4 opacity-80" />
                       <span className="uppercase truncate max-w-[80px]">{mate.personaname}</span>
                    </div>
                 ))}
              </div>
              <p className="text-[10px] text-theme-dim mt-2 uppercase">{bestCombo.wins}W - {bestCombo.losses}L // {bestCombo.matches.length} MATCHES</p>
           </div>
           
           <div className="md:col-span-2 terminal-box p-5 flex items-center justify-center text-theme-dim text-xs md:text-sm font-mono border-l-4 border-l-theme">
              {bestCombo.id === 'SOLO' ? (
                <div className="flex items-center gap-3">
                   <AlertTriangle className="w-5 h-5 text-theme animate-pulse shrink-0" />
                   <span className="uppercase tracking-widest">ADVISORY: SOLO PERFORMANCE EXCEEDS PARTY METRICS.</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                   <TrendingUp className="w-5 h-5 text-theme shrink-0" />
                   <span className="uppercase tracking-widest">STRATEGY: MAINTAIN CURRENT SQUAD CONFIGURATION.</span>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left: Party Table */}
        <div className="lg:col-span-2">
           <PartyTable 
             parties={parties} 
             onSelectParty={(party) => setSelectedPartyId(party.id)} 
             selectedPartyId={selectedPartyId || (parties.length > 0 ? parties[0].id : null)}
           />
        </div>

        {/* Right: Match Details for Selected Party */}
        <div className="space-y-4">
           <h3 className="text-lg font-bold text-theme border-b border-theme-dim pb-2 flex justify-between items-center">
             <span>MATCH_LOG</span>
             {selectedParty && <span className="text-xs font-normal text-theme-dim">COUNT: {selectedParty.matches.length}</span>}
           </h3>
           
           {selectedParty ? (
             <div className="terminal-box p-3 md:p-4 min-h-[400px]">
                <div className="mb-4">
                  <p className="text-[10px] text-theme-dim uppercase tracking-widest mb-2">ACTIVE_MEMBERS</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedParty.id === 'SOLO' ? (
                        <span className="text-theme-dim text-xs uppercase border border-dashed border-theme-dim px-2 py-1">[SOLO_OPERATIVE]</span>
                    ) : (
                        selectedParty.teammates.map((mate) => (
                            <span key={mate.account_id} className="text-xs text-theme border border-theme-dim px-2 py-1 flex items-center gap-1.5 hover:bg-theme-dim">
                                <img src={getHeroImageUrl(mate.mostPlayedHeroId)} className="w-3 h-3 opacity-70" alt=""/>
                                <span className="uppercase truncate max-w-[100px]">{mate.personaname}</span>
                            </span>
                        ))
                    )}
                  </div>
                </div>
                <MatchList matches={selectedParty.matches} onMatchClick={onMatchClick} />
             </div>
           ) : (
             <div className="text-theme-dim text-center py-10 border border-dashed border-theme-dim uppercase text-xs">Awaiting Selection...</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;