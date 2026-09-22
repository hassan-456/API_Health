import React from 'react';
import {
  Play,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  Loader2,
  Clock,
} from 'lucide-react';
import type { ApiEndpoint } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface EndpointTableProps {
  endpoints: ApiEndpoint[];
  checkingIds: Set<string>;
  onCheckEndpoint: (id: string) => void;
  onEditEndpoint: (endpoint: ApiEndpoint) => void;
  onDeleteEndpoint: (id: string) => void;
  onSelectEndpoint: (endpoint: ApiEndpoint) => void;
}

export const EndpointTable: React.FC<EndpointTableProps> = ({
  endpoints,
  checkingIds,
  onCheckEndpoint,
  onEditEndpoint,
  onDeleteEndpoint,
  onSelectEndpoint,
}) => {
  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
      case 'POST':
        return 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/50';
      case 'DELETE':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (endpoint: ApiEndpoint) => {
    if (!endpoint.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
          Inactive
        </span>
      );
    }

    const check = endpoint.lastCheck;
    if (!check) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700">
          <Clock className="w-3 h-3 mr-1 text-slate-400" />
          Pending
        </span>
      );
    }

    if (!check.success) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/70 text-rose-300 border border-rose-700/60 shadow-sm shadow-rose-900/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-pulse" />
          Down ({check.httpStatus || 'Err'})
        </span>
      );
    }

    if (check.thresholdExceeded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          Degraded ({check.responseTime}ms)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 shadow-sm shadow-emerald-900/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
        Healthy ({check.responseTime}ms)
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">API Service</th>
              <th className="px-4 py-3.5">Method & URL</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Latency / SLA</th>
              <th className="px-4 py-3.5">Last Checked</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {endpoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No endpoints configured yet. Click "+ Add Endpoint" to register one.
                </td>
              </tr>
            ) : (
              endpoints.map((ep) => {
                const isChecking = checkingIds.has(ep._id);
                const check = ep.lastCheck;
                const responseTime = check?.responseTime || 0;
                const percent = Math.min(100, Math.round((responseTime / ep.threshold) * 100));

                return (
                  <tr
                    key={ep._id}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    {/* Name & Active status */}
                    <td className="px-5 py-4 font-medium text-white">
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => onSelectEndpoint(ep)}
                          className="hover:text-indigo-400 transition-colors text-left flex items-center space-x-2"
                        >
                          <span className="font-semibold text-sm">{ep.name}</span>
                        </button>
                      </div>
                    </td>

                    {/* Method & URL */}
                    <td className="px-4 py-4 font-mono text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getMethodBadgeClass(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <a
                          href={ep.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-300 truncate max-w-[200px] lg:max-w-[280px] inline-flex items-center space-x-1 group-hover:text-slate-300 transition-colors"
                          title={ep.url}
                        >
                          <span className="truncate">{ep.url}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(ep)}
                    </td>

                    {/* Latency / SLA */}
                    <td className="px-4 py-4 min-w-[160px]">
                      {ep.isActive && check ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-mono">
                            <span
                              className={
                                check.thresholdExceeded ? 'text-amber-400 font-semibold' : 'text-slate-300'
                              }
                            >
                              {check.responseTime}ms
                            </span>
                            <span className="text-slate-500">max {ep.threshold}ms</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                !check.success
                                  ? 'bg-rose-500'
                                  : check.thresholdExceeded
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Last Checked */}
                    <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(check?.timestamp)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Test Now Button */}
                        <button
                          onClick={() => onCheckEndpoint(ep._id)}
                          disabled={isChecking || !ep.isActive}
                          title={ep.isActive ? 'Run Health Check Now' : 'Endpoint is inactive'}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            isChecking
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                              : !ep.isActive
                              ? 'opacity-30 cursor-not-allowed text-slate-500 bg-slate-900 border border-slate-800'
                              : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white shadow-sm'
                          }`}
                        >
                          {isChecking ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Pinging</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Test</span>
                            </>
                          )}
                        </button>

                        {/* Inspect details */}
                        <button
                          onClick={() => onSelectEndpoint(ep)}
                          title="View Details & Check History"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditEndpoint(ep)}
                          title="Edit Configuration"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteEndpoint(ep._id)}
                          title="Delete Endpoint"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
