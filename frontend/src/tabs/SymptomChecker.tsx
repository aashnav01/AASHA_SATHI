import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { checkSymptoms, type SymptomCheckResult } from '../services/api';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Mic, Volume2, AlertTriangle, X, Thermometer, Wind, Brain, Droplet, Skull, Activity, Phone, Zap, ChevronDown, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Symptoms with Hindi translations and voice tokens
const SYMPTOMS_WITH_TOKENS = [
  { en: 'Fever', hi: 'बुखार', voiceTokens: ['fever', 'temp', 'hot', 'बुखार', 'ताप', 'गर्मी'] },
  { en: 'Cough', hi: 'खाँसी', voiceTokens: ['cough', 'coughing', 'खाँसी', 'खांसी', 'कफ'] },
  { en: 'Headache', hi: 'सिरदर्द', voiceTokens: ['headache', 'head', 'pain', 'सिरदर्द', 'सिर', 'दर्द'] },
  { en: 'Rash', hi: 'दाने', voiceTokens: ['rash', 'skin', 'spots', 'दाने', 'चपत', 'चर्म'] },
  { en: 'Diarrhea', hi: 'दस्त', voiceTokens: ['diarrhea', 'loose', 'stool', 'दस्त', 'पेट', 'पखाना'] },
  { en: 'Vomiting', hi: 'उल्टी', voiceTokens: ['vomit', 'vomiting', 'nausea', 'उल्टी', 'मतली', 'उल्टियाँ'] },
];

const COMMON_SYMPTOMS = SYMPTOMS_WITH_TOKENS.map(s => s.en);

const TB_SYMPTOMS = [
  { en: 'Cough > 2 weeks', hi: 'खाँसी > 2 हफ्ते' },
  { en: 'Night Sweats', hi: 'रात को पसीना' },
  { en: 'Unexplained Weight Loss', hi: 'अस्पष्ट वजन में कमी' },
  { en: 'Blood in Sputum', hi: 'कफ में रक्त' },
];

const CBAC_NCD_QUESTIONS = [
  { en: 'Do you smoke?', hi: 'क्या आप धूम्रपान करते हैं?' },
  { en: 'Do you have high BP history?', hi: 'क्या आपको उच्च रक्तचाप का इतिहास है?' },
  { en: 'Any diabetes in family?', hi: 'परिवार में मधुमेह है?' },
  { en: 'Are you overweight/obese?', hi: 'क्या आप अधिक वजन/मोटे हैं?' },
];

const NTEP_HOTLINE = '1800-11-6666';

const SYMPTOM_ICONS: Record<string, React.ReactNode> = {
  Fever:    <Thermometer size={22} />,
  Cough:    <Wind size={22} />,
  Headache: <Brain size={22} />,
  Rash:     <Activity size={22} />,
  Diarrhea: <Droplet size={22} />,
  Vomiting: <Skull size={22} />,
};

const SYMPTOM_COLORS: Record<string, string> = {
  Fever:    '#ef4444',
  Cough:    '#0ea5e9',
  Headache: '#8b5cf6',
  Rash:     '#f59e0b',
  Diarrhea: '#06b6d4',
  Vomiting: '#6366f1',
};

const PHC_NUMBER = '104';

export const SymptomChecker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { listen, stop: stopListen, isListening, transcript, clearTranscript } = useVoiceRecognition();
  const { speak } = useTextToSpeech();

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [spreading, setSpreading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [tbSymptoms, setTbSymptoms] = useState<string[]>([]);
  const [showTbCard, setShowTbCard] = useState(false);
  const [cbacAge, setCbacAge] = useState(false);
  const [cbacRisks, setCbacRisks] = useState<boolean[]>([false, false, false, false]);
  const [showCbacCard, setShowCbacCard] = useState(false);

  const playInstructions = useCallback(() => {
    speak(t('symptom.voice_intro'));
  }, [speak, t]);

  // Auto-read intro on mount for low-literacy
  useEffect(() => {
    const timer = setTimeout(() => playInstructions(), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced voice matching with token-based recognition
  useEffect(() => {
    if (!transcript) return;
    const lower = transcript.toLowerCase();
    let matched = false;

    // Match symptoms using voice tokens
    for (const symptom of SYMPTOMS_WITH_TOKENS) {
      const displayName = symptom.en;
      if (!symptoms.includes(displayName)) {
        if (symptom.voiceTokens.some(token => lower.includes(token.toLowerCase()))) {
          setSymptoms(prev => [...prev, displayName]);
          matched = true;
          speak(`${t('common.success')}: ${displayName}`);
        }
      }
    }

    if (!matched) {
      // Fallback: add as custom symptom
      setSymptoms(prev => [...prev, transcript]);
      speak(`${t('common.success')}: ${transcript}`);
    }

    clearTranscript();
    stopListen();
  }, [transcript, symptoms, speak, clearTranscript, stopListen, t]);

  const toggleSymptom = (s: string) => {
    if (symptoms.includes(s)) {
      setSymptoms(symptoms.filter(x => x !== s));
    } else {
      setSymptoms(prev => [...prev, s]);
      speak(s);
    }
  };

  const handleCheck = async () => {
    if (symptoms.length === 0) {
      speak(t('symptom.voice_intro'));
      return;
    }
    try {
      setLoading(true);
      const res = await checkSymptoms(symptoms, duration, spreading);
      
      // Force high urgency if any TB symptoms selected
      if (tbSymptoms.length > 0) {
        res.overall_urgency = 'high';
        res.summary = t('symptom.tb_detected', 'TB symptoms detected - urgent referral required');
      }
      
      setResult(res);
      const urgencyText = t(`symptom.urgency_${res.overall_urgency}`);
      speak(`${urgencyText}. ${res.summary}`);
    } catch (e) {
      console.error(e);
      speak(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    const urgencyGradient = {
      high:   'from-red-500 to-red-700',
      medium: 'from-orange-400 to-amber-600',
      low:    'from-emerald-400 to-green-600',
    }[result.overall_urgency];

    const bgCard = {
      high:   'border-red-200 bg-red-50/60',
      medium: 'border-orange-200 bg-orange-50/60',
      low:    'border-emerald-200 bg-emerald-50/60',
    }[result.overall_urgency];

    const textColor = {
      high:   'text-red-700',
      medium: 'text-orange-700',
      low:    'text-emerald-700',
    }[result.overall_urgency];

    const urgencyPct = { high: 90, medium: 55, low: 20 }[result.overall_urgency];

    return (
      <div className="space-y-4 pb-4 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('symptom.title')}</h2>

        <Card className={`border-2 ${bgCard} animate-slide-up`}>
          {/* Gauge */}
          <div className="flex flex-col items-center mb-6 mt-2">
            <div className="relative w-36 h-36 mb-3">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background arc */}
                <path d="M 10 90 A 50 50 0 0 1 110 90" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
                {/* Filled arc */}
                <path
                  d="M 10 90 A 50 50 0 0 1 110 90"
                  fill="none"
                  stroke={result.overall_urgency === 'high' ? '#ef4444' : result.overall_urgency === 'medium' ? '#f59e0b' : '#10b981'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${urgencyPct * 1.57} 200`}
                  className="transition-all duration-1000"
                />
                {/* Icon */}
                <text x="60" y="75" textAnchor="middle" fontSize="28" className="select-none">
                  {result.overall_urgency === 'high' ? '🚨' : result.overall_urgency === 'medium' ? '⚠️' : '✅'}
                </text>
              </svg>
            </div>
            {/* Urgency badge */}
            <div className={`px-5 py-2 rounded-2xl font-black text-lg uppercase tracking-wider text-white bg-gradient-to-r ${urgencyGradient} shadow-lg mb-2`}>
              {t(`symptom.urgency_${result.overall_urgency}`)}
            </div>
            <p className={`font-semibold text-sm px-4 text-center leading-relaxed ${textColor}`}>{result.summary}</p>
          </div>

          {/* TB Recommendation if TB symptoms present */}
          {tbSymptoms.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-5 animate-slide-up">
              <div className="flex items-start gap-3">
                <Activity size={28} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-black text-red-700 mb-2 text-sm">{t('symptom.tb_recommendation_title', 'TB Risk - Immediate Action Required')}</p>
                  <p className="text-xs text-red-700 leading-relaxed mb-3">{t('symptom.tb_recommendation', 'Refer to PHC immediately for sputum test under NTEP. Provide Nikshay ID. Patient gets ₹500/month Nikshay Poshan.')}</p>
                  <a
                    href={`tel:${NTEP_HOTLINE}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                  >
                    <Phone size={16} />
                    {t('symptom.ntep_hotline', 'NTEP Hotline')}: {NTEP_HOTLINE}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Per-symptom results */}
          <div className="space-y-3 mb-5">
            {result.results.map((r, i) => (
              <div key={i} className="bg-white/90 p-4 rounded-2xl shadow-sm border border-white/50 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="font-black text-gray-900 capitalize mb-2 text-sm">{r.symptom}</p>
                <div className="bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">{t('symptom.advice')}</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{r.advice}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">{t('symptom.action')}</p>
                  <p className="text-xs text-blue-700 leading-relaxed font-semibold">{r.action}</p>
                </div>
                <button
                  onClick={() => speak(`${r.symptom}. ${r.advice}. ${r.action}`)}
                  className="mt-2 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                >
                  <Volume2 size={12} /> {t('common.tap_to_hear')}
                </button>
              </div>
            ))}
          </div>

          {/* PHC call button for high urgency */}
          {result.overall_urgency === 'high' && (
            <a
              href={`tel:${PHC_NUMBER}`}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white mb-4 shadow-lg animate-bounce-in text-base"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
              id="call-phc-btn"
            >
              <Phone size={20} />
              {t('symptom.call_phc')} — {PHC_NUMBER}
            </a>
          )}

          {/* WHO protocol note */}
          <div className="sci-ref-card flex items-start gap-2 mb-5">
            <Zap size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 font-medium leading-relaxed">{t('symptom.who_protocol')}</p>
          </div>

          <button
            id="symptom-retry-btn"
            onClick={() => { 
              setResult(null); 
              setSymptoms([]); 
              setDuration(1); 
              setSpreading(false);
              setTbSymptoms([]);
              setShowTbCard(false);
              setCbacAge(false);
              setCbacRisks([false, false, false, false]);
              setShowCbacCard(false);
            }}
            className="w-full bg-white text-gray-800 font-bold py-4 rounded-xl shadow-md hover:bg-gray-50 hover:shadow-lg transition-all active:scale-95"
          >
            {t('common.try_again')}
          </button>
        </Card>
      </div>
    );
  }

  // ── Input screen ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{t('symptom.title')}</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{t('symptom.subtitle')}</p>
        </div>
        <button
          id="symptom-voice-intro"
          onClick={playInstructions}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
          aria-label="Read instructions"
        >
          <Volume2 size={22} />
        </button>
      </div>

      <Card className="animate-slide-up">
        {/* Voice bar */}
        <div className="mb-5 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-gray-700 font-medium text-sm">{t('symptom.subtitle')}</span>
          <button
            id="symptom-mic-btn"
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
            🎤 {t('symptom.voice_intro')}
          </div>
        )}

        {/* Symptom chips */}
        <div className="mb-5 animate-slide-up stagger-1">
          <label className="section-label mb-3">{t('symptom.select')}</label>
          <div className="grid grid-cols-3 gap-2">
            {COMMON_SYMPTOMS.map(s => {
              const selected = symptoms.includes(s);
              const color = SYMPTOM_COLORS[s] || '#6367FF';
              const tKey = `symptom.common_list.${s.toLowerCase()}`;
              const label = t(tKey) !== tKey ? t(tKey) : s;
              return (
                <div
                  key={s}
                  id={`symp-chip-${s.toLowerCase()}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSymptom(s)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSymptom(s); } }}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer"
                  style={{
                    borderColor: selected ? color : '#e5e7eb',
                    background: selected ? `${color}18` : 'rgba(255,255,255,0.6)',
                    color: selected ? color : '#6b7280',
                  }}
                >
                  <div style={{ color: selected ? color : '#d1d5db' }}>{SYMPTOM_ICONS[s]}</div>
                  <span className="text-[10px] font-black text-center leading-tight">{label}</span>
                  <button
                    onClick={e => { e.stopPropagation(); speak(label); }}
                    className="p-0.5 rounded-full"
                    style={{ color: selected ? color : '#d1d5db' }}
                    aria-label="Read aloud"
                  >
                    <Volume2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected chips */}
        {symptoms.length > 0 && (
          <div className="mb-5 animate-slide-up">
            <label className="section-label mb-2">{t('symptom.selected_symptoms')}</label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm"
                  style={{ background: `${SYMPTOM_COLORS[s] || '#6367FF'}15`, color: SYMPTOM_COLORS[s] || '#6367FF', border: `1px solid ${SYMPTOM_COLORS[s] || '#6367FF'}30` }}>
                  {s}
                  <button onClick={() => setSymptoms(symptoms.filter((_, i) => i !== idx))}
                    className="hover:scale-110 transition-transform">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Duration + Spreading */}
        <div className="grid grid-cols-2 gap-4 mb-5 animate-slide-up stagger-2">
          <div>
            <label className="section-label mb-2">{t('symptom.duration')}</label>
            <div className="relative">
              <input type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} className="input-field text-xl font-black text-center pr-12" />
              <span className="absolute right-4 top-[14px] text-gray-400 font-bold text-sm">{t('symptom.days')}</span>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 bg-gray-50/50 hover:bg-gray-100 border-gray-100 cursor-pointer h-14 transition-colors">
              <input type="checkbox" checked={spreading} onChange={e => setSpreading(e.target.checked)} className="w-5 h-5 accent-primary rounded cursor-pointer" />
              <span className="text-sm font-bold text-gray-700">{t('symptom.spreading')}</span>
            </label>
          </div>
        </div>

        {/* WHO note */}
        <div className="sci-ref-card flex items-start gap-2 mb-5 animate-slide-up stagger-3">
          <Zap size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 font-medium leading-relaxed">{t('symptom.who_protocol')}</p>
        </div>

        {/* TB Screening Card */}
        <div className="mb-5 animate-slide-up stagger-4">
          <button
            onClick={() => setShowTbCard(!showTbCard)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-red-600" />
              <div className="text-left">
                <p className="font-bold text-red-700">{t('symptom.tb_screening_title', 'TB Screening (NTEP)')}</p>
                <p className="text-xs text-red-600">{tbSymptoms.length > 0 ? `${tbSymptoms.length} selected` : 'Check for TB risk'}</p>
              </div>
            </div>
            <ChevronDown size={20} className={`text-red-600 transition-transform ${showTbCard ? 'rotate-180' : ''}`} />
          </button>

          {showTbCard && (
            <div className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-fade-in">
              <p className="text-xs font-bold text-red-700 mb-3">{t('symptom.tb_symptoms_label', 'TB Risk Symptoms')}</p>
              <div className="grid grid-cols-2 gap-2">
                {TB_SYMPTOMS.map(symptom => {
                  const selected = tbSymptoms.includes(symptom.en);
                  return (
                    <button
                      key={symptom.en}
                      onClick={() => {
                        if (selected) {
                          setTbSymptoms(tbSymptoms.filter(s => s !== symptom.en));
                        } else {
                          setTbSymptoms([...tbSymptoms, symptom.en]);
                        }
                        speak(symptom.en);
                      }}
                      className="p-3 rounded-lg border-2 transition-all font-bold text-xs text-center"
                      style={{
                        borderColor: selected ? '#dc2626' : '#fee2e2',
                        background: selected ? '#fecaca' : '#fef2f2',
                        color: selected ? '#7f1d1d' : '#991b1b',
                      }}
                    >
                      {i18n.language === 'hi' ? symptom.hi : symptom.en}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-red-600 font-semibold mt-3">{t('symptom.tb_warning', 'NTEP: National TB Elimination Program - Free treatment & support')}</p>
            </div>
          )}
        </div>

        {/* CBAC NCD Screening Card */}
        <div className="mb-5 animate-slide-up stagger-4">
          <button
            onClick={() => setShowCbacCard(!showCbacCard)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-purple-600" />
              <div className="text-left">
                <p className="font-bold text-purple-700">{t('symptom.cbac_title', 'CBAC - NCD Risk Check')}</p>
                <p className="text-xs text-purple-600">{cbacAge ? `${cbacRisks.filter(Boolean).length} risk factors` : 'Age screening'}</p>
              </div>
            </div>
            <ChevronDown size={20} className={`text-purple-600 transition-transform ${showCbacCard ? 'rotate-180' : ''}`} />
          </button>

          {showCbacCard && (
            <div className="mt-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl animate-fade-in space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-purple-200">
                <input
                  type="checkbox"
                  id="cbac-age"
                  checked={cbacAge}
                  onChange={(e) => setCbacAge(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="cbac-age" className="flex-1 font-bold text-sm text-purple-700 cursor-pointer">
                  {t('symptom.cbac_age_trigger', 'Age >30 years')}
                </label>
              </div>

              {cbacAge && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-bold text-purple-700 mb-2">{t('symptom.cbac_ncd_questions', 'NCD Risk Factors')}</p>
                  {CBAC_NCD_QUESTIONS.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
                      <input
                        type="checkbox"
                        id={`cbac-q${idx}`}
                        checked={cbacRisks[idx]}
                        onChange={(e) => {
                          const newRisks = [...cbacRisks];
                          newRisks[idx] = e.target.checked;
                          setCbacRisks(newRisks);
                        }}
                        className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                      />
                      <label htmlFor={`cbac-q${idx}`} className="flex-1 font-semibold text-xs text-purple-700 cursor-pointer">
                        {i18n.language === 'hi' ? q.hi : q.en}
                      </label>
                    </div>
                  ))}

                  {cbacRisks.filter(Boolean).length >= 2 && (
                    <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg animate-slide-up">
                      <p className="font-bold text-yellow-800 text-sm mb-1">{t('symptom.cbac_referral_needed', '⚠️ NCD Referral Recommended')}</p>
                      <p className="text-xs text-yellow-700">{t('symptom.cbac_referral_message', `${cbacRisks.filter(Boolean).length} risk factors detected. Refer to CHC for CBAC assessment and health screening.`)}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-purple-600 font-semibold">{t('symptom.cbac_info', 'CBAC: Community-Based Assessment Checklist for screening Non-Communicable Diseases')}</p>
            </div>
          )}
        </div>

        <button
          id="symptom-check-btn"
          onClick={handleCheck}
          disabled={loading || symptoms.length === 0}
          className="w-full btn-primary text-base py-4 flex items-center justify-center gap-2 disabled:opacity-50 animate-slide-up stagger-6"
        >
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('common.loading')}</>
            : <><AlertTriangle size={20} /> {t('symptom.check_btn')}</>
          }
        </button>
      </Card>
    </div>
  );
};
