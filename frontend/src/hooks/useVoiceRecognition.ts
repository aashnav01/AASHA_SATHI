import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export function useVoiceRecognition() {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recognitionRef.current = recog;
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Speech recognition not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [i18n.language]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const listen = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    
    setTranscript('');
    setError(null);
    setIsListening(true);

    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptStr = event.results[current][0].transcript;
      setTranscript(transcriptStr);
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      // Ignore if already started
    }
  }, [i18n.language]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, []);

  return { listen, stop, isListening, transcript, error, clearTranscript };
}
