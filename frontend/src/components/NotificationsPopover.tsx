import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Layers, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
  link?: string;
}

interface NotificationsPopoverProps {
  notifications: NotificationItem[];
  onClear: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notifications,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none"
        title="Operational Notifications"
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066ff]"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">Operational Activity</h3>
              <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 font-mono">
                {notifications.length}
              </span>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onClear}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-60" />
                <p className="font-semibold text-slate-800">All systems quiet</p>
                <p className="text-[11px]">No active exception alerts or pending batch jobs.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 hover:bg-slate-50 rounded transition-colors text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      {n.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      {n.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                      {n.type === 'info' && <Zap className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                      <span className="truncate">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.description}</p>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-block text-[11px] font-semibold text-[#0066ff] hover:underline pt-0.5"
                    >
                      View details →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex justify-between items-center font-mono">
            <span>LedgerIQ Event Stream</span>
            <Link to="/audit" onClick={() => setIsOpen(false)} className="hover:text-slate-900">
              Full Audit Trail →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
