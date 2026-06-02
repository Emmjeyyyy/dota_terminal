import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGlobalHeroes } from '../services/api';
import { GlobalHero } from '../types';
import { Loader2, Search, Filter, X } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';
import HeroDetailModal from './HeroDetailModal';

const ATTR_FILTERS = [
   { id: 'str', label: 'Strength', icon: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/hero_strength.png' },
   { id: 'agi', label: 'Agility', icon: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/hero_agility.png' },
   { id: 'int', label: 'Intelligence', icon: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/hero_intelligence.png' },
   { id: 'all', label: 'Universal', icon: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/hero_universal.png' },
];

const HeroesView: React.FC = () => {
   const { data, isLoading: loading } = useQuery({
      queryKey: ['globalHeroes'],
      queryFn: getGlobalHeroes,
   });
   
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedAttrs, setSelectedAttrs] = useState<string[]>([]);
   const [selectedComplexity, setSelectedComplexity] = useState<number | null>(null);
   const [selectedHero, setSelectedHero] = useState<GlobalHero | null>(null);

   const heroes = useMemo(() => {
      if (!data) return [];
      return [...data].sort((a, b) => a.localized_name.localeCompare(b.localized_name));
   }, [data]);

   const toggleAttr = (attrId: string) => {
      setSelectedAttrs(prev =>
         prev.includes(attrId)
            ? prev.filter(id => id !== attrId)
            : [...prev, attrId]
      );
   };

   const toggleComplexity = (comp: number) => {
      setSelectedComplexity(prev => prev === comp ? null : comp);
   };

   const filteredHeroes = useMemo(() => {
      let result = heroes;

      if (selectedAttrs.length > 0) {
         result = result.filter(h => selectedAttrs.includes(h.primary_attr));
      }

      if (selectedComplexity !== null) {
         result = result.filter(h => h.complexity === selectedComplexity);
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
   }, [heroes, searchQuery, selectedAttrs, selectedComplexity]);

   return (
      <div className="animate-fade-in w-full">
         <div className="mb-6 border-b border-theme-dim pb-4">
            <h2 className="text-lg font-bold text-theme uppercase tracking-wider glow-text">Heroes</h2>
         </div>

         {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-theme">
               <Loader2 className="animate-spin w-8 h-8 mb-2" />
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
                        placeholder="SEARCH HERO..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-theme-dim text-theme pl-10 pr-4 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-theme focus:ring-1 focus:ring-theme/50 transition-all placeholder-theme-dim/50"
                     />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-2">
                     {/* Attribute Filter */}
                     <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
                        <span className="text-[10px] uppercase text-theme-dim tracking-wider flex items-center gap-1 mb-1 sm:mb-0 mr-0 sm:mr-1">
                           <Filter className="w-3 h-3" /> ATTRIBUTE:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                           {ATTR_FILTERS.map((attr) => {
                              const isSelected = selectedAttrs.includes(attr.id);
                              let selectedClasses = '';
                              if (isSelected) {
                                  if (attr.id === 'str') selectedClasses = 'opacity-100 scale-110 border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
                                  else if (attr.id === 'agi') selectedClasses = 'opacity-100 scale-110 border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
                                  else if (attr.id === 'int') selectedClasses = 'opacity-100 scale-110 border-[#00a4db] bg-[#00a4db]/10 shadow-[0_0_10px_rgba(0,164,219,0.5)]';
                                  else if (attr.id === 'all') selectedClasses = 'opacity-100 scale-110 border-transparent shadow-[0_0_10px_rgba(255,255,255,0.3)]';
                              } else {
                                  selectedClasses = 'opacity-40 border-transparent sm:hover:opacity-100 sm:hover:scale-105 grayscale sm:hover:grayscale-0';
                              }

                              return (
                                 <button
                                    key={attr.id}
                                    onClick={() => toggleAttr(attr.id)}
                                    className={`w-8 h-8 rounded-full border transition-all duration-300 relative group overflow-hidden flex items-center justify-center ${selectedClasses}`}
                                    title={attr.label}
                                 >
                                    {isSelected && attr.id === 'all' && (
                                       <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-[#00a4db] p-[1px] -z-10">
                                          <div className="w-full h-full bg-black rounded-full" />
                                       </div>
                                    )}
                                    <img src={attr.icon} alt={attr.label} className="w-full h-full object-contain relative z-10" />
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                     
                     <div className="w-[1px] h-6 bg-theme-dim/50 mx-1 hidden sm:block"></div>
                     
                     {/* Complexity Filter */}
                     <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
                        <span className="text-[10px] uppercase text-theme-dim tracking-wider flex items-center gap-1 mb-1 sm:mb-0 mr-0 sm:mr-1">
                           COMPLEXITY:
                        </span>
                        <div className="flex items-center gap-2">
                           {[1, 2, 3].map((comp) => {
                              const isActive = selectedComplexity !== null && comp <= selectedComplexity;
                              return (
                                 <button
                                    key={comp}
                                    onClick={() => toggleComplexity(comp)}
                                    className={`h-8 w-8 flex items-center justify-center rounded-sm transition-all duration-300 font-bold text-lg ${isActive ? 'opacity-100 scale-110 text-theme drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'opacity-40 text-theme-dim sm:hover:opacity-100'}`}
                                    title={`Complexity ${comp}`}
                                 >
                                    {isActive ? '◆' : '◇'}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
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
                        {(selectedAttrs.length > 0 || selectedComplexity !== null || searchQuery) && (
                           <button
                              onClick={() => { setSelectedAttrs([]); setSelectedComplexity(null); setSearchQuery(''); }}
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