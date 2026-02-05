import React, { useEffect, useState } from 'react';
import { MatchDetail, MatchPlayerDetail } from '../types';
import { getMatchDetails, requestMatchParse } from '../services/api';
import { getHeroImageUrl } from '../services/heroService';
import { Loader2, RefreshCw, ArrowLeft, Terminal, Trophy } from 'lucide-react';

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

  const HeroCard: React.FC<{ player: MatchPlayerDetail }> = ({ player }) => {
    const netWorth = ((player.gold_per_min * (match.duration / 60)) / 1000).toFixed(1);
    
    return (
      <div className="relative group overflow-hidden bg-black/40 border border-theme-dim hover:border-theme transition-all duration-300 flex flex-col h-64 md:h-80 w-full shadow-lg">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-black">
             <img 
               src={getHeroImageUrl(player.hero_id)} 
               alt="Hero" 
               className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 ease-out filter brightness-75 group-hover:brightness-100"
               onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x36?text=?' }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90"></div>
        </div>
        
        {/* Upper Section: IGN */}
        <div className="relative z-10 pt-4 px-2 text-center w-full">
            {player.account_id ? (
                <button 
                  onClick={() => onPlayerClick(player.account_id!)}
                  className="text-white font-bold uppercase tracking-wider text-xs md:text-sm hover:text-theme transition-colors text-shadow-md truncate w-full block px-2"
                >
                  {player.personaname}
                </button>
            ) : (
                <span className="text-theme-dim italic text-[10px] uppercase tracking-widest">[Anonymous]</span>
            )}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Lower Section: Net Worth & KDA */}
        <div className="relative z-10 pb-4 px-2 text-center space-y-2">
            <div className="flex flex-col items-center">
               <span className="text-[9px] text-[#fbbf24] font-bold uppercase tracking-widest opacity-80 mb-0.5 shadow-black text-shadow">Net Worth</span>
               <div className="text-lg md:text-xl font-bold text-[#fbbf24] drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] leading-none">
                 {netWorth}k
               </div>
            </div>
            
            <div className="w-8 h-px bg-theme-dim/30 mx-auto"></div>

            <div>
               <div className="flex justify-center items-center gap-2 font-mono text-sm md:text-base drop-shadow-md">
                  <span className="text-theme font-bold">{player.kills}</span>
                  <span className="text-theme-dim text-[10px]">/</span>
                  <span className="text-red-500 font-bold">{player.deaths}</span>
                  <span className="text-theme-dim text-[10px]">/</span>
                  <span className="text-white font-bold opacity-80">{player.assists}</span>
               </div>
               <div className="text-[9px] text-theme-dim uppercase tracking-widest opacity-50 mt-1">K / D / A</div>
            </div>
        </div>
      </div>
    );
  };

  const TeamSection = ({ title, players, isWinner, isRadiant }: { title: string, players: MatchPlayerDetail[], isWinner: boolean, isRadiant: boolean }) => (
    <div className={`mb-12 ${isWinner ? '' : 'opacity-95'}`}>
      <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isWinner ? 'border-theme' : 'border-theme-dim'} px-2`}>
        <div className="flex items-center gap-3">
            <div className={`w-1 h-6 ${isRadiant ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_currentColor]`}></div>
            <h3 className={`font-bold text-base md:text-lg uppercase tracking-widest ${isRadiant ? 'text-green-400' : 'text-red-400'}`}>
               {title}
            </h3>
        </div>
        <div className="flex items-center gap-4">
             <div className="text-2xl md:text-3xl font-bold text-white tracking-widest">
                {isRadiant ? match.radiant_score : match.dire_score}
             </div>
             <div className={`px-3 py-1 border text-xs font-bold uppercase tracking-widest ${isWinner ? 'bg-theme text-black border-theme' : 'text-theme-dim border-theme-dim bg-transparent'}`}>
                {isWinner ? <span className="flex items-center gap-1"><Trophy className="w-3 h-3"/> Win</span> : 'Loss'}
             </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
         {players.map(p => (
            <HeroCard key={p.player_slot} player={p} />
         ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
       <button onClick={onBack} className="mb-6 text-xs text-theme-dim hover:text-theme flex items-center gap-1 uppercase tracking-widest border border-transparent hover:border-theme px-2 py-1 transition-all w-fit">
         <ArrowLeft className="w-3 h-3" /> Back_To_Terminal
       </button>

       <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-theme-dim pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-5 h-5 text-theme" />
                <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                    Match {match.match_id}
                </h1>
            </div>
            <div className="text-theme-dim text-xs font-mono flex flex-wrap gap-4">
               <span>DATE: {new Date(match.start_time * 1000).toLocaleString()}</span>
               <span className="text-theme">DURATION: {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2,'0')}</span>
            </div>
          </div>
          <div className="flex gap-0">
            <a 
                href={`https://www.opendota.com/matches/${match.match_id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-black hover:bg-theme hover:text-black text-xs text-theme border border-theme transition-colors uppercase font-bold tracking-wider"
            >
                OpenDota
            </a>
            <button 
                onClick={handleParse}
                className="px-4 py-2 bg-theme/10 hover:bg-theme hover:text-black text-theme border-t border-b border-r border-theme text-xs font-bold flex items-center gap-2 uppercase tracking-wider transition-all"
            >
                <RefreshCw className="w-3 h-3" /> Parse
            </button>
          </div>
       </div>

       <TeamSection title="Radiant" players={radiantPlayers} isWinner={match.radiant_win} isRadiant={true} />
       <TeamSection title="Dire" players={direPlayers} isWinner={!match.radiant_win} isRadiant={false} />
    </div>
  );
};

export default MatchDetailView;