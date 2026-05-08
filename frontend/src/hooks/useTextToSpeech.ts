import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Map i18n language codes to BCP-47 speech synthesis codes
const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

export function useTextToSpeech() {
  const { i18n } = useTranslation();

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = LANG_MAP[i18n.language] ?? 'en-IN';
    utterance.lang = targetLang;

    // Rate: slightly slower for Hindi/Telugu for clarity
    utterance.rate = i18n.language === 'en' ? 1.0 : 0.92;
    utterance.pitch = 1.0;

    // Voice selection: try exact match → language prefix match → any Indian English
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(v => v.lang === targetLang) ||
      voices.find(v => v.lang.startsWith(i18n.language)) ||
      voices.find(v => v.lang.startsWith(targetLang.split('-')[0])) ||
      voices.find(v => v.lang.includes('IN')) ||
      null;

    if (voice) utterance.voice = voice;

    if (onEnd) utterance.onend = onEnd;

    // Chrome bug: voices may not be ready — retry if empty
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const freshVoices = window.speechSynthesis.getVoices();
        const freshVoice =
          freshVoices.find(v => v.lang === targetLang) ||
          freshVoices.find(v => v.lang.startsWith(i18n.language)) ||
          null;
        if (freshVoice) utterance.voice = freshVoice;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [i18n.language]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
