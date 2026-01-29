import React, { useEffect, useState } from 'react';
import { MatchDetail, MatchPlayerDetail } from '../types';
import { getMatchDetails, requestMatchParse } from '../services/api';
import { getHeroImageUrl } from '../services/heroService';
import { Loader2, RefreshCw, ArrowLeft, Terminal } from 'lucide-react';

interface MatchDetailViewProps {
  matchId: number;
  onPlayerClick: (accountId: number) => void;
  onBack: () => void;
}

const MatchDetailView: React.FC<MatchDetailViewProps> = ({ matchId, onPlayerClick, onBack }) => {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMatchDetails(matchId).then(data => {
      if (isMounted) {
        setMatch(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [matchId]);

  const handleParse = () => {
    requestMatchParse(matchId);
    alert("PARSE_REQUEST_SENT >> AWAITING_PROCESSING");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-theme">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="text-xs uppercase animate-pulse">Fetching_Match_Data...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12 border border-dashed border-theme-dim">
        <div className="text-theme mb-4 uppercase">Error: Data_Corruption_Or_Not_Found</div>
        <button onClick={onBack} className="text-theme-dim hover:text-theme underline uppercase text-xs">Return_Previous</button>
      </div>
    );
  }

  const radiantPlayers = match.players.filter(p => p.player_slot < 128);
  const direPlayers = match.players.filter(p => p.player_slot >= 128);

  const TeamTable = ({ title, players, isWinner, isRadiant }: { title: string, players: MatchPlayerDetail[], isWinner: boolean, isRadiant: boolean }) => (
    <div className={`mb-8 terminal-box ${isWinner ? 'border-theme' : 'border-theme-dim'}`}>
      <div className={`p-3 flex justify-between items-center border-b border-theme-dim ${isWinner ? 'bg-theme-dim' : ''}`}>
        <h3 className="font-bold text-sm text-theme uppercase tracking-wider flex items-center gap-2">
           <Terminal className="w-4 h-4" /> {title}
        </h3>
        <span className={`px-2 py-0.5 border border-theme text-[10px] font-bold uppercase ${isWinner ? 'bg-theme text-black' : 'text-theme-dim border-theme-dim'}`}>
          {isWinner ? 'VICTORY' : 'DEFEAT'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/40 text-theme-dim uppercase text-[10px] tracking-widest border-b border-theme-dim">
            <tr>
              <th className="p-3">Unit</th>
              <th className="p-3">Operator</th>
              <th className="p-3 text-center">Lvl</th>
              <th className="p-3 text-center">K / D / A</th>
              <th className="p-3 text-center">Net</th>
              <th className="p-3 text-center">GPM / XPM</th>
              <th className="p-3 text-center">HD</th>
              <th className="p-3 text-center">TD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-dim">
            {players.map(p => (
              <tr key={p.player_slot} className="hover:bg-theme-dim transition-colors group">
                <td className="p-3">
                  <img src={getHeroImageUrl(p.hero_id)} className="w-8 h-auto border border-theme-dim opacity-80 group-hover:opacity-100" alt="" />
                </td>
                <td className="p-3">
                  {p.account_id ? (
                    <button 
                      onClick={() => onPlayerClick(p.account_id!)}
                      className="font-bold text-theme hover:underline text-left truncate max-w-[150px] uppercase"
                    >
                      {p.personaname || 'Unknown'}
                    </button>
                  ) : (
                    <span className="text-theme-dim italic text-[10px]">[ANONYMOUS]</span>
                  )}
                </td>
                <td className="p-3 text-center text-theme-dim">-</td> 
                <td className="p-3 text-center font-mono">
                  <span className="text-theme font-bold">{p.kills}</span>
                  <span className="text-theme-dim mx-1">/</span>
                  <span className="text-theme opacity-70">{p.deaths}</span>
                  <span className="text-theme-dim mx-1">/</span>
                  <span className="text-theme-dim">{p.assists}</span>
                </td>
                <td className="p-3 text-center text-theme font-mono">
                  {((p.gold_per_min * (match.duration / 60)) / 1000).toFixed(1)}k
                </td>
                <td className="p-3 text-center text-theme-dim text-[10px]">
                  {p.gold_per_min} / {p.xp_per_min}
                </td>
                <td className="p-3 text-center text-theme-dim">
                  {(p.hero_damage / 1000).toFixed(1)}k
                </td>
                <td className="p-3 text-center text-theme-dim">
                   {p.tower_damage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
       <button onClick={onBack} className="mb-6 text-xs text-theme-dim hover:text-theme flex items-center gap-1 uppercase tracking-widest border border-transparent hover:border-theme px-2 py-1 transition-all">
         <ArrowLeft className="w-3 h-3" /> Return
       </button>

       <div className="flex justify-between items-end mb-6 border-b border-theme pb-4">
          <div>
            <h1 className="text-2xl font-bold text-theme uppercase glow-text">MATCH_ID: {match.match_id}</h1>
            <p className="text-theme-dim text-xs font-mono mt-1">
               {new Date(match.start_time * 1000).toLocaleString()} // DURATION: {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2,'0')}
            </p>
          </div>
          <div className="flex gap-2">
            <a 
                href={`https://www.opendota.com/matches/${match.match_id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1.5 bg-black hover:bg-theme hover:text-black rounded-none text-xs text-theme border border-theme transition-colors uppercase font-bold"
            >
                Ext_Link
            </a>
            <button 
                onClick={handleParse}
                className="px-3 py-1.5 bg-theme hover:bg-theme-dim text-black rounded-none text-xs font-bold flex items-center gap-1 uppercase"
            >
                <RefreshCw className="w-3 h-3" /> Re_Parse
            </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-center terminal-box p-4">
          <div className="border-r border-theme-dim">
            <div className="text-theme text-4xl font-bold glow-text">{match.radiant_score}</div>
            <div className="text-[10px] uppercase text-theme-dim font-bold tracking-[0.2em] mt-1">Radiant_Force</div>
          </div>
          <div>
            <div className={`text-4xl font-bold ${!match.radiant_win ? 'text-theme opacity-80' : 'text-theme-dim'}`}>{match.dire_score}</div>
            <div className="text-[10px] uppercase text-theme-dim font-bold tracking-[0.2em] mt-1">Dire_Force</div>
          </div>
       </div>

       <TeamTable title="Radiant_Faction" players={radiantPlayers} isWinner={match.radiant_win} isRadiant={true} />
       <TeamTable title="Dire_Faction" players={direPlayers} isWinner={!match.radiant_win} isRadiant={false} />
    </div>
  );
};

export default MatchDetailView;