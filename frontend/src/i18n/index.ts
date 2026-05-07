import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import te from './te.json';

// Persist language preference across sessions
const savedLang = localStorage.getItem('asha_lang') || 'hi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Save language on change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('asha_lang', lng);
});

export default i18n;
