import React from 'react';

export const Spinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full opacity-25"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    {label && <p className="text-indigo-300 font-medium animate-pulse">{label}</p>}
  </div>
);
