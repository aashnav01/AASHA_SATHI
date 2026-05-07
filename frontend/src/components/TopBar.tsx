import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, User, Globe, X, ChevronDown } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isOnline = useOnlineStatus();
  const { speak } = useTextToSpeech();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const cycle: Record<string, string> = { en: 'hi', hi: 'te', te: 'en' };
    const newLang = cycle[i18n.language] ?? 'en';
    i18n.changeLanguage(newLang);
    const labels: Record<string, string> = { en: 'English selected', hi: 'हिन्दी चुनी गई', te: 'తెలుగు ఎంచుకున్నారు' };
    speak(labels[newLang] ?? 'Language changed');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 z-50 shadow-[0_4px_30px_rgb(0,0,0,0.04)]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden relative flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C4D9F 0%, #E8A0B4 100%)' }}>
            <span className="text-white font-black text-base z-10 relative">A</span>
          </div>
          <div>
            <h1 className="text-base font-black leading-tight"
              style={{ background: 'linear-gradient(90deg, #7C4D9F, #E8A0B4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ASHA Sathi
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold leading-tight">आशा साथी</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Offline pill */}
          {!isOnline && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full border border-amber-200 animate-pulse">
              {t('common.offline')}
            </span>
          )}

          {/* Language toggle */}
          <button
            id="topbar-lang-toggle"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
            style={{ background: 'rgba(124,77,159,0.1)', color: '#7C4D9F' }}
          >
            <Globe size={12} />
            {{ en: 'हिं', hi: 'తె', te: 'EN' }[i18n.language] ?? 'EN'}
          </button>

          {/* Bell */}
          <button
            id="topbar-bell"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-gray-400" />
          </button>

          {/* Profile avatar with dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              id="topbar-profile"
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-1 group"
              aria-label="Profile menu"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, #6367FF, #8494FF)' }}>
                <User size={16} />
              </div>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 z-[200] animate-slide-up overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">ASHA Worker</p>
                  <p className="text-xs text-gray-400 font-medium">Primary Health Centre</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
                  >
                    <Globe size={16} className="text-primary" />
                    {{ en: 'Switch to हिंदी', hi: 'Switch to తెలుగు', te: 'Switch to English' }[i18n.language] ?? 'Switch Language'}
                  </button>
                </div>
                <button
                  onClick={() => setShowProfile(false)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-gray-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Offline banner below header */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 z-40 text-white text-xs font-bold py-1.5 text-center tracking-wide shadow-md"
          style={{ background: 'linear-gradient(90deg, #7C4D9F, #B08CC0)' }}>
          {t('common.offline_banner')}
        </div>
      )}
    </>
  );
};
