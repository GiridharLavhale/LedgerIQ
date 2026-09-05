import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, User as UserIcon, Clock } from 'lucide-react';
import { auditApi } from '../../api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogsList'],
    queryFn: () => auditApi.list(),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Compliance Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log of every financial action, match approval, and system configuration change.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tnum">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Target Entity</th>
                  <th className="py-3 px-3">Target ID</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs && logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-900 font-sans font-semibold">{l.target_entity}</td>
                      <td className="py-3.5 px-3 text-slate-600">{l.target_id.slice(0, 12)}...</td>
                      <td className="py-3.5 px-3 text-slate-500">{l.ip_address || '127.0.0.1'}</td>
                      <td className="py-3.5 px-3 font-sans text-slate-700 max-w-sm truncate">
                        {l.details || (l.new_state ? JSON.stringify(l.new_state) : 'Action recorded')}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {l.created_at.replace('T', ' ').slice(0, 19)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
