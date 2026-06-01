import React from 'react';
import { WardMap } from '../types';

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

    // Process ward data into an array of points
    // OpenDota coordinates typically map from 64 to 192.
    // X goes left to right, Y goes bottom to top.
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

    const renderMap = (points: {x: number, y: number, count: number}[], maxCount: number, type: 'obs' | 'sen') => {
        return (
            <div className="relative aspect-square w-full max-w-md mx-auto bg-black/80 border border-theme-dim/30 overflow-hidden">
                <img 
                    src="https://raw.githubusercontent.com/odota/web/master/public/assets/images/dota2/map/7.33/dota_map.png" 
                    alt="Dota 2 Map" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    onError={(e) => {
                        // Fallback to older map if 7.33 is unavailable
                        (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/odota/web/master/public/assets/images/dota2/map/minimap.jpg";
                    }}
                />
                
                {/* Heatmap overlay */}
                {points.map((p, idx) => {
                    // OpenDota standard grid mapping: 64 to 192
                    const pctX = ((p.x - 64) / 128) * 100;
                    const pctY = 100 - (((p.y - 64) / 128) * 100);
                    
                    // Clamp to visible area
                    if (pctX < 0 || pctX > 100 || pctY < 0 || pctY > 100) return null;

                    const intensity = p.count / maxCount;
                    const size = 10 + (intensity * 15); // 10px to 25px
                    const opacity = 0.4 + (intensity * 0.6); // 0.4 to 1.0

                    // Yellow for obs, Blue for sen
                    const color = type === 'obs' ? 'rgba(255, 235, 59, 1)' : 'rgba(33, 150, 243, 1)';
                    const glowColor = type === 'obs' ? 'rgba(255, 193, 7, 0.8)' : 'rgba(3, 169, 244, 0.8)';
                    const haloColor = type === 'obs' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(103, 58, 183, 0.4)';

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
                                boxShadow: `0 0 ${size * 1.5}px ${size * 0.5}px ${glowColor}, 0 0 ${size * 3}px ${size * 1.5}px ${haloColor}`
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
