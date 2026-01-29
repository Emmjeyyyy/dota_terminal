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

        return (
          <div 
            key={match.match_id} 
            onClick={() => onMatchClick(match.match_id)}
            className="group cursor-pointer border border-theme-dim p-2 flex items-center justify-between hover:bg-theme-dim transition-all hover:border-theme"
          >
            <div className="flex items-center gap-3">
               <div className="relative">
                  <img 
                    src={getHeroImageUrl(match.hero_id)} 
                    alt="Hero"
                    className="w-10 h-auto opacity-70 group-hover:opacity-100 transition-opacity border border-theme-dim" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x36?text=?' }}
                  />
               </div>
               <div>
                  <div className={`font-bold text-xs uppercase tracking-wider ${won ? 'text-theme' : 'text-theme opacity-60'}`}>
                    {won ? '>> VICTORY' : '>> DEFEAT'}
                  </div>
                  <div className="text-[10px] text-theme-dim font-mono">
                    {new Date(match.start_time * 1000).toLocaleDateString()}
                  </div>
               </div>
            </div>
            
            <div className="text-right flex gap-4 items-center">
               <div className="hidden sm:block">
                 <div className="text-[9px] text-theme-dim uppercase">KDA</div>
                 <div className="text-xs font-mono text-theme">
                   {match.kills}/{match.deaths}/{match.assists}
                 </div>
               </div>
               
               <div className="hidden sm:block">
                 <div className="text-[9px] text-theme-dim uppercase">TIME</div>
                 <div className="text-xs font-mono text-theme">
                   {Math.floor(match.duration / 60)}:{String(match.duration % 60).padStart(2, '0')}
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