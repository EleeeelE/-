import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#fffbef] rounded-3xl shadow-2xl border-[8px] border-[#8d6e63] overflow-hidden flex flex-col p-8 transform rotate-1">
        
        {/* Header */}
        <div className="text-center mb-6">
            <h2 className="text-4xl font-black text-[#5d4037] font-cute tracking-wide">关于我们</h2>
            <div className="h-2 w-24 bg-[#a1887f] rounded-full mx-auto mt-3"></div>
        </div>

        {/* Content - Structured for "One Sentence Per Line" */}
        <div className="flex flex-col gap-6 text-[#6d4c41] font-medium text-center font-cute text-xl">
            
            {/* Intro */}
            <div className="text-2xl">
                🌱 欢迎来到 <span className="text-[#e65100] font-black">萌兽大乱斗</span>！
            </div>

            {/* Description Block 1 */}
            <div className="flex flex-col gap-1">
                <p>这是一个轻松愉快的生成式对战游戏。</p>
                <p>只需上传一张照片，</p>
                <p>AI 就会为你识别动物种类，</p>
                <p>并生成独一无二的 RPG 角色卡片。</p>
            </div>

            {/* Description Block 2 */}
            <div className="flex flex-col gap-1">
                <p>享受阳光、草地和激烈的（虽然很萌）战斗吧！</p>
                <p>快叫上你的朋友一起来玩！</p>
            </div>

            {/* Version Info */}
            <p className="text-base opacity-60 pt-4 border-t-2 border-[#d7ccc8] border-dashed">
                Version 1.0.0 | Made for Fun
            </p>
        </div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="mt-8 w-full py-4 rounded-2xl font-black text-2xl text-[#fffbef] bg-[#8d6e63] hover:bg-[#795548] transition-colors border-b-4 border-[#5d4037] active:border-b-0 active:mt-1 shadow-lg"
        >
            关闭
        </button>
      </div>
    </div>
  );
};