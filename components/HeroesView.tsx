import React, { useEffect, useState, useMemo } from 'react';
import { getGlobalHeroes } from '../services/api';
import { GlobalHero } from '../types';
import { Loader2, Search, Filter, X } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';
import HeroDetailModal from './HeroDetailModal';

const ATTR_FILTERS = [
  { id: 'str', label: 'Strength', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-str-active.png' },
  { id: 'agi', label: 'Agility', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-agi-active.png' },
  { id: 'int', label: 'Intelligence', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-int-active.png' },
  { id: 'all', label: 'Universal', icon: 'https://cdn.steamstatic.com/apps/dota2/images/dota_react/herogrid/filter-uni-active.png' },
];

const HeroesView: React.FC = () => {
  const [heroes, setHeroes] = useState<GlobalHero[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([]);
  const [selectedHero, setSelectedHero] = useState<GlobalHero | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getGlobalHeroes();
        setHeroes(data.sort((a,b) => a.localized_name.localeCompare(b.localized_name)));
        setLoading(false);
    };
    fetchData();
  }, []);

  const toggleAttr = (attrId: string) => {
    setSelectedAttrs(prev => 
      prev.includes(attrId) 
        ? prev.filter(id => id !== attrId) 
        : [...prev, attrId]
    );
  };

  const filteredHeroes = useMemo(() => {
    let result = heroes;

    if (selectedAttrs.length > 0) {
      result = result.filter(h => selectedAttrs.includes(h.primary_attr));
    }

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
    <div className="animate-fade-in w-full">
        <div className="mb-6 border-b border-theme-dim pb-4">
             <h2 className="text-lg font-bold text-theme uppercase tracking-wider glow-text">Database // Heroes</h2>
        </div>

       {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-theme">
               <Loader2 className="animate-spin w-8 h-8 mb-2"/>
               <span className="text-xs uppercase animate-pulse">Downloading_Assets...</span>
           </div>
       ) : (
          <div className="space-y-6">
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
                      onClick={() => setSelectedHero(h)}
                      className="group border border-theme-dim bg-black p-1 hover:border-theme transition-colors cursor-pointer animate-warp-in hover:bg-white/5"
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

       {selectedHero && (
           <HeroDetailModal 
               hero={selectedHero} 
               onClose={() => setSelectedHero(null)} 
           />
       )}
    </div>
  );
};

export default HeroesView;