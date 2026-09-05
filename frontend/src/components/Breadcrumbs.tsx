import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'reconciliation': 'Reconciliation Batches',
  'batches': 'Batch Workspace',
  'data-sources': 'Data Sources & Feeds',
  'transactions': 'Canonical Ledger',
  'payments': 'Payment Gateway Collections',
  'settlements': 'Settlement Feeds & Payouts',
  'bank-statements': 'Core Banking Statements',
  'invoices': 'OMS & ERP Invoices',
  'exceptions': 'Exception Workbench',
  'verification': 'Independent Verification',
  'evaluations': 'Benchmark Evaluations',
  'reports': 'Reports & Analytics',
  'audit': 'Compliance Audit Trail',
  'settings': 'Organization & Settings',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Home className="h-3.5 w-3.5 text-slate-400" />
        <span>FinOps Command Center</span>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link
        to="/"
        className="flex items-center gap-1 text-slate-500 hover:text-[#0066ff] transition-colors font-medium"
      >
        <Home className="h-3.5 w-3.5 text-slate-400" />
        <span className="hidden sm:inline">Overview</span>
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
        const label = isUuid
          ? `ID: ${segment.slice(0, 8)}...`
          : ROUTE_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="text-slate-500 hover:text-[#0066ff] transition-colors truncate max-w-[150px] font-medium"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
