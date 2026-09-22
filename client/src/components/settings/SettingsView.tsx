import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { api, checkBackendConnection } from '../../services/api';

interface SettingsViewProps {
  isLiveBackend: boolean;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isLiveBackend,
  onRefreshAll,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const connected = await checkBackendConnection();
    setTesting(false);
    if (connected) {
      setTestResult('Successfully connected to live Express + MongoDB backend!');
      onRefreshAll();
    } else {
      setTestResult(
        'Backend server unreachable or MongoDB not yet running. The app will continue seamlessly in interactive Demo Mode.'
      );
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all demo endpoints and historical checks back to default?')) {
      api.resetDemoData();
      onRefreshAll();
      alert('Demo data has been reset to defaults!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight">
          System Settings & Environment Diagnostics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor your server connectivity, configure health check engine parameters, or reset demo state.
        </p>
      </div>

      {/* Backend & DB Status Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLiveBackend
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Backend Connection Status
              </h3>
              <p className="text-xs text-slate-400">
                PulseWatch Express API &bull; Port 5001
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                isLiveBackend
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}
            >
              {isLiveBackend ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Backend Connected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Demo Mode Active</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Click to probe <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono">http://localhost:5001/api/endpoints</code>:
          </p>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing Connection...' : 'Test Backend Connection'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs border ${
              isLiveBackend
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/50 border-amber-800 text-amber-300'
            }`}
          >
            {testResult}
          </div>
        )}

        {/* Instructions for starting MongoDB */}
        {!isLiveBackend && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
              <Terminal className="w-4 h-4" />
              <span>To connect live MongoDB & Backend:</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you wish to use MongoDB locally, ensure MongoDB is running or configure MongoDB Atlas in <code className="text-slate-300">server/.env</code>:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 space-y-1">
              <div className="text-slate-500"># Option 1: Start MongoDB locally via brew</div>
              <div>brew services start mongodb/brew/mongodb-community</div>
              <div className="text-slate-500 mt-2"># Option 2: Run server in dev mode</div>
              <div>cd server && npm run dev</div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Data Management */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Reset Demo Environment</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Restores the 7 default microservice endpoints (User, Auth, Checkout, Stripe, Inventory, Telemetry, Webhook) and resets historical data.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
