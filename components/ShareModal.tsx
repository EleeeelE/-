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
            backgroundColor: null // transparent background for the canvas itself
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
      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        
        {/* Hidden Container for HTML2Canvas - Increased Size and Beautified */}
        <div className="relative bg-gradient-to-br from-[#fff7ed] to-[#ffe4e6] p-6 rounded-3xl shadow-2xl overflow-hidden w-full max-w-[420px] border-[6px] border-white ring-4 ring-amber-200" ref={posterRef}>
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#f59e0b 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
             </div>
             
             {/* Decorative Corner Icons */}
             <div className="absolute top-2 left-2 text-3xl opacity-50">🌸</div>
             <div className="absolute top-2 right-2 text-3xl opacity-50">✨</div>
             <div className="absolute bottom-2 left-2 text-3xl opacity-50">⭐</div>
             <div className="absolute bottom-2 right-2 text-3xl opacity-50">🐾</div>

             {/* Header */}
             <div className="relative z-10 text-center mb-6">
                 <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black font-cute text-2xl rounded-full border-[3px] border-white shadow-lg transform -rotate-1">
                    🏆 萌兽大乱斗战报
                 </div>
             </div>

             {/* VS Area */}
             <div className="relative z-10 flex justify-between items-end px-2 mb-8 mt-2">
                 {/* Winner */}
                 <div className="flex flex-col items-center w-1/2 relative z-20">
                    <div className="absolute -top-10 text-5xl animate-bounce drop-shadow-md">👑</div>
                    <div className="w-28 h-28 rounded-full border-[5px] border-yellow-400 shadow-xl bg-white overflow-hidden relative">
                        <img src={winnerCard?.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 ring-4 ring-white/50 rounded-full"></div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-black px-3 py-1 rounded-full mt-2 border-2 border-white shadow-sm tracking-wider">
                        WINNER
                    </div>
                    <div className="font-black text-amber-900 text-lg mt-1 text-center font-cute leading-tight drop-shadow-sm">
                        {winnerCard?.data.title}
                    </div>
                 </div>

                 {/* VS Badge */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] z-10">
                     <span className="text-4xl font-black text-red-500 font-cute drop-shadow-lg stroke-white" style={{ WebkitTextStroke: '2px white' }}>VS</span>
                 </div>

                 {/* Loser */}
                 <div className="flex flex-col items-center w-1/2 opacity-80 scale-90 grayscale-[0.3]">
                    <div className="w-24 h-24 rounded-full border-[5px] border-gray-300 shadow-inner bg-gray-100 overflow-hidden relative">
                        <img src={loserCard?.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gray-500/10"></div>
                        <div className="absolute top-0 right-0 text-3xl">🌀</div>
                    </div>
                     <div className="bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded mt-2">
                        LOSER
                    </div>
                    <div className="font-bold text-gray-600 text-sm mt-1 text-center font-cute leading-tight">
                        {loserCard?.data.title}
                    </div>
                 </div>
             </div>

             {/* Taunt Box */}
             <div className="relative z-10 bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-amber-200/60 text-center shadow-sm mx-2">
                 <div className="text-amber-300 text-2xl absolute -top-3 -left-2">❝</div>
                 <p className="text-amber-800 font-bold text-base font-cute leading-relaxed px-2">
                     {tauntText}
                 </p>
                 <div className="text-amber-300 text-2xl absolute -bottom-4 -right-2 transform rotate-180">❝</div>
             </div>

             {/* Footer */}
             <div className="relative z-10 mt-6 flex justify-between items-end border-t-2 border-amber-100 pt-2 border-dashed">
                 <div className="flex flex-col items-start">
                     <div className="text-xs text-amber-900/60 font-bold">
                         AI Farm Battler
                     </div>
                     <div className="text-[10px] text-amber-900/40">
                         Generate your own monster!
                     </div>
                 </div>
                 <div className="w-14 h-14 bg-white p-1 rounded-lg border-2 border-gray-100 shadow-sm rotate-3">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://github.com/google/genai" className="w-full h-full opacity-90" />
                 </div>
             </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[350px]">
             {generating ? (
                 <div className="text-white text-center animate-pulse font-bold text-lg">正在绘制战报... 🎨</div>
             ) : (
                 generatedImage ? (
                    <a 
                        href={generatedImage} 
                        download={`battle-report-${Date.now()}.png`}
                        className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black text-xl rounded-2xl text-center shadow-lg border-b-[6px] border-green-700 active:border-b-0 active:mt-1.5 transition-all flex items-center justify-center gap-2"
                    >
                        <span>📥</span> 保存图片分享
                    </a>
                 ) : (
                     <button onClick={generatePoster} className="text-white underline">重试生成</button>
                 )
             )}
             
             <button 
                onClick={onClose}
                className="w-full py-3 bg-white text-amber-800 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-md"
            >
                关闭
             </button>
        </div>

      </div>
    </div>
  );
};