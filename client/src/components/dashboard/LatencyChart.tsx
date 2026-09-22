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

const RANGE_HOURS = { '1h': 1, '6h': 6, '24h': 24 } as const;

export const LatencyChart: React.FC<LatencyChartProps> = ({ stats }) => {
  const [range, setRange] = useState<'1h' | '6h' | '24h'>('24h');

  const chartData = (stats.latencyTrend ?? []).filter((point) => {
    if (!point.at) return true;
    const ageMs = Date.now() - new Date(point.at).getTime();
    return ageMs <= RANGE_HOURS[range] * 60 * 60 * 1000;
  });

  const sla = chartData[0]?.threshold ?? 300;
  const peak = Math.max(sla, ...chartData.map((point) => point.avgLatency), 0);
  const yMax = Math.max(100, Math.ceil((peak * 1.25) / 50) * 50);

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900">
              System Latency Timeline
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded-full border border-indigo-200">
              Live Aggregations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recorded response times vs the {sla}ms SLA target
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
          {(['1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No health checks in the last {range}.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
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
              width={64}
              tickLine={false}
              axisLine={false}
              domain={[0, yMax]}
              allowDecimals={false}
              tickFormatter={(v) => `${v}ms`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-3 rounded-lg border border-slate-200 text-xs shadow-xl">
                      <div className="text-slate-500 font-mono mb-1">{label}</div>
                      <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Avg Latency:</span>
                        <span className="font-mono text-indigo-600">{data.avgLatency} ms</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500 mt-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400/80" />
                        <span>SLA Threshold:</span>
                        <span className="font-mono text-rose-600">{data.threshold} ms</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={sla}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{
                value: `${sla}ms SLA`,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Area
              type="monotone"
              dataKey="avgLatency"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
              dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-3 border-t border-slate-200">
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
        <span className="text-[11px] font-mono text-slate-500">
          Last updated: Just now
        </span>
      </div>
    </div>
  );
};
