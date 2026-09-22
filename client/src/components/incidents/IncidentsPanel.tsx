import React, { useMemo, useState } from 'react';
import {
  ServerCrash,
  XOctagon,
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import type { Incident, IncidentType } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface IncidentsPanelProps {
  incidents: Incident[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TYPE_META: Record<
  IncidentType,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  SERVICE_UNAVAILABLE: {
    label: 'Service Unavailable',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <ServerCrash className="w-3.5 h-3.5" />,
  },
  SERVER_ERROR: {
    label: 'Server Error',
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: <XOctagon className="w-3.5 h-3.5" />,
  },
  CLIENT_ERROR: {
    label: 'Client Error',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  SLOW_RESPONSE: {
    label: 'Slow Response',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

export const IncidentsPanel: React.FC<IncidentsPanelProps> = ({
  incidents,
  isLoading,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | IncidentType>('ALL');

  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && inc.type !== typeFilter) return false;
      return true;
    });
  }, [incidents, statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Incident Classification & History
            </h2>
            <p className="text-xs text-slate-500">
              {openCount} open &bull; {resolvedCount} resolved &bull; {incidents.length} total detected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['ALL', 'OPEN', 'RESOLVED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'OPEN' ? 'Open' : 'Resolved'}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">All Types</option>
            <option value="SERVICE_UNAVAILABLE">Service Unavailable</option>
            <option value="SLOW_RESPONSE">Slow Response</option>
            <option value="CLIENT_ERROR">Client Error</option>
            <option value="SERVER_ERROR">Server Error</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh incidents"
              className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">API Name</th>
                <th className="px-4 py-3.5">Incident Type</th>
                <th className="px-4 py-3.5">Detected</th>
                <th className="px-4 py-3.5">Current Status</th>
                <th className="px-4 py-3.5">HTTP / Response Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    {incidents.length === 0
                      ? 'No incidents detected. All monitored APIs are healthy.'
                      : 'No incidents match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => {
                  const meta = TYPE_META[inc.type];
                  return (
                    <tr key={inc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900">{inc.apiName}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}
                        >
                          {meta.icon}
                          {inc.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <span title={new Date(inc.detectedAt).toLocaleString()}>
                          {formatTimeAgo(inc.detectedAt)}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {inc.status === 'OPEN' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Resolved{' '}
                            {inc.resolvedAt && (
                              <span className="ml-1 text-emerald-600/70 font-normal">
                                {formatTimeAgo(inc.resolvedAt)}
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={
                              inc.httpStatus
                                ? inc.httpStatus >= 500
                                  ? 'text-red-600 font-semibold'
                                  : inc.httpStatus >= 400
                                  ? 'text-orange-600 font-semibold'
                                  : 'text-slate-700'
                                : 'text-slate-400'
                            }
                          >
                            {inc.httpStatus ? `HTTP ${inc.httpStatus}` : 'No Response'}
                          </span>
                          {inc.responseTime !== undefined && (
                            <span className="text-slate-400">&bull; {inc.responseTime}ms</span>
                          )}
                        </div>
                        {inc.error && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]" title={inc.error}>
                            {inc.error}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
