import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  BarChart3,
  ListOrdered,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { ApiEndpoint, HealthCheck } from '../../types';
import { api } from '../../services/api';
import { formatTimeAgo } from '../../lib/utils';
import { classifyIncident } from '../../lib/incidentClassifier';

interface EndpointDetailModalProps {
  endpoint: ApiEndpoint | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckEndpoint: (id: string) => Promise<void>;
  isChecking: boolean;
}

export const EndpointDetailModal: React.FC<EndpointDetailModalProps> = ({
  endpoint,
  isOpen,
  onClose,
  onCheckEndpoint,
  isChecking,
}) => {
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && endpoint) {
      loadHistory();
    }
  }, [isOpen, endpoint]);

  const loadHistory = async () => {
    if (!endpoint) return;
    try {
      setIsLoading(true);
      const res = await api.getEndpointHistory(endpoint._id);
      setHistory(res.checks);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !endpoint) return null;

  const chartData = [...history]
    .reverse()
    .slice(-15)
    .map((c, i) => ({
      index: i + 1,
      latency: c.responseTime || 0,
      threshold: endpoint.threshold,
      time: new Date(c.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: c.success ? (c.thresholdExceeded ? 'slow' : 'healthy') : 'failed',
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                endpoint.method === 'GET'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {endpoint.method}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">
                {endpoint.name}
              </h3>
              <a
                href={endpoint.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-indigo-600 font-mono mt-1 inline-flex items-center space-x-1"
              >
                <span>{endpoint.url}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCheckEndpoint(endpoint._id).then(loadHistory)}
              disabled={isChecking || !endpoint.isActive}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Check</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Status</span>
              <div className="font-bold text-sm">
                {!endpoint.isActive ? (
                  <span className="text-slate-500">Inactive</span>
                ) : !endpoint.lastCheck ? (
                  <span className="text-slate-500">Pending</span>
                ) : !endpoint.lastCheck.success ? (
                  <span className="text-rose-600">
                    {classifyIncident({
                      success: endpoint.lastCheck.success,
                      httpStatus: endpoint.lastCheck.httpStatus,
                      thresholdExceeded: endpoint.lastCheck.thresholdExceeded,
                    })?.label || 'Service Unavailable'}
                  </span>
                ) : endpoint.lastCheck.thresholdExceeded ? (
                  <span className="text-amber-600">Slow Response</span>
                ) : (
                  <span className="text-emerald-600">Healthy</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Latest Latency</span>
              <div className="font-mono font-bold text-sm text-slate-900">
                {endpoint.lastCheck?.responseTime || 0} ms
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block mb-1">Target SLA</span>
              <div className="font-mono font-bold text-sm text-indigo-600">
                {endpoint.threshold} ms
              </div>
            </div>
          </div>

          {/* Latency History Chart */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                  Recent Response Latencies
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Threshold: {endpoint.threshold}ms
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="glass-panel p-2 rounded text-xs border border-slate-200">
                            <span className="text-slate-500">{d.time}:</span>{' '}
                            <span className="font-mono font-bold text-slate-900">{d.latency}ms</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={endpoint.threshold} stroke="#f43f5e" strokeDasharray="3 3" />
                  <Bar
                    dataKey="latency"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Log Table */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ListOrdered className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Historical Health Checks
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Result</th>
                    <th className="px-4 py-2.5">Status Code</th>
                    <th className="px-4 py-2.5">Response Time</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                        Loading history...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        No historical checks available.
                      </td>
                    </tr>
                  ) : (
                    history.slice(0, 8).map((c) => (
                      <tr key={c._id} className="hover:bg-slate-100">
                        <td className="px-4 py-2.5 flex items-center space-x-1.5">
                          {!c.success ? (
                            <span className="text-rose-600 flex items-center space-x-1 font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </span>
                          ) : c.thresholdExceeded ? (
                            <span className="text-amber-600 flex items-center space-x-1 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Slow</span>
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center space-x-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>OK</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono">
                          {c.httpStatus || 'ERR'}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold">
                          <span
                            className={
                              !c.success
                                ? 'text-rose-600'
                                : c.thresholdExceeded
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {c.responseTime} ms
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {formatTimeAgo(c.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
