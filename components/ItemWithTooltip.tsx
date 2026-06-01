import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ItemTooltip from './ItemTooltip';

interface ItemWithTooltipProps {
  itemId: number;
  url: string;
  timeStr?: string;
  itemData: any;
  isNeutral?: boolean;
}

const ItemWithTooltip: React.FC<ItemWithTooltipProps> = ({ itemId, url, timeStr, itemData, isNeutral }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left, // Left side of the item
        y: rect.top + rect.height / 2, // Vertically centered to the item
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsHovered(true);
  };

  useEffect(() => {
    if (isHovered) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isHovered]);

  const itemContent = (
    <>
      <img src={url} alt="" className="w-full h-full object-cover" />
      {timeStr && (
        <div className={`absolute bottom-0 inset-x-0 pt-2 pb-[1px] bg-gradient-to-t from-black via-black/80 to-transparent font-mono font-bold text-center text-white leading-none pointer-events-none ${isNeutral ? 'text-[8px]' : 'text-[10px]'}`}>
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">{timeStr}</span>
        </div>
      )}
    </>
  );

  return (
    <>
      <div 
        ref={itemRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={isNeutral 
          ? "w-8 h-8 rounded-full overflow-hidden border border-white/10 relative shadow-[0_0_5px_rgba(255,255,255,0.05)] shrink-0 cursor-help"
          : "w-11 h-8 bg-black/50 border border-white/10 relative cursor-help"
        }
      >
        {itemContent}
      </div>

      {isHovered && itemData && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: 'translate(calc(-100% - 8px), -50%)',
          }}
        >
          <ItemTooltip item={itemData} />
        </div>,
        document.body
      )}
    </>
  );
};

export default ItemWithTooltip;
