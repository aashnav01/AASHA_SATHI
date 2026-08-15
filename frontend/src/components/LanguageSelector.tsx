import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// Each language is written in its own script. A worker who cannot read the
// current language still has to be able to find her own, so these are never
// translated - and all options are shown at once rather than cycled.
const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी', spoken: 'हिन्दी चुनी गई' },
  { code: 'en', label: 'English', spoken: 'English selected' },
  { code: 'te', label: 'తెలుగు', spoken: 'తెలుగు ఎంచుకున్నారు' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { speak } = useTextToSpeech();

  const current = i18n.language?.split('-')[0] ?? 'hi';

  const choose = (code: string, spoken: string) => {
    if (code === current) return;
    i18n.changeLanguage(code);
    speak(spoken);
  };

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Select language">
      <Globe size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
      {LANGUAGES.map(({ code, label, spoken }) => {
        const active = code === current;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => choose(code, spoken)}
            aria-pressed={active}
            className="px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
            style={
              active
                ? { background: '#7C4D9F', color: '#fff' }
                : { background: 'rgba(124,77,159,0.1)', color: '#7C4D9F' }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
