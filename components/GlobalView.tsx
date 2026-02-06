import React, { useEffect, useState, useMemo } from 'react';
import { getGlobalHeroes, getProMatches } from '../services/api';
import { GlobalHero, ProMatch } from '../types';
import { Loader2, Swords, Gamepad2, Search, Filter, X } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';

interface GlobalViewProps {
  onMatchClick: (id: number) => void;
}

const ATTR_FILTERS = [
  { id: 'str', label: 'Strength', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-str-active.png' },
  { id: 'agi', label: 'Agility', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-agi-active.png' },
  { id: 'int', label: 'Intelligence', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-int-active.png' },
  { id: 'all', label: 'Universal', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-uni-active.png' },
];

const GlobalView: React.FC<GlobalViewProps> = ({ onMatchClick }) => {
  const [tab, setTab] = useState<'heroes' | 'pro'>('heroes');
  const [heroes, setHeroes] = useState<GlobalHero[]>([]);
  const [matches, setMatches] = useState<ProMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([]);

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
  }, [tab, heroes.length, matches.length]);

  const toggleAttr = (attrId: string) => {
    setSelectedAttrs(prev => 
      prev.includes(attrId) 
        ? prev.filter(id => id !== attrId) 
        : [...prev, attrId]
    );
  };

  const filteredHeroes = useMemo(() => {
    let result = heroes;

    // Filter by Attributes
    if (selectedAttrs.length > 0) {
      result = result.filter(h => selectedAttrs.includes(h.primary_attr));
    }

    // Filter by Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.localized_name.toLowerCase().includes(lower) || 
        h.name.toLowerCase().includes(lower) ||
        h.primary_attr.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [heroes, searchQuery, selectedAttrs]);

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
                  <div className="space-y-6">
                     {/* Controls: Search & Filter */}
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="relative w-full md:max-w-xs">
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

                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-[10px] uppercase text-theme-dim tracking-wider mr-1 hidden sm:flex items-center gap-1">
                              <Filter className="w-3 h-3" /> Attr:
                           </span>
                           {ATTR_FILTERS.map((attr) => (
                              <button
                                 key={attr.id}
                                 onClick={() => toggleAttr(attr.id)}
                                 className={`
                                    w-8 h-8 rounded-full border transition-all duration-300 relative group overflow-hidden
                                    ${selectedAttrs.includes(attr.id) 
                                       ? 'opacity-100 scale-110 border-theme bg-theme/10 shadow-[0_0_10px_rgba(74,222,128,0.3)]' 
                                       : 'opacity-40 border-transparent hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}
                                 `}
                                 title={attr.label}
                              >
                                 <img src={attr.icon} alt={attr.label} className="w-full h-full object-contain" />
                              </button>
                           ))}
                        </div>
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
                           <div className="col-span-full py-20 text-center text-theme-dim border border-dashed border-theme-dim flex flex-col items-center justify-center gap-4">
                              <span className="text-xs uppercase">No_Operatives_Found</span>
                              {(selectedAttrs.length > 0 || searchQuery) && (
                                  <button 
                                    onClick={() => { setSelectedAttrs([]); setSearchQuery(''); }}
                                    className="text-xs uppercase text-theme hover:underline flex items-center gap-2"
                                  >
                                    <X className="w-3 h-3" /> Reset_All_Filters
                                  </button>
                              )}
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
                  </div>
              )}
           </>
       )}
    </div>
  );
};

export default GlobalView;