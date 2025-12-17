import React from 'react';
import { Move } from '../types';

interface MoveDetailModalProps {
  move: Move;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ownerName: string;
}

export const MoveDetailModal: React.FC<MoveDetailModalProps> = ({ move, isOpen, onClose, onConfirm, ownerName }) => {
  if (!isOpen) return null;

  const imageUrl = `https://image.pollinations.ai/prompt/cute cartoon rpg skill effect, ${encodeURIComponent(move.visual_prompt)}?width=600&height=400&nologo=true&seed=${move.power}&model=flux`;

  const getTypeColor = (type: string) => {
    if (type.includes('物理') || type.includes('Physical')) return 'text-red-600 bg-red-100';
    if (type.includes('特殊') || type.includes('Special')) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  // Increased Z-index to 100 to appear above sticky health bars (z-40)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Wooden Board Container - Increased Max Width to xl */}
      <div className="relative w-full max-w-xl wood-texture rounded-3xl shadow-2xl border-[8px] border-amber-800/60 overflow-hidden flex flex-col transform rotate-1">
        
        {/* Nail Deco */}
        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-amber-900 shadow-inner z-20"></div>
        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-amber-900 shadow-inner z-20"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-white hover:text-yellow-200 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Section - Increased Height to h-64 */}
        <div className="relative w-full h-72 bg-amber-100 border-b-4 border-amber-800/40">
            <img 
                src={imageUrl} 
                alt={move.name}
                className="w-full h-full object-cover"
                loading="eager"
            />
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/70 to-transparent">
                <h2 className="text-3xl font-black text-white drop-shadow-md tracking-wide font-cute">{move.name}</h2>
                <p className="text-sm text-yellow-300 font-bold mt-1">{ownerName} 的绝招!</p>
            </div>
        </div>

        {/* Paper Content Section */}
        <div className="p-6 space-y-5 bg-[#fef3c7]">
            
            {/* Type & Stats Row */}
            <div className="flex justify-between items-center">
                <span className={`px-4 py-1.5 rounded-full border-2 border-white/50 text-sm font-black shadow-sm ${getTypeColor(move.type)}`}>
                    {move.type}
                </span>
                <div className="flex space-x-4 text-base font-bold text-amber-800">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-amber-100">
                        <span className="text-red-500 text-lg">⚔️</span> {move.power}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-amber-100">
                        <span className="text-yellow-500 text-lg">🎯</span> {move.accuracy}%
                    </span>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-200/50 shadow-sm relative">
                <p className="text-amber-900 text-base leading-relaxed font-medium">
                    {move.description}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                    onClick={onClose}
                    className="px-6 py-4 rounded-2xl font-bold text-amber-700 bg-amber-200 hover:bg-amber-300 transition-colors border-b-4 border-amber-300 active:border-b-0 active:mt-1 text-lg"
                >
                    算了
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-6 py-4 rounded-2xl font-black text-white bg-green-500 hover:bg-green-400 transition-all border-b-4 border-green-700 shadow-xl active:border-b-0 active:mt-1 active:shadow-none text-lg flex items-center justify-center gap-2"
                >
                    出击! 🐾
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};