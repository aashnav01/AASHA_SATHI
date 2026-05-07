import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { getChartsData, type ChartsData } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Activity, HeartPulse, ShieldAlert, TrendingUp, Volume2, Clock } from 'lucide-react';

type Period = '7' | '30' | 'all';

export const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useTextToSpeech();
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getChartsData();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  const filterByPeriod = <T extends { date: string }>(arr: T[]): T[] => {
    if (period === 'all') return arr;
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return arr.filter(d => new Date(d.date) >= cutoff);
  };

  const getTrend = (arr: Array<{ date: string; count: number }>, filtered: Array<{ date: string; count: number }>) => {
    if (arr.length < 2 || filtered.length === 0) return null;
    const prev = arr.slice(0, Math.max(1, arr.length - filtered.length)).reduce((s, d) => s + d.count, 0);
    const curr = filtered.reduce((s, d) => s + d.count, 0);
    if (prev === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct;
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-4 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('analytics.title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="card h-24 shimmer-bg rounded-2xl" />)}
        </div>
        <div className="card h-64 shimmer-bg rounded-2xl" />
        <div className="card h-64 shimmer-bg rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 pb-4">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('analytics.title')}</h2>
        <Card className="text-center py-10">
          <TrendingUp size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-red-500 font-semibold">{t('common.error')}</p>
          <button onClick={fetchData} className="btn-primary mt-4 text-sm">Retry</button>
        </Card>
      </div>
    );
  }

  const filteredAnemia = filterByPeriod(data.anemia);
  const filteredPPD = filterByPeriod(data.ppd);
  const totalAnemia = filteredAnemia.reduce((s, d) => s + d.count, 0);
  const totalPPD = filteredPPD.reduce((s, d) => s + d.count, 0);
  const highRisk = data.ppd_risk_distribution.find(d => d.risk_level === 'high')?.count ?? 0;
  const lowRisk = data.ppd_risk_distribution.find(d => d.risk_level === 'low')?.count ?? 0;
  const anemTrend = getTrend(data.anemia, filteredAnemia);
  const ppdTrend = getTrend(data.ppd, filteredPPD);

  const kpiCards = [
    { labelKey: 'analytics.anemia', value: totalAnemia, sub: t('analytics.screenings'), icon: HeartPulse, iconBg: 'bg-sky-100', iconColor: 'text-sky-600', trend: anemTrend },
    { labelKey: 'analytics.ppd',    value: totalPPD,    sub: t('analytics.screenings'), icon: Activity,   iconBg: 'bg-violet-100', iconColor: 'text-violet-600', trend: ppdTrend },
    { labelKey: 'analytics.high_risk', value: highRisk, sub: t('analytics.need_referral'), icon: ShieldAlert, iconBg: 'bg-red-100', iconColor: 'text-red-500', valueColor: 'text-red-500', trend: null },
    { labelKey: 'analytics.low_risk',  value: lowRisk,  sub: t('analytics.normal_range'),  icon: TrendingUp,  iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500', valueColor: 'text-emerald-500', trend: null },
  ];

  const speakSummary = () => {
    speak(t('analytics.voice_summary', { anemia: totalAnemia, ppd: totalPPD, highRisk }));
  };

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('analytics.title')}</h2>
          <p className="text-sm text-gray-400 font-medium">{t('analytics.overview')}</p>
        </div>
        <button
          id="analytics-voice-btn"
          onClick={speakSummary}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(99,103,255,0.1)', color: '#6367FF' }}
          aria-label="Hear summary"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-1 mr-1">
          <Clock size={13} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-400">Period:</span>
        </div>
        {(['7', '30', 'all'] as Period[]).map(p => (
          <button
            key={p}
            id={`period-${p}`}
            onClick={() => setPeriod(p)}
            className={period === p ? 'chip-active flex-shrink-0' : 'chip-inactive flex-shrink-0'}
          >
            {t(`analytics.period_${p}`)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          const isUp = (kpi.trend ?? 0) >= 0;
          return (
            <Card key={i} className="!p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">{t(kpi.labelKey)}</p>
                <div className={`w-9 h-9 ${kpi.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={17} className={kpi.iconColor} />
                </div>
              </div>
              <p className={`text-3xl font-black ${kpi.valueColor ?? 'text-gray-900'}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{kpi.sub}</p>
              {kpi.trend !== null && (
                <div className={`mt-1.5 text-[10px] font-black flex items-center gap-0.5 ${isUp ? 'text-emerald-500' : 'text-red-400'}`}>
                  <span>{isUp ? '▲' : '▼'}</span>
                  <span>{Math.abs(kpi.trend)}% {isUp ? 'vs prev.' : 'vs prev.'}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Anemia Chart */}
      <Card>
        <h3 className="font-bold text-gray-700 mb-0.5">{t('analytics.anemia_chart')}</h3>
        <p className="text-xs text-gray-400 mb-4">{t('analytics.daily_count')}</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredAnemia} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="count" name="Screenings" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* PPD Chart */}
      <Card>
        <h3 className="font-bold text-gray-700 mb-0.5">{t('analytics.ppd_chart')}</h3>
        <p className="text-xs text-gray-400 mb-4">{t('analytics.daily_count')}</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredPPD} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Bar dataKey="count" name="Screenings" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Risk Distribution Pie */}
      <Card>
        <h3 className="font-bold text-gray-700 mb-0.5">{t('analytics.risk_chart')}</h3>
        <p className="text-xs text-gray-400 mb-4">{t('analytics.risk_breakdown')}</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.ppd_risk_distribution}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={82}
                paddingAngle={4} dataKey="count" nameKey="risk_level"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) => `${String(props.name || '').toUpperCase()} ${((props.percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.ppd_risk_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.risk_level as keyof typeof COLORS] || '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(value, name) => [value, String(name).toUpperCase()]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-5 mt-2">
          {data.ppd_risk_distribution.map(d => (
            <div key={d.risk_level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[d.risk_level as keyof typeof COLORS] }} />
              <span className="text-xs font-bold text-gray-500 capitalize">{d.risk_level}</span>
              <span className="text-xs font-black text-gray-700">({d.count})</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
