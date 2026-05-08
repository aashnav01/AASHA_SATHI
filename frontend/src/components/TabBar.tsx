import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity, ClipboardList, AlertTriangle, BarChart2,
  ShieldAlert, HeartPulse, BookOpen, BookMarked,
  Smile, RefreshCw, IndianRupee, Ambulance
} from 'lucide-react';

// ALL tabs in one flat list — horizontally scrollable
const ALL_TABS = [
  { path: '/',               icon: ClipboardList, labelKey: 'tabs.tasks',     color: '#7C4D9F' },
  { path: '/anemia',         icon: HeartPulse,    labelKey: 'tabs.anemia',    color: '#E8A0B4' },
  { path: '/ppd',            icon: Activity,      labelKey: 'tabs.ppd',       color: '#B08CC0' },
  { path: '/symptom-check',  icon: AlertTriangle, labelKey: 'tabs.symptom',   color: '#D4A017' },
  { path: '/pregnancy-risk', icon: ShieldAlert,   labelKey: 'tabs.risk',      color: '#A63D57' },
  { path: '/schemes',        icon: BookMarked,    labelKey: 'tabs.schemes',   color: '#7C4D9F' },
  { path: '/education',      icon: BookOpen,      labelKey: 'tabs.education', color: '#2A7D52' },
  { path: '/incentive',      icon: IndianRupee,   labelKey: 'tabs.incentive', color: '#D4A017' },
  { path: '/referral',       icon: Ambulance,     labelKey: 'tabs.referral',  color: '#A63D57' },
  { path: '/wellness',       icon: Smile,         labelKey: 'tabs.wellness',  color: '#E8A0B4' },
  { path: '/sync',           icon: RefreshCw,     labelKey: 'tabs.sync',      color: '#7C4D9F' },
  { path: '/analytics',      icon: BarChart2,     labelKey: 'tabs.analytics', color: '#2A7D52' },
];

export const TabBar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.06)',
      }}
    >
      {/* Lavender accent line */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #7C4D9F 0%, #E8A0B4 50%, #2A7D52 100%)' }} />

      {/* Horizontally scrollable tab strip */}
      <div
        className="flex overflow-x-auto py-1 px-1 gap-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {ALL_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              id={`tab-${item.path.replace(/\//g, '') || 'home'}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-shrink-0 py-1.5 px-3 rounded-2xl transition-all duration-200 relative min-w-[56px] ${
                  isActive ? 'scale-105' : 'hover:bg-gray-50'
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: `${item.color}14` } : {}
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active dot */}
                  {isActive && (
                    <div
                      className="absolute top-1 w-1 h-1 rounded-full"
                      style={{ background: item.color }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="transition-all duration-200"
                    style={{ color: isActive ? item.color : '#9ca3af' }}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>

                  {/* Label */}
                  <span
                    className="text-[9px] mt-0.5 font-black tracking-wide leading-none whitespace-nowrap"
                    style={{ color: isActive ? item.color : '#9ca3af' }}
                  >
                    {t(item.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Hide scrollbar for webkit */}
      <style>{`.flex::-webkit-scrollbar { display: none; }`}</style>
    </nav>
  );
};
