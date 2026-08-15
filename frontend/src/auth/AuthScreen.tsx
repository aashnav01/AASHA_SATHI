import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, KeyRound, User as UserIcon, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';

export const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(mobile, pin);
      } else {
        await register(name, mobile, pin);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('auth.generic_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-background flex flex-col items-center justify-center p-6">
      <div className="blob-1" />
      <div className="blob-2" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-4"
            style={{ background: 'linear-gradient(135deg, #7C4D9F 0%, #E8A0B4 100%)' }}>
            <span className="text-white font-black text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-black"
            style={{ background: 'linear-gradient(90deg, #7C4D9F, #E8A0B4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ASHA Sathi
          </h1>
          <p className="text-sm text-gray-400 font-semibold mt-1">आशा साथी</p>

          {/* Language must be selectable before sign-in: the TopBar switcher
              only exists after login, and the app defaults to Hindi. */}
          <div className="mt-5">
            <LanguageSelector />
          </div>
        </div>

        <Card className="animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 text-center mb-2">
              {mode === 'login' ? t('auth.login_title') : t('auth.register_title')}
            </h2>

            {mode === 'register' && (
              <div>
                <label className="section-label mb-2 flex items-center gap-1.5">
                  <UserIcon size={14} /> {t('auth.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder={t('auth.name_placeholder')}
                  required
                />
              </div>
            )}

            <div>
              <label className="section-label mb-2 flex items-center gap-1.5">
                <Phone size={14} /> {t('auth.mobile')}
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder={t('auth.mobile_placeholder')}
                required
              />
            </div>

            <div>
              <label className="section-label mb-2 flex items-center gap-1.5">
                <KeyRound size={14} /> {t('auth.pin')}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder={t('auth.pin_placeholder')}
                required
              />
            </div>

            {error && (
              <p className="text-sm font-bold text-red-600 text-center">{error}</p>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary text-base py-4 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' ? t('auth.login_button') : t('auth.register_button')}
            </button>

            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="w-full text-center text-sm font-bold text-primary py-2"
            >
              {mode === 'login' ? t('auth.switch_to_register') : t('auth.switch_to_login')}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};
