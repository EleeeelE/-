import React, { useRef, useState } from 'react';
import { Player, AnimalData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: Player;
  loser: Player;
  winnerCard: { data: AnimalData, imageUrl: string } | null;
  loserCard: { data: AnimalData, imageUrl: string } | null;
}

declare global {
  interface Window {
    html2canvas: any;
  }
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, winner, loser, winnerCard, loserCard }) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generatePoster = async () => {
    if (!posterRef.current || !window.html2canvas) return;
    setGenerating(true);
    
    try {
        const canvas = await window.html2canvas(posterRef.current, {
            scale: 2, // Retina quality
            useCORS: true,
            backgroundColor: '#f0f9ff'
        });
        setGeneratedImage(canvas.toDataURL("image/png"));
    } catch (e) {
        console.error("Poster gen failed", e);
    } finally {
        setGenerating(false);
    }
  };

  // Auto generate on open
  React.useEffect(() => {
    if (isOpen) {
        setGeneratedImage(null);
        // Small timeout to ensure DOM is rendered
        setTimeout(generatePoster, 500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Taunt Text Generator
  const getTaunt = () => {
      const winnerName = winnerCard?.data.title || '我的萌兽';
      const loserName = loserCard?.data.title || '对手';
      const templates = [
          `我家 ${winnerName} 把 ${loserName} 揍得找不着北！不服来战！`,
          `震惊！${winnerName} 竟然一招制敌！${loserName} 完全不是对手！`,
          `萌兽大乱斗战报：${winnerName} 轻松取胜，这就是实力的差距！`,
          `虽然都很萌，但我的 ${winnerName} 显然更能打！再接再厉吧 ${loserName}！`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
  };

  const tauntText = getTaunt();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 max-w-lg w-full">
        
        {/* Hidden Container for HTML2Canvas - displayed absolute offscreen if not debugging, but here we render it visibly for the user to see what they are sharing */}
        <div className="relative bg-[#f0f9ff] p-4 rounded-xl shadow-2xl overflow-hidden w-full max-w-[350px]" ref={posterRef}>
             {/* Background Pattern */}
             <div className="absolute inset-0 bg-farm-pattern opacity-20 pointer-events-none"></div>
             <div className="absolute bottom-0 w-full h-20 bg-green-200 rounded-t-[50%] scale-150"></div>
             
             {/* Header */}
             <div className="relative z-10 text-center mb-4">
                 <div className="inline-block px-4 py-1 bg-amber-500 text-white font-black font-cute text-xl rounded-full border-2 border-white shadow-md transform -rotate-2">
                    萌兽大乱斗 🏆 战报
                 </div>
             </div>

             {/* VS Area */}
             <div className="relative z-10 flex justify-between items-end px-2 mb-6 mt-4">
                 {/* Winner */}
                 <div className="flex flex-col items-center w-1/2 relative z-20">
                    <div className="absolute -top-8 text-4xl animate-bounce">👑</div>
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg bg-white overflow-hidden">
                        <img src={winnerCard?.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded mt-1 border border-yellow-300">
                        WINNER
                    </div>
                    <div className="font-black text-amber-900 text-sm mt-1 text-center font-cute leading-tight">
                        {winnerCard?.data.title}
                    </div>
                 </div>

                 {/* VS Badge */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-3xl font-black text-red-500 font-cute drop-shadow-md z-10">
                     VS
                 </div>

                 {/* Loser */}
                 <div className="flex flex-col items-center w-1/2 opacity-70 scale-90 grayscale-[0.5]">
                    <div className="w-20 h-20 rounded-full border-4 border-gray-300 shadow-inner bg-gray-100 overflow-hidden">
                        <img src={loserCard?.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-bold text-gray-600 text-xs mt-2 text-center font-cute leading-tight">
                        {loserCard?.data.title}
                    </div>
                 </div>
             </div>

             {/* Taunt Box */}
             <div className="relative z-10 bg-white/90 p-3 rounded-lg border-2 border-amber-200 text-center shadow-sm">
                 <p className="text-amber-800 font-bold text-sm font-cute leading-relaxed">
                     “{tauntText}”
                 </p>
             </div>

             {/* Footer */}
             <div className="relative z-10 mt-4 flex justify-between items-end">
                 <div className="text-[10px] text-amber-900/40 font-bold">
                     Generated by AI Farm Battler
                 </div>
                 <div className="w-12 h-12 bg-white p-1 rounded border border-gray-200">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://github.com/google/genai" className="w-full h-full opacity-80" />
                 </div>
             </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[350px]">
             {generating ? (
                 <div className="text-white text-center animate-pulse">正在生成海报... 🎨</div>
             ) : (
                 generatedImage ? (
                    <a 
                        href={generatedImage} 
                        download={`battle-report-${Date.now()}.png`}
                        className="w-full py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-center shadow-lg border-b-4 border-green-700 active:border-b-0 active:mt-1"
                    >
                        ⬇️ 保存图片分享
                    </a>
                 ) : (
                     <button onClick={generatePoster} className="text-white underline">重试生成</button>
                 )
             )}
             
             <button 
                onClick={onClose}
                className="w-full py-3 bg-white text-amber-800 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
                关闭
             </button>
        </div>

      </div>
    </div>
  );
};