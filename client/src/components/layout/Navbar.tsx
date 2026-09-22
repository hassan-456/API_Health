import React from 'react';
import {
  Activity,
  Server,
  LayoutDashboard,
  Radio,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Database,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'overview' | 'endpoints' | 'matrix' | 'settings';
  onTabChange: (tab: 'overview' | 'endpoints' | 'matrix' | 'settings') => void;
  onOpenAddModal: () => void;
  onRunAllChecks: () => void;
  isCheckingAll: boolean;
  isLiveBackend: boolean;
  onRefreshStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onRunAllChecks,
  isCheckingAll,
  isLiveBackend,
  onRefreshStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <div
              onClick={() => onTabChange('overview')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Activity className="w-5 h-5 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-white font-mono">
                    Pulse<span className="text-indigo-400">Watch</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded uppercase">
                    v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  API Health & Performance Engine
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <button
                onClick={() => onTabChange('overview')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => onTabChange('endpoints')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'endpoints'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Endpoints</span>
              </button>

              <button
                onClick={() => onTabChange('matrix')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Live Matrix</span>
              </button>

              <button
                onClick={() => onTabChange('settings')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Backend Status Badge */}
            <div
              onClick={onRefreshStatus}
              title={
                isLiveBackend
                  ? 'Connected to live Express backend'
                  : 'Backend server is offline or MongoDB is down. Running in interactive Demo Mode.'
              }
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                isLiveBackend
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/50 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-700/50 hover:bg-amber-900/40'
              }`}
            >
              {isLiveBackend ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Server</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>

            {/* Run All Checks Button */}
            <button
              onClick={onRunAllChecks}
              disabled={isCheckingAll}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all hover:border-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-400 ${
                  isCheckingAll ? 'animate-spin text-indigo-400' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {isCheckingAll ? 'Checking...' : 'Run All Checks'}
              </span>
            </button>

            {/* Add Endpoint Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Endpoint</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-900">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'overview' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => onTabChange('endpoints')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'endpoints' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Endpoints</span>
          </button>
          <button
            onClick={() => onTabChange('matrix')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'matrix' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Matrix</span>
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
