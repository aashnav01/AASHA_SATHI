import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Map i18n language codes to BCP-47 speech synthesis codes
const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

// Picks the best available voice for the target language. Many devices (most
// Windows browsers without extra language packs) have zero hi-IN/te-IN voices
// installed, so this falls back through progressively looser matches.
function pickVoice(voices: SpeechSynthesisVoice[], i18nLang: string, targetLang: string) {
  return (
    voices.find(v => v.lang === targetLang) ||
    voices.find(v => v.lang.toLowerCase().startsWith(i18nLang)) ||
    voices.find(v => v.lang.includes('IN')) ||
    voices.find(v => v.default) ||
    voices[0] ||
    null
  );
}

export function useTextToSpeech() {
  const { i18n } = useTranslation();

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = LANG_MAP[i18n.language] ?? 'en-IN';

    // Rate: slightly slower for Hindi/Telugu for clarity
    utterance.rate = i18n.language === 'en' ? 1.0 : 0.92;
    utterance.pitch = 1.0;

    const applyVoice = (voices: SpeechSynthesisVoice[]) => {
      const voice = pickVoice(voices, i18n.language, targetLang);
      if (voice) {
        utterance.voice = voice;
        // Tag the utterance with the VOICE's own language, not the desired
        // one — a mismatched voice/lang pair (e.g. an en-IN voice tagged
        // hi-IN) makes some engines (notably Windows SAPI) speak nothing at
        // all. Matching them guarantees audio plays, even if the closest
        // available voice can only approximate the target language.
        utterance.lang = voice.lang;
      } else {
        utterance.lang = targetLang;
      }
    };

    if (onEnd) utterance.onend = onEnd;

    // Chrome bug: voices may not be ready on first call — retry once loaded.
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        applyVoice(window.speechSynthesis.getVoices());
        window.speechSynthesis.speak(utterance);
      };
    } else {
      applyVoice(voices);
      window.speechSynthesis.speak(utterance);
    }
  }, [i18n.language]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
