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
import { classifyIncident } from '../../lib/incidentClassifier';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POST':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadge = (endpoint: ApiEndpoint) => {
    if (!endpoint.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Inactive
        </span>
      );
    }

    const check = endpoint.lastCheck;
    if (!check) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <Clock className="w-3 h-3 mr-1 text-slate-400" />
          Pending
        </span>
      );
    }

    if (!check.success) {
      const classification = classifyIncident({
        success: check.success,
        httpStatus: check.httpStatus,
        thresholdExceeded: check.thresholdExceeded,
      });
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 shadow-sm shadow-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
          {classification?.label || 'Service Unavailable'}
        </span>
      );
    }

    if (check.thresholdExceeded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Slow Response ({check.responseTime}ms)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Healthy ({check.responseTime}ms)
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">API Service</th>
              <th className="px-4 py-3.5">Method & URL</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Latency / SLA</th>
              <th className="px-4 py-3.5">Last Checked</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {endpoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
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
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* Name & Active status */}
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => onSelectEndpoint(ep)}
                          className="hover:text-indigo-600 transition-colors text-left flex items-center space-x-2"
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
                          className="text-slate-500 hover:text-indigo-600 truncate max-w-[200px] lg:max-w-[280px] inline-flex items-center space-x-1 group-hover:text-slate-600 transition-colors"
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
                                check.thresholdExceeded ? 'text-amber-600 font-semibold' : 'text-slate-700'
                              }
                            >
                              {check.responseTime}ms
                            </span>
                            <span className="text-slate-500">max {ep.threshold}ms</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
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
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : !ep.isActive
                              ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100 border border-slate-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white shadow-sm'
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
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditEndpoint(ep)}
                          title="Edit Configuration"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteEndpoint(ep._id)}
                          title="Delete Endpoint"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
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
