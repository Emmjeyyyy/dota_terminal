import React, { useEffect, useState } from 'react';
import { getProMatches } from '../services/api';
import { ProMatch } from '../types';
import { Loader2 } from 'lucide-react';

interface ProMatchesViewProps {
  onMatchClick: (id: number) => void;
}

const ProMatchesView: React.FC<ProMatchesViewProps> = ({ onMatchClick }) => {
  const [matches, setMatches] = useState<ProMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getProMatches();
        setMatches(data);
        setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in w-full">
        <div className="mb-6 border-b border-theme-dim pb-4">
             <h2 className="text-lg font-bold text-theme uppercase tracking-wider glow-text">Pro Circuit // Feed</h2>
        </div>

       {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-theme">
               <Loader2 className="animate-spin w-8 h-8 mb-2"/>
               <span className="text-xs uppercase animate-pulse">Downloading_Feed...</span>
           </div>
       ) : (
          <div className="space-y-2">
             {matches.map(m => (
                 <div 
                   key={m.match_id} 
                   onClick={() => onMatchClick(m.match_id)}
                   className="border border-theme-dim p-3 hover:bg-theme-dim cursor-pointer flex justify-between items-center group transition-colors"
                 >
                    <div className="flex-1">
                        <div className="text-[10px] text-theme-dim mb-1 uppercase tracking-widest">{m.league_name}</div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className={`font-bold uppercase ${m.radiant_win ? 'text-theme glow-text' : 'text-theme opacity-80'}`}>
                                {m.radiant_name || 'RADIANT'}
                            </div>
                            <div className="text-theme-dim text-xs">VS</div>
                            <div className={`font-bold uppercase ${!m.radiant_win ? 'text-theme glow-text' : 'text-theme opacity-80'}`}>
                                {m.dire_name || 'DIRE'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-mono font-bold text-theme group-hover:text-black transition-colors">
                            {m.radiant_score} - {m.dire_score}
                        </div>
                        <div className="text-[10px] text-theme-dim font-mono group-hover:text-black/70">
                            {Math.floor(m.duration / 60)}:{(m.duration % 60).toString().padStart(2,'0')}
                        </div>
                    </div>
                 </div>
             ))}
             {matches.length === 0 && (
                <div className="text-center py-20 text-theme-dim italic">No active circuit data found.</div>
             )}
          </div>
       )}
    </div>
  );
};

export default ProMatchesView;