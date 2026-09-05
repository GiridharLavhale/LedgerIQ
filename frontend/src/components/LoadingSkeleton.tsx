import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-2.5 animate-pulse">
      <div className="h-9 w-full rounded bg-slate-200/70" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full rounded bg-white border border-slate-200" />
      ))}
    </div>
  );
};
