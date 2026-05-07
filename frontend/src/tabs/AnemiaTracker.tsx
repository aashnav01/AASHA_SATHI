import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { Mic, Volume2, BatteryWarning, HeartPulse, Activity, Coffee, ShieldAlert, AlertCircle, RefreshCcw, Wind, Leaf, Target, Pill, Drumstick, Zap, ChevronDown, Eye, Hand, Flame, Droplet } from 'lucide-react';
import { db, makeClientId } from '../db/offlineDb';

// Symptoms with voice token matching
const SYMPTOMS_WITH_TOKENS = [
  { en: 'Fatigue / Weakness', hi: 'थकान', voiceTokens: ['fatigue', 'weak', 'tired', 'थकान', 'कमजोरी'] },
  { en: 'Pale inner eyelids', hi: 'पीली पलकें', voiceTokens: ['pale', 'eyelid', 'पीली', 'पलक'] },
  { en: 'Pale tongue / gums', hi: 'पीली जीभ', voiceTokens: ['pale', 'tongue', 'gum', 'जीभ', 'मसूड़े'] },
  { en: 'Spoon nails', hi: 'चम्मच के आकार नाखून', voiceTokens: ['nail', 'spoon', 'नाखून', 'चम्मच'] },
  { en: 'Breathlessness', hi: 'साँस लेने में तकलीफ', voiceTokens: ['breath', 'shortness', 'साँस', 'तकलीफ'] },
  { en: 'Pica (Eating dirt/chalk)', hi: 'मिट्टी खाने की इच्छा', voiceTokens: ['pica', 'dirt', 'chalk', 'मिट्टी', 'चाक'] },
  { en: 'Frequent headaches', hi: 'बार-बार सिरदर्द', voiceTokens: ['headache', 'head', 'सिरदर्द', 'दर्द'] },
  { en: 'Swelling in feet (Edema)', hi: 'पैरों में सूजन', voiceTokens: ['swelling', 'edema', 'feet', 'सूजन', 'पैर'] },
  { en: 'Rapid heartbeat', hi: 'दिल की तेज़ धड़कन', voiceTokens: ['heartbeat', 'rapid', 'heart', 'दिल', 'धड़कन'] }
];

// Foods with voice token matching
const FOODS_WITH_TOKENS = [
  { en: 'IFA (Regular)', hi: 'आयरन की गोली (नियमित)', voiceTokens: ['ifa', 'iron', 'tablet', 'regular', 'गोली', 'नियमित'] },
  { en: 'IFA (Missed doses)', hi: 'आयरन की गोली (मिस्ड डोज़)', voiceTokens: ['ifa', 'missed', 'iron', 'missed', 'मिस्ड', 'डोज़'] },
  { en: 'Leafy Greens', hi: 'हरी सब्जियाँ', voiceTokens: ['leafy', 'green', 'greens', 'पालक', 'सब्जी'] },
  { en: 'Jaggery (Gur)', hi: 'गुड़', voiceTokens: ['jaggery', 'gur', 'जगरी', 'गुड़'] },
  { en: 'Beans / Rajma', hi: 'राजमा / बीन्स', voiceTokens: ['beans', 'rajma', 'राजमा', 'बीन्स'] },
  { en: 'Amla / Lemon', hi: 'आँवला / नींबू', voiceTokens: ['amla', 'lemon', 'आँवला', 'नींबू'] },
  { en: 'Meat / Eggs', hi: 'मांस / अंडे', voiceTokens: ['meat', 'egg', 'मांस', 'अंडे'] },
  { en: 'Tea/Milk with meal', hi: 'चाय/दूध के साथ खाना', voiceTokens: ['tea', 'milk', 'meal', 'चाय', 'दूध'] }
];

