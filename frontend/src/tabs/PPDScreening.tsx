import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../components/Card';
import { db, makeClientId } from '../db/offlineDb';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { Mic, Volume2, ChevronLeft, Zap, Bot, Loader2, Info } from 'lucide-react';
import { getPpdGuidance, type PpdAnalysisResult } from '../services/api';

const OPTIONS_BASE = [
  { value: 0, key: '0', voiceTokens: ['never', 'no', 'zero', 'कभी नहीं', 'नहीं'] },
  { value: 1, key: '1', voiceTokens: ['hardly', 'not often', 'rarely', 'अक्सर नहीं'] },
  { value: 2, key: '2', voiceTokens: ['sometimes', 'कभी-कभी', 'कभी'] },
  { value: 3, key: '3', voiceTokens: ['yes', 'often', 'always', 'हाँ', 'अधिकतर'] },
];

export const PPDScreening: React.FC = () => {
  const { t } = useTranslation();
  const questions: string[] = t('ppd.questions', { returnObjects: true }) as string[];
  const { listen, stop: stopListen, isListening, transcript, clearTranscript } = useVoiceRecognition();
  const { speak, stop: stopSpeak } = useTextToSpeech();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(-1));
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{ score: number; risk: string; message: string } | null>(null);
  const [aiInsight, setAiInsight] = useState<PpdAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const hasSpokenIntro = useRef(false);

  // Voice intro on first mount
  useEffect(() => {
    if (!hasSpokenIntro.current) {
      hasSpokenIntro.current = true;
      setTimeout(() => {
        speak(t('ppd.voice_instruction'), () => {
          if (questions[0]) readQuestion(0);
        });
      }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readQuestion = useCallback((idx: number) => {
    stopSpeak();
    const optionsText = OPTIONS_BASE.map(o => t(`ppd.options.${o.key}`)).join('. ');
    speak(
      `${t('ppd.question_x_of_10', { current: idx + 1 })}. ${questions[idx]}. ${optionsText}.`,
      () => listen()
    );
  }, [speak, stopSpeak, listen, questions, t]);

  // Read each new question
  useEffect(() => {
    if (currentQ < 10 && !result && hasSpokenIntro.current) {
      const timer = setTimeout(() => readQuestion(currentQ), 300);
      return () => clearTimeout(timer);
    }
  }, [currentQ, result, readQuestion]);

  // Voice answer matching
  useEffect(() => {
    if (!transcript || currentQ >= 10 || result) return;
    const lower = transcript.toLowerCase();
    let matched = false;
    for (const opt of OPTIONS_BASE) {
      if (opt.voiceTokens.some(tok => lower.includes(tok))) {
        handleSelect(opt.value);
        matched = true;
        break;
      }
    }
    if (!matched) {
      speak(`${t('common.error')}. ${OPTIONS_BASE.map(o => t(`ppd.options.${o.key}`)).join(', ')}.`, () => listen());
    }
    clearTranscript();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const handleSelect = useCallback((val: number) => {
    stopListen();
    const newAnswers = [...answers];
    newAnswers[currentQ] = val;
    setAnswers(newAnswers);

    speak(t(`ppd.options.${val}`));

    if (currentQ < 9) {
      setSlideDir('left');
      setCurrentQ(q => q + 1);
    } else {
      finalizeResult(newAnswers);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentQ, stopListen, speak, t]);

  const handlePrevious = () => {
    if (currentQ > 0) {
      setSlideDir('right');
      setCurrentQ(q => q - 1);
    }
  };

  const finalizeResult = async (finalAnswers: number[]) => {
    if (finalAnswers.includes(-1)) return;
    
    // Scientifically accurate EPDS calculation
    // Questions 1 and 2 (index 0, 1) are positively phrased, so they must be reverse-scored in a 0-3 scale.
    // Score logic: if index is 0 or 1, actual_score = 3 - val. Otherwise, actual_score = val.
    const calculated_score = finalAnswers.reduce((sum, val, idx) => {
      const isReverseScored = idx === 0 || idx === 1;
      const points = isReverseScored ? (3 - val) : val;
      return sum + points;
    }, 0);

    let risk_level: 'low' | 'medium' | 'high' = 'low';
    let referral_message = t('ppd.result_low');

    // Thresholds
    if (calculated_score >= 13) { 
      risk_level = 'high'; 
      referral_message = t('ppd.result_high'); 
    } else if (calculated_score >= 10) { 
      risk_level = 'medium'; 
      referral_message = t('ppd.result_medium'); 
    }

    // Critical Red Flag overrides: Item 10 (index 9) is self-harm. Any score > 0 demands immediate referral.
    if (finalAnswers[9] > 0) {
      risk_level = 'high';
      referral_message = 'URGENT PSYCHIATRIC REFERRAL: Self-harm ideation detected. Do not leave the mother alone. ' + t('ppd.result_high');
    }

    setResult({ score: calculated_score, risk: risk_level, message: referral_message });
    speak(`${t('ppd.score')}: ${calculated_score}. ${t('ppd.risk')}: ${t(`ppd.result_${risk_level}`)}. ${referral_message}`);

    try {
      await db.unsyncedPPD.add({
        clientId: makeClientId(),
        clientTimestamp: new Date().toISOString(),
        epds_answers: finalAnswers,
        total_score: calculated_score,
        risk_level,
        referral_message,
      });
      setStatus(t('common.saved_offline'));
      
      // Fetch AI guidance automatically
      setIsAnalyzing(true);
      try {
        const guidance = await getPpdGuidance({
          epds_answers: finalAnswers,
          score: calculated_score,
          risk_level,
        });
        setAiInsight(guidance);
      } catch (err) {
        console.error('Failed to get AI guidance', err);
      } finally {
        setIsAnalyzing(false);
      }

      setTimeout(() => {
        setAnswers(Array(10).fill(-1));
        setResult(null);
        setAiInsight(null);
        setCurrentQ(0);
        setStatus('');
        hasSpokenIntro.current = false;
      }, 30000); // Increased timeout to 30s to allow ASHA to read counseling script
    } catch (e) {
      console.error(e);
      setStatus(t('common.error'));
    }
  };

  const riskConfig = {
    high:   { border: 'border-red-200 bg-red-50',     text: 'text-red-700',     score: 'text-red-600' },
    medium: { border: 'border-orange-200 bg-orange-50',text: 'text-orange-700', score: 'text-orange-600' },
    low:    { border: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', score: 'text-emerald-600' },
  };

  if (result) {
    const cfg = riskConfig[result.risk as keyof typeof riskConfig];
    return (
      <div className="space-y-4 pb-4 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('ppd.full_title')}</h2>
        <Card className={`text-center py-10 border-2 ${cfg.border} animate-bounce-in`}>
          {/* Score ring */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={result.risk === 'high' ? '#ef4444' : result.risk === 'medium' ? '#f59e0b' : '#10b981'}
                strokeWidth="8"
                strokeDasharray={`${(result.score / 30) * 264} 264`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h3 className={`font-black text-4xl ${cfg.score}`}>{result.score}</h3>
              <p className="text-xs text-gray-400 font-bold">/30</p>
            </div>
          </div>
          <p className={`text-xl font-black mb-2 uppercase tracking-wide ${cfg.text}`}>
            {result.risk} {t('ppd.risk')}
          </p>
          <p className="text-gray-700 font-medium px-4 mb-4 text-sm leading-relaxed">{result.message}</p>
          {status && (
            <div className="p-3 bg-white/60 border border-white rounded-xl text-sm font-bold mx-4 text-emerald-700">
              {status}
            </div>
          )}
          {/* Re-read result */}
          <button
            onClick={() => speak(`${t('ppd.score')}: ${result.score}. ${result.message}`)}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-white/80 text-primary font-bold text-sm shadow-sm"
          >
            <Volume2 size={16} /> {t('common.tap_to_hear')}
          </button>

          {/* AI Insights Card */}
          <div className="mx-4 mt-6 text-left animate-slide-up">
            <h4 className="text-sm font-black text-gray-800 mb-2 flex items-center gap-2">
              <Bot size={18} className="text-primary" /> AI Counseling Guide
            </h4>
            
            {isAnalyzing ? (
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
                <p className="text-xs font-bold text-primary animate-pulse">Generating personalized safe-counseling script...</p>
              </div>
            ) : aiInsight ? (
              <div className="space-y-3">
                {/* Empathetic Script */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
                  <p className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1.5"><Volume2 size={14}/> Tell the mother:</p>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{aiInsight.counseling_script}"</p>
                  <button onClick={() => speak(aiInsight.counseling_script)} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Read Aloud &rarr;
                  </button>
                </div>

                {/* Doctor Note */}
                {aiInsight.referral_summary && result.risk !== 'low' && (
                   <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 shadow-sm">
                     <p className="text-xs font-bold text-rose-800 mb-1 flex items-center gap-1.5"><Info size={14}/> Doctor Referral Note:</p>
                     <p className="text-xs font-medium text-gray-700">{aiInsight.referral_summary}</p>
                   </div>
                )}
                
                {/* Action Items */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-800 mb-2">Next Steps for ASHA:</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    {aiInsight.action_plan.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center text-xs text-gray-500 font-medium">
                Counseling guide unavailable offline.
              </div>
            )}
          </div>

          {/* EPDS tip */}
          <div className="mx-4 mt-4 sci-ref-card text-left">
            <p className="text-xs text-gray-600 leading-relaxed"><span className="font-bold text-primary">EPDS: </span>{t('ppd.epds_tip')}</p>
          </div>
        </Card>
      </div>
    );
  }

  const progress = (currentQ / 10) * 100;

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{t('ppd.title')}</h2>
          <p className="text-sm font-bold text-primary">{t('ppd.question_x_of_10', { current: currentQ + 1 })}</p>
        </div>
        <button
          id="ppd-replay-btn"
          onClick={() => readQuestion(currentQ)}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}
          aria-label="Replay question"
        >
          <Volume2 size={22} />
        </button>
      </div>

      <Card className="animate-slide-up">
        {/* Voice bar */}
        <div className="mb-5 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-gray-700 font-medium text-sm">{t('ppd.use_voice_answer')}</span>
          <button
            id="ppd-mic-btn"
            onClick={isListening ? stopListen : listen}
            className={isListening ? 'btn-voice-active' : 'btn-voice-idle'}
            aria-label="Voice input"
          >
            {isListening
              ? <div className="voice-wave"><span/><span/><span/><span/><span/></div>
              : <Mic size={22} className="text-white" />
            }
          </button>
        </div>

        {isListening && (
          <div className="voice-hint mb-4 animate-fade-in text-xs">
            🎤 {t('ppd.voice_instruction')}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-gray-400">{t('ppd.question_x_of_10', { current: currentQ + 1 })}</span>
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #6367FF)' }}
            />
          </div>
        </div>

        {/* Question */}
        <div
          key={`q-${currentQ}`}
          className={`mb-8 min-h-[100px] flex items-center justify-center p-6 rounded-2xl border border-primary/20 ${slideDir === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}
          style={{ background: 'linear-gradient(135deg, rgba(99,103,255,0.04), rgba(139,92,246,0.06))' }}
        >
          <p className="text-xl font-black text-center text-gray-800 leading-snug">{questions[currentQ]}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {OPTIONS_BASE.map((opt, oi) => (
            <button
              key={opt.value}
              id={`ppd-opt-${opt.value}`}
              onClick={() => handleSelect(opt.value)}
              className={`w-full p-4 rounded-2xl border-2 font-bold text-base text-left transition-all flex justify-between items-center active:scale-95 ${
                answers[currentQ] === opt.value
                  ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-md'
                  : 'border-gray-100 bg-white/60 text-gray-700 hover:border-primary/40 hover:bg-primary/5'
              }`}
              style={{ animationDelay: `${oi * 60}ms` }}
            >
              <span>{t(`ppd.options.${opt.key}`)}</span>
              <button
                onClick={e => { e.stopPropagation(); speak(t(`ppd.options.${opt.key}`)); }}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors flex-shrink-0"
                aria-label="Read option"
              >
                <Volume2 size={18} />
              </button>
            </button>
          ))}
        </div>

        {/* Previous button */}
        {currentQ > 0 && (
          <button
            id="ppd-prev-btn"
            onClick={handlePrevious}
            className="mt-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} /> {t('ppd.prev_question')}
          </button>
        )}

        {/* EPDS scientific reference */}
        <div className="mt-5 sci-ref-card flex items-start gap-2">
          <Zap size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 font-medium leading-relaxed">{t('ppd.epds_tip')}</p>
        </div>
      </Card>
    </div>
  );
};
