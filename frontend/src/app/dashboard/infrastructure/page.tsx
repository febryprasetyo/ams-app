'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import MonitoringToolbar from '@/components/infrastructure/MonitoringToolbar';
import AccurateLicenseTable from '@/components/infrastructure/AccurateLicenseTable';
import DatabasePanels from '@/components/infrastructure/DatabasePanels';
import type {
  AccurateLicenseLog,
  AccurateServerMonitoring,
  LicensesResponse,
  MonitoringResponse,
  SyncResponse,
} from '@/components/infrastructure/types';
import { errorMessage } from '@/components/infrastructure/utils';

export default function InfrastructurePage() {
  const [licenses, setLicenses] = useState<AccurateLicenseLog[]>([]);
  const [servers, setServers] = useState<AccurateServerMonitoring[]>([]);
  const [activeTab, setActiveTab] = useState<'licenses' | 'database'>('licenses');
  const [selectedServerId, setSelectedServerId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingServer, setSyncingServer] = useState<number | 'all' | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [licenseResponse, monitoringResponse] = await Promise.all([
        api.get<LicensesResponse>('/infrastructure/accurate'),
        api.get<MonitoringResponse>('/infrastructure/accurate/database'),
      ]);
      setLicenses(licenseResponse.data ?? []);
      setLastSyncedAt(licenseResponse.lastSyncedAt ?? null);
      setServers(monitoringResponse.data ?? []);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Gagal membaca data monitoring Accurate.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote data load is the external synchronization owned by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSync = async (serverId: number | 'all') => {
    setSyncingServer(serverId);
    setError(null);
    try {
      const response = await api.post<SyncResponse>(
        '/infrastructure/accurate/sync',
        serverId === 'all' ? {} : { serverId },
      );
      setLicenses(response.data ?? []);
      const latestSuccess = response.results
        .filter((result) => result.success && result.syncedAt)
        .map((result) => result.syncedAt as string)
        .sort()
        .at(-1);
      if (latestSuccess) setLastSyncedAt(latestSuccess);
      setToast({
        type: response.results.every((result) => result.success) ? 'success' : 'warning',
        text: response.results
          .map((result) =>
            result.success
              ? `${result.hostname}: ${result.licensesCount ?? 0} lisensi`
              : `${result.hostname}: ${result.error || 'gagal'}`,
          )
          .join(' • '),
      });
      await fetchData();
    } catch (requestError: unknown) {
      setToast({ type: 'warning', text: errorMessage(requestError, 'Sinkronisasi lisensi gagal.') });
    } finally {
      setSyncingServer(null);
      window.setTimeout(() => setToast(null), 7000);
    }
  };

  const filteredLicenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return licenses.filter((license) => {
      if (selectedServerId !== 'all' && license.serverId !== selectedServerId) return false;
      if (!query) return true;
      return [license.licenseKey, license.host, license.ip, license.version, license.serverHostname].some(
        (value) => value?.toLowerCase().includes(query),
      );
    });
  }, [licenses, searchQuery, selectedServerId]);

  const visibleServers =
    selectedServerId === 'all' ? servers : servers.filter((server) => server.id === selectedServerId);

  const activeLicenses = licenses.filter(
    (license) =>
      license.status === 'ACTIVE' &&
      (selectedServerId === 'all' || license.serverId === selectedServerId),
  ).length;

  const totalLicenses = licenses.filter(
    (license) => selectedServerId === 'all' || license.serverId === selectedServerId,
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 max-w-xl rounded-2xl border px-5 py-4 text-sm text-white shadow-xl ${
              toast.type === 'success' ? 'border-emerald-500 bg-emerald-600' : 'border-amber-500 bg-amber-600'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex h-40 items-center justify-center text-slate-400 text-sm">
            Memuat data monitoring...
          </div>
        )}

        {!loading && (
          <>
            <MonitoringToolbar
              servers={servers}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedServerId={selectedServerId}
              onServerChange={setSelectedServerId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeLicenses={activeLicenses}
              totalLicenses={totalLicenses}
              lastSyncedAt={lastSyncedAt}
              syncingServer={syncingServer}
              onSync={handleSync}
            />

            {activeTab === 'licenses' ? (
              <AccurateLicenseTable licenses={filteredLicenses} />
            ) : (
              <DatabasePanels servers={visibleServers} />
            )}
          </>
        )}

        <footer className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-4 w-4" />
          Status online dihitung dari heartbeat agent tiga menit terakhir. Tidak ada data monitoring contoh
          yang ditampilkan.
        </footer>
      </div>
    </DashboardLayout>
  );
}
