import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ClipboardList, AlertTriangle, BarChart2, ShieldAlert, HeartPulse, BookOpen, BookMarked, Smile, RefreshCw, MoreVertical, X, IndianRupee, Ambulance } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',              icon: ClipboardList, labelKey: 'tabs.tasks',     color: '#6367FF' },
  { path: '/anemia',        icon: HeartPulse,    labelKey: 'tabs.anemia',    color: '#e84393' },
  { path: '/ppd',           icon: Activity,      labelKey: 'tabs.ppd',       color: '#8b5cf6' },
  { path: '/symptom-check', icon: AlertTriangle, labelKey: 'tabs.symptom',   color: '#f59e0b' },
  { path: '/pregnancy-risk',icon: ShieldAlert,   labelKey: 'tabs.risk',      color: '#ef4444' },
  { path: '/schemes',       icon: BookMarked,    labelKey: 'tabs.schemes',   color: '#06b6d4' },
  { path: '/education',     icon: BookOpen,      labelKey: 'tabs.education', color: '#00b894' },
];

const MORE_ITEMS = [
  { path: '/incentive',  icon: IndianRupee, labelKey: 'tabs.incentive', color: '#D4A017' },
  { path: '/referral',   icon: Ambulance,   labelKey: 'tabs.referral',  color: '#A63D57' },
  { path: '/sync',       icon: RefreshCw,   labelKey: 'tabs.sync',      color: '#7C4D9F' },
  { path: '/wellness',   icon: Smile,       labelKey: 'tabs.wellness',  color: '#E8A0B4' },
  { path: '/analytics',  icon: BarChart2,   labelKey: 'tabs.analytics', color: '#2A7D52' },
];

export const TabBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMoreItemClick = (path: string) => {
    navigate(path);
    setShowMoreSheet(false);
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 -4px 30px rgba(0,0,0,0.04)' }}
      >
        {/* Top gradient accent line — lavender palette */}
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #7C4D9F 0%, #E8A0B4 50%, #2A7D52 100%)' }} />

        <div
          className="flex justify-between py-1.5 px-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Main tabs */}
          <div className="flex gap-0.5 flex-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  id={`tab-${item.path.replace('/', '') || 'home'}`}
                  className="flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 rounded-2xl transition-all duration-300 relative"
                  style={active ? {
                    background: `${item.color}15`,
                  } : {}}
                >
                  {/* Active dot */}
                  {active && (
                    <div
                      className="absolute top-1 w-1 h-1 rounded-full"
                      style={{ background: item.color }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
                    style={{ color: active ? item.color : '#9ca3af' }}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  </div>

                  {/* Label */}
                  <span
                    className="text-[9px] mt-1 font-black truncate tracking-wide leading-none"
                    style={{ color: active ? item.color : '#9ca3af' }}
                  >
                    {t(item.labelKey)}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* More sheet button */}
          <button
            id="tab-more-btn"
            onClick={() => setShowMoreSheet(true)}
            className="flex flex-col items-center justify-center flex-shrink-0 py-1.5 px-1 rounded-2xl transition-all duration-300 relative"
            style={{ color: '#9ca3af' }}
          >
            {/* Icon */}
            <div className="transition-all duration-300">
              <MoreVertical size={20} strokeWidth={1.8} />
            </div>

            {/* Label */}
            <span className="text-[9px] mt-1 font-black truncate tracking-wide leading-none">
              {t('tabs.more', 'More')}
            </span>
          </button>
        </div>
      </nav>

      {/* More Sheet Overlay */}
      {showMoreSheet && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMoreSheet(false)}
        >
          {/* Bottom Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-2xl animate-slide-up"
            style={{ maxHeight: '90vh', animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{t('tabs.more_options', 'More Options')}</h3>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {MORE_ITEMS.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className="w-full flex items-center gap-4 p-4 transition-all hover:bg-gray-50 active:bg-gray-100"
                    style={active ? { background: `${item.color}10` } : {}}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span
                      className="flex-1 text-left font-semibold transition-colors"
                      style={{ color: active ? item.color : '#374151' }}
                    >
                      {t(item.labelKey)}
                    </span>
                    {active && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: item.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Safe area spacer */}
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}
    </>
  );
};
