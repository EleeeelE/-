import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  colorClass: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, colorClass }) => {
  return (
    <div className="flex items-center space-x-2 text-xs font-bold text-amber-800/70">
      <span className="w-8">{label}</span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
        <div 
          className={`h-full rounded-full ${colorClass}`} 
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
      <span className="w-6 text-right text-amber-900">{value}</span>
    </div>
  );
};