const SYMPTOM_ICONS: Record<string, React.ReactNode> = {
  // English
  'Fatigue / Weakness':       <BatteryWarning size={22} />,
  'Pale inner eyelids':       <Eye size={22} />,
  'Pale tongue / gums':       <Droplet size={22} />,
  'Spoon nails':              <Hand size={22} />,
  'Breathlessness':           <Wind size={22} />,
  'Pica (Eating dirt/chalk)': <AlertCircle size={22} />,
  'Frequent headaches':       <Activity size={22} />,
  'Swelling in feet (Edema)': <RefreshCcw size={22} />,
  'Rapid heartbeat':          <HeartPulse size={22} />,
  // Hindi
  'थकान':                      <BatteryWarning size={22} />,
  'पीली पलकें':                 <Eye size={22} />,
  'पीली जीभ':                  <Droplet size={22} />,
  'चम्मच के आकार नाखून':        <Hand size={22} />,
  'साँस लेने में तकलीफ':       <Wind size={22} />,
  'मिट्टी खाने की इच्छा':      <AlertCircle size={22} />,
  'बार-बार सिरदर्द':           <Activity size={22} />,
  'पैरों में सूजन':           <RefreshCcw size={22} />,
  'दिल की तेज़ धड़कन':         <HeartPulse size={22} />,
};

const FOOD_ICONS: Record<string, React.ReactNode> = {
  // English
  'IFA (Regular)':        <Pill size={22} className="text-emerald-500"/>,
  'IFA (Missed doses)':   <Pill size={22} className="text-orange-500"/>,
  'Leafy Greens':         <Leaf size={22} />,
  'Jaggery (Gur)':        <Target size={22} />,
  'Beans / Rajma':        <Flame size={22} />,
  'Amla / Lemon':         <Zap size={22} />,
  'Meat / Eggs':          <Drumstick size={22} />,
  'Tea/Milk with meal':   <Coffee size={22} />,
  // Hindi
  'आयरन की गोली (नियमित)':    <Pill size={22} className="text-emerald-500"/>,
  'आयरन की गोली (मिस्ड डोज़)':  <Pill size={22} className="text-orange-500"/>,
  'हरी सब्जियाँ':             <Leaf size={22} />,
  'गुड़':                      <Target size={22} />,
  'राजमा / बीन्स':            <Flame size={22} />,
  'आँवला / नींबू':            <Zap size={22} />,
  'मांस / अंडे':              <Drumstick size={22} />,
  'चाय/दूध के साथ खाना':     <Coffee size={22} />,
};

// WHO/ICMR iron content reference
const IRON_REFERENCE = [
  { food: 'Jaggery (gur)', iron: '11.4 mg', key: 'jaggery' },
  { food: 'Rajma (beans)', iron: '5.5 mg',  key: 'beans' },
  { food: 'Spinach',       iron: '2.7 mg',  key: 'spinach' },
  { food: 'Dates',         iron: '1.1 mg',  key: 'dates' },
];

