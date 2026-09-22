import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Radio,
} from 'lucide-react';
import type { RecentCheckWithEndpoint } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface ActivityFeedProps {
  recentChecks: RecentCheckWithEndpoint[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ recentChecks }) => {
  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
          <h3 className="text-base font-semibold text-slate-900">Live Activity Feed</h3>
        </div>
        <span className="text-xs text-slate-500">
          Last {recentChecks.length} checks
        </span>
      </div>

      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {recentChecks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No health checks recorded yet.
          </div>
        ) : (
          recentChecks.map((check) => {
            const isError = !check.success;
            const isSlow = check.thresholdExceeded;

            return (
              <div
                key={check._id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isError ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : isSlow ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>

                  {/* API details */}
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {check.apiName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 text-slate-500">
                        {check.method}
                      </span>
                    </div>

                    {check.error ? (
                      <p className="text-[11px] text-rose-600 truncate mt-0.5">
                        {check.error}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Status Code: <span className="font-mono text-slate-700">{check.httpStatus || 200} OK</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Latency & Timestamp */}
                <div className="text-right shrink-0 ml-3">
                  <div className="font-mono font-semibold">
                    <span
                      className={
                        isError
                          ? 'text-rose-600'
                          : isSlow
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }
                    >
                      {check.responseTime} ms
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatTimeAgo(check.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
