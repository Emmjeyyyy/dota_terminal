import { API_BASE_URL } from '../constants';
import { Hero } from '../types';

let heroNameMap: Record<number, string> = {}; // id -> internal_name (npc_dota_hero_...)
let heroLocalizedNameMap: Record<number, string> = {}; // id -> Localized Name

// Caches for extended data
let heroExtendedMap: Record<string, any> = {}; 
let abilitiesMap: Record<string, any> = {};

export const ensureHeroData = async (): Promise<void> => {
  if (Object.keys(heroNameMap).length > 0) return;
  try {
    const res = await fetch(`${API_BASE_URL}/heroes`);
    if (!res.ok) throw new Error("Failed to fetch heroes");
    const data: Hero[] = await res.json();
    data.forEach(h => {
      heroNameMap[h.id] = h.name;
      heroLocalizedNameMap[h.id] = h.localized_name;
    });
  } catch (e) {
    console.error("Failed to load heroes", e);
  }
};

export const ensureExtendedHeroData = async (): Promise<void> => {
  if (Object.keys(heroExtendedMap).length > 0 && Object.keys(abilitiesMap).length > 0) return;
  
  try {
    const [heroesRes, abilitiesRes] = await Promise.all([
      fetch('https://api.opendota.com/api/constants/heroes'),
      fetch('https://api.opendota.com/api/constants/abilities')
    ]);

    if (heroesRes.ok) heroExtendedMap = await heroesRes.json();
    if (abilitiesRes.ok) abilitiesMap = await abilitiesRes.json();
  } catch (e) {
    console.error("Failed to load extended hero data", e);
  }
};

export const getHeroName = (id: number): string => {
  return heroLocalizedNameMap[id] || `hero_${id}`;
};

export const getHeroImageUrl = (id: number): string => {
  const internalName = heroNameMap[id];
  if (!internalName) return 'https://via.placeholder.com/64x36?text=?';
  
  // Transformation rules:
  // 1. Remove 'npc_dota_hero_' prefix
  // 2. Convert to lowercase
  // 3. Keep underscores
  const urlName = internalName.replace('npc_dota_hero_', '').toLowerCase();
  
  return `https://cdn.steamstatic.com/apps/dota2/images/dota_react/heroes/${urlName}.png`;
};

export const getHeroAbilities = (heroId: number): any[] => {
  const hero = heroExtendedMap[heroId.toString()];
  if (!hero || !hero.abilities) return [];
  
  // Map ability names to their details
  return hero.abilities
      .map((abilityName: string) => {
          const data = abilitiesMap[abilityName];
          // Important: Inject the name key so mapped components can use it for Image URLs
          return data ? { ...data, name: abilityName } : null;
      })
      .filter((a: any) => a && a.dname && a.desc); 
};

export const getHeroTalents = (heroId: number): any[] => {
  const hero = heroExtendedMap[heroId.toString()];
  if (!hero || !hero.talents) return [];

  return hero.talents.map((t: any) => {
    // Look up proper name in abilities map (talents are technically abilities)
    const abilityData = abilitiesMap[t.name];
    return {
        ...t,
        dname: abilityData ? abilityData.dname : t.name
    };
  });
};

export const getHeroFacets = (heroId: number): any[] => {
  const hero = heroExtendedMap[heroId.toString()];
  return hero?.facets || [];
};

export const getAbilityImageUrl = (abilityName: string): string => {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/${abilityName}.png`;
};

export const getFacetIconUrl = (iconName: string): string => {
   return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/facets/${iconName}.png`;
};