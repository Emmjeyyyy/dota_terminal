import React from 'react';
import { MatchSummary } from '../types';
import { getHeroImageUrl } from '../services/heroService';
import { ChevronRight } from 'lucide-react';

interface MatchListProps {
  matches: MatchSummary[];
  onMatchClick: (matchId: number) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, onMatchClick }) => {
  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const isRadiant = match.player_slot < 128;
        const won = (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);
        const durationMin = Math.floor(match.duration / 60);
        const durationSec = String(match.duration % 60).padStart(2, '0');

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
                  <div className={`font-bold text-xs uppercase tracking-wider ${won ? 'text-theme' : 'text-theme opacity-80'}`}>
                    {won ? '>> VICTORY' : '>> DEFEAT'}
                  </div>
                  <div className="text-[10px] text-theme-dim font-mono">
                    {new Date(match.start_time * 1000).toLocaleDateString()}
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
  );
};

export default MatchList;