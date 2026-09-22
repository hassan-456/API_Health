import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Navbar, type AppTab } from './components/layout/Navbar';
import { MetricCards } from './components/dashboard/MetricCards';
import { LatencyChart } from './components/dashboard/LatencyChart';
import { EndpointTable } from './components/dashboard/EndpointTable';
import { ActivityFeed } from './components/dashboard/ActivityFeed';
import { KioskMatrix } from './components/matrix/KioskMatrix';
import { IncidentsPanel } from './components/incidents/IncidentsPanel';
import { SettingsView } from './components/settings/SettingsView';
import { EndpointModal } from './components/modals/EndpointModal';
import { EndpointDetailModal } from './components/modals/EndpointDetailModal';
import { api, checkBackendConnection } from './services/api';
import type {
  ApiEndpoint,
  DashboardStats,
  CreateEndpointDto,
  Incident,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(false);
  const [, setIsLoading] = useState<boolean>(true);
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [isCheckingAll, setIsCheckingAll] = useState<boolean>(false);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Search & Filters for Endpoints tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'HEALTHY' | 'SLOW' | 'FAILED' | 'INACTIVE'
  >('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpoint | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Notification / toast banner
  const [banner, setBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showBanner = (
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const backendAlive = await checkBackendConnection();
      setIsLiveBackend(backendAlive);

      const [eps, dashStats, incs] = await Promise.all([
        api.getEndpoints(),
        api.getDashboard(),
        api.getIncidents(),
      ]);
      setEndpoints(eps);
      setStats(dashStats);
      setIncidents(incs);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshIncidents = useCallback(async () => {
    setIsLoadingIncidents(true);
    try {
      const incs = await api.getIncidents();
      setIncidents(incs);
    } catch (err: any) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Execute check on a single endpoint
  const handleCheckEndpoint = async (id: string) => {
    setCheckingIds((prev) => new Set(prev).add(id));
    try {
      const check = await api.executeCheck(id);
      const [updatedEndpoints, updatedStats, updatedIncidents] = await Promise.all([
        api.getEndpoints(),
        api.getDashboard(),
        api.getIncidents(),
      ]);
      setEndpoints(updatedEndpoints);
      setStats(updatedStats);
      setIncidents(updatedIncidents);

      // Also update selectedEndpoint if modal is open
      if (selectedEndpoint && selectedEndpoint._id === id) {
        const found = updatedEndpoints.find((e) => e._id === id);
        if (found) setSelectedEndpoint(found);
      }

      const ep = updatedEndpoints.find((e) => e._id === id);
      if (check.success) {
        showBanner(
          `${ep?.name || 'Endpoint'} responded in ${check.responseTime}ms (${
            check.thresholdExceeded ? 'Degraded SLA' : 'Healthy'
          })`,
          check.thresholdExceeded ? 'info' : 'success'
        );
      } else {
        showBanner(
          `Check failed for ${ep?.name || 'Endpoint'}: ${
            check.error || 'Connection error'
          }`,
          'error'
        );
      }
    } catch (err: any) {
      showBanner(`Check failed: ${err.message}`, 'error');
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Run checks on all active endpoints sequentially
  const handleRunAllChecks = async () => {
    const active = endpoints.filter((e) => e.isActive);
    if (active.length === 0) {
      showBanner('No active endpoints to check', 'info');
      return;
    }

    setIsCheckingAll(true);
    showBanner(`Initiating health check on ${active.length} active services...`, 'info');

    for (const ep of active) {
      setCheckingIds((prev) => new Set(prev).add(ep._id));
      try {
        await api.executeCheck(ep._id);
      } catch {
        // continue with other endpoints
      } finally {
        setCheckingIds((prev) => {
          const next = new Set(prev);
          next.delete(ep._id);
          return next;
        });
      }
    }

    const [updatedEndpoints, updatedStats, updatedIncidents] = await Promise.all([
      api.getEndpoints(),
      api.getDashboard(),
      api.getIncidents(),
    ]);
    setEndpoints(updatedEndpoints);
    setStats(updatedStats);
    setIncidents(updatedIncidents);
    setIsCheckingAll(false);
    showBanner('Completed health checks across all services', 'success');
  };

  // Save new or edited endpoint
  const handleSaveEndpoint = async (data: CreateEndpointDto) => {
    if (editingEndpoint) {
      await api.updateEndpoint(editingEndpoint._id, data);
      showBanner(`Endpoint "${data.name}" updated successfully`);
      setEditingEndpoint(null);
    } else {
      await api.createEndpoint(data);
      showBanner(`Endpoint "${data.name}" registered and checked!`);
    }
    const [updated, dash, incs] = await Promise.all([
      api.getEndpoints(),
      api.getDashboard(),
      api.getIncidents(),
    ]);
    setEndpoints(updated);
    setStats(dash);
    setIncidents(incs);
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (id: string) => {
    const ep = endpoints.find((e) => e._id === id);
    if (confirm(`Are you sure you want to delete "${ep?.name || 'this endpoint'}"?`)) {
      await api.deleteEndpoint(id);
      showBanner(`Endpoint "${ep?.name}" deleted`);
      const [updated, dash, incs] = await Promise.all([
        api.getEndpoints(),
        api.getDashboard(),
        api.getIncidents(),
      ]);
      setEndpoints(updated);
      setStats(dash);
      setIncidents(incs);
    }
  };

  // Filtered endpoints for Endpoints tab
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ep.name.toLowerCase().includes(q);
        const matchesUrl = ep.url.toLowerCase().includes(q);
        if (!matchesName && !matchesUrl) return false;
      }

      // Method filter
      if (methodFilter !== 'ALL' && ep.method !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'INACTIVE') return !ep.isActive;
      if (!ep.isActive && statusFilter !== 'ALL') return false;

      if (statusFilter === 'FAILED') return ep.lastCheck && !ep.lastCheck.success;
      if (statusFilter === 'SLOW')
        return ep.lastCheck && ep.lastCheck.success && ep.lastCheck.thresholdExceeded;
      if (statusFilter === 'HEALTHY')
        return ep.lastCheck && ep.lastCheck.success && !ep.lastCheck.thresholdExceeded;

      return true;
    });
  }, [endpoints, searchQuery, statusFilter, methodFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingEndpoint(null);
          setIsAddModalOpen(true);
        }}
        onRunAllChecks={handleRunAllChecks}
        isCheckingAll={isCheckingAll}
        isLiveBackend={isLiveBackend}
        onRefreshStatus={fetchData}
        openIncidentsCount={stats?.openIncidents ?? 0}
      />

      {/* Global Notification Banner */}
      {banner && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold border ${
              banner.type === 'error'
                ? 'bg-white text-rose-700 border-rose-200 shadow-rose-200/60'
                : banner.type === 'info'
                ? 'bg-white text-indigo-700 border-indigo-200 shadow-indigo-200/60'
                : 'bg-white text-emerald-700 border-emerald-200 shadow-emerald-200/60'
            } backdrop-blur-lg`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{banner.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            {stats && <MetricCards stats={stats} />}

            {/* Open Incidents Alert Strip */}
            {stats && stats.openIncidents > 0 && (
              <button
                onClick={() => setActiveTab('incidents')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="text-sm font-semibold text-rose-700">
                    {stats.openIncidents} open incident{stats.openIncidents === 1 ? '' : 's'} detected
                  </span>
                  <span className="text-xs text-rose-600/80 hidden sm:inline">
                    Service outages, errors, or SLA breaches need attention
                  </span>
                </div>
                <span className="text-xs font-semibold text-rose-700 shrink-0">
                  View Incidents &rarr;
                </span>
              </button>
            )}

            {/* Performance Timeline Chart & Live Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {stats && <LatencyChart stats={stats} />}
              </div>
              <div className="lg:col-span-1">
                {stats && <ActivityFeed recentChecks={stats.recentChecks} />}
              </div>
            </div>

            {/* Endpoints Table Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Active Endpoints Roster
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time status and latency telemetry across registered microservices
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('endpoints')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View All ({endpoints.length}) &rarr;
                </button>
              </div>

              <EndpointTable
                endpoints={endpoints}
                checkingIds={checkingIds}
                onCheckEndpoint={handleCheckEndpoint}
                onEditEndpoint={(ep) => {
                  setEditingEndpoint(ep);
                  setIsAddModalOpen(true);
                }}
                onDeleteEndpoint={handleDeleteEndpoint}
                onSelectEndpoint={(ep) => {
                  setSelectedEndpoint(ep);
                  setIsDetailModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === 'endpoints' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Header & Controls */}
            <div className="glass-panel p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  API Endpoints Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Configure targets, latency thresholds, and probe microservices
                </p>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search input */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or URL..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="HEALTHY">Healthy</option>
                  <option value="SLOW">Degraded</option>
                  <option value="FAILED">Failed</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                {/* Method Filter */}
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-mono"
                >
                  <option value="ALL">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                {/* Add Endpoint */}
                <button
                  onClick={() => {
                    setEditingEndpoint(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register API</span>
                </button>
              </div>
            </div>

            {/* Endpoints Table */}
            <EndpointTable
              endpoints={filteredEndpoints}
              checkingIds={checkingIds}
              onCheckEndpoint={handleCheckEndpoint}
              onEditEndpoint={(ep) => {
                setEditingEndpoint(ep);
                setIsAddModalOpen(true);
              }}
              onDeleteEndpoint={handleDeleteEndpoint}
              onSelectEndpoint={(ep) => {
                setSelectedEndpoint(ep);
                setIsDetailModalOpen(true);
              }}
            />
          </div>
        )}

        {/* MATRIX / KIOSK TAB */}
        {activeTab === 'matrix' && (
          <div className="animate-in fade-in duration-300">
            <KioskMatrix
              endpoints={endpoints}
              checkingIds={checkingIds}
              onCheckEndpoint={handleCheckEndpoint}
              onSelectEndpoint={(ep) => {
                setSelectedEndpoint(ep);
                setIsDetailModalOpen(true);
              }}
            />
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div className="animate-in fade-in duration-300">
            <IncidentsPanel
              incidents={incidents}
              isLoading={isLoadingIncidents}
              onRefresh={refreshIncidents}
            />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300">
            <SettingsView
              isLiveBackend={isLiveBackend}
              onRefreshAll={fetchData}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping-slow"></span>
            <span className="font-mono text-slate-500">
              PulseWatch Engine Active
            </span>
          </div>
          <div>
            Built with React 19, TypeScript, Tailwind CSS & Express.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EndpointModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEndpoint}
        initialData={editingEndpoint}
      />

      <EndpointDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        endpoint={selectedEndpoint}
        onCheckEndpoint={handleCheckEndpoint}
        isChecking={selectedEndpoint ? checkingIds.has(selectedEndpoint._id) : false}
      />
    </div>
  );
}

export default App;
