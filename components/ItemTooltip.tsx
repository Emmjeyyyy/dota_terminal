import React from 'react';

export interface ItemAbility {
  type: string;
  title: string;
  description: string;
}

export interface ItemAttribute {
  key: string;
  display?: string;
  value: string | string[];
}

export interface ItemData {
  id: number;
  dname?: string;
  img?: string;
  cost?: number;
  dmg_type?: string;
  dispellable?: string;
  attrib?: ItemAttribute[];
  abilities?: ItemAbility[];
  lore?: string;
}

interface ItemTooltipProps {
  item: ItemData | null;
  className?: string;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, className = '' }) => {
  if (!item) return null;

  const renderAttribute = (attr: ItemAttribute, idx: number) => {
    if (!attr.display) return null;
    const val = Array.isArray(attr.value) ? attr.value.join('/') : attr.value;
    
    // Split by {value} to perfectly isolate the number for styling
    const parts = attr.display.split('{value}');
    
    return (
        <div key={idx} className="text-[#b1b8be]">
            {parts[0]}<span className="text-white font-bold">{val}</span>{parts.slice(1).join('{value}')}
        </div>
    );
  };

  const imgUrl = item.img ? `https://cdn.akamai.steamstatic.com${item.img}` : undefined;

  return (
    <div className={`w-[320px] bg-[#1a232c] border border-black/40 shadow-2xl flex flex-col text-[#b1b8be] text-sm z-[1000] pointer-events-none font-sans ${className}`}>
      {/* Header */}
      <div className="bg-[#242f39] p-3 flex gap-3 border-b border-[#303f4d]">
        {imgUrl && (
          <div className="w-[85px] h-[64px] shrink-0 bg-black shadow-lg">
            <img src={imgUrl} alt={item.dname || 'Item'} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <div className="text-white font-bold text-[18px] uppercase tracking-wide">
            {item.dname || 'Unknown Item'}
          </div>
          {item.cost ? (
            <div className="flex items-center gap-1.5 mt-1 text-[#e7b13a] font-bold">
              <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/gold.png" alt="Gold" className="w-4 h-4" />
              {item.cost}
            </div>
          ) : null}
        </div>
      </div>

      {/* Meta (Damage Type, Dispellable) */}
      {(item.dmg_type || item.dispellable) && (
        <div className="p-4 pb-2 text-[12px] uppercase tracking-wider flex flex-col gap-1 border-b border-[#303f4d]/50">
          {item.dmg_type && (
            <div>
              <span className="text-[#647687]">DAMAGE TYPE:</span> <span className={item.dmg_type.toLowerCase() === 'physical' ? 'text-[#c23f3f]' : item.dmg_type.toLowerCase() === 'magical' ? 'text-[#3fa2c2]' : 'text-white'}>{item.dmg_type}</span>
            </div>
          )}
          {item.dispellable && (
            <div>
              <span className="text-[#647687]">DISPELLABLE:</span> <span className={item.dispellable.toLowerCase() === 'yes' ? 'text-[#4ea444]' : 'text-[#c23f3f]'}>{item.dispellable}</span>
            </div>
          )}
        </div>
      )}

      {/* Attributes */}
      {item.attrib && item.attrib.length > 0 && (
        <div className="p-4 py-3 flex flex-col gap-[2px]">
          {item.attrib.map((attr, idx) => renderAttribute(attr, idx))}
        </div>
      )}

      {/* Abilities */}
      {item.abilities && item.abilities.length > 0 && (
        <div className="flex flex-col gap-2 p-3 pt-0">
          {item.abilities.map((ability, idx) => {
            // Function to highlight numbers in the description
            const renderDescription = (desc: string) => {
                const parts = desc.split(/(\d+(?:\.\d+)?%?)/g);
                return parts.map((part, i) => {
                    if (/^\d+(?:\.\d+)?%?$/.test(part)) {
                        return <span key={i} className="font-bold">{part}</span>;
                    }
                    return <span key={i}>{part}</span>;
                });
            };

            return (
                <div key={idx} className="bg-[#1b2631] border border-[#263545] shadow-inner">
                <div className="flex items-center justify-between p-2 px-3 bg-gradient-to-r from-[#2c315f] to-[#1c2132]">
                    <div className="text-white font-bold">
                        <span className="text-[#a5b4da]">{ability.type === 'passive' ? 'Passive: ' : ability.type === 'active' ? 'Active: ' : 'Use: '}</span>
                        {ability.title}
                    </div>
                    {/* Mana and Cooldown */}
                    {(item.mc || item.cd) && ability.type === 'active' && (
                        <div className="flex items-center gap-3 text-[13px] font-bold">
                            {item.mc ? (
                                <div className="flex items-center gap-1.5 text-white">
                                    <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-[#00a4db] to-[#007196] shadow-[0_0_2px_rgba(0,0,0,1)] border border-[#00c5ff]/30"></div>
                                    {item.mc}
                                </div>
                            ) : null}
                            {item.cd ? (
                                <div className="flex items-center gap-1.5 text-white">
                                    <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-[#686868] to-[#404040] shadow-[0_0_2px_rgba(0,0,0,1)] border border-[#8a8a8a]/30 relative overflow-hidden">
                                        {/* A little tick inside to look like a cooldown dial */}
                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-black/40 rounded-bl-sm"></div>
                                    </div>
                                    {item.cd}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
                <div className="text-[#8292ce] text-[13px] leading-relaxed p-3">
                    {renderDescription(ability.description)}
                </div>
                </div>
            );
          })}
        </div>
      )}

      {/* Lore */}
      {item.lore && (
        <div className="bg-[#0f1418] p-3 text-[12px] italic text-[#6a7b8c] border-t border-black leading-relaxed">
          {item.lore}
        </div>
      )}
    </div>
  );
};

export default ItemTooltip;
