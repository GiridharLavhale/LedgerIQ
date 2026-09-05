import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgColors = {
          success: 'bg-emerald-900/95 border-emerald-700 text-white',
          error: 'bg-rose-900/95 border-rose-700 text-white',
          warning: 'bg-amber-900/95 border-amber-700 text-white',
          info: 'bg-[#031635]/95 border-slate-700 text-white',
        };

        const icons = {
          success: <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />,
          error: <AlertCircle className="h-4 w-4 text-rose-300 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />,
          info: <Info className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />,
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3 rounded-lg border shadow-xl text-xs backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-150 ${bgColors[toast.type]}`}
          >
            <div className="flex items-start gap-2.5">
              {icons[toast.type]}
              <span className="font-medium leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-0.5 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
