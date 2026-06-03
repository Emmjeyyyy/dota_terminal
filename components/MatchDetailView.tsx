import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MatchDetail, MatchPlayerDetail } from '../types';
import { getMatchDetails, requestMatchParse } from '../services/api';
import { getHeroImageUrl, getHeroIconUrl } from '../services/heroService';
import { Loader2, RefreshCw, ArrowLeft, Trophy, Swords } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ItemTooltip from './ItemTooltip';
import ItemWithTooltip from './ItemWithTooltip';

// Map Assets
import radiantTowerImg from '../assets/map-assets/goodguys_tower.png';
import direTowerImg from '../assets/map-assets/badguys_tower.png';
import radiantRaxImg from '../assets/map-assets/goodguys_rax.png';
import direRaxImg from '../assets/map-assets/badguys_rax.png';
import radiantFortImg from '../assets/map-assets/goodguys_fort.png';
import direFortImg from '../assets/map-assets/badguys_fort.png';
import radiantTowerAngleImg from '../assets/map-assets/goodguys_tower_angle.png';
import direTowerAngleImg from '../assets/map-assets/badguys_tower_angle.png';
import radiantRaxAngleImg from '../assets/map-assets/goodguys_rax_angle.png';
import direRaxAngleImg from '../assets/map-assets/badguys_rax_angle.png';
import minimapBackgroundImg from '../assets/minimap/7.38_minimap.webp';

interface MatchDetailViewProps {
    matchId: number;
    onPlayerClick: (accountId: number) => void;
    onBack: () => void;
}

// Extended interface for properties returned by API but not in shared types
interface ExtendedPlayer extends MatchPlayerDetail {
    level?: number;
    last_hits?: number;
    denies?: number;
    net_worth?: number;
    rank_tier?: number;
    total_gold?: number;
    hero_variant?: number;
    aghanims_scepter?: number;
    aghanims_shard?: number;
    item_neutral?: number;
    total_xp?: number;
    hero_healing?: number;
    first_purchase_time?: Record<string, number>;
}

const XP_TABLE = [
    0, 240, 640, 1160, 1760,
    2440, 3200, 4000, 4900, 5900,
    7000, 8200, 9500, 10900, 12400,
    14000, 15700, 17500, 19400, 21400,
    23600, 26000, 28600, 31400, 34400,
    38400, 43400, 49400, 56400, 63900
];

const AbilityIconWithTooltip: React.FC<{ ability: any, iconUrl: string, isTalent: boolean }> = ({ ability, iconUrl, isTalent }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2, // Centered horizontally
                y: rect.top - 8, // Just above the element
            });
        }
    };

    useEffect(() => {
        if (isHovered) {
            updatePosition(); // Initial position
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isHovered]);

    return (
        <>
            <div
                ref={ref}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full h-full flex items-center justify-center shadow-[0_0_2px_black] cursor-help ${isTalent ? 'bg-[#11141a]' : ''}`}
            >
                <img src={iconUrl} className={`w-full h-full ${isTalent ? 'object-contain p-1 opacity-80' : 'object-cover'}`} alt={ability.dname} />
            </div>

            {isHovered && ability && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none p-2 bg-[#2d313b] border border-black shadow-2xl flex items-center gap-3 w-max rounded-sm"
                    style={{
                        left: `${coords.x}px`,
                        top: `${coords.y}px`,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="w-8 h-8 shrink-0 bg-[#11141a] border border-[#1e2329] flex items-center justify-center p-0.5">
                        <img src={iconUrl} className={`w-full h-full ${isTalent ? 'object-contain p-1 opacity-80' : 'object-cover'}`} alt="" />
                    </div>
                    <div className="font-bold text-[13px] uppercase tracking-wide text-white glow-text pr-2">
                        {ability.dname}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const MINIMAP_SCALE = 1.19;

const TOWER_MAP = [
    { bit: 1, rx: 13, ry: 37, dx: 20, dy: 15, isMid: false }, // Top T1
    { bit: 2, rx: 13, ry: 53, dx: 47, dy: 13, isMid: false }, // Top T2
    { bit: 4, rx: 13, ry: 67, dx: 70, dy: 15, isMid: false }, // Top T3
    { bit: 8, rx: 44, ry: 54, dx: 53, dy: 46, isMid: true }, // Mid T1
    { bit: 16, rx: 33, ry: 64, dx: 66, dy: 35, isMid: true }, // Mid T2
    { bit: 32, rx: 25, ry: 71, dx: 74, dy: 28, isMid: true }, // Mid T3
    { bit: 64, rx: 79, ry: 83, dx: 86, dy: 58, isMid: false }, // Bot T1
    { bit: 128, rx: 50, ry: 83.5, dx: 86, dy: 43, isMid: false }, // Bot T2
    { bit: 256, rx: 29, ry: 83, dx: 87, dy: 32, isMid: false }, // Bot T3
    { bit: 512, rx: 14, ry: 78, dx: 83, dy: 21, isMid: true }, // T4 1
    { bit: 1024, rx: 17, ry: 81, dx: 79.5, dy: 17.5, isMid: true }, // T4 2
];

const BARRACKS_MAP = [
    { bit: 1, rx: 11, ry: 70, dx: 73, dy: 13, isMid: false }, // Top Melee
    { bit: 2, rx: 14.6, ry: 70, dx: 73, dy: 17, isMid: false }, // Top Ranged
    { bit: 4, rx: 20, ry: 72, dx: 74, dy: 24, isMid: true }, // Mid Melee
    { bit: 8, rx: 23.2, ry: 75, dx: 77.5, dy: 27.5, isMid: true }, // Mid Ranged
    { bit: 16, rx: 25.5, ry: 80.5, dx: 84.5, dy: 28.5, isMid: false }, // Bot Melee
    { bit: 32, rx: 25.5, ry: 85, dx: 89, dy: 28.5, isMid: false }, // Bot Ranged
];

const ANCIENT_MAP = [
    { rx: 12, ry: 82, dx: 84, dy: 16 }
];

const HERO_POSITION_MAP = {
    Radiant: {
        1: { startX: 81, startY: 83, stepX: -9, stepY: 0 }, // Safe Lane (Bot)
        2: { startX: 43, startY: 55, stepX: -6, stepY: 6 }, // Mid Lane
        3: { startX: 13, startY: 33, stepX: 0, stepY: 10 }, // Off Lane (Top)
    },
    Dire: {
        1: { startX: 27, startY: 14, stepX: -9, stepY: 0 }, // Safe Lane (Top)
        2: { startX: 53, startY: 44, stepX: 6, stepY: -6 }, // Mid Lane
        3: { startX: 86, startY: 60, stepX: 0, stepY: -10 }, // Off Lane (Bot)
    }
};

const TowerIcon = ({ isRadiant, isDestroyed, isMid }: { isRadiant: boolean, isDestroyed: boolean, isMid?: boolean }) => {
    let src = isRadiant ? radiantTowerImg : direTowerImg;
    if (isMid) src = isRadiant ? radiantTowerAngleImg : direTowerAngleImg;
    return (
        <img
            src={src}
            alt="Tower"
            className={`w-3 h-3 sm:w-4 sm:h-4 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)] ${isDestroyed ? 'grayscale brightness-50' : ''}`}
        />
    );
};

const BarracksIcon = ({ isRadiant, isDestroyed, isMid }: { isRadiant: boolean, isDestroyed: boolean, isMid?: boolean }) => {
    let src = isRadiant ? radiantRaxImg : direRaxImg;
    if (isMid) src = isRadiant ? radiantRaxAngleImg : direRaxAngleImg;
    return (
        <img
            src={src}
            alt="Barracks"
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)] ${isDestroyed ? 'grayscale brightness-50' : ''}`}
        />
    );
};

const AncientIcon = ({ isRadiant, isDestroyed }: { isRadiant: boolean, isDestroyed: boolean }) => {
    return (
        <img
            src={isRadiant ? radiantFortImg : direFortImg}
            alt="Ancient"
            className={`w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.8)] ${isDestroyed ? 'grayscale brightness-50' : ''}`}
        />
    );
};

const BuildingsMap: React.FC<{ match: MatchDetail }> = ({ match }) => {
    const [showHeroes, setShowHeroes] = useState(true);
    const rs = match.tower_status_radiant ?? 0;
    const ds = match.tower_status_dire ?? 0;
    const rbs = match.barracks_status_radiant ?? 0;
    const dbs = match.barracks_status_dire ?? 0;

    // Group players by team and core lane to ensure carry/support stay together
    const laneGroups: Record<string, MatchPlayerDetail[]> = {};
    const getMappedRole = (p: MatchPlayerDetail) => {
        if (p.lane_role && p.lane_role >= 1 && p.lane_role <= 3) return p.lane_role;
        // Force Jungle (4) into Offlane (3), and any unknowns into Mid (2)
        return p.lane_role === 4 ? 3 : 2;
    };

    match.players.forEach(p => {
        const key = `${p.player_slot < 128 ? 'R' : 'D'}-${getMappedRole(p)}`;
        if (!laneGroups[key]) laneGroups[key] = [];
        laneGroups[key].push(p);
    });

    const getHeroPosition = (player: MatchPlayerDetail) => {
        const isRadiant = player.player_slot < 128;
        const roleKey = getMappedRole(player);
        const key = `${isRadiant ? 'R' : 'D'}-${roleKey}`;
        const indexInLane = laneGroups[key].indexOf(player);

        const teamConfig = isRadiant ? HERO_POSITION_MAP.Radiant : HERO_POSITION_MAP.Dire;
        const config = teamConfig[roleKey as keyof typeof teamConfig] || teamConfig[2 as keyof typeof teamConfig];

        const x = config.startX + (indexInLane * config.stepX);
        const y = config.startY + (indexInLane * config.stepY);

        return { left: `${x}%`, top: `${y}%` };
    };

    return (
        <div className="terminal-box h-full flex flex-col min-h-[350px]">
            <div className="px-4 py-2 border-b border-theme-dim/50 bg-white/5 flex justify-between items-center">
                <h3 className="font-bold uppercase tracking-widest text-sm text-theme">Buildings Map</h3>
                <button
                    onClick={() => setShowHeroes(!showHeroes)}
                    className="text-xs uppercase tracking-wider px-2 py-1 bg-black/40 hover:bg-black/60 border border-theme-dim/30 rounded transition-colors text-theme-dim hover:text-theme"
                >
                    {showHeroes ? 'Hide Heroes' : 'Show Heroes'}
                </button>
            </div>
            <div className="flex-1 p-2 sm:p-4 flex items-center justify-center">
                <div className="relative w-full max-w-full aspect-square bg-[#0c141d] border border-theme-dim/30 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <img src={minimapBackgroundImg} alt="Minimap" className="w-full h-full object-cover opacity-80" style={{ transform: `scale(${MINIMAP_SCALE})` }} />

                    {TOWER_MAP.map(t => (
                        <React.Fragment key={`t-${t.bit}`}>
                            <div className="absolute" style={{ left: `${t.rx}%`, top: `${t.ry}%`, transform: 'translate(-50%, -50%)' }} title="Radiant Tower">
                                <TowerIcon isRadiant={true} isDestroyed={(rs & t.bit) === 0} isMid={t.isMid} />
                            </div>
                            <div className="absolute" style={{ left: `${t.dx}%`, top: `${t.dy}%`, transform: 'translate(-50%, -50%)' }} title="Dire Tower">
                                <TowerIcon isRadiant={false} isDestroyed={(ds & t.bit) === 0} isMid={t.isMid} />
                            </div>
                        </React.Fragment>
                    ))}

                    {BARRACKS_MAP.map(b => (
                        <React.Fragment key={`b-${b.bit}`}>
                            <div className="absolute" style={{ left: `${b.rx}%`, top: `${b.ry}%`, transform: 'translate(-50%, -50%)' }} title="Radiant Barracks">
                                <BarracksIcon isRadiant={true} isDestroyed={(rbs & b.bit) === 0} isMid={b.isMid} />
                            </div>
                            <div className="absolute" style={{ left: `${b.dx}%`, top: `${b.dy}%`, transform: 'translate(-50%, -50%)' }} title="Dire Barracks">
                                <BarracksIcon isRadiant={false} isDestroyed={(dbs & b.bit) === 0} isMid={b.isMid} />
                            </div>
                        </React.Fragment>
                    ))}

                    {/* Base Ancients */}
                    {ANCIENT_MAP.map((a, i) => (
                        <React.Fragment key={`ancient-${i}`}>
                            <div className="absolute" style={{ left: `${a.rx}%`, top: `${a.ry}%`, transform: 'translate(-50%, -50%)' }} title="Radiant Ancient">
                                <AncientIcon isRadiant={true} isDestroyed={!match.radiant_win} />
                            </div>
                            <div className="absolute" style={{ left: `${a.dx}%`, top: `${a.dy}%`, transform: 'translate(-50%, -50%)' }} title="Dire Ancient">
                                <AncientIcon isRadiant={false} isDestroyed={match.radiant_win} />
                            </div>
                        </React.Fragment>
                    ))}

                    {/* Hero Icons */}
                    {showHeroes && match.players.map(p => {
                        const isRadiant = p.player_slot < 128;
                        return (
                            <div
                                key={`map-hero-${p.player_slot}`}
                                className={`absolute w-6 h-6 sm:w-8 sm:h-8 z-30 transition-transform hover:scale-125 ${isRadiant ? 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]'}`}
                                style={{ ...getHeroPosition(p), transform: 'translate(-50%, -50%)' }}
                                title={p.personaname || `Hero ${p.hero_id}`}
                            >
                                <img src={getHeroIconUrl(p.hero_id)} alt="" className="w-full h-full object-cover" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const AdvantageGraph: React.FC<{ match: MatchDetail }> = ({ match }) => {
    if (!match.radiant_gold_adv || !match.radiant_xp_adv) {
        return (
            <div className="terminal-box h-full flex flex-col">
                <div className="px-4 py-2 border-b border-theme-dim/50 bg-white/5">
                    <h3 className="font-bold uppercase tracking-widest text-sm text-theme">Radiant Advantage</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-theme-dim uppercase border border-dashed border-theme-dim/30 p-8 w-full">
                        Advantage data not available (Parse Required)
                    </div>
                </div>
            </div>
        );
    }

    const data = match.radiant_gold_adv.map((gold, index) => ({
        time: index,
        timeStr: `${index}:00`,
        gold,
        xp: match.radiant_xp_adv?.[index] || 0,
    }));

    const maxVal = Math.max(...data.map(d => Math.abs(d.gold)), ...data.map(d => Math.abs(d.xp)), 5000);

    return (
        <div className="terminal-box h-full flex flex-col min-h-[350px]">
            <div className="px-4 py-2 border-b border-theme-dim/50 bg-white/5 flex justify-between items-center">
                <h3 className="font-bold uppercase tracking-widest text-sm text-theme">Radiant Advantage</h3>
                <div className="flex gap-4 text-[10px] sm:text-xs uppercase font-bold tracking-widest">
                    <span className="text-[#fbbf24] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Gold</span>
                    <span className="text-[#60a5fa] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#60a5fa]" /> Experience</span>
                </div>
            </div>
            <div className="flex-1 p-2 sm:p-4 pb-8 h-[300px] sm:h-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                        <XAxis dataKey="timeStr" stroke="#666" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} tickMargin={10} minTickGap={30} />
                        <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} domain={[-maxVal, maxVal]} tickFormatter={(val) => val === 0 ? '0' : (val > 0 ? `+${val / 1000}k` : `${val / 1000}k`)} width={40} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'var(--theme-color)', fontFamily: 'monospace', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number, name: string) => [value > 0 ? `Radiant +${value}` : `Dire +${Math.abs(value)}`, name === 'gold' ? 'Gold Adv' : 'XP Adv']}
                            labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line type="monotone" dataKey="gold" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="xp" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MatchDetailView: React.FC<MatchDetailViewProps> = ({ matchId, onPlayerClick, onBack }) => {
    const [match, setMatch] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [itemMap, setItemMap] = useState<Record<number, string>>({});
    const [itemIdToKey, setItemIdToKey] = useState<Record<number, string>>({});
    const [itemDataMap, setItemDataMap] = useState<Record<number, any>>({});
    const [heroConstants, setHeroConstants] = useState<Record<string, any>>({});
    const [abilityIdMap, setAbilityIdMap] = useState<Record<number, string>>({});
    const [abilityDataMap, setAbilityDataMap] = useState<Record<string, any>>({});

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            const matchData = await getMatchDetails(matchId);
            if (isMounted) {
                setMatch(matchData);
                setLoading(false);
            }
        };

        // Parallel fetches for constants
        Promise.all([
            fetch('https://api.opendota.com/api/constants/items').then(res => res.json()),
            fetch('https://api.opendota.com/api/constants/heroes').then(res => res.json()),
            fetch('https://api.opendota.com/api/constants/ability_ids').then(res => res.json()),
            fetch('https://api.opendota.com/api/constants/abilities').then(res => res.json())
        ]).then(([itemsData, heroesData, abilityIdsData, abilitiesData]) => {
            if (!isMounted) return;

            // Process Items
            const map: Record<number, string> = {};
            const keyMap: Record<number, string> = {};
            const dataMap: Record<number, any> = {};
            Object.entries(itemsData).forEach(([key, item]: [string, any]) => {
                if (item.id) {
                    map[item.id] = item.img;
                    keyMap[item.id] = key;
                    dataMap[item.id] = item;
                }
            });
            setItemMap(map);
            setItemIdToKey(keyMap);
            setItemDataMap(dataMap);

            // Process Heroes (Store fully for facets)
            setHeroConstants(heroesData);

            // Process Abilities
            setAbilityIdMap(abilityIdsData);
            setAbilityDataMap(abilitiesData);
        }).catch(err => console.error("Failed to fetch constants", err));

        fetchData();
        return () => { isMounted = false; };
    }, [matchId]);

    // Compute party indicators
    const partyMapping = useMemo(() => {
        if (!match) return new Map<number, string>();

        // First, count occurrences of each party_id
        const partyCounts = new Map<number, number>();
        match.players.forEach(p => {
            // OpenDota party_id can be 0 (it's a 0-indexed integer for parties), so don't check truthiness or > 0
            if (p.party_id !== undefined && p.party_id !== null) {
                partyCounts.set(p.party_id, (partyCounts.get(p.party_id) || 0) + 1);
            }
        });

        const mapping = new Map<number, string>();
        let currentRoman = 0;
        const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

        // Assign roman numerals to parties with > 1 player
        partyCounts.forEach((count, partyId) => {
            if (count > 1) {
                mapping.set(partyId, romans[currentRoman % romans.length]);
                currentRoman++;
            }
        });

        return mapping;
    }, [match]);

    const handleParse = () => {
        requestMatchParse(matchId);
        alert("PARSE_REQUEST_SENT >> AWAITING_PROCESSING");
    };

    const getItemUrl = (itemId: number) => {
        if (!itemId || !itemMap[itemId]) return null;
        return `https://cdn.steamstatic.com${itemMap[itemId]}`;
    };

    const getFacetIconUrl = (heroId: number, variant?: number) => {
        if (!variant || !heroConstants) return null;
        const hero = heroConstants[heroId.toString()];
        if (!hero || !hero.facets) return null;
        // Facet index is roughly variant - 1
        const facet = hero.facets[variant - 1];
        if (facet && facet.icon) {
            return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/facets/${facet.icon}.png`;
        }
        return null;
    };

    const getRankName = (rank_tier?: number) => {
        if (!rank_tier) return 'Uncalibrated';
        const rank = Math.floor(rank_tier / 10);
        const stars = rank_tier % 10;
        const rankNames = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
        const name = rankNames[rank - 1] || 'Unknown';
        return `${name} [${stars}]`;
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] text-theme">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs uppercase animate-pulse">Fetching_Match_Data...</span>
            </div>
        );
    }

    if (!match) {
        return (
            <div className="text-center py-12 border border-dashed border-theme-dim">
                <div className="text-theme mb-4 uppercase">Error: Data_Corruption_Or_Not_Found</div>
                <button onClick={onBack} className="text-theme-dim hover:text-theme underline uppercase text-xs">Return_Previous</button>
            </div>
        );
    }

    const radiantPlayers = match.players.filter(p => p.player_slot < 128) as ExtendedPlayer[];
    const direPlayers = match.players.filter(p => p.player_slot >= 128) as ExtendedPlayer[];

    const HeroCard: React.FC<{ player: MatchPlayerDetail; isRadiant: boolean }> = ({ player, isRadiant }) => {
        const netWorth = ((player.gold_per_min * (match.duration / 60)) / 1000).toFixed(1);
        const heroImage = getHeroImageUrl(player.hero_id);

        return (
            <div className="relative group overflow-hidden bg-black border border-theme-dim hover:border-theme transition-all duration-300 h-[28rem] w-full flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {/* Background Hero Image - Full Cover */}
                <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                    <img
                        src={heroImage}
                        alt="Hero"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700 ease-out filter brightness-75 contrast-125"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x120?text=?' }}
                    />
                    {/* Gradient Overlays for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
                </div>

                {/* Top: Player Name */}
                <div className="relative z-10 p-2 text-center border-b border-white/5">
                    <div className="truncate text-[10px] sm:text-xs font-bold text-white group-hover:text-theme transition-colors shadow-black text-shadow-md">
                        {player.personaname || 'Unknown'}
                    </div>
                </div>

                {/* Spacer to push content to bottom */}
                <div className="flex-1"></div>

                {/* Stats Overlay on Hover/Default */}
                <div className="relative z-10 p-2 space-y-3 bg-gradient-to-t from-black/95 to-transparent pt-8">

                    {/* Net Worth */}
                    <div className="flex flex-col items-center">
                        <div className="text-[#fbbf24] font-bold text-lg leading-none drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]">
                            {netWorth}k
                        </div>
                        <div className="text-[8px] text-[#fbbf24]/80 uppercase tracking-wider">Net Worth</div>
                    </div>

                    {/* KDA */}
                    <div className="border-t border-white/10 pt-2">
                        <div className="flex justify-center items-center gap-1 font-mono text-xs sm:text-sm">
                            <span className="text-green-400 font-bold">{player.kills}</span>
                            <span className="text-theme-dim text-[10px]">/</span>
                            <span className="text-red-500 font-bold">{player.deaths}</span>
                            <span className="text-theme-dim text-[10px]">/</span>
                            <span className="text-white font-bold opacity-80">{player.assists}</span>
                        </div>
                        <div className="text-[8px] text-theme-dim text-center uppercase tracking-wider opacity-60 mt-0.5">K / D / A</div>
                    </div>

                    {/* GPM/XPM - Visible on Group Hover or just small */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] text-theme-dim font-mono text-center border-t border-white/10 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div>
                            <span className="text-white">{player.gold_per_min}</span> GPM
                        </div>
                        <div>
                            <span className="text-white">{player.xp_per_min}</span> XPM
                        </div>
                    </div>
                </div>

                {/* Team Indicator Strip */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${isRadiant ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
            </div>
        );
    };

    const renderAbilityIcon = (abilityId: number) => {
        if (!abilityId) return null;
        const abilityName = abilityIdMap[abilityId];
        if (!abilityName) return null;
        const ability = abilityDataMap[abilityName];
        if (!ability) return null;

        const isTalent = abilityName.includes('special_bonus');
        const iconUrl = isTalent
            ? "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/talents.svg"
            : `https://cdn.cloudflare.steamstatic.com${ability.img}`;

        return (
            <div className="w-full h-full relative">
                <AbilityIconWithTooltip ability={ability} iconUrl={iconUrl} isTalent={isTalent} />
            </div>
        );
    };

    const LEVEL_MAPPING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 25];

    const renderAbilityBuild = (teamPlayers: ExtendedPlayer[], isRadiant: boolean) => (
        <div className="terminal-box overflow-hidden mb-8">
            {/* Header */}
            <div className={`px-4 py-2 border-b border-theme-dim/50 flex items-center justify-between ${isRadiant ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <h3 className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isRadiant ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isRadiant ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isRadiant ? 'Radiant - Ability Build' : 'Dire - Ability Build'}
                </h3>
            </div>

            {/* Table Header */}
            <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1050px]">
                    <div className="flex items-center text-[10px] uppercase text-theme-dim bg-black/40 border-b border-theme-dim/30 py-2 px-4 font-bold tracking-wider">
                        <div className="w-48 shrink-0">Player</div>
                        {[...Array(25)].map((_, i) => (
                            <div key={i} className="flex-1 text-center font-mono font-bold text-white/80">{i + 1}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-theme-dim/20">
                        {teamPlayers.map((p) => {
                            const upgrades = p.ability_upgrades_arr || [];
                            const build = new Array(25).fill(null);

                            upgrades.forEach((abilityId, index) => {
                                const level = LEVEL_MAPPING[index];
                                if (level && level <= 25) {
                                    build[level - 1] = abilityId;
                                } else if (!level && index < 25) {
                                    // Fallback if array exceeds known mappings
                                    build[index] = abilityId;
                                }
                            });

                            return (
                                <div key={p.player_slot} className="flex items-center py-2 px-4 hover:bg-white/5 transition-colors group">
                                    {/* Player Identity */}
                                    <div className="w-48 shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => p.account_id && onPlayerClick(p.account_id)}>
                                        {/* Hero Portrait Block */}
                                        <div className="relative w-12 h-7 shrink-0 bg-black shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                                            <img
                                                src={getHeroImageUrl(p.hero_id)}
                                                alt=""
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        {/* Text Info */}
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <div className={`text-[11px] font-bold truncate leading-none mb-1 ${p.account_id ? 'text-theme group-hover:underline' : 'text-theme-dim italic'}`}>
                                                {p.personaname || 'Anonymous'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {p.rank_tier ? (
                                                    <span className="text-[9px] text-theme-dim font-mono leading-none flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-theme-dim/40"></span>
                                                        {getRankName(p.rank_tier)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-theme-dim/50 font-mono leading-none">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 25 Levels */}
                                    {build.map((abilityId, i) => (
                                        <div key={i} className="flex-1 flex justify-center items-center px-0.5">
                                            {abilityId ? (
                                                <div className="w-[30px] h-[30px] transition-transform hover:scale-110">
                                                    {renderAbilityIcon(abilityId)}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTeamOverview = (teamPlayers: ExtendedPlayer[], isRadiant: boolean) => (
        <div className="terminal-box overflow-hidden mb-8">
            {/* Header */}
            <div className={`px-4 py-2 border-b border-theme-dim/50 flex items-center justify-between ${isRadiant ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <h3 className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${isRadiant ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isRadiant ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isRadiant ? 'Radiant — Overview' : 'Dire — Overview'}
                </h3>
            </div>

            {/* Table Header */}
            <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[1200px]">
                    <div className="flex items-center text-[10px] uppercase text-theme-dim bg-black/40 border-b border-theme-dim/30 py-2 px-4 font-bold tracking-wider">
                        <div className="w-52 shrink-0">Player</div>
                        {/* <div className="w-12 text-center shrink-0">Facet</div> */}
                        <div className="w-12 text-center shrink-0">
                            <span className="group relative cursor-help">
                                LVL
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Level</div>
                            </span>
                        </div>
                        <div className="w-24 text-center shrink-0">
                            <span className="group relative cursor-help">
                                KDA
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Kills / Deaths / Assists</div>
                            </span>
                        </div>
                        <div className="w-20 text-center shrink-0">
                            <span className="group relative cursor-help">
                                LH/DN
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Last Hits / Denies</div>
                            </span>
                        </div>
                        <div className="w-20 text-right shrink-0">
                            <span className="group relative cursor-help">
                                NET
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Net Worth</div>
                            </span>
                        </div>
                        <div className="w-24 text-center shrink-0">
                            <span className="group relative cursor-help">
                                GPM/XPM
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Gold Per Minute / Experience Per Minute</div>
                            </span>
                        </div>
                        <div className="w-16 text-right shrink-0">
                            <span className="group relative cursor-help">
                                HD
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Amount of damage dealt to heroes</div>
                            </span>
                        </div>
                        <div className="w-16 text-right shrink-0">
                            <span className="group relative cursor-help">
                                TD
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Amount of damage dealt to towers</div>
                            </span>
                        </div>
                        <div className="w-16 text-right shrink-0">
                            <span className="group relative cursor-help">
                                HH
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Amount of health restored to heroes</div>
                            </span>
                        </div>
                        <div className="w-[300px] pl-6 shrink-0">
                            <span className="group relative cursor-help">
                                Items
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-[#444] text-white text-[11px] font-normal normal-case rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-lg border border-white/10">Main Inventory</div>
                            </span>
                        </div>
                        <div className="w-14 text-center shrink-0"></div> {/* Neutral */}
                        <div className="w-10 text-center shrink-0"></div> {/* Aghs */}
                        <div className="flex-1"></div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-theme-dim/20">
                        {teamPlayers.map((p) => {
                            const netWorth = p.net_worth || p.total_gold || (p.gold_per_min * match.duration / 60);
                            const itemIds = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5];
                            const partyRoman = p.party_id !== undefined && p.party_id !== null ? partyMapping.get(p.party_id) : null;

                            return (
                                <div key={p.player_slot} className="flex items-center py-2 px-4 hover:bg-white/5 transition-colors group">
                                    {/* Player Identity */}
                                    <div className="w-52 shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => p.account_id && onPlayerClick(p.account_id)}>
                                        {/* Party Indicator Slot */}
                                        <div className="w-4 shrink-0 flex justify-center">
                                            {partyRoman && (
                                                <span className="text-[10px] font-bold text-theme-dim/70 font-serif italic -rotate-6 select-none" title={`Party ID: ${p.party_id}`}>
                                                    {partyRoman}
                                                </span>
                                            )}
                                        </div>

                                        {/* Hero Portrait Block */}
                                        <div className="relative w-14 h-8 shrink-0 bg-black shadow-[0_0_4px_rgba(0,0,0,0.6)]">
                                            {/* Hero Image */}
                                            <img
                                                src={getHeroImageUrl(p.hero_id)}
                                                alt=""
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <div className={`text-xs font-bold truncate leading-none mb-1 ${p.account_id ? 'text-theme group-hover:underline' : 'text-theme-dim italic'}`}>
                                                {p.personaname || 'Anonymous'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {p.rank_tier ? (
                                                    <span className="text-[10px] text-theme-dim font-mono leading-none flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-theme-dim/40"></span>
                                                        {getRankName(p.rank_tier)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-theme-dim/50 font-mono leading-none">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Facet Column
                              <div className="w-12 text-center shrink-0 font-mono text-white text-xs text-theme-dim">
                                  {p.hero_variant || '-'}
                              </div> */}

                                    {/* Stats */}
                                    <div className="w-12 flex justify-center items-center shrink-0">
                                        {(() => {
                                            let progress = 0;
                                            if (p.level && p.level < 30 && (p as ExtendedPlayer).total_xp !== undefined) {
                                                const xp = (p as ExtendedPlayer).total_xp!;
                                                const currentLevelXp = XP_TABLE[p.level - 1] || 0;
                                                const nextLevelXp = XP_TABLE[p.level] || currentLevelXp + 1;
                                                const xpIntoLevel = xp - currentLevelXp;
                                                const xpRequired = nextLevelXp - currentLevelXp;
                                                progress = Math.max(0, Math.min(1, xpIntoLevel / xpRequired));
                                            } else if (p.level === 30) {
                                                progress = 1;
                                            }
                                            const r = 13;
                                            const circ = 2 * Math.PI * r;
                                            return (
                                                <div className="relative w-8 h-8 flex items-center justify-center">
                                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                        <circle cx="16" cy="16" r={r} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                                        <circle
                                                            cx="16" cy="16" r={r}
                                                            fill="transparent"
                                                            stroke="#fbbf24"
                                                            strokeWidth="2"
                                                            strokeDasharray={circ}
                                                            strokeDashoffset={circ * (1 - progress)}
                                                            className="transition-all duration-1000 ease-out"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <span className="font-mono text-white text-[11px] font-bold z-10">{p.level || '-'}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="w-24 text-center shrink-0 font-mono text-xs">
                                        <span className="text-green-400 font-bold">{p.kills}</span>
                                        <span className="text-theme-dim mx-1">/</span>
                                        <span className="text-red-400 font-bold">{p.deaths}</span>
                                        <span className="text-theme-dim mx-1">/</span>
                                        <span className="text-white/70">{p.assists}</span>
                                    </div>

                                    <div className="w-20 text-center shrink-0 font-mono text-xs text-theme-dim">
                                        <span className="text-white">{p.last_hits || 0}</span>
                                        <span className="mx-1">/</span>
                                        <span>{p.denies || 0}</span>
                                    </div>

                                    <div className="w-20 text-right shrink-0 font-mono text-xs text-[#fbbf24]">
                                        {netWorth ? (netWorth / 1000).toFixed(1) : '0.0'}k
                                    </div>

                                    <div className="w-24 text-center shrink-0 font-mono text-xs text-theme-dim">
                                        <span className="text-white">{p.gold_per_min}</span>
                                        <span className="mx-1 text-theme-dim">/</span>
                                        <span className="text-white">{p.xp_per_min}</span>
                                    </div>

                                    <div className="w-16 text-right shrink-0 font-mono text-xs text-white/80">
                                        {p.hero_damage ? (p.hero_damage / 1000).toFixed(1) + 'k' : '-'}
                                    </div>

                                    <div className="w-16 text-right shrink-0 font-mono text-xs text-white/60">
                                        {p.tower_damage ? (p.tower_damage >= 1000 ? (p.tower_damage / 1000).toFixed(1).replace('.0', '') + 'k' : p.tower_damage) : '-'}
                                    </div>

                                    <div className="w-16 text-right shrink-0 font-mono text-xs text-white/80">
                                        {p.hero_healing ? (p.hero_healing >= 1000 ? (p.hero_healing / 1000).toFixed(1).replace('.0', '') + 'k' : p.hero_healing) : '-'}
                                    </div>

                                    {/* Main Inventory */}
                                    <div className="w-[300px] pl-6 shrink-0 flex items-center gap-1">
                                        {itemIds.map((itemId, i) => {
                                            const url = getItemUrl(itemId);
                                            if (!url) return null;

                                            const itemKey = itemIdToKey[itemId];
                                            const purchaseTimeStr = (p as ExtendedPlayer).first_purchase_time?.[itemKey];
                                            let timeStr = "";
                                            if (purchaseTimeStr !== undefined) {
                                                const t = Number(purchaseTimeStr);
                                                const minutes = Math.floor(Math.abs(t) / 60);
                                                const seconds = Math.floor(Math.abs(t) % 60);
                                                timeStr = `${t < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
                                            }

                                            return (
                                                <ItemWithTooltip
                                                    key={i}
                                                    itemId={itemId}
                                                    url={url}
                                                    timeStr={timeStr}
                                                    itemData={itemDataMap[itemId]}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Neutral Item */}
                                    <div className="w-14 shrink-0 flex items-center justify-center">
                                        {(() => {
                                            const neutralId = p.item_neutral || p.neutral_item;
                                            const url = neutralId ? getItemUrl(neutralId) : null;

                                            if (url) {
                                                const itemKey = itemIdToKey[neutralId!];
                                                const purchaseTimeStr = (p as ExtendedPlayer).first_purchase_time?.[itemKey];
                                                let timeStr = "";
                                                if (purchaseTimeStr !== undefined) {
                                                    const t = Number(purchaseTimeStr);
                                                    const minutes = Math.floor(Math.abs(t) / 60);
                                                    const seconds = Math.floor(Math.abs(t) % 60);
                                                    timeStr = `${t < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
                                                }

                                                return (
                                                    <ItemWithTooltip
                                                        key="neutral"
                                                        itemId={neutralId}
                                                        url={url}
                                                        timeStr={timeStr}
                                                        itemData={itemDataMap[neutralId!]}
                                                        isNeutral={true}
                                                    />
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Aghanim Upgrades */}
                                    <div className="w-10 shrink-0 flex flex-col items-center justify-center gap-1">
                                        <img
                                            src={p.aghanims_scepter ? 'https://www.opendota.com/assets/images/dota2/scepter_1.png' : 'https://www.opendota.com/assets/images/dota2/scepter_0.png'}
                                            className="w-4 h-auto"
                                            alt="Scepter"
                                            title={p.aghanims_scepter ? "Aghanim's Scepter (Owned)" : "Aghanim's Scepter (Not Owned)"}
                                        />
                                        <img
                                            src={p.aghanims_shard ? 'https://www.opendota.com/assets/images/dota2/shard_1.png' : 'https://www.opendota.com/assets/images/dota2/shard_0.png'}
                                            className="w-4 h-auto"
                                            alt="Shard"
                                            title={p.aghanims_shard ? "Aghanim's Shard (Owned)" : "Aghanim's Shard (Not Owned)"}
                                        />
                                    </div>

                                    <div className="flex-1"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-[1920px] mx-auto p-2 sm:p-4 animate-fade-in">
            {/* Navigation Header */}
            <div className="flex justify-between items-start mb-6">
                <button onClick={onBack} className="text-xs text-theme-dim hover:text-theme flex items-center gap-2 uppercase tracking-widest border border-transparent hover:border-theme px-3 py-1.5 transition-all group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={handleParse}
                        className="px-3 sm:px-4 py-2 bg-theme/5 hover:bg-theme hover:text-black text-theme border border-theme text-xs font-bold flex items-center gap-2 uppercase tracking-wider transition-all"
                    >
                        <RefreshCw className="w-3 h-3" /> <span className="hidden sm:inline">Re-Parse</span>
                    </button>
                    <a
                        href={`https://www.opendota.com/matches/${match.match_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 sm:px-4 py-2 bg-black hover:bg-white/10 text-theme-dim hover:text-white border border-theme-dim text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <span className="hidden sm:inline">OpenDota</span><span className="sm:hidden">OD</span>
                    </a>
                </div>
            </div>

            {/* Match Header Stats */}
            <div className="flex flex-col items-center justify-center mb-8 sm:mb-12 relative">
                <div className="text-[10px] text-theme-dim uppercase tracking-[0.2em] mb-2">Match ID: {match.match_id}</div>
                <div className="flex items-center gap-6 sm:gap-16">
                    {/* Radiant Score */}
                    <div className="relative flex flex-col items-center">
                        <div className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none ${match.radiant_win ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'text-green-500/50'}`}>
                            {match.radiant_score}
                        </div>
                        {match.radiant_win && (
                            <div className="absolute top-full mt-2 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-green-400 whitespace-nowrap drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                Radiant Victory
                            </div>
                        )}
                    </div>

                    {/* Center Info */}
                    <div className="flex flex-col items-center gap-2 z-10">
                        <div className="px-4 sm:px-6 py-1.5 bg-black border border-theme-dim rounded-full text-sm sm:text-base font-mono text-theme-dim uppercase tracking-widest whitespace-nowrap">
                            {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <Swords className={`w-6 h-6 sm:w-8 sm:h-8 ${match.radiant_win ? 'text-green-400' : 'text-red-400'} opacity-80`} />
                    </div>

                    {/* Dire Score */}
                    <div className="relative flex flex-col items-center">
                        <div className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none ${!match.radiant_win ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]' : 'text-red-500/50'}`}>
                            {match.dire_score}
                        </div>
                        {!match.radiant_win && (
                            <div className="absolute top-full mt-2 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-red-400 whitespace-nowrap drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                                Dire Victory
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Split Layout - Side by Side on XL */}
            <div className="flex flex-col xl:flex-row gap-8 xl:gap-6 mb-12">

                {/* Radiant Side (Left) */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3 px-2 border-b border-green-500/30 pb-2">
                        <h3 className="text-green-400 font-bold uppercase tracking-widest flex items-center gap-2 text-sm md:text-base">
                            <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_currentColor]"></div>
                            The Radiant
                        </h3>
                        {match.radiant_win && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
                        {radiantPlayers.map(p => (
                            <div key={p.player_slot} onClick={() => p.account_id && onPlayerClick(p.account_id)} className={p.account_id ? 'cursor-pointer' : ''}>
                                <HeroCard player={p} isRadiant={true} />
                            </div>
                        ))}
                        {[...Array(Math.max(0, 5 - radiantPlayers.length))].map((_, i) => (
                            <div key={`empty-r-${i}`} className="h-[28rem] bg-black/20 border border-theme-dim/10"></div>
                        ))}
                    </div>
                </div>

                {/* Dire Side (Right) */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3 px-2 border-b border-red-500/30 pb-2 xl:flex-row-reverse">
                        <h3 className="text-red-400 font-bold uppercase tracking-widest flex items-center gap-2 xl:flex-row-reverse text-sm md:text-base">
                            <div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_currentColor]"></div>
                            The Dire
                        </h3>
                        {!match.radiant_win && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
                        {direPlayers.map(p => (
                            <div key={p.player_slot} onClick={() => p.account_id && onPlayerClick(p.account_id)} className={p.account_id ? 'cursor-pointer' : ''}>
                                <HeroCard player={p} isRadiant={false} />
                            </div>
                        ))}
                        {[...Array(Math.max(0, 5 - direPlayers.length))].map((_, i) => (
                            <div key={`empty-d-${i}`} className="h-[28rem] bg-black/20 border border-theme-dim/10"></div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Team Overview Section */}
            <div className="space-y-6">
                {renderTeamOverview(radiantPlayers, true)}
                {renderTeamOverview(direPlayers, false)}
            </div>

            {/* Ability Build Section */}
            <div className="space-y-6 mt-12">
                {renderAbilityBuild(radiantPlayers, true)}
                {renderAbilityBuild(direPlayers, false)}
            </div>

            {/* Map and Graph Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-4">
                <div className="lg:col-span-1 h-full">
                    <BuildingsMap match={match} />
                </div>
                <div className="lg:col-span-2 h-full">
                    <AdvantageGraph match={match} />
                </div>
            </div>

            {/* Optional padding to ensure scroll area isn't cut off */}
            <div className="h-12"></div>
        </div>
    );
};

export default MatchDetailView;