export const AnemiaTracker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { listen, stop: stopListen, isListening, transcript, clearTranscript } = useVoiceRecognition();
  const { speak } = useTextToSpeech();

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [foods, setFoods] = useState<string[]>([]);
  const [advice, setAdvice] = useState('');
  const [adviceError, setAdviceError] = useState('');
  const [status, setStatus] = useState('');
  const [showRef, setShowRef] = useState(false);

  const playInstructions = useCallback(() => {
    speak(t('anemia.voice_intro'));
  }, [speak, t]);

  useEffect(() => {
    // Auto-read instructions on first load for low-literacy accessibility
    const timer = setTimeout(() => playInstructions(), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced voice matching with token-based recognition
  useEffect(() => {
    if (transcript) {
      const lower = transcript.toLowerCase();
      const matched: string[] = [];

      // Match symptoms using voice tokens
      for (const symptom of SYMPTOMS_WITH_TOKENS) {
        const displayName = i18n.language === 'hi' ? symptom.hi : symptom.en;
        if (!symptoms.includes(displayName)) {
          if (symptom.voiceTokens.some(token => lower.includes(token.toLowerCase()))) {
            setSymptoms(prev => [...prev, displayName]);
            matched.push(displayName);
          }
        }
      }

      // Match foods using voice tokens
      for (const food of FOODS_WITH_TOKENS) {
        const displayName = i18n.language === 'hi' ? food.hi : food.en;
        if (!foods.includes(displayName)) {
          if (food.voiceTokens.some(token => lower.includes(token.toLowerCase()))) {
            setFoods(prev => [...prev, displayName]);
            matched.push(displayName);
          }
        }
      }

      if (matched.length > 0) {
        speak(t('common.success') + ': ' + matched.join(', '));
      } else {
        speak(`${transcript}. ${t('common.error')}.`);
      }
      clearTranscript();
    }
  }, [transcript, symptoms, foods, speak, clearTranscript, t, i18n.language]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList(prev => [...prev, item]);
      speak(item);
    }
  };

  const handleSave = async () => {
    // Validate advice is not empty
    if (!advice.trim()) {
      const errorMsg = t('anemia.advice_required');
      setAdviceError(errorMsg);
      speak(errorMsg);
      return;
    }

    // Clear any previous error
    setAdviceError('');

    try {
      await db.unsyncedAnemia.add({
        clientId: makeClientId(),
        clientTimestamp: new Date().toISOString(),
        symptoms,
        foods_consumed: foods,
        advice_given: advice,
      });
      const msg = t('anemia.success');
      setStatus('success');
      speak(msg);
      setSymptoms([]);
      setFoods([]);
      setAdvice('');
      setTimeout(() => setStatus(''), 4000);
    } catch (e) {
      console.error(e);
      setStatus('error');
      speak(t('common.error'));
    }
  };

  const sKey = (s: string) => s.toLowerCase().replace(/ /g, '_').replace(/\//g, '_');

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('anemia.title')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('anemia.subtitle')}</p>
        </div>
        <button
          id="anemia-voice-intro"
          onClick={playInstructions}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(232,67,147,0.1)', color: '#e84393' }}
          aria-label="Read instructions"
        >
          <Volume2 size={22} />
        </button>
      </div>

      <Card className="animate-slide-up">
        <div className="space-y-6">

          {/* Voice control bar */}
          <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <span className="text-gray-700 font-medium text-sm">{t('anemia.use_voice_select')}</span>
            <button
              id="anemia-mic-btn"
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
            <div className="voice-hint animate-fade-in">
              🎤 {t('anemia.use_voice_select')}
            </div>
          )}

          {/* Symptoms */}
          <div className="animate-slide-up stagger-1">
            <label className="section-label mb-3">{t('anemia.symptoms_label')}</label>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOMS_WITH_TOKENS.map(symptomObj => {
                const displayName = i18n.language === 'hi' ? symptomObj.hi : symptomObj.en;
                const k = sKey(symptomObj.en);
                const label = t(`anemia.symptoms.${k}`) !== `anemia.symptoms.${k}` ? t(`anemia.symptoms.${k}`) : displayName;
                const selected = symptoms.includes(displayName);
                return (
                  <button
                    key={displayName}
                    id={`symptom-${k}`}
                    onClick={() => toggleItem(symptoms, setSymptoms, displayName)}
                    className={`p-4 rounded-xl border-2 font-bold text-left transition-all text-sm flex flex-col items-center gap-1 ${
                      selected
                        ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-inner scale-[1.02]'
                        : 'bg-white/60 border-gray-100 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className={selected ? 'text-rose-500' : 'text-gray-400'}>{SYMPTOM_ICONS[displayName]}</div>
                    <span className="text-xs font-bold text-center leading-tight">{label}</span>
                    <button
                      onClick={e => { e.stopPropagation(); speak(label); }}
                      className={`mt-1 p-1 rounded-full transition-colors ${selected ? 'text-rose-400 hover:bg-rose-100' : 'text-gray-300 hover:text-primary'}`}
                      aria-label="Read aloud"
                    >
                      <Volume2 size={14} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foods */}
          <div className="animate-slide-up stagger-2">
            <label className="section-label mb-3">{t('anemia.foods_label')}</label>
            <div className="grid grid-cols-2 gap-3">
              {FOODS_WITH_TOKENS.map(foodObj => {
                const displayName = i18n.language === 'hi' ? foodObj.hi : foodObj.en;
                const k = sKey(foodObj.en);
                const label = t(`anemia.foods.${k}`) !== `anemia.foods.${k}` ? t(`anemia.foods.${k}`) : displayName;
                const selected = foods.includes(displayName);
                return (
                  <button
                    key={displayName}
                    id={`food-${k}`}
                    onClick={() => toggleItem(foods, setFoods, displayName)}
                    className={`p-4 rounded-xl border-2 font-bold text-left transition-all text-sm flex flex-col items-center gap-1 ${
                      selected
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-inner scale-[1.02]'
                        : 'bg-white/60 border-gray-100 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className={selected ? 'text-emerald-500' : 'text-gray-400'}>{FOOD_ICONS[displayName]}</div>
                    <span className="text-xs font-bold text-center leading-tight">{label}</span>
                    <button
                      onClick={e => { e.stopPropagation(); speak(label); }}
                      className={`mt-1 p-1 rounded-full transition-colors ${selected ? 'text-emerald-400 hover:bg-emerald-100' : 'text-gray-300 hover:text-primary'}`}
                      aria-label="Read aloud"
                    >
                      <Volume2 size={14} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advice field */}
          <div className="animate-slide-up stagger-3">
            <label className="section-label mb-2">{t('anemia.advice_given')}</label>
            <textarea
              value={advice}
              onChange={e => {
                setAdvice(e.target.value);
                // Clear error when user starts typing
                if (adviceError) setAdviceError('');
              }}
              className={`input-field resize-none text-base bg-white/60 ${adviceError ? 'border-2 border-red-500' : ''}`}
              rows={3}
              placeholder={t('anemia.type_or_dictate')}
            />
            {adviceError && (
              <p className="text-sm font-bold text-red-600 mt-2">{adviceError}</p>
            )}
          </div>

          {/* WHO Reference collapsible */}
          <div className="animate-slide-up stagger-4">
            <button
              onClick={() => { setShowRef(v => !v); if (!showRef) speak(t('anemia.who_reference')); }}
              className="w-full sci-ref-card flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-primary">WHO / ICMR Reference</span>
              </div>
              <ChevronDown size={14} className={`text-primary transition-transform ${showRef ? 'rotate-180' : ''}`} />
            </button>
            {showRef && (
              <div className="mt-2 bg-white/70 rounded-xl p-3 border border-primary/10 space-y-3 animate-fade-in">
                <div>
                  <p className="text-xs text-gray-600 font-medium">{t('anemia.who_reference')}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {IRON_REFERENCE.map(r => (
                      <div key={r.key} className="flex justify-between bg-emerald-50/50 rounded-lg px-2 py-1.5 border border-emerald-100">
                        <span className="text-xs font-semibold text-gray-700">{r.food}</span>
                        <span className="text-xs font-black text-emerald-600">{r.iron}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indian MoHFW IFA Guidelines */}
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xs text-blue-800 font-bold mb-1.5 flex items-center gap-1.5"><Pill size={14} /> MoHFW IFA Protocol</p>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li><b>Prophylactic:</b> 1 IFA tab/day for 100 days.</li>
                    <li><b>Therapeutic:</b> 2 IFA tabs/day for severe anemia.</li>
                    <li>Deworming (Albendazole 400mg) in 2nd trimester.</li>
                  </ul>
                </div>
                
                {/* Absorption Rules */}
                <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                  <p className="text-xs text-orange-800 font-bold mb-1.5 flex items-center gap-1.5"><ShieldAlert size={14} /> Iron Absorption Rules</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li className="flex items-start gap-1 leading-tight"><span className="text-emerald-500 font-bold">✓</span> <span className="flex-1"><b>Enhance:</b> Take IFA with Vitamin C (Lemon/Amla).</span></li>
                    <li className="flex items-start gap-1 leading-tight"><span className="text-red-500 font-bold">✗</span> <span className="flex-1"><b>Inhibit:</b> Avoid IFA with Milk (Calcium blocks iron).</span></li>
                    <li className="flex items-start gap-1 leading-tight"><span className="text-red-500 font-bold">✗</span> <span className="flex-1"><b>Inhibit:</b> Avoid Tea/Coffee for 1 hr after meals.</span></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            id="anemia-submit-btn"
            onClick={handleSave}
            className="w-full btn-primary text-base py-4 animate-slide-up stagger-5"
          >
            {t('anemia.submit')}
          </button>

          {/* Status */}
          {status && (
            <div className={`p-4 rounded-xl text-center font-bold text-sm animate-bounce-in ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {status === 'success' ? `✓ ${t('anemia.success')}` : t('common.error')}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
