import React, { useEffect, useState } from 'react';
import { MatchDetail, MatchPlayerDetail } from '../types';
import { getMatchDetails, requestMatchParse } from '../services/api';
import { getHeroImageUrl } from '../services/heroService';
import { Loader2, RefreshCw, ArrowLeft, Trophy, Swords } from 'lucide-react';

interface MatchDetailViewProps {
  matchId: number;
  onPlayerClick: (accountId: number) => void;
  onBack: () => void;
}

// Extended interface for properties returned by API but not in shared types
interface ExtendedPlayer extends MatchPlayerDetail {
  level?: number;
  last_hits?: number;
  denies?: number;
  net_worth?: number;
  rank_tier?: number;
  total_gold?: number;
  hero_variant?: number;
}

const MatchDetailView: React.FC<MatchDetailViewProps> = ({ matchId, onPlayerClick, onBack }) => {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemMap, setItemMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
        const matchData = await getMatchDetails(matchId);
        if (isMounted) {
            setMatch(matchData);
            setLoading(false);
        }
    };

    // Fetch Item Constants for mapping IDs to Images
    fetch('https://api.opendota.com/api/constants/items')
        .then(res => res.json())
        .then(data => {
            if (!isMounted) return;
            const map: Record<number, string> = {};
            Object.values(data).forEach((item: any) => {
                if(item.id) map[item.id] = item.img;
            });
            setItemMap(map);
        })
        .catch(err => console.error("Failed to fetch item constants", err));

    fetchData();
    return () => { isMounted = false; };
  }, [matchId]);

  const handleParse = () => {
    requestMatchParse(matchId);
    alert("PARSE_REQUEST_SENT >> AWAITING_PROCESSING");
  };

  const getItemUrl = (itemId: number) => {
      if (!itemId || !itemMap[itemId]) return null;
      return `https://cdn.steamstatic.com${itemMap[itemId]}`;
  };

  const getRankName = (rank_tier?: number) => {
    if (!rank_tier) return 'Uncalibrated';
    const rank = Math.floor(rank_tier / 10);
    const stars = rank_tier % 10;
    const rankNames = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
    const name = rankNames[rank - 1] || 'Unknown';
    return `${name} [${stars}]`;
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

  const radiantPlayers = match.players.filter(p => p.player_slot < 128) as ExtendedPlayer[];
  const direPlayers = match.players.filter(p => p.player_slot >= 128) as ExtendedPlayer[];

  const HeroCard: React.FC<{ player: MatchPlayerDetail; isRadiant: boolean }> = ({ player, isRadiant }) => {
    const netWorth = ((player.gold_per_min * (match.duration / 60)) / 1000).toFixed(1);
    const heroImage = getHeroImageUrl(player.hero_id);
    
    return (
      <div className="relative group overflow-hidden bg-black border border-theme-dim hover:border-theme transition-all duration-300 h-[28rem] w-full flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.5)]">
         {/* Background Hero Image - Full Cover */}
         <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
             <img 
               src={heroImage} 
               alt="Hero" 
               className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700 ease-out filter brightness-75 contrast-125"
               onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x120?text=?' }}
             />
             {/* Gradient Overlays for Readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
         </div>

         {/* Top: Player Name */}
         <div className="relative z-10 p-2 text-center border-b border-white/5">
            <div className="truncate text-[10px] sm:text-xs font-bold text-white group-hover:text-theme transition-colors shadow-black text-shadow-md">
                {player.personaname || 'Unknown'}
            </div>
         </div>

         {/* Spacer to push content to bottom */}
         <div className="flex-1"></div>

         {/* Stats Overlay on Hover/Default */}
         <div className="relative z-10 p-2 space-y-3 bg-gradient-to-t from-black/95 to-transparent pt-8">
            
            {/* Net Worth */}
            <div className="flex flex-col items-center">
               <div className="text-[#fbbf24] font-bold text-lg leading-none drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]">
                 {netWorth}k
               </div>
               <div className="text-[8px] text-[#fbbf24]/80 uppercase tracking-wider">Net Worth</div>
            </div>

            {/* KDA */}
            <div className="border-t border-white/10 pt-2">
               <div className="flex justify-center items-center gap-1 font-mono text-xs sm:text-sm">
                  <span className="text-green-400 font-bold">{player.kills}</span>
                  <span className="text-theme-dim text-[10px]">/</span>
                  <span className="text-red-500 font-bold">{player.deaths}</span>
                  <span className="text-theme-dim text-[10px]">/</span>
                  <span className="text-white font-bold opacity-80">{player.assists}</span>
               </div>
               <div className="text-[8px] text-theme-dim text-center uppercase tracking-wider opacity-60 mt-0.5">K / D / A</div>
            </div>
            
            {/* GPM/XPM - Visible on Group Hover or just small */}
            <div className="grid grid-cols-2 gap-1 text-[9px] text-theme-dim font-mono text-center border-t border-white/10 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
               <div>
                  <span className="text-white">{player.gold_per_min}</span> GPM
               </div>
               <div>
                  <span className="text-white">{player.xp_per_min}</span> XPM
               </div>
            </div>
         </div>
         
         {/* Team Indicator Strip */}
         <div className={`absolute bottom-0 left-0 right-0 h-1 ${isRadiant ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
      </div>
    );
  };

  const renderTeamOverview = (teamPlayers: ExtendedPlayer[], isRadiant: boolean) => (
    <div className="terminal-box overflow-hidden mb-8">
       {/* Header */}
       <div className={`px-4 py-2 border-b border-theme-dim/50 flex items-center justify-between ${isRadiant ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
          <h3 className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isRadiant ? 'text-green-400' : 'text-red-400'}`}>
             <div className={`w-2 h-2 rounded-full ${isRadiant ? 'bg-green-400' : 'bg-red-400'}`} />
             {isRadiant ? 'Radiant — Overview' : 'Dire — Overview'}
          </h3>
       </div>

       {/* Table Header */}
       <div className="overflow-x-auto custom-scrollbar">
           <div className="min-w-[900px]">
               <div className="flex items-center text-[10px] uppercase text-theme-dim bg-black/40 border-b border-theme-dim/30 py-2 px-4 font-bold tracking-wider">
                  <div className="w-52 shrink-0">Player</div>
                  <div className="w-12 text-center shrink-0">Facet</div>
                  <div className="w-12 text-center shrink-0">LVL</div>
                  <div className="w-24 text-center shrink-0">KDA</div>
                  <div className="w-20 text-center shrink-0">LH/DN</div>
                  <div className="w-20 text-right shrink-0">NET</div>
                  <div className="w-24 text-center shrink-0">GPM/XPM</div>
                  <div className="w-16 text-right shrink-0">HD</div>
                  <div className="w-16 text-right shrink-0">TD</div>
                  <div className="flex-1 pl-6">Items</div>
               </div>

               {/* Rows */}
               <div className="divide-y divide-theme-dim/20">
                  {teamPlayers.map((p) => {
                      const netWorth = p.net_worth || p.total_gold || (p.gold_per_min * match.duration / 60);
                      const itemIds = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5];
                      
                      return (
                          <div key={p.player_slot} className="flex items-center py-2 px-4 hover:bg-white/5 transition-colors group">
                              {/* Player Identity */}
                              <div className="w-52 shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => p.account_id && onPlayerClick(p.account_id)}>
                                 {/* Hero Portrait Block */}
                                 <div className="relative w-14 h-8 shrink-0 bg-black shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                                     {/* Hero Image */}
                                     <img 
                                         src={getHeroImageUrl(p.hero_id)} 
                                         alt="" 
                                         className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                                     />
                                 </div>

                                 {/* Text Info */}
                                 <div className="flex flex-col min-w-0 pr-2">
                                     <div className={`text-xs font-bold truncate leading-none mb-1 ${p.account_id ? 'text-theme group-hover:underline' : 'text-theme-dim italic'}`}>
                                         {p.personaname || 'Anonymous'}
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                         {p.rank_tier ? (
                                             <span className="text-[10px] text-theme-dim font-mono leading-none flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-theme-dim/40"></span>
                                                {getRankName(p.rank_tier)}
                                             </span>
                                         ) : (
                                             <span className="text-[10px] text-theme-dim/50 font-mono leading-none">-</span>
                                         )}
                                     </div>
                                 </div>
                              </div>
                              
                              {/* Facet Column */}
                              <div className="w-12 text-center shrink-0 font-mono text-white text-xs text-theme-dim">
                                  {p.hero_variant || '-'}
                              </div>

                              {/* Stats */}
                              <div className="w-12 text-center shrink-0 font-mono text-white text-xs">{p.level || '-'}</div>
                              
                              <div className="w-24 text-center shrink-0 font-mono text-xs">
                                  <span className="text-green-400 font-bold">{p.kills}</span>
                                  <span className="text-theme-dim mx-1">/</span>
                                  <span className="text-red-400 font-bold">{p.deaths}</span>
                                  <span className="text-theme-dim mx-1">/</span>
                                  <span className="text-white/70">{p.assists}</span>
                              </div>

                              <div className="w-20 text-center shrink-0 font-mono text-xs text-theme-dim">
                                  <span className="text-white">{p.last_hits || 0}</span>
                                  <span className="mx-1">/</span>
                                  <span>{p.denies || 0}</span>
                              </div>

                              <div className="w-20 text-right shrink-0 font-mono text-xs text-[#fbbf24]">
                                  {netWorth ? (netWorth / 1000).toFixed(1) : '0.0'}k
                              </div>

                              <div className="w-24 text-center shrink-0 font-mono text-xs text-theme-dim">
                                  <span className="text-white">{p.gold_per_min}</span>
                                  <span className="mx-1 text-theme-dim">/</span>
                                  <span className="text-white">{p.xp_per_min}</span>
                              </div>

                              <div className="w-16 text-right shrink-0 font-mono text-xs text-white/80">
                                  {p.hero_damage ? (p.hero_damage / 1000).toFixed(1) + 'k' : '-'}
                              </div>

                              <div className="w-16 text-right shrink-0 font-mono text-xs text-white/60">
                                  {p.tower_damage || '-'}
                              </div>

                              {/* Items */}
                              <div className="flex-1 pl-6 flex items-center gap-1">
                                  {itemIds.map((itemId, i) => {
                                      const url = getItemUrl(itemId);
                                      return (
                                          <div key={i} className="w-8 h-6 bg-black/50 border border-theme-dim/30 relative">
                                              {url && <img src={url} alt="" className="w-full h-full object-cover" title={`Item ${itemId}`} />}
                                          </div>
                                      );
                                  })}
                                  
                                  {/* Neutral Item Separator */}
                                  {p.neutral_item && (
                                      <>
                                          <div className="w-px h-6 bg-theme-dim/30 mx-1"></div>
                                          <div className="w-6 h-6 rounded-full overflow-hidden border border-theme-dim/50 relative shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                                             {getItemUrl(p.neutral_item) && <img src={getItemUrl(p.neutral_item)!} alt="" className="w-full h-full object-cover" />}
                                          </div>
                                      </>
                                  )}
                              </div>
                          </div>
                      );
                  })}
               </div>
           </div>
       </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1920px] mx-auto p-2 sm:p-4 animate-fade-in">
       {/* Navigation Header */}
       <div className="flex justify-between items-start mb-6">
           <button onClick={onBack} className="text-xs text-theme-dim hover:text-theme flex items-center gap-2 uppercase tracking-widest border border-transparent hover:border-theme px-3 py-1.5 transition-all group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
           </button>
           
           <div className="flex gap-2">
                <button 
                    onClick={handleParse}
                    className="px-3 sm:px-4 py-2 bg-theme/5 hover:bg-theme hover:text-black text-theme border border-theme text-xs font-bold flex items-center gap-2 uppercase tracking-wider transition-all"
                >
                    <RefreshCw className="w-3 h-3" /> <span className="hidden sm:inline">Re-Parse</span>
                </button>
                <a 
                    href={`https://www.opendota.com/matches/${match.match_id}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-3 sm:px-4 py-2 bg-black hover:bg-white/10 text-theme-dim hover:text-white border border-theme-dim text-xs font-bold uppercase tracking-wider transition-all"
                >
                    <span className="hidden sm:inline">OpenDota</span><span className="sm:hidden">OD</span>
                </a>
           </div>
       </div>

       {/* Match Header Stats */}
       <div className="flex flex-col items-center justify-center mb-8 sm:mb-12 relative">
          <div className="text-[10px] text-theme-dim uppercase tracking-[0.2em] mb-2">Match ID: {match.match_id}</div>
          <div className="flex items-center gap-6 sm:gap-16">
              {/* Radiant Score */}
              <div className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter ${match.radiant_win ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'text-green-500/50'}`}>
                  {match.radiant_score}
              </div>

              {/* Center Info */}
              <div className="flex flex-col items-center gap-2 z-10">
                  <div className="px-3 sm:px-4 py-1 bg-black border border-theme-dim rounded-full text-[10px] sm:text-xs font-mono text-theme-dim uppercase tracking-widest whitespace-nowrap">
                      {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2,'0')}
                  </div>
                  <Swords className={`w-6 h-6 sm:w-8 sm:h-8 ${match.radiant_win ? 'text-green-400' : 'text-red-400'} opacity-80`} />
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-theme-dim whitespace-nowrap">
                      {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
                  </div>
              </div>

              {/* Dire Score */}
              <div className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter ${!match.radiant_win ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]' : 'text-red-500/50'}`}>
                  {match.dire_score}
              </div>
          </div>
       </div>

       {/* Team Split Layout - Side by Side on XL */}
       <div className="flex flex-col xl:flex-row gap-8 xl:gap-6 mb-12">
          
          {/* Radiant Side (Left) */}
          <div className="flex-1">
              <div className="flex items-center justify-between mb-3 px-2 border-b border-green-500/30 pb-2">
                  <h3 className="text-green-400 font-bold uppercase tracking-widest flex items-center gap-2 text-sm md:text-base">
                      <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_currentColor]"></div>
                      The Radiant
                  </h3>
                  {match.radiant_win && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
              </div>
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
                  {radiantPlayers.map(p => (
                      <div key={p.player_slot} onClick={() => p.account_id && onPlayerClick(p.account_id)} className={p.account_id ? 'cursor-pointer' : ''}>
                        <HeroCard player={p} isRadiant={true} />
                      </div>
                  ))}
                  {[...Array(Math.max(0, 5 - radiantPlayers.length))].map((_, i) => (
                      <div key={`empty-r-${i}`} className="h-[28rem] bg-black/20 border border-theme-dim/10"></div>
                  ))}
              </div>
          </div>

          {/* Dire Side (Right) */}
          <div className="flex-1">
              <div className="flex items-center justify-between mb-3 px-2 border-b border-red-500/30 pb-2 xl:flex-row-reverse">
                  <h3 className="text-red-400 font-bold uppercase tracking-widest flex items-center gap-2 xl:flex-row-reverse text-sm md:text-base">
                      <div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_currentColor]"></div>
                      The Dire
                  </h3>
                  {!match.radiant_win && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
              </div>
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
                  {direPlayers.map(p => (
                      <div key={p.player_slot} onClick={() => p.account_id && onPlayerClick(p.account_id)} className={p.account_id ? 'cursor-pointer' : ''}>
                        <HeroCard player={p} isRadiant={false} />
                      </div>
                  ))}
                   {[...Array(Math.max(0, 5 - direPlayers.length))].map((_, i) => (
                      <div key={`empty-d-${i}`} className="h-[28rem] bg-black/20 border border-theme-dim/10"></div>
                  ))}
              </div>
          </div>
       </div>

       {/* Team Overview Section */}
       <div className="space-y-6">
          {renderTeamOverview(radiantPlayers, true)}
          {renderTeamOverview(direPlayers, false)}
       </div>
    </div>
  );
};

export default MatchDetailView;