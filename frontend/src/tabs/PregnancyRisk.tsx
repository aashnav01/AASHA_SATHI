import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { db } from '../db/offlineDb';
import { assessPregnancyRisk, type PregnancyRiskResult } from '../services/api';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Mic, Volume2, ShieldAlert, HeartPulse, Activity, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// WHO/ICMR BP and Hb reference
const RISK_THRESHOLDS = [
  { label: 'Severe hypertension', value: 'BP ≥160/110 mmHg', level: 'high', color: '#ef4444' },
  { label: 'Gestational hypertension', value: 'BP ≥140/90 mmHg', level: 'high', color: '#ef4444' },
  { label: 'Severe anemia', value: 'Hb < 7  g/dL', level: 'high', color: '#ef4444' },
  { label: 'Moderate anemia', value: 'Hb 7–9.9 g/dL', level: 'medium', color: '#f59e0b' },
  { label: 'PPD referral threshold', value: 'EPDS ≥13', level: 'high', color: '#ef4444' },
];

export const PregnancyRisk: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useTextToSpeech();
  const { listen, stop: stopListen, isListening, transcript, clearTranscript } = useVoiceRecognition();

  const [hemoglobin, setHemoglobin] = useState(11.5);
  const [ppdScore, setPpdScore] = useState(0);
  const [epdsQ10, setEpdsQ10] = useState(0);
  const [sysBp, setSysBp] = useState(120);
  const [diaBp, setDiaBp] = useState(80);
  const [weeks, setWeeks] = useState(20);
  
  // Danger Sign Flags
  const [hasBleeding, setHasBleeding] = useState(false);
  const [hasSevereHeadache, setHasSevereHeadache] = useState(false);
  const [hasReducedFetalMovement, setHasReducedFetalMovement] = useState(false);
  const [hasFever, setHasFever] = useState(false);
  const [hasSwelling, setHasSwelling] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PregnancyRiskResult | null>(null);

  const playInstructions = useCallback(() => {
    speak(t('risk.voice_intro'));
  }, [speak, t]);

  // Auto-read intro and fetch latest PPD
  useEffect(() => {
    const timer = setTimeout(() => playInstructions(), 600);
    
    // Automatically pre-fill the most recent PPD score
    db.unsyncedPPD.toCollection().last().then((lastPpd) => {
      if (lastPpd) {
        setPpdScore(lastPpd.total_score);
        // Question 10 is index 9
        if (lastPpd.epds_answers && lastPpd.epds_answers.length > 9) {
          setEpdsQ10(lastPpd.epds_answers[9]);
        }
      }
    }).catch(e => console.error("Could not fetch offline PPD", e));

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!transcript) return;
    const lower = transcript.toLowerCase();
    const match = lower.match(/(\d+)/g);
    if (match?.length) {
      if (lower.includes('week') || lower.includes('सप्ताह')) {
        setWeeks(parseInt(match[0]));
        speak(`${t('risk.gestational_age')}: ${match[0]}`);
      } else {
        speak(`${t('common.error')}.`);
      }
    }
    clearTranscript();
    stopListen();
  }, [transcript, speak, clearTranscript, stopListen, t]);

  const handleAssess = async () => {
    try {
      setLoading(true);
      const res = await assessPregnancyRisk({
        hemoglobin_g_dl: hemoglobin,
        ppd_score: ppdScore,
        epds_q10_score: epdsQ10,
        systolic_bp: sysBp,
        diastolic_bp: diaBp,
        gestational_age_weeks: weeks,
        has_bleeding: hasBleeding,
        has_severe_headache: hasSevereHeadache,
        has_reduced_fetal_movement: hasReducedFetalMovement,
        has_fever: hasFever,
        has_swelling: hasSwelling,
      });
      setResult(res);
      const rText = t(`risk.risk_${res.risk_level}`);
      speak(t('risk.voice_result', { risk: rText, reasons: res.reasons.length }));
    } catch (e) {
      console.error(e);
      speak(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const riskCfg = {
    high:   { border: 'border-red-200 bg-red-50/90',       text: 'text-red-700',     icon: '#ef4444', grad: 'from-red-500 to-red-700' },
    medium: { border: 'border-orange-200 bg-orange-50/90',  text: 'text-orange-700',  icon: '#f59e0b', grad: 'from-orange-400 to-amber-600' },
    low:    { border: 'border-emerald-200 bg-emerald-50/90',text: 'text-emerald-700', icon: '#10b981', grad: 'from-emerald-400 to-green-600' },
  };

  if (result) {
    const cfg = riskCfg[result.risk_level];
    return (
      <div className="space-y-4 pb-4 animate-fade-in">
        <h2 className="text-2xl font-extrabold text-gray-900">{t('risk.title')}</h2>
        <Card className={`border-2 ${cfg.border} animate-bounce-in`}>
          {/* Hero risk banner */}
          <div className="text-center mb-6 mt-2">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${cfg.grad} shadow-xl`}>
              <ShieldAlert size={36} className="text-white" />
            </div>
            <div className={`inline-block px-5 py-2 rounded-2xl font-black text-lg uppercase tracking-wider text-white bg-gradient-to-r ${cfg.grad} shadow-lg mb-2`}>
              {t(`risk.risk_${result.risk_level}`)}
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest opacity-60 mt-1 ${cfg.text}`}>{t('risk.assessment_result')}</p>

            {/* Voice read result */}
            <button
              onClick={() => speak(t('risk.voice_result', { risk: t(`risk.risk_${result.risk_level}`), reasons: result.reasons.length }))}
              className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 rounded-full bg-white/80 font-bold text-primary text-sm shadow-sm hover:bg-white transition-all"
            >
              <Volume2 size={14} /> {t('common.tap_to_hear')}
            </button>
          </div>

          {/* Risk factors */}
          {result.reasons.length > 0 && (
            <div className="mb-4 bg-white/60 p-4 rounded-2xl border border-white/50">
              <h4 className="font-black text-gray-900 mb-3 text-sm uppercase tracking-wider">{t('risk.reasons')}</h4>
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.icon }} />
                    <span className="text-sm font-semibold leading-snug text-gray-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="mb-4 bg-white/60 p-4 rounded-2xl border border-white/50">
            <h4 className="font-black text-gray-900 mb-3 text-sm uppercase tracking-wider">{t('risk.recommendations')}</h4>
            <div className="space-y-2">
              {result.recommendations.map((r, i) => (
                <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-black shadow-sm"
                    style={{ background: `linear-gradient(135deg, #6367FF, #8494FF)` }}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 leading-snug pt-0.5">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WHO/ICMR reference */}
          <div className="sci-ref-card flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              <span className="text-xs font-black text-primary">WHO / ICMR Thresholds</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">{t('risk.who_bp_threshold')}</p>
            <p className="text-xs text-gray-600 font-medium">{t('risk.icmr_hb_threshold')}</p>
          </div>

          <button
            id="risk-retry-btn"
            onClick={() => setResult(null)}
            className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl shadow-md hover:bg-gray-50 active:scale-95 transition-all"
          >
            {t('common.try_again')}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{t('risk.title')}</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{t('risk.subtitle')}</p>
        </div>
        <button
          id="risk-voice-intro"
          onClick={playInstructions}
          className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
          aria-label="Read instructions"
        >
          <Volume2 size={22} />
        </button>
      </div>

      <Card className="animate-slide-up">
        {/* Voice bar */}
        <div className="mb-6 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <span className="text-gray-700 font-medium text-sm">{t('risk.subtitle')}</span>
          <button
            id="risk-mic-btn"
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

        <div className="space-y-5">
          {/* Gestational age */}
          <div className="animate-slide-up stagger-1">
            <label className="section-label mb-2">{t('risk.gestational_age')}</label>
            <div className="relative">
              <input type="number" value={weeks} onChange={e => setWeeks(Number(e.target.value))}
                className="input-field pl-5 font-black text-xl" />
              <span className="absolute right-4 top-[14px] text-gray-400 font-bold text-sm">{t('risk.weeks')}</span>
            </div>
          </div>

          {/* Danger Signs Checklist */}
          <div className="animate-slide-up stagger-2 bg-red-50/50 p-4 rounded-xl border border-red-100">
            <label className="section-label mb-3 text-red-600 flex items-center gap-1.5"><ShieldAlert size={14}/> {t('risk.danger_title')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('risk.danger_bleeding'), state: hasBleeding, set: setHasBleeding },
                { label: t('risk.danger_headache'), state: hasSevereHeadache, set: setHasSevereHeadache },
                { label: t('risk.danger_fetal'), state: hasReducedFetalMovement, set: setHasReducedFetalMovement, hidden: weeks < 24 },
                { label: t('risk.danger_fever'), state: hasFever, set: setHasFever },
                { label: t('risk.danger_swelling'), state: hasSwelling, set: setHasSwelling },
              ].filter(i => !i.hidden).map(item => (
                <button
                  key={item.label}
                  onClick={() => { item.set(!item.state); speak(item.label); }}
                  className={`p-3 rounded-lg border-2 text-xs font-bold text-left transition-all flex items-center justify-between min-h-[60px] ${
                    item.state ? 'border-red-400 bg-red-100 text-red-700 shadow-sm' : 'border-red-100 bg-white/60 text-gray-600 hover:border-red-200'
                  }`}
                >
                  <span className="leading-tight w-4/5">{item.label}</span>
                  {item.state && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Blood pressure */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-3">
            <div>
              <label className="section-label mb-2 flex items-center gap-1"><HeartPulse size={11} className="text-red-400" />{t('risk.systolic_bp')}</label>
              <input type="number" value={sysBp} onChange={e => setSysBp(Number(e.target.value))}
                className="input-field font-black text-xl text-center" />
            </div>
            <div>
              <label className="section-label mb-2 flex items-center gap-1"><Activity size={11} className="text-orange-400" />{t('risk.diastolic_bp')}</label>
              <input type="number" value={diaBp} onChange={e => setDiaBp(Number(e.target.value))}
                className="input-field font-black text-xl text-center" />
            </div>
          </div>

          {/* PPD Score */}
          <div className="animate-slide-up stagger-4">
            <div className="flex justify-between mb-2">
              <label className="section-label">{t('risk.ppd_score')}</label>
              <label className="section-label text-red-400">{t('risk.q10_score')}</label>
            </div>
            <div className="flex gap-2">
              <input type="number" value={ppdScore} onChange={e => setPpdScore(Number(e.target.value))}
                className="input-field font-black text-xl w-2/3" />
              <input type="number" value={epdsQ10} max="3" min="0" onChange={e => setEpdsQ10(Number(e.target.value))}
                className="input-field font-black text-xl w-1/3 text-center text-red-500" />
            </div>
          </div>

          {/* Hemoglobin */}
          <div className="animate-slide-up stagger-5">
            <label className="section-label mb-2">{t('risk.hemoglobin')}</label>
            <div className="relative">
              <input type="number" step="0.1" value={hemoglobin} onChange={e => setHemoglobin(Number(e.target.value))}
                className="input-field pl-5 font-black text-xl" />
              <span className="absolute right-4 top-[14px] text-gray-400 font-bold text-sm">g/dL</span>
            </div>
          </div>

          {/* WHO/ICMR collapsible reference */}
          <div className="animate-slide-up stagger-6">
            <button
              onClick={() => { setShowRef(v => !v); if (!showRef) speak('WHO ICMR thresholds for pregnancy risk. ' + t('risk.who_bp_threshold') + ' ' + t('risk.icmr_hb_threshold')); }}
              className="w-full sci-ref-card flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-primary">WHO/ICMR Reference Thresholds</span>
              </div>
              <Volume2 size={13} className="text-primary" />
            </button>
            {showRef && (
              <div className="mt-2 bg-white/70 rounded-xl p-3 border border-primary/10 space-y-2 animate-fade-in">
                {RISK_THRESHOLDS.map(rt => (
                  <div key={rt.label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">{rt.label}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ color: rt.color, background: `${rt.color}20` }}>{rt.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          id="risk-assess-btn"
          onClick={handleAssess}
          disabled={loading}
          className="w-full mt-6 btn-primary py-4 text-base flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('common.loading')}</>
            : <><ShieldAlert size={20} /> {t('risk.assess_btn')}</>
          }
        </button>
      </Card>
    </div>
  );
};
