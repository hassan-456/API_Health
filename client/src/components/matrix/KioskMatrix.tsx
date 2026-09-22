import React, { useState } from 'react';
import {
  Activity,
  Play,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Radio,
} from 'lucide-react';
import type { ApiEndpoint } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface KioskMatrixProps {
  endpoints: ApiEndpoint[];
  checkingIds: Set<string>;
  onCheckEndpoint: (id: string) => void;
  onSelectEndpoint: (endpoint: ApiEndpoint) => void;
}

export const KioskMatrix: React.FC<KioskMatrixProps> = ({
  endpoints,
  checkingIds,
  onCheckEndpoint,
  onSelectEndpoint,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'HEALTHY' | 'SLOW' | 'FAILED'>('ALL');

  const filtered = endpoints.filter((ep) => {
    if (filter === 'ALL') return true;
    if (!ep.isActive) return false;
    if (!ep.lastCheck) return false;
    if (filter === 'FAILED') return !ep.lastCheck.success;
    if (filter === 'SLOW') return ep.lastCheck.success && ep.lastCheck.thresholdExceeded;
    if (filter === 'HEALTHY') return ep.lastCheck.success && !ep.lastCheck.thresholdExceeded;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Live Service Health Matrix
            </h2>
            <p className="text-xs text-slate-400">
              High-visibility NOC & cluster operations monitoring view
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          {(['ALL', 'HEALTHY', 'SLOW', 'FAILED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Services' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((ep) => {
          const isChecking = checkingIds.has(ep._id);
          const check = ep.lastCheck;

          let statusTheme = {
            border: 'border-slate-800',
            bgGlow: 'bg-slate-500/5',
            icon: <Activity className="w-5 h-5 text-slate-400" />,
            badge: 'bg-slate-800 text-slate-400',
            text: 'text-slate-400',
            label: 'Inactive',
            glowClass: '',
          };

          if (ep.isActive) {
            if (!check) {
              statusTheme = {
                border: 'border-slate-700',
                bgGlow: 'bg-slate-500/10',
                icon: <Activity className="w-5 h-5 text-slate-400" />,
                badge: 'bg-slate-800 text-slate-300',
                text: 'text-slate-300',
                label: 'Pending',
                glowClass: '',
              };
            } else if (!check.success) {
              statusTheme = {
                border: 'border-rose-600/50',
                bgGlow: 'bg-rose-500/10',
                icon: <ShieldX className="w-5 h-5 text-rose-400 animate-pulse" />,
                badge: 'bg-rose-950/80 text-rose-300 border border-rose-700/50',
                text: 'text-rose-400',
                label: `OUTAGE (${check.httpStatus || 'ERR'})`,
                glowClass: 'glow-rose',
              };
            } else if (check.thresholdExceeded) {
              statusTheme = {
                border: 'border-amber-600/50',
                bgGlow: 'bg-amber-500/10',
                icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
                badge: 'bg-amber-950/80 text-amber-300 border border-amber-700/50',
                text: 'text-amber-400',
                label: 'DEGRADED',
                glowClass: 'glow-amber',
              };
            } else {
              statusTheme = {
                border: 'border-emerald-600/40',
                bgGlow: 'bg-emerald-500/10',
                icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
                badge: 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50',
                text: 'text-emerald-400',
                label: 'OPERATIONAL',
                glowClass: 'glow-emerald',
              };
            }
          }

          return (
            <div
              key={ep._id}
              className={`glass-panel rounded-xl p-5 border ${statusTheme.border} ${statusTheme.glowClass} flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}
            >
              {/* Background gradient */}
              <div
                className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none ${statusTheme.bgGlow}`}
              />

              <div>
                {/* Header with status badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ep.method === 'GET'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusTheme.badge}`}
                    >
                      {statusTheme.label}
                    </span>
                  </div>

                  <div className="flex items-center">{statusTheme.icon}</div>
                </div>

                {/* Service Name & URL */}
                <h3
                  onClick={() => onSelectEndpoint(ep)}
                  className="font-bold text-white text-base truncate cursor-pointer hover:text-indigo-400 transition-colors"
                >
                  {ep.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5 flex items-center space-x-1">
                  <span className="truncate">{ep.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                </p>

                {/* Latency Number */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Response Latency
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span
                      className={`text-2xl font-extrabold font-mono ${statusTheme.text}`}
                    >
                      {check ? check.responseTime : '—'}
                    </span>
                    {check && <span className="text-xs text-slate-400 font-mono">ms</span>}
                    <span className="text-xs text-slate-500 ml-auto font-mono">
                      Target &lt;{ep.threshold}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {formatTimeAgo(check?.timestamp)}
                </span>

                <button
                  onClick={() => onCheckEndpoint(ep._id)}
                  disabled={isChecking || !ep.isActive}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors disabled:opacity-40"
                >
                  {isChecking ? (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-indigo-400" />
                  )}
                  <span>Ping</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
