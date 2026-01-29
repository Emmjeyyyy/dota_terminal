import React, { useEffect, useState, useMemo } from 'react';
import { getGlobalHeroes, getProMatches } from '../services/api';
import { GlobalHero, ProMatch } from '../types';
import { Loader2, Swords, Gamepad2, Search } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';

interface GlobalViewProps {
  onMatchClick: (id: number) => void;
}

const GlobalView: React.FC<GlobalViewProps> = ({ onMatchClick }) => {
  const [tab, setTab] = useState<'heroes' | 'pro'>('heroes');
  const [heroes, setHeroes] = useState<GlobalHero[]>([]);
  const [matches, setMatches] = useState<ProMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        if (tab === 'heroes' && heroes.length === 0) {
            const data = await getGlobalHeroes();
            setHeroes(data.sort((a,b) => a.localized_name.localeCompare(b.localized_name)));
        } else if (tab === 'pro' && matches.length === 0) {
            const data = await getProMatches();
            setMatches(data);
        }
        setLoading(false);
    };
    fetchData();
  }, [tab]);

  const filteredHeroes = useMemo(() => {
    if (!searchQuery) return heroes;
    const lower = searchQuery.toLowerCase();
    return heroes.filter(h => 
      h.localized_name.toLowerCase().includes(lower) || 
      h.name.toLowerCase().includes(lower) ||
      h.primary_attr.toLowerCase().includes(lower)
    );
  }, [heroes, searchQuery]);

  return (
    <div className="animate-fade-in">
       <div className="flex gap-4 mb-6 border-b border-theme-dim pb-4">
          <button 
             onClick={() => setTab('heroes')}
             className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 border transition-all ${tab === 'heroes' ? 'bg-theme text-black border-theme' : 'bg-transparent text-theme-dim border-theme-dim hover:border-theme hover:text-theme'}`}
          >
             <Swords className="w-4 h-4" /> Database_Heroes
          </button>
          <button 
             onClick={() => setTab('pro')}
             className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 border transition-all ${tab === 'pro' ? 'bg-theme text-black border-theme' : 'bg-transparent text-theme-dim border-theme-dim hover:border-theme hover:text-theme'}`}
          >
             <Gamepad2 className="w-4 h-4" /> Pro_Circuit_Feed
          </button>
       </div>

       {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-theme">
               <Loader2 className="animate-spin w-8 h-8 mb-2"/>
               <span className="text-xs uppercase animate-pulse">Downloading_Assets...</span>
           </div>
       ) : (
           <>
              {tab === 'heroes' && (
                  <div className="space-y-4">
                     {/* Search Bar */}
                     <div className="relative max-w-md">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-dim">
                           <Search className="w-4 h-4" />
                        </div>
                        <input
                           type="text"
                           placeholder="FILTER_OPERATIVES..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-black/50 border border-theme-dim text-theme pl-10 pr-4 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-theme focus:ring-1 focus:ring-theme/50 transition-all placeholder-theme-dim/50"
                        />
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 min-h-[300px] content-start">
                        {filteredHeroes.map((h, index) => (
                           <div 
                              key={h.id} 
                              className="group border border-theme-dim bg-black p-1 hover:border-theme transition-colors cursor-default animate-warp-in"
                              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                           >
                              <div className="relative overflow-hidden mb-1">
                                  <img 
                                      src={getHeroImageUrl(h.id)} 
                                      alt={h.localized_name} 
                                      className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity" 
                                  />
                                  <div className="absolute inset-0 bg-theme mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity"></div>
                              </div>
                              <div className="text-center text-[10px] font-bold text-theme-dim group-hover:text-theme uppercase truncate">
                                  {h.localized_name}
                              </div>
                           </div>
                        ))}
                        {filteredHeroes.length === 0 && (
                           <div className="col-span-full py-20 text-center text-theme-dim border border-dashed border-theme-dim">
                              <span className="text-xs uppercase">No_Operatives_Found_Matching_Query</span>
                           </div>
                        )}
                     </div>
                  </div>
              )}

              {tab === 'pro' && (
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
                                    <div className={`font-bold uppercase ${m.radiant_win ? 'text-theme glow-text' : 'text-theme opacity-60'}`}>
                                        {m.radiant_name || 'RADIANT'}
                                    </div>
                                    <div className="text-theme-dim text-xs">VS</div>
                                    <div className={`font-bold uppercase ${!m.radiant_win ? 'text-theme glow-text' : 'text-theme opacity-60'}`}>
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
                  </div>
              )}
           </>
       )}
    </div>
  );
};

export default GlobalView;