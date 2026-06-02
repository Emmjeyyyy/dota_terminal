import React from 'react';
import { WardMap } from '../types';
import dotaMap from '../assets/dota_minimap.jpg';

interface WardMapViewerProps {
    wardMap: WardMap | null;
}

const WardMapViewer: React.FC<WardMapViewerProps> = ({ wardMap }) => {
    if (!wardMap) {
        return (
            <div className="text-center py-8 text-theme-dim border border-dashed border-theme-dim/30 uppercase text-xs">
                No ward map data available.
            </div>
        );
    }

    const hasData = Object.keys(wardMap.obs || {}).length > 0 || Object.keys(wardMap.sen || {}).length > 0;

    if (!hasData) {
        return (
            <div className="text-center py-8 text-theme-dim border border-dashed border-theme-dim/30 uppercase text-xs">
                Not enough parsed data to generate ward map.
            </div>
        );
    }

    const extractPoints = (data: Record<string, Record<string, number>>) => {
        const points: { x: number, y: number, count: number }[] = [];
        let maxCount = 1;

        Object.entries(data || {}).forEach(([xStr, yObj]) => {
            const gridX = parseInt(xStr, 10);
            Object.entries(yObj).forEach(([yStr, count]) => {
                const gridY = parseInt(yStr, 10);
                if (count > maxCount) maxCount = count;
                points.push({ x: gridX, y: gridY, count });
            });
        });

        return { points, maxCount };
    };

    const obsData = extractPoints(wardMap.obs);
    const senData = extractPoints(wardMap.sen);

    const renderMap = (points: { x: number, y: number, count: number }[], maxCount: number, type: 'obs' | 'sen') => {
        return (
            <div className="relative aspect-square w-full max-w-md mx-auto bg-black/80 border border-white/10 overflow-hidden">
                <img
                    src={dotaMap}
                    alt="Dota 2 Map"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                {points.map((p, idx) => {
                    const pctX = ((p.x - 64) / 128) * 100;
                    const pctY = 100 - (((p.y - 64) / 128) * 100);

                    if (pctX < 0 || pctX > 100 || pctY < 0 || pctY > 100) return null;

                    const intensity = p.count / maxCount;

                    // Dot size: small for rare, larger for frequent (but stays discrete)
                    const size = 6 + (intensity * 14); // 6px → 20px

                    // Opacity: low-freq is semi-transparent, high-freq is solid
                    const opacity = 0.35 + (intensity * 0.65);

                    // Glow radius scales with frequency for heat emphasis
                    const glowInner = size * 0.4;
                    const glowOuter = size * 1.2 + (intensity * size * 0.8);
                    const haloOuter = size * 2 + (intensity * size * 1.5);

                    const color      = type === 'obs' ? 'rgba(255, 235, 59, 1)'    : 'rgba(33, 150, 243, 1)';
                    const glowColor  = type === 'obs' ? `rgba(255, 193, 7, ${0.3 + intensity * 0.3})`  : `rgba(3, 169, 244, ${0.3 + intensity * 0.3})`;
                    const haloColor  = type === 'obs' ? `rgba(76, 175, 80, ${0.05 + intensity * 0.1})` : `rgba(103, 58, 183, ${0.05 + intensity * 0.1})`;

                    return (
                        <div
                            key={`${p.x}-${p.y}-${idx}`}
                            className="absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
                            style={{
                                left: `${pctX}%`,
                                top: `${pctY}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundColor: color,
                                opacity: opacity,
                                boxShadow: [
                                    `0 0 ${glowInner}px ${glowInner * 0.5}px ${glowColor}`,
                                    `0 0 ${glowOuter}px ${glowOuter * 0.4}px ${glowColor}`,
                                    `0 0 ${haloOuter}px ${haloOuter * 0.3}px ${haloColor}`,
                                ].join(', '),
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="text-center text-yellow-400 font-bold uppercase mb-4 tracking-wider text-xs flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(255,235,59,0.8)]"></div>
                    Observer Wards
                </h4>
                {renderMap(obsData.points, obsData.maxCount, 'obs')}
            </div>
            <div>
                <h4 className="text-center text-blue-400 font-bold uppercase mb-4 tracking-wider text-xs flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(33,150,243,0.8)]"></div>
                    Sentry Wards
                </h4>
                {renderMap(senData.points, senData.maxCount, 'sen')}
            </div>
        </div>
    );
};

export default WardMapViewer;
