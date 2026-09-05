import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || '').toUpperCase();

  // DESIGN.md Light-Fill Style Badges
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-500';

  if (s === 'MATCHED' || s === 'COMPLETED' || s === 'RESOLVED' || s === 'APPROVED_MATCH') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (s === 'LIKELY_MATCH' || s === 'PROCESSING' || s === 'INVESTIGATING' || s === 'UNDER_INVESTIGATION' || s === 'PENDING') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-600';
  } else if (s === 'PARTIAL_MATCH') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (s === 'EXCEPTION' || s === 'FAILED' || s === 'REJECTED_MATCH' || s === 'DUPLICATE' || s === 'INVALID') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-600';
  } else if (s === 'UNRECONCILED' || s === 'OPEN') {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-500';
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-tight ${colorClasses} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{s.replace(/_/g, ' ')}</span>
    </span>
  );
};
