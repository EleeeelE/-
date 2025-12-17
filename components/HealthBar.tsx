import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  isRightSide?: boolean; // To mirror the design for Player 2
}

export const HealthBar: React.FC<HealthBarProps> = ({ current, max, isRightSide = false }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  // Dynamic color based on health percentage - Softer pastel colors
  let barColor = 'bg-gradient-to-r from-green-400 to-green-500';
  let iconColor = 'text-red-500';
  
  if (percentage < 50) {
    barColor = 'bg-gradient-to-r from-yellow-400 to-orange-400';
  }
  if (percentage < 20) {
    barColor = 'bg-gradient-to-r from-red-400 to-red-500 animate-pulse';
  }

  // Adjust padding to prevent heart icon from covering text
  // Icon is approx 2rem (w-8) + positioning. Giving it pl-12/pr-12 ensures clearance.
  const textPadding = isRightSide ? 'pr-14 pl-2' : 'pl-14 pr-2';

  return (
    <div className={`w-full flex flex-col ${isRightSide ? 'items-end' : 'items-start'} relative z-10`}>
      {/* HP Badge */}
      <div className={`absolute -top-4 ${isRightSide ? '-right-2' : '-left-2'} z-20`}>
        <div className="bg-white p-1 rounded-full border-4 border-amber-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 ${iconColor} drop-shadow-sm`}>
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
        </div>
      </div>

      {/* HP Text Info */}
      <div className={`flex items-end gap-2 mb-1 ${textPadding} ${isRightSide ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xl font-black text-amber-800 drop-shadow-sm font-cute">{Math.ceil(current)}</span>
        <span className="text-xs text-amber-600/80 font-bold mb-1">/ {max}</span>
      </div>

      {/* The Bar Container - Rounded Pill */}
      <div className="h-8 w-full bg-amber-100 rounded-full border-4 border-white shadow-md relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
        </div>

        {/* The Actual HP Fill */}
        <div 
          className={`h-full transition-all duration-700 ease-out relative rounded-full ${barColor}`} 
          style={{ width: `${percentage}%` }}
        >
          {/* Highlight (Jelly effect) */}
          <div className="absolute top-1 left-2 right-2 h-2 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};