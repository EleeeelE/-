import React, { useEffect, useRef } from 'react';

// We now expect simple strings, but we will parse them to make them pretty
export const GameLog: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Helper to style log entries based on content
  const renderLogItem = (log: string, index: number) => {
    let type = 'neutral';
    let icon = '📌';
    let bg = 'bg-amber-50';
    let text = 'text-amber-800';

    if (log.includes('造成了')) {
        type = 'damage';
        icon = '⚔️';
        bg = 'bg-red-50';
        text = 'text-red-800';
    }
    if (log.includes('暴击')) {
        type = 'crit';
        icon = '💥';
        bg = 'bg-orange-50';
        text = 'text-orange-900';
    }
    if (log.includes('MISS') || log.includes('打空')) {
        type = 'miss';
        icon = '💨';
        bg = 'bg-gray-100';
        text = 'text-gray-500';
    }
    if (log.includes('胜利')) {
        type = 'win';
        icon = '🏆';
        bg = 'bg-yellow-100';
        text = 'text-yellow-700 font-bold';
    }
    if (log.includes('回合开始')) {
        type = 'round';
        icon = '🔔';
        bg = 'bg-blue-50';
        text = 'text-blue-800 font-bold text-center';
    }
    if (log.includes('SYSTEM') || log.includes('MISSION')) {
        icon = '🤖';
    }

    const isLatest = index === logs.length - 1;

    return (
        <li 
            key={index} 
            className={`
                text-xs md:text-sm p-2 rounded-lg border border-transparent
                ${bg} ${text} ${type === 'round' ? 'justify-center border-blue-100 my-2' : ''}
                flex items-start gap-2 animate-in slide-in-from-left-2 fade-in duration-300
                ${isLatest ? 'ring-2 ring-amber-300 shadow-sm' : ''}
            `}
        >
            <span className="text-base select-none shrink-0">{icon}</span>
            <span className="leading-snug">{log}</span>
        </li>
    );
  };

  return (
    <div className="relative w-full group mt-6"> 
      {/* Tape Effect - Now outside/above to avoid clipping */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-yellow-200/90 rotate-1 shadow-sm z-20 pointer-events-none"></div>

      {/* Title Badge - Moved outside the container to prevent clipping */}
      <div className="absolute -top-5 left-4 z-30 transform -rotate-2">
         <div className="bg-amber-400 px-4 py-1.5 rounded-lg border-2 border-white shadow-md text-white text-sm font-bold font-cute">
            战斗日记
         </div>
      </div>

      <div className="relative bg-white rounded-xl border-4 border-amber-200 shadow-lg p-1 overflow-hidden">
          {/* Background Lines */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-30" 
             style={{ backgroundImage: 'linear-gradient(#fcd34d 1px, transparent 1px)', backgroundSize: '100% 24px', marginTop: '24px' }}>
          </div>

          <div 
            className="w-full h-80 overflow-y-auto p-4 pt-8 custom-scrollbar relative z-10" 
            ref={scrollRef}
          >
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-amber-400 space-y-2 opacity-50">
                <span className="animate-bounce text-2xl">📝</span>
                <span className="font-cute">等待战斗开始...</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {logs.map((log, i) => renderLogItem(log, i))}
              </ul>
            )}
          </div>
      </div>
    </div>
  );
};