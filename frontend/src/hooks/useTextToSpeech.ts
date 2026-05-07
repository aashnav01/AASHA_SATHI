import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useTextToSpeech() {
  const { i18n } = useTranslation();

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    
    const lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.lang = lang;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(lang)) || voices.find(v => v.lang.includes(i18n.language));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1.0; 
    
    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }, [i18n.language]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
