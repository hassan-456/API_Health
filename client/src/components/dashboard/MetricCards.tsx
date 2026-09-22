import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats } from '../../types';

interface MetricCardsProps {
  stats: DashboardStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  const healthyPercent =
    stats.activeApis > 0
      ? Math.round((stats.healthyApis / stats.activeApis) * 100)
      : 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Total Endpoints */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total APIs</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {stats.totalApis}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-indigo-400 font-semibold">{stats.activeApis}</span> active
          </div>
        </div>
      </div>

      {/* Healthy */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Healthy</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {stats.healthyApis}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-emerald-400 font-medium">{healthyPercent}%</span> normal
          </div>
        </div>
      </div>

      {/* Slow / Degraded */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Degraded</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
            {stats.slowApis}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Threshold breached</div>
        </div>
      </div>

      {/* Outages / Failed */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Down / Outage</span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
            {stats.failedApis}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.failedApis > 0 ? (
              <span className="text-rose-400 font-semibold">Immediate attention</span>
            ) : (
              'Zero downtime'
            )}
          </div>
        </div>
      </div>

      {/* Average Latency */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Avg Latency</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {stats.avgResponseTime}
            <span className="text-sm font-sans font-normal text-slate-400 ml-1">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across active APIs</div>
        </div>
      </div>

      {/* System Uptime */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Global Uptime</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">
            {stats.uptimePercentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Last 30 days</div>
        </div>
      </div>
    </div>
  );
};
