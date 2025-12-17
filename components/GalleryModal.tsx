import React, { useEffect, useState } from 'react';
import { SavedAnimal } from '../types';
import { BattleCard } from './BattleCard';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SavedAnimal) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [savedItems, setSavedItems] = useState<SavedAnimal[]>([]);
  const [previewItem, setPreviewItem] = useState<SavedAnimal | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewItem(null); // Reset preview on open
      const stored = localStorage.getItem('beast_battler_gallery');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedItems(parsed.sort((a: SavedAnimal, b: SavedAnimal) => b.createdAt - a.createdAt));
        } catch (e) {
          console.error("Failed to load gallery", e);
        }
      }
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("确定要放生这只萌兽吗？");
    if (confirmed) {
        const newItems = savedItems.filter(item => item.id !== id);
        setSavedItems(newItems);
        localStorage.setItem('beast_battler_gallery', JSON.stringify(newItems));
        if (previewItem?.id === id) setPreviewItem(null);
    }
  };

  const handleItemClick = (item: SavedAnimal) => {
      setPreviewItem(item);
  };

  const handleConfirmSelection = () => {
      if (previewItem) {
          onSelect(previewItem);
          onClose(); // Explicitly close modal after selection
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#fffbef] rounded-3xl shadow-2xl border-[8px] border-[#8d6e63] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#8d6e63] p-4 flex justify-between items-center shadow-md z-10 shrink-0">
            <h2 className="text-2xl font-black text-white font-cute tracking-wide flex items-center gap-2">
                📖 我的萌兽图鉴
                <span className="text-sm bg-black/20 px-2 py-0.5 rounded-full font-normal">
                    {savedItems.length} / 10
                </span>
            </h2>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center transition-colors font-bold"
            >
                ✕
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Left Side: List/Grid */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar bg-amber-50 ${previewItem ? 'hidden md:block md:w-1/2 lg:w-3/5' : 'w-full'}`}>
                {savedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-amber-800/40 space-y-4">
                        <span className="text-6xl">🕸️</span>
                        <p className="font-cute text-xl">图鉴是空的...</p>
                        <p className="text-sm">在上传界面或战斗中点击星星 ✨ 保存角色</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {savedItems.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`
                                    relative bg-white rounded-xl p-2 border-4 transition-all cursor-pointer shadow-sm group
                                    ${previewItem?.id === item.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-100 hover:border-amber-300'}
                                `}
                            >
                                <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-2">
                                    <img src={`data:image/png;base64,${item.imageBase64}`} className="w-full h-full object-cover" alt={item.data.species} />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-black text-amber-800 truncate text-sm font-cute">{item.data.title}</h3>
                                </div>
                                
                                {/* Mini Element Badge */}
                                <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-600 shadow-sm">
                                    {item.data.element}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Side: Preview Detail (Visible when an item is selected) */}
            {previewItem && (
                <div className="absolute inset-0 md:static md:inset-auto w-full md:w-1/2 lg:w-2/5 bg-[#fffbef] border-l-0 md:border-l-4 border-[#8d6e63]/20 flex flex-col p-4 animate-in slide-in-from-right-10 z-20">
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-2">
                        <div className="w-full max-w-sm pointer-events-none"> 
                             {/* pointer-events-none on wrapper to prevent interactions inside preview if desired, 
                                 but BattleCard handles clicks. We just want to view. */}
                            <BattleCard 
                                data={previewItem.data} 
                                imageUrl={`data:image/png;base64,${previewItem.imageBase64}`} 
                            />
                        </div>
                     </div>

                     <div className="mt-4 flex gap-3 shrink-0">
                        <button 
                            onClick={(e) => handleDelete(e, previewItem.id)}
                            className="flex-1 py-3 rounded-xl font-bold text-red-500 bg-red-100 hover:bg-red-200 transition-colors border-b-4 border-red-300 active:border-b-0 active:mt-1"
                        >
                            🗑️ 放生
                        </button>

                         {/* Only show "Select" if we are in a context that allows selection (passed via onSelect prop) */}
                         <button 
                            onClick={handleConfirmSelection}
                            className="flex-[2] py-3 rounded-xl font-black text-white bg-green-500 hover:bg-green-400 transition-colors border-b-4 border-green-700 shadow-lg active:border-b-0 active:mt-1 active:shadow-none"
                         >
                            ✅ 选择出战
                        </button>
                        
                        {/* Mobile Back Button */}
                        <button 
                            onClick={() => setPreviewItem(null)}
                            className="md:hidden flex-1 py-3 rounded-xl font-bold text-amber-700 bg-amber-200"
                        >
                            ↩️ 返回
                        </button>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};