import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Clock } from 'lucide-react';
import type { DashboardStats } from '../../types';

interface LatencyChartProps {
  stats: DashboardStats;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ stats }) => {
  const [range, setRange] = useState<'1h' | '6h' | '24h'>('24h');

  // Multipliers or data adjusters based on range
  const chartData = stats.latencyTrend || [
    { time: '00:00', avgLatency: 120, threshold: 300 },
    { time: '04:00', avgLatency: 145, threshold: 300 },
    { time: '08:00', avgLatency: 190, threshold: 300 },
    { time: '12:00', avgLatency: 285, threshold: 300 },
    { time: '16:00', avgLatency: 210, threshold: 300 },
    { time: '20:00', avgLatency: stats.avgResponseTime || 160, threshold: 300 },
  ];

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              System Latency Timeline
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800/40">
              Live Aggregations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global average latency response curve vs 300ms SLA target
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
          {(['1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}ms`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-3 rounded-lg border border-slate-700 text-xs shadow-xl">
                      <div className="text-slate-400 font-mono mb-1">{label}</div>
                      <div className="flex items-center space-x-2 text-white font-semibold">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span>Avg Latency:</span>
                        <span className="font-mono text-indigo-300">{data.avgLatency} ms</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400 mt-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400/80" />
                        <span>SLA Threshold:</span>
                        <span className="font-mono text-rose-300">{data.threshold} ms</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={300}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: '300ms SLA Alert Line',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'top',
              }}
            />
            <Area
              type="monotone"
              dataKey="avgLatency"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Recorded Response Time</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 rounded-sm bg-rose-500"></span>
            <span>Breach Threshold</span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Last updated: Just now
        </span>
      </div>
    </div>
  );
};
