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
  AlertOctagon,
} from 'lucide-react';

export type AppTab = 'overview' | 'endpoints' | 'matrix' | 'incidents' | 'settings';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenAddModal: () => void;
  onRunAllChecks: () => void;
  isCheckingAll: boolean;
  isLiveBackend: boolean;
  onRefreshStatus: () => void;
  openIncidentsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onRunAllChecks,
  isCheckingAll,
  isLiveBackend,
  onRefreshStatus,
  openIncidentsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
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
                  <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                    Pulse<span className="text-indigo-600">Watch</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded uppercase">
                    v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  API Health & Performance Engine
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              <button
                onClick={() => onTabChange('overview')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => onTabChange('endpoints')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'endpoints'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Endpoints</span>
              </button>

              <button
                onClick={() => onTabChange('matrix')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Live Matrix</span>
              </button>

              <button
                onClick={() => onTabChange('incidents')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'incidents'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Incidents</span>
                {openIncidentsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 leading-none">
                    {openIncidentsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('settings')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isLiveBackend ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Server</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Demo Mode</span>
                </>
              )}
            </div>

            {/* Run All Checks Button */}
            <button
              onClick={onRunAllChecks}
              disabled={isCheckingAll}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:border-slate-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  isCheckingAll ? 'animate-spin text-indigo-600' : ''
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
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => onTabChange('endpoints')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'endpoints' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Endpoints</span>
          </button>
          <button
            onClick={() => onTabChange('matrix')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'matrix' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Matrix</span>
          </button>
          <button
            onClick={() => onTabChange('incidents')}
            className={`relative flex flex-col items-center py-1 text-xs ${
              activeTab === 'incidents' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Incidents</span>
            {openIncidentsCount > 0 && (
              <span className="absolute -top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center py-1 text-xs ${
              activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-500'
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
