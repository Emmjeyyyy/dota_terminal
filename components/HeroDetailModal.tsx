import React, { useEffect, useState } from 'react';
import { GlobalHero } from '../types';
import { 
  ensureExtendedHeroData, 
  getHeroAbilities, 
  getHeroTalents,
  getHeroFacets, 
  getAbilityImageUrl, 
  getHeroImageUrl,
  getFacetIconUrl
} from '../services/heroService';
import { Loader2, X, Shield, Sword, Footprints, Zap, Brain } from 'lucide-react';

interface HeroDetailModalProps {
  hero: GlobalHero;
  onClose: () => void;
}

const HeroDetailModal: React.FC<HeroDetailModalProps> = ({ hero, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [abilities, setAbilities] = useState<any[]>([]);
  const [talents, setTalents] = useState<any[]>([]);
  const [facets, setFacets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await ensureExtendedHeroData();
      setAbilities(getHeroAbilities(hero.id));
      setTalents(getHeroTalents(hero.id));
      setFacets(getHeroFacets(hero.id));
      setLoading(false);
    };
    fetchData();

    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [hero.id, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getAttrIcon = (attr: string) => {
    if (attr === 'str') return <div className="font-bold font-mono text-red-500">STR</div>;
    if (attr === 'agi') return <div className="font-bold font-mono text-green-500">AGI</div>;
    if (attr === 'int') return <div className="font-bold font-mono text-blue-500">INT</div>;
    return <div className="font-bold font-mono text-yellow-500">UNI</div>;
  };

  const renderTalentTree = () => {
    const levels = [25, 20, 15, 10];
    return (
        <div className="relative mt-8 p-4 bg-gradient-to-b from-black/60 to-black/20 border border-theme-dim/30 rounded-sm overflow-hidden group">
             {/* Background Tree SVG - Opacity Overlay */}
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                 <img src="https://www.opendota.com/assets/images/dota2/talent_tree.svg" className="h-[120%] w-auto" alt="" />
             </div>
             
             <h3 className="text-lg font-bold text-theme uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10 border-b border-theme-dim/50 pb-2">
                <img src="https://www.opendota.com/assets/images/dota2/talent_tree.svg" className="w-5 h-5 invert opacity-80" alt="Talent Tree" /> 
                Talent Tree
             </h3>

             <div className="relative z-10 space-y-4">
                 {levels.map(lvl => {
                     // Find talents for this level
                     const tierTalents = talents.filter((t: any) => t.level === lvl);
                     const left = tierTalents[0];
                     const right = tierTalents[1]; // Usually standard is 2 choices

                     return (
                         <div key={lvl} className="flex items-center gap-2 md:gap-6 text-[10px] md:text-xs">
                             <div className="flex-1 text-right text-theme-dim/90 py-2 px-3 bg-black/60 border border-transparent hover:border-theme-dim/50 hover:text-white transition-colors rounded-sm shadow-sm h-full flex items-center justify-end">
                                 {left?.dname || '—'}
                             </div>
                             
                             <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-theme-dim bg-black flex items-center justify-center font-bold text-theme shadow-[0_0_15px_rgba(74,222,128,0.15)] z-20">
                                 {lvl}
                             </div>
                             
                             <div className="flex-1 text-left text-theme-dim/90 py-2 px-3 bg-black/60 border border-transparent hover:border-theme-dim/50 hover:text-white transition-colors rounded-sm shadow-sm h-full flex items-center justify-start">
                                 {right?.dname || '—'}
                             </div>
                         </div>
                     );
                 })}
             </div>
             
             {talents.length === 0 && (
                 <div className="text-center py-4 text-theme-dim italic text-xs">Talent data unavailable for this operative.</div>
             )}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="terminal-box w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-theme-dim hover:text-white bg-black/50 p-2 border border-transparent hover:border-theme transition-all rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header */}
        <div className="relative">
            {/* Background Banner Effect */}
            <div className="h-48 overflow-hidden relative">
                 <img 
                    src={getHeroImageUrl(hero.id)} 
                    alt={hero.localized_name} 
                    className="w-full h-full object-cover object-top opacity-60 blur-sm scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
            </div>

            {/* Content Over Banner */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-end md:items-center gap-6">
                 {/* Portrait */}
                 <div className="relative shrink-0">
                     <img 
                        src={getHeroImageUrl(hero.id)} 
                        alt="" 
                        className="w-32 h-auto border-2 border-theme shadow-[0_0_20px_rgba(74,222,128,0.3)] bg-black"
                     />
                 </div>
                 
                 {/* Text Info */}
                 <div className="flex-1 mb-2">
                     <div className="flex items-center gap-3 mb-1">
                         {getAttrIcon(hero.primary_attr)}
                         <span className="text-theme-dim text-xs uppercase tracking-widest">{hero.attack_type}</span>
                     </div>
                     <h1 className="text-4xl md:text-5xl font-bold text-theme uppercase tracking-tight glow-text leading-none">{hero.localized_name}</h1>
                     <div className="flex flex-wrap gap-2 mt-3">
                        {hero.roles.map(role => (
                            <span key={role} className="text-[10px] uppercase font-bold px-2 py-0.5 border border-theme-dim text-theme-dim/80 bg-black/50">
                                {role}
                            </span>
                        ))}
                     </div>
                 </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-theme-dim/20 border-y border-theme-dim/30">
            <div className="bg-black/80 p-3 flex items-center gap-3 justify-center">
                 <Sword className="w-4 h-4 text-theme-dim" />
                 <span className="font-mono text-sm font-bold text-theme">
                    {hero.base_attack_min} - {hero.base_attack_max}
                 </span>
            </div>
            <div className="bg-black/80 p-3 flex items-center gap-3 justify-center">
                 <Shield className="w-4 h-4 text-theme-dim" />
                 <span className="font-mono text-sm font-bold text-theme">
                    {hero.base_armor?.toFixed(1)}
                 </span>
            </div>
            <div className="bg-black/80 p-3 flex items-center gap-3 justify-center">
                 <Footprints className="w-4 h-4 text-theme-dim" />
                 <span className="font-mono text-sm font-bold text-theme">
                    {hero.move_speed}
                 </span>
            </div>
            <div className="bg-black/80 p-3 flex items-center gap-3 justify-center">
                 <Zap className="w-4 h-4 text-theme-dim" />
                 <span className="font-mono text-sm font-bold text-theme">
                    {hero.attack_range}
                 </span>
            </div>
        </div>

        {/* Attributes Detail */}
        <div className="bg-black/60 p-4 border-b border-theme-dim/30 flex justify-center gap-8 md:gap-16 text-sm font-mono">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-red-400 font-bold">{hero.base_str}</span>
                <span className="text-theme-dim text-xs">+{hero.str_gain?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-400 font-bold">{hero.base_agi}</span>
                <span className="text-theme-dim text-xs">+{hero.agi_gain?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-blue-400 font-bold">{hero.base_int}</span>
                <span className="text-theme-dim text-xs">+{hero.int_gain?.toFixed(1)}</span>
            </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-theme h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <span className="text-xs uppercase animate-pulse">Decrypting_Ability_Data...</span>
                </div>
            ) : (
                <>
                    {/* Abilities Section */}
                    <div>
                        <h3 className="text-lg font-bold text-theme uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-theme-dim">
                            <Zap className="w-5 h-5" /> Abilities
                        </h3>
                        <div className="space-y-4">
                            {abilities.map((ability: any, idx: number) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 border border-transparent hover:border-theme-dim transition-colors group">
                                    <div className="shrink-0">
                                        <img 
                                            src={getAbilityImageUrl(ability.name)} 
                                            alt={ability.dname} 
                                            className="w-16 h-16 md:w-20 md:h-20 bg-black border border-theme-dim shadow-lg object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=?' }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-theme uppercase text-sm md:text-base group-hover:text-white transition-colors">
                                                {ability.dname}
                                            </h4>
                                            {ability.behavior && (
                                                <span className="text-[9px] text-theme-dim uppercase border border-theme-dim px-1.5 py-0.5 rounded-sm">
                                                    {Array.isArray(ability.behavior) ? ability.behavior[0] : ability.behavior}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs md:text-sm text-theme-dim/90 leading-relaxed font-sans">
                                            {ability.desc}
                                        </p>
                                        
                                        {/* Ability Meta (CD/Mana) */}
                                        <div className="flex gap-4 mt-3 text-[10px] md:text-xs font-mono text-theme-dim opacity-70">
                                            {ability.mc && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>
                                                    <span>{Array.isArray(ability.mc) ? ability.mc[0] : ability.mc} MANA</span>
                                                </div>
                                            )}
                                            {ability.cd && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    <span>{Array.isArray(ability.cd) ? ability.cd[0] : ability.cd}s CD</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {abilities.length === 0 && (
                                <div className="text-center py-6 text-theme-dim border border-dashed border-theme-dim/30 uppercase text-xs">
                                    No Ability Data Available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Talent Tree Section */}
                    {renderTalentTree()}

                    {/* Facets Section */}
                    {facets.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-theme uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-theme-dim mt-8">
                                <Brain className="w-5 h-5" /> Facets
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {facets.map((facet: any, idx: number) => (
                                    <div key={idx} className="bg-gradient-to-br from-black to-white/5 border border-theme-dim p-4 flex gap-4">
                                        <div className="shrink-0 pt-1">
                                            {facet.icon && (
                                                <img 
                                                    src={getFacetIconUrl(facet.icon)} 
                                                    alt="" 
                                                    className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-theme uppercase text-sm mb-2 tracking-wide">{facet.title || facet.name}</h4>
                                            <p className="text-xs text-theme-dim/80 font-sans leading-relaxed" dangerouslySetInnerHTML={{__html: facet.description}}></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default HeroDetailModal;