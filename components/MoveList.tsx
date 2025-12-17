import React from 'react';
import { Move } from '../types';

const getTypeColor = (type: string) => {
  if (type.includes('物理') || type.includes('Physical')) return 'bg-red-500/20 text-red-300 border-red-500/50';
  if (type.includes('特殊') || type.includes('Special')) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  return 'bg-green-500/20 text-green-300 border-green-500/50';
};

export const MoveList: React.FC<{ moves: Move[] }> = ({ moves }) => {
  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">专属绝招</h3>
      {moves.map((move, index) => (
        <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-white text-lg">{move.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(move.type)}`}>
              {move.type}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-2">{move.description}</p>
          <div className="flex space-x-4 text-xs font-mono text-gray-500">
            <span title="威力">PWR: <span className="text-gray-300">{move.power}</span></span>
            <span title="命中">ACC: <span className="text-gray-300">{move.accuracy}%</span></span>
          </div>
        </div>
      ))}
    </div>
  );
};
