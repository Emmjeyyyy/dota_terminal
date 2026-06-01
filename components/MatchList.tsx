import React, { useState } from 'react';
import { MatchSummary } from '../types';
import { getHeroImageUrl } from '../services/heroService';
import { ChevronRight } from 'lucide-react';

interface MatchListProps {
  matches: MatchSummary[];
  onMatchClick: (matchId: number) => void;
}

const getMatchLabel = (lobby_type: number = 0, game_mode: number = 0): string => {
  if (game_mode === 23) return 'Turbo';
  if (lobby_type === 7) return 'Ranked';
  return 'Unranked';
};

const MatchList: React.FC<MatchListProps> = ({ matches, onMatchClick }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(matches.length / itemsPerPage);
  
  const paginatedMatches = matches.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
      {paginatedMatches.map((match) => {
        const isRadiant = match.player_slot < 128;
        const won = (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);
        const durationMin = Math.floor(match.duration / 60);
        const durationSec = String(match.duration % 60).padStart(2, '0');
        const label = getMatchLabel(match.lobby_type, match.game_mode);

        return (
          <div 
            key={match.match_id} 
            onClick={() => onMatchClick(match.match_id)}
            className="group cursor-pointer border border-theme-dim p-2 sm:p-3 flex items-center justify-between hover:bg-theme-dim transition-all hover:border-theme"
          >
            <div className="flex items-center gap-3">
               <div className="relative shrink-0">
                  <img 
                    src={getHeroImageUrl(match.hero_id)} 
                    alt="Hero"
                    className="w-10 h-auto sm:w-12 sm:h-auto opacity-100 border border-theme-dim brightness-110 shadow-[0_0_5px_rgba(74,222,128,0.1)]" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x36?text=?' }}
                  />
               </div>
               <div className="flex flex-col">
                  <div className={`font-bold text-xs uppercase tracking-wider ${won ? 'text-theme' : 'text-red-400 opacity-80'}`}>
                    {won ? '>> VICTORY' : '>> DEFEAT'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-theme-dim font-mono">
                    <span>{new Date(match.start_time * 1000).toLocaleDateString()}</span>
                    {label && (
                        <>
                           <span className="opacity-50">/</span>
                           <span className="text-theme opacity-80 uppercase tracking-tight">{label}</span>
                        </>
                    )}
                  </div>
               </div>
            </div>
             
            <div className="text-right flex items-center gap-2 sm:gap-6">
               <div className="flex flex-col sm:items-end">
                 <div className="text-[9px] text-theme-dim uppercase hidden sm:block">Performance</div>
                 <div className="text-xs font-mono text-theme flex gap-2 sm:block">
                   <span>{match.kills}/{match.deaths}/{match.assists}</span>
                   <span className="text-theme-dim sm:hidden">|</span>
                   <span className="sm:hidden text-theme-dim">{durationMin}:{durationSec}</span>
                 </div>
               </div>
               
               <div className="hidden sm:block">
                 <div className="text-[9px] text-theme-dim uppercase">TIME</div>
                 <div className="text-xs font-mono text-theme">
                   {durationMin}:{durationSec}
                 </div>
               </div>

               <ChevronRight className="w-4 h-4 text-theme-dim group-hover:text-theme group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        );
      })}
      {matches.length === 0 && (
          <div className="text-center py-6 text-theme-dim italic text-xs uppercase">No matches found in buffer.</div>
      )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-theme-dim pt-4 mt-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs uppercase tracking-wider text-theme-dim hover:text-theme disabled:opacity-30 disabled:hover:text-theme-dim transition-colors"
          >
            {'<< Previous_Page'}
          </button>
          
          <div className="text-xs font-mono text-theme glow-text">
            [{page} / {totalPages}]
          </div>

          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs uppercase tracking-wider text-theme-dim hover:text-theme disabled:opacity-30 disabled:hover:text-theme-dim transition-colors"
          >
            {'Next_Page >>'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchList;