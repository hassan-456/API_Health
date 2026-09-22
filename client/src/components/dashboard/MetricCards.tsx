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
          <span className="text-xs font-medium text-slate-500">Total APIs</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.totalApis}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="text-indigo-600 font-semibold">{stats.activeApis}</span> active
          </div>
        </div>
      </div>

      {/* Healthy */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Healthy</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
            {stats.healthyApis}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="text-emerald-600 font-medium">{healthyPercent}%</span> normal
          </div>
        </div>
      </div>

      {/* Slow / Degraded */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Degraded</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600">
            {stats.slowApis}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Threshold breached</div>
        </div>
      </div>

      {/* Outages / Failed */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Down / Outage</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600">
            {stats.failedApis}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.failedApis > 0 ? (
              <span className="text-rose-600 font-semibold">Immediate attention</span>
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
          <span className="text-xs font-medium text-slate-500">Avg Latency</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
            {stats.avgResponseTime}
            <span className="text-sm font-sans font-normal text-slate-500 ml-1">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across active APIs</div>
        </div>
      </div>

      {/* System Uptime */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Global Uptime</span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-600">
            {stats.uptimePercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Last 30 days</div>
        </div>
      </div>
    </div>
  );
};
