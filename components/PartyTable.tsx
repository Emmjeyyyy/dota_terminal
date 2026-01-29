import React, { useState } from 'react';
import { PartyGroup } from '../types';
import { Users, BarChart3 } from 'lucide-react';
import { getHeroImageUrl } from '../services/heroService';

interface PartyTableProps {
  parties: PartyGroup[];
  onSelectParty: (party: PartyGroup) => void;
  selectedPartyId: string | null;
}

const PartyTable: React.FC<PartyTableProps> = ({ parties, onSelectParty, selectedPartyId }) => {
  const [sortField, setSortField] = useState<'matches' | 'winrate'>('matches');

  const getWinrate = (p: PartyGroup) => (p.wins / p.matches.length) * 100;

  const sortedParties = [...parties].sort((a, b) => {
    if (sortField === 'matches') {
      return b.matches.length - a.matches.length; 
    } else {
      return getWinrate(b) - getWinrate(a);
    }
  });

  return (
    <div className="terminal-box overflow-hidden">
      <div className="p-4 border-b border-theme-dim flex justify-between items-center bg-black/20">
        <h2 className="text-lg font-bold text-theme flex items-center gap-2 uppercase tracking-tight">
          <Users className="w-5 h-5" />
          Squad_Compositions
        </h2>
        <div className="flex text-[10px] uppercase border border-theme-dim">
          <button
            onClick={() => setSortField('matches')}
            className={`px-3 py-1 transition-colors ${sortField === 'matches' ? 'bg-theme text-black font-bold' : 'text-theme-dim hover:text-theme'}`}
          >
            Volume
          </button>
          <div className="w-px bg-theme-dim"></div>
          <button
            onClick={() => setSortField('winrate')}
            className={`px-3 py-1 transition-colors ${sortField === 'winrate' ? 'bg-theme text-black font-bold' : 'text-theme-dim hover:text-theme'}`}
          >
            Efficiency
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase text-theme-dim border-b border-theme-dim tracking-wider">
              <th className="p-4 w-1/3">Operatives</th>
              <th className="p-4 text-center">GAMES</th>
              <th className="p-4 text-center">RECORD</th>
              <th className="p-4 text-right">RATING</th>
            </tr>
          </thead>
          <tbody>
            {sortedParties.map((party) => {
              const winrate = getWinrate(party);
              const isSelected = party.id === selectedPartyId;
              
              return (
                <tr 
                  key={party.id}
                  onClick={() => onSelectParty(party)}
                  className={`
                    cursor-pointer transition-all border-b border-theme-dim last:border-0 group
                    ${isSelected ? 'bg-theme-dim border-l-4 border-l-theme' : 'hover:bg-white/5 border-l-4 border-l-transparent'}
                  `}
                >
                  <td className="p-4">
                    {party.id === 'SOLO' ? (
                       <span className="text-theme-dim italic uppercase text-xs opacity-60 group-hover:opacity-100">[SOLO_UNIT]</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {party.teammates.map((mate) => (
                          <div 
                            key={mate.account_id} 
                            className="flex items-center gap-1.5 text-theme text-xs border border-theme-dim px-1.5 py-0.5"
                          >
                            <img 
                              src={getHeroImageUrl(mate.mostPlayedHeroId)} 
                              alt="" 
                              className="w-4 h-4 opacity-80"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=?' }}
                            />
                            <span className="uppercase text-[10px] truncate max-w-[80px]">{mate.personaname}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center font-bold text-theme">
                    {party.matches.length.toString().padStart(2, '0')}
                  </td>
                  <td className="p-4 text-center text-xs font-mono">
                    <span className="text-theme opacity-100">{party.wins}W</span>
                    <span className="text-theme-dim mx-1">/</span>
                    <span className="text-theme opacity-60">{party.losses}L</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <div className="w-16 h-2 border border-theme-dim p-0.5">
                         <div 
                           className="h-full bg-theme" 
                           style={{ width: `${winrate}%`, opacity: winrate >= 50 ? 1 : 0.4 }}
                         />
                       </div>
                       <span className="text-xs font-bold text-theme">
                         {winrate.toFixed(0)}%
                       </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {sortedParties.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-theme-dim uppercase text-xs tracking-widest">
                  No_Data_Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartyTable;