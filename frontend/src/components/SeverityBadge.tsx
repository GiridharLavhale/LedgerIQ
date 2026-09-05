import React from 'react';

interface SeverityBadgeProps {
  severity: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const sev = (severity || '').toUpperCase();

  let color = 'bg-slate-100 text-slate-700 border-slate-200 border-l-slate-400';
  if (sev === 'CRITICAL') {
    color = 'bg-rose-50 text-rose-800 border-rose-200 border-l-4 border-l-rose-600 font-bold';
  } else if (sev === 'HIGH') {
    color = 'bg-rose-50 text-rose-700 border-rose-200 border-l-4 border-l-rose-500 font-semibold';
  } else if (sev === 'MEDIUM') {
    color = 'bg-amber-50 text-amber-800 border-amber-200 border-l-2 border-l-amber-500 font-medium';
  } else if (sev === 'LOW') {
    color = 'bg-blue-50 text-blue-800 border-blue-200 font-normal';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded border uppercase tracking-wider ${color}`}>
      {sev}
    </span>
  );
};
