import React, { useState, useEffect } from 'react';
import { X, Server } from 'lucide-react';
import type { ApiEndpoint, CreateEndpointDto, HttpMethod } from '../../types';

interface EndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateEndpointDto) => Promise<void>;
  initialData?: ApiEndpoint | null;
}

export const EndpointModal: React.FC<EndpointModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [threshold, setThreshold] = useState<number>(300);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setUrl(initialData.url);
      setMethod(initialData.method);
      setThreshold(initialData.threshold);
      setIsActive(initialData.isActive);
    } else {
      setName('');
      setUrl('');
      setMethod('GET');
      setThreshold(300);
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Endpoint name is required');
      return;
    }
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        url: url.trim(),
        method,
        threshold: Number(threshold) || 300,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save endpoint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {initialData ? 'Edit Endpoint' : 'Register New Endpoint'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Authentication Microservice"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* URL & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Endpoint URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.domain.com/v1/health"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Threshold SLA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Latency Alert Threshold (ms)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {threshold} ms
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <input
                type="number"
                min="50"
                max="10000"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Checks taking longer than this SLA will be flagged as "Degraded".
            </p>
          </div>

          {/* Active status */}
          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 accent-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 text-xs">
                  Active Monitoring
                </span>
                <p className="text-[11px] text-slate-400">
                  Enable automated health checks and SLA evaluation for this API.
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
