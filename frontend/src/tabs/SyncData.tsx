import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { db } from '../db/offlineDb';
import { syncData } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { CloudUpload, CheckCircle, AlertCircle, Database, RefreshCw, Wifi, CloudOff, Cloud, Volume2, Clock } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const SyncData: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useTextToSpeech();
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'none'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [counts, setCounts] = useState({
    anemia: 0,
    ppd: 0,
    alerts: 0,
    referrals: 0,
    incentives: 0,
    wellness: 0,
    taskCompletions: 0,
  });

  const refreshPendingCount = useCallback(async () => {
    const anemia = await db.unsyncedAnemia.count();
    const ppd = await db.unsyncedPPD.count();
    const alerts = await db.unsyncedAlerts.count();
    const referrals = await db.referrals.where('sync_status').equals('pending').count();
    const incentives = await db.unsyncedIncentiveLogs.count();
    const wellness = await db.wellnessCheckins.where('sync_status').equals('pending').count();
    const taskCompletions = await db.taskCompletions.where('sync_status').equals('pending').count();
    setCounts({ anemia, ppd, alerts, referrals, incentives, wellness, taskCompletions });
  }, []);

  useEffect(() => {
    refreshPendingCount();
    // Load last sync time from localStorage
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  }, [refreshPendingCount]);

  const totalPending = counts.anemia + counts.ppd + counts.alerts + counts.referrals + counts.incentives + counts.wellness + counts.taskCompletions;

  const formatSyncTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleSync = async () => {
    setSyncing(true);
    setStatus('idle');
    try {
      const anemia = (await db.unsyncedAnemia.toArray()).map(({ id: _id, ...rest }) => rest);
      const ppd = (await db.unsyncedPPD.toArray()).map(({ id: _id, ...rest }) => rest);
      const alerts = (await db.unsyncedAlerts.toArray()).map(({ id: _id, ...rest }) => rest);
      const referrals = (await db.referrals.where('sync_status').equals('pending').toArray()).map(({ id: _id, sync_status, ...rest }) => rest);
      const incentives = (await db.unsyncedIncentiveLogs.toArray()).map(({ id: _id, ...rest }) => rest);
      const wellness = (await db.wellnessCheckins.where('sync_status').equals('pending').toArray()).map(({ id: _id, sync_status, ...rest }) => rest);
      const taskCompletions = (await db.taskCompletions.where('sync_status').equals('pending').toArray()).map(({ id: _id, sync_status, ...rest }) => rest);

      if (anemia.length === 0 && ppd.length === 0 && alerts.length === 0 && referrals.length === 0 && incentives.length === 0 && wellness.length === 0 && taskCompletions.length === 0) {
        setStatus('none');
        speak(t('sync.no_data'));
        setSyncing(false);
        return;
      }

      // Call backend with all 5 data types
      const response = await syncData({ anemia, ppd, alerts, referrals, incentives, wellness, taskCompletions });

      // ── CRITICAL SAFETY: Verify inserted counts before clearing tables ──
      const inserted = response.inserted;
      const tablesCleared: string[] = [];
      const warnings: string[] = [];

      // Only clear each table if non-empty batch was confirmed inserted
      if (anemia.length > 0 && inserted.anemia > 0) {
        await db.unsyncedAnemia.clear();
        tablesCleared.push('anemia');
      } else if (anemia.length > 0 && inserted.anemia === 0) {
        warnings.push(`Anemia: No records inserted. Check backend response.`);
      }

      if (ppd.length > 0 && inserted.ppd > 0) {
        await db.unsyncedPPD.clear();
        tablesCleared.push('ppd');
      } else if (ppd.length > 0 && inserted.ppd === 0) {
        warnings.push(`PPD: No records inserted. Check backend response.`);
      }

      if (alerts.length > 0 && inserted.alerts > 0) {
        await db.unsyncedAlerts.clear();
        tablesCleared.push('alerts');
      } else if (alerts.length > 0 && inserted.alerts === 0) {
        warnings.push(`Alerts: No records inserted. Check backend response.`);
      }

      if (referrals.length > 0 && inserted.referrals > 0) {
        await db.referrals.where('sync_status').equals('pending').delete();
        tablesCleared.push('referrals');
      } else if (referrals.length > 0 && inserted.referrals === 0) {
        warnings.push(`Referrals: No records inserted. Check backend response.`);
      }

      if (incentives.length > 0 && inserted.incentives > 0) {
        await db.unsyncedIncentiveLogs.clear();
        tablesCleared.push('incentives');
      } else if (incentives.length > 0 && inserted.incentives === 0) {
        warnings.push(`Incentives: No records inserted. Check backend response.`);
      }

      if (wellness.length > 0 && inserted.wellness > 0) {
        await db.wellnessCheckins.where('sync_status').equals('pending').modify({ sync_status: 'synced' });
        tablesCleared.push('wellness');
      } else if (wellness.length > 0 && inserted.wellness === 0) {
        warnings.push(`Wellness: No records inserted. Check backend response.`);
      }

      if (taskCompletions.length > 0 && inserted.taskCompletions > 0) {
        await db.taskCompletions.where('sync_status').equals('pending').modify({ sync_status: 'synced' });
        tablesCleared.push('taskCompletions');
      } else if (taskCompletions.length > 0 && inserted.taskCompletions === 0) {
        warnings.push(`TaskCompletions: No records inserted. Check backend response.`);
      }

      // Log warnings if counts don't match
      if (warnings.length > 0) {
        console.warn('[FRONTEND SYNC] Verification warnings:', warnings);
        response.warnings = [...(response.warnings || []), ...warnings];
      }

      // Update last sync time only if at least one table was successfully cleared
      if (tablesCleared.length > 0) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem('lastSyncTime', now.toISOString());
      }

      setStatus('success');
      speak(t('sync.success'));
      setCounts({ anemia: 0, ppd: 0, alerts: 0, referrals: 0, incentives: 0, wellness: 0, taskCompletions: 0 });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (e) {
      console.error(e);
      setStatus('error');
      speak(t('common.error'));
    } finally {
      setSyncing(false);
    }
  };

  const speakStatus = () => {
    const statusText = totalPending > 0
      ? t('sync.pending', { count: totalPending })
      : t('sync.all_synced');
    const connText = isOnline ? t('sync.connected') : t('sync.no_internet');
    speak(`${statusText}. ${connText}.`);
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('sync.title')}</h2>
          <p className="text-sm text-gray-400 font-medium">{t('sync.subtitle')}</p>
        </div>
        <button
          id="sync-voice-btn"
          onClick={speakStatus}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}
          aria-label="Hear sync status"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Main Status Visual */}
      <Card className={`!p-6 border-2 text-center transition-all ${totalPending > 0 ? 'border-red-200 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
        <div className="flex justify-center mb-4 relative">
          {totalPending > 0 ? (
            <div className="relative">
              <CloudOff size={64} className="text-red-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                {totalPending}
              </div>
            </div>
          ) : (
            <Cloud size={64} className="text-emerald-500" />
          )}
        </div>
        <h3 className={`font-black text-xl uppercase tracking-wide mb-1 ${totalPending > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
          {totalPending > 0 ? t('sync.action_required') : t('sync.fully_synced')}
        </h3>
        <p className={`text-sm font-semibold ${totalPending > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
          {totalPending > 0 ? t('sync.waiting_upload') : t('sync.all_saved')}
        </p>
      </Card>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <Card className="!p-3 border-l-4 border-blue-400 bg-blue-50 flex items-center gap-3">
          <Clock size={16} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700">Last synced</p>
            <p className="text-sm text-blue-600">{formatSyncTime(lastSyncTime)}</p>
          </div>
        </Card>
      )}

      {/* Connection Status */}
      <Card className={`!p-4 border-2 ${isOnline ? 'border-blue-200 bg-blue-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOnline ? 'bg-blue-100' : 'bg-amber-100'}`}>
            <Wifi size={20} className={isOnline ? 'text-blue-600' : 'text-amber-600'} />
          </div>
          <div>
            <p className={`font-bold text-sm ${isOnline ? 'text-blue-700' : 'text-amber-700'}`}>
              {isOnline ? t('sync.connected') : t('sync.no_internet')}
            </p>
            <p className="text-xs text-gray-400">
              {isOnline ? t('sync.ready_sync') : t('sync.will_sync_online')}
            </p>
          </div>
          <div className={`ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'}`} />
        </div>
      </Card>

      {/* Records Breakdown */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-gray-400" />
          <h3 className="font-bold text-gray-700 text-sm">{t('sync.offline_records')}</h3>
          <button
            id="sync-refresh-btn"
            onClick={refreshPendingCount}
            className="ml-auto text-gray-300 hover:text-gray-500 transition-colors"
            aria-label="Refresh count"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {[
            { label: t('sync.anemia_records'), count: counts.anemia, color: '#0ea5e9' },
            { label: t('sync.ppd_screenings'), count: counts.ppd, color: '#8b5cf6' },
            { label: t('sync.panic_alerts'), count: counts.alerts, color: '#ef4444' },
            { label: 'Referrals', count: counts.referrals, color: '#f97316' },
            { label: 'Incentives', count: counts.incentives, color: '#10b981' },
            { label: t('sync.wellness_records', 'Wellness'), count: counts.wellness, color: '#ec4899' },
            { label: t('sync.task_completions', 'Task Completions'), count: counts.taskCompletions, color: '#8b5cf6' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm font-semibold text-gray-600">{label}</span>
              <span
                className="text-sm font-black px-3 py-1 rounded-full"
                style={count > 0
                  ? { color, background: `${color}18`, border: `1px solid ${color}30` }
                  : { color: '#9ca3af', background: '#f9fafb' }
                }
              >
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Total Badge */}
        <div className={`flex items-center justify-between mb-5 p-3 rounded-2xl border ${totalPending > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-sm font-bold ${totalPending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {totalPending > 0 ? t('sync.pending', { count: totalPending }) : t('sync.all_synced')}
          </span>
          <span className={`text-2xl font-black ${totalPending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {totalPending}
          </span>
        </div>

        {/* Sync Button */}
        <button
          id="sync-now-btn"
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing
            ? <><RefreshCw size={18} className="animate-spin" /> {t('sync.syncing')}</>
            : <><CloudUpload size={18} /> {t('sync.button')}</>
          }
        </button>

        {!isOnline && (
          <p className="text-center text-xs text-amber-600 font-semibold mt-3">
            {t('sync.connect_to_sync')}
          </p>
        )}

        {/* Status messages */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 mt-4 rounded-xl text-sm font-semibold animate-slide-up">
            <CheckCircle size={18} /> {t('sync.success')}
          </div>
        )}
        {status === 'none' && (
          <div className="p-3 bg-blue-50 text-blue-700 mt-4 rounded-xl text-sm text-center font-semibold animate-slide-up">
            {t('sync.no_data')}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 mt-4 rounded-xl text-sm font-semibold animate-slide-up">
            <AlertCircle size={18} /> {t('common.error')}
          </div>
        )}
      </Card>
    </div>
  );
};
