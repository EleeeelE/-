import React, { useState, useEffect } from 'react';
import { AnimalData, Move } from '../types';
import { StatBar } from './StatBar';

interface BattleCardProps {
  data: AnimalData;
  imageUrl: string;
  isBattleMode?: boolean;
  isActive?: boolean;
  hasActed?: boolean;
  onMoveSelect?: (move: Move) => void;
  // New Visual Props
  isHurt?: boolean;
  damageEffect?: { text: string; type: 'crit' | 'normal' | 'miss' } | null;
  // Save functionality
  onSave?: () => void;
}

export const BattleCard: React.FC<BattleCardProps> = ({ 
  data, 
  imageUrl, 
  isBattleMode = false, 
  isActive = false,
  hasActed = false,
  onMoveSelect,
  isHurt = false,
  damageEffect = null,
  onSave
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saveAnim, setSaveAnim] = useState(false);

  // Handle save click with animation
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
        setIsSaved(true);
        setSaveAnim(true);
        onSave();
        // Reset animation class after it plays
        setTimeout(() => setSaveAnim(false), 600);
    }
  };

  return (
    <div className={`
      relative w-full rounded-2xl overflow-hidden transition-all duration-500
      bg-[#fdfbf7] shadow-xl border-[6px] border-white group/card
      ${isActive ? 'scale-[1.02] -rotate-1 ring-4 ring-yellow-400 ring-offset-2 z-10' : 'scale-95 rotate-1 opacity-90 hover:opacity-100 hover:rotate-0 hover:scale-100'}
      ${hasActed ? 'grayscale opacity-60' : ''}
      ${isHurt ? 'animate-shake bg-red-50' : ''}
    `}>
      
      {/* Damage Overlay (Floating Text) */}
      {damageEffect && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`animate-float-damage font-black font-cute drop-shadow-lg text-center
            ${damageEffect.type === 'crit' ? 'text-6xl text-yellow-400 stroke-red-800' : 
              damageEffect.type === 'miss' ? 'text-4xl text-gray-500' : 'text-5xl text-red-500'}
          `}>
            {damageEffect.type === 'crit' && <div className="text-xl text-red-600 mb-[-10px]">暴击!</div>}
            {damageEffect.text}
          </div>
        </div>
      )}

      {/* Wood Texture Border Inner */}
      <div className="bg-amber-100 p-2 h-full flex flex-col gap-2">
        
        {/* Card Header - Paper Tag Style */}
        <div className="bg-white rounded-lg p-2 border-2 border-amber-200/50 shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-stripes-orange opacity-20"></div>
          <div>
            <h2 className="text-xl font-black text-amber-800 tracking-tight font-cute">
              {data.title}
            </h2>
            <p className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">{data.species}</p>
          </div>
          <div className="flex flex-col items-end">
             <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 shadow-sm">
            {data.element}
            </span>
          </div>
        </div>

        {/* Image Container - Polaroid Style */}
        <div className="relative aspect-video w-full bg-amber-50 rounded-lg overflow-hidden border-4 border-white shadow-inner group">
          <div className={`${isHurt ? 'bg-red-500/30' : 'bg-transparent'} absolute inset-0 z-20 transition-colors duration-100 pointer-events-none`}></div>
          <img 
            src={imageUrl} 
            alt={data.species} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* MOVED SAVE BUTTON HERE - Overlay on image */}
          {onSave && (
            <button 
                onClick={handleSaveClick}
                className={`absolute top-2 right-2 z-40 p-1.5 rounded-full transition-all duration-300 shadow-md border-2 border-white backdrop-blur-sm
                    ${isSaved ? 'bg-yellow-100/90 text-yellow-500' : 'bg-black/30 text-white hover:bg-yellow-400 hover:text-white'}
                    ${saveAnim ? 'animate-[ping_0.5s_ease-in-out]' : 'hover:scale-110'}
                `}
                title="收藏到图鉴"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            </button>
          )}

          {hasActed && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-30 backdrop-blur-[2px]">
                  <span className="text-2xl font-black text-amber-500 border-4 border-amber-500 px-4 py-2 rounded-xl transform -rotate-12 bg-white shadow-lg font-cute">
                      休息中 zZZ
                  </span>
              </div>
          )}

          {!isBattleMode && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 backdrop-blur-sm border-t-2 border-amber-100">
                <p className="text-amber-800/80 italic text-xs leading-relaxed text-center font-cute">"{data.flavorText}"</p>
            </div>
          )}
        </div>

        {/* Stats & Moves Area */}
        <div className="bg-white rounded-xl p-3 border-2 border-amber-100 shadow-sm space-y-3">
          
          {/* Preview Stats */}
          {!isBattleMode && (
             <div className="grid grid-cols-2 gap-2 p-2 bg-amber-50 rounded-lg">
               <StatBar label="生命" value={data.stats.hp} colorClass="bg-green-400" />
               <StatBar label="攻击" value={data.stats.attack} colorClass="bg-red-400" />
               <StatBar label="防御" value={data.stats.defense} colorClass="bg-blue-400" />
               <StatBar label="速度" value={data.stats.speed} colorClass="bg-yellow-400" />
            </div>
          )}

          {/* Moves - Wood Plank Buttons */}
          <div className="space-y-2">
            {isBattleMode && (
              <div className="flex items-center justify-center mb-1">
                  <div className="h-[2px] w-8 bg-amber-200 rounded-full"></div>
                  <h3 className="text-xs font-bold text-amber-500 px-2 font-cute">选择招式</h3>
                  <div className="h-[2px] w-8 bg-amber-200 rounded-full"></div>
              </div>
            )}
            
            {data.moves.map((move, index) => {
              const canClick = isBattleMode && isActive && onMoveSelect && !hasActed;
              
              return (
                <button
                  key={index}
                  disabled={!canClick}
                  onClick={() => canClick && onMoveSelect(move)}
                  className={`
                    w-full relative text-left p-2 px-3 rounded-xl border-b-4 transition-all duration-200 group/btn flex items-center justify-between
                    ${canClick 
                      ? 'bg-amber-500 hover:bg-amber-400 border-amber-700 hover:border-amber-600 text-white shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 active:mt-1 cursor-pointer' 
                      : 'bg-gray-100 border-gray-300 text-gray-400 cursor-default'}
                  `}
                >
                  <div className="flex flex-col">
                      <span className="font-bold text-sm font-cute drop-shadow-md">
                        {move.name}
                      </span>
                      {canClick && (
                         <div className="flex space-x-2 text-[10px] font-bold opacity-90 mt-0.5">
                            <span>PWR {move.power}</span>
                            <span>ACC {move.accuracy}%</span>
                         </div>
                      )}
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${canClick ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                    {move.type}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};