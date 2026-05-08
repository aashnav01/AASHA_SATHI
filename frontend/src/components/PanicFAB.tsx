import React, { useState } from 'react';
import { AlertOctagon, X, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendPanic } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export const PanicFAB: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useTextToSpeech();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setShowConfirm(true);
    speak(t('panic.description'));
  };

  const handlePanic = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');

    let location = { lat: 28.6139, lng: 77.2090 };
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {
      // use default Delhi coords
    }

    try {
      await sendPanic(location);
      setShowSuccess(true);
      speak(t('panic.success_title') + '. ' + t('panic.success_desc'));
      setTimeout(() => setShowSuccess(false), 5000);
    } catch {
      setError(t('panic.error_sending'));
      speak(t('panic.error_sending'));
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Emergency features stack */}
      <div className="fixed bottom-[76px] right-3 z-50 flex flex-col gap-2">
        {/* Referral shortcut */}
        <button
          id="referral-link"
          onClick={() => navigate('/referral')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-all text-xs font-semibold shadow-md"
          style={{ background: 'white', border: '1px solid rgba(166,61,87,0.25)', color: '#A63D57' }}
        >
          {t('panic.referral_link', 'Referral')}
          <ArrowRight size={12} />
        </button>

        {/* SOS FAB — no pulse, clean corner */}
        <button
          id="panic-fab-btn"
          onClick={handleOpen}
          disabled={loading}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-90"
          style={{
            background: loading
              ? 'linear-gradient(135deg, #d4829a, #c06070)'
              : 'linear-gradient(135deg, #A63D57, #7C2238)',
            boxShadow: loading ? 'none' : '0 6px 24px rgba(166,61,87,0.5)',
          }}
          aria-label={t('panic.title')}
        >
          {loading ? (
            <div className="w-5 h-5 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          ) : (
            <AlertOctagon size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-bounce-in">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="text-center mb-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 relative"
                style={{ background: 'linear-gradient(135deg, rgba(166,61,87,0.12), rgba(166,61,87,0.06))' }}>
                <AlertOctagon size={36} style={{ color: '#A63D57' }} />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">{t('panic.emergency_alert')}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{t('panic.description')}</p>
            </div>

            {/* Info strips */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold"
                style={{ background: 'rgba(166,61,87,0.07)', color: '#A63D57' }}>
                <MapPin size={16} className="flex-shrink-0" style={{ color: '#A63D57' }} />
                <span>{t('panic.gps_shared')}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold"
                style={{ background: 'rgba(166,61,87,0.07)', color: '#A63D57' }}>
                <Phone size={16} className="flex-shrink-0" style={{ color: '#A63D57' }} />
                <span>{t('panic.sms_sent')}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-sm"
              >
                {t('panic.cancel')}
              </button>
              <button
                onClick={handlePanic}
                className="py-3.5 rounded-2xl font-black text-white active:scale-95 transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #A63D57, #7C2238)', boxShadow: '0 4px 15px rgba(166,61,87,0.4)' }}
              >
                {t('panic.send_alert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-40 right-4 left-4 z-[100] rounded-2xl p-4 shadow-2xl animate-slide-up flex items-center gap-3 max-w-sm mx-auto"
          style={{ background: 'linear-gradient(135deg, #2A7D52, #3a9e6a)' }}>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black">✓</div>
          <div>
            <p className="font-black text-sm text-white">{t('panic.success_title')}</p>
            <p className="text-xs text-green-100 mt-0.5">{t('panic.success_desc')}</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-40 right-4 left-4 z-[100] rounded-2xl p-4 shadow-2xl animate-slide-up flex items-center gap-3 max-w-sm mx-auto"
          style={{ background: 'linear-gradient(135deg, #A63D57, #7C2238)' }}>
          <X size={18} className="flex-shrink-0 text-white" />
          <p className="font-bold text-sm text-white">{error}</p>
        </div>
      )}
    </>
  );
};
