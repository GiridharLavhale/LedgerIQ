import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="rounded-full border border-slate-200 bg-slate-50 p-4 text-slate-500 shadow-sm">
        <Icon className="h-7 w-7 text-[#0066ff]" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded bg-[#0066ff] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0050cc] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
