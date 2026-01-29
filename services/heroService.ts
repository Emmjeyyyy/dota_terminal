import { API_BASE_URL } from '../constants';
import { Hero } from '../types';

let heroNameMap: Record<number, string> = {}; // id -> internal_name (npc_dota_hero_...)
let heroLocalizedNameMap: Record<number, string> = {}; // id -> Localized Name

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
