import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { PlayCircle, BookOpen, Volume2, X, Zap, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { getEducationModules, type EducationModule } from '../services/api';

type FilterKey = 'All' | 'Nutrition' | 'Mental Health' | 'Anemia' | 'Pregnancy';

const FILTER_KEYS: FilterKey[] = ['All', 'Nutrition', 'Mental Health', 'Anemia', 'Pregnancy'];

// Extended scientific content for each category (for expanded drawer)
const SCIENTIFIC_CONTENT: Record<string, { who: string; icmr: string; tips: string[] }> = {
  Nutrition: {
    who: 'WHO recommends 27 mg iron/day during pregnancy. Pair iron with Vitamin C to improve absorption by up to 6×.',
    icmr: 'ICMR-NIN: Iron-Folic Acid (IFA) supplementation — 1 tablet daily for all pregnant women from first trimester.',
    tips: ['Eat jaggery (gur) — has 11.4 mg iron per 100g', 'Spinach + lemon juice = maximum iron absorption', 'Avoid tea/coffee with meals — reduces iron absorption by 60%'],
  },
  'Mental Health': {
    who: 'WHO: 1 in 5 women experience depression or anxiety during pregnancy or after childbirth. Early screening saves lives.',
    icmr: 'EPDS (Edinburgh Postnatal Depression Scale) is the validated gold-standard tool recommended by ICMR for community screening.',
    tips: ['Score ≥10: Needs counselling & follow-up', 'Score ≥13: Immediate referral to psychiatrist', 'EPDS Q10 (self-harm) any score > 0: Emergency referral'],
  },
  Anemia: {
    who: 'WHO: Hemoglobin < 11 g/dL in pregnancy = anemia. Below 7 g/dL = severe anemia requiring emergency care.',
    icmr: 'ICMR: IFA tablets (100mg iron + 500mcg folic acid) must be given to all pregnant women twice daily if Hb < 7.',
    tips: ['Check Hb at first ANC visit and at 28–32 weeks', 'Pale conjunctiva & nails = clinical sign of severe anemia', 'ORS + iron supplementation in severe cases before referral'],
  },
  Pregnancy: {
    who: 'WHO: BP ≥140/90 mmHg in pregnancy = gestational hypertension. BP ≥160/110 = hypertensive emergency. Immediate referral.',
    icmr: 'ICMR: Minimum 8 ANC visits. First at 12 weeks, then monthly until 28 weeks, fortnightly until 36 weeks, weekly after.',
    tips: ['Pre-eclampsia warning signs: headache, blurred vision, upper abdominal pain, swelling', 'Urine protein testing at each ANC visit for pre-eclampsia screening', 'All women with BP ≥ 140/90 to be referred to PHC or district hospital'],
  },
};

export const Education: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useTextToSpeech();
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [expanded, setExpanded] = useState<EducationModule | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEducationModules();
      setModules(data);
      speak(t('education.voice_intro', { count: data.length }));
    } catch (e) {
      console.error('Failed to load education modules:', e);
      // Should not happen with static data, but fallback gracefully
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [speak, t]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const filtered = filter === 'All' ? modules : modules.filter(m => m.category === filter);

  const filterLabelKey = (f: FilterKey): string => {
    const map: Record<FilterKey, string> = {
      'All': 'education.filter_all',
      'Nutrition': 'education.filter_nutrition',
      'Mental Health': 'education.filter_mental',
      'Anemia': 'education.filter_anemia',
      'Pregnancy': 'education.filter_pregnancy',
    };
    return map[f];
  };

  const readModule = (mod: EducationModule) => {
    const sci = SCIENTIFIC_CONTENT[mod.category];
    const text = `${mod.title}. ${sci ? sci.who + ' ' + sci.icmr : ''}`;
    speak(text);
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('education.full_title')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('education.subtitle')}</p>
        </div>
        <div className="p-3 rounded-full shadow-sm" style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894' }}>
          <BookOpen size={22} />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTER_KEYS.map(f => (
          <button
            key={f}
            id={`edu-filter-${f.replace(' ', '-').toLowerCase()}`}
            onClick={() => setFilter(f)}
            className={filter === f ? 'chip-active flex-shrink-0' : 'chip-inactive flex-shrink-0'}
          >
            {t(filterLabelKey(f))}
          </button>
        ))}
      </div>

      {/* Module list */}
      {loading ? (
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2 text-primary font-bold justify-center animate-pulse py-2">
            <BookOpen size={18} className="animate-bounce" />
            <span className="text-sm">{t('education.loading_text')}</span>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card h-44 shimmer-bg rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((mod, idx) => {
            const sci = SCIENTIFIC_CONTENT[mod.category];
            return (
              <Card
                key={mod.id}
                className={`animate-slide-up stagger-${Math.min(idx + 1, 4)} !p-0 overflow-hidden cursor-pointer group`}
                onClick={() => { setExpanded(mod); readModule(mod); }}
              >
                {/* Thumbnail */}
                <div className={`h-36 bg-gradient-to-br ${mod.color} relative flex items-center justify-center overflow-hidden`}>
                  {mod.youtube_id && (
                     <img src={`https://img.youtube.com/vi/${mod.youtube_id}/mqdefault.jpg`} alt="Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
                  )}
                  <PlayCircle size={52} className="text-white opacity-90 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg z-10" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-10">
                    {mod.duration}
                  </div>
                  {/* Category pill */}
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                    {mod.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 bg-white flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 leading-snug text-sm mb-1 line-clamp-2">{mod.title}</h3>
                    {sci && (
                      <p className="text-xs text-gray-400 line-clamp-1">{sci.tips[0]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); readModule(mod); }}
                      className="p-2 rounded-full text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Read module aloud"
                    >
                      <Volume2 size={16} />
                    </button>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #00b894, #00cec9)' }}>
                      {t('education.start_learning')} <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card className="text-center py-10">
              <BookOpen size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-semibold text-sm">No modules in this category</p>
            </Card>
          )}
        </div>
      )}

      {/* Expanded Module Drawer */}
      {expanded && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setExpanded(null)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header / Media Player */}
            {expanded.youtube_id ? (
              <div className="w-full relative bg-black aspect-video flex-shrink-0">
                <iframe 
                  className="w-full h-full absolute top-0 left-0"
                  src={`https://www.youtube.com/embed/${expanded.youtube_id}?autoplay=1&playsinline=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
                <button
                  onClick={() => setExpanded(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white z-50 hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className={`h-32 bg-gradient-to-br ${expanded.color} relative flex items-center justify-center flex-shrink-0`}>
                <h2 className="text-white font-black text-lg px-6 text-center leading-tight drop-shadow">{expanded.title}</h2>
                <button
                  onClick={() => setExpanded(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Category & Duration */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">{expanded.category}</span>
                <span className="text-xs font-bold text-gray-400">{expanded.duration}</span>
              </div>

              {/* Scientific content */}
              {SCIENTIFIC_CONTENT[expanded.category] && (() => {
                const sci = SCIENTIFIC_CONTENT[expanded.category];
                return (
                  <>
                    {/* WHO guideline */}
                    <div className="sci-ref-card space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary flex-shrink-0" />
                        <span className="text-xs font-black text-primary">{t('education.who_guideline')}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{sci.who}</p>
                    </div>

                    {/* ICMR guideline */}
                    <div className="sci-ref-card space-y-1.5" style={{ background: 'linear-gradient(135deg, rgba(0,184,148,0.06), rgba(0,206,201,0.04))', borderColor: 'rgba(0,184,148,0.2)' }}>
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-black text-emerald-600">{t('education.icmr_guideline')}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{sci.icmr}</p>
                    </div>

                    {/* Key tips */}
                    <div>
                      <h4 className="font-black text-gray-900 text-sm mb-3 uppercase tracking-wider">{t('education.scientific_basis')}</h4>
                      <div className="space-y-2">
                        {sci.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-6 h-6 rounded-full text-white font-black flex items-center justify-center text-xs flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #6367FF, #8494FF)' }}>
                              {i + 1}
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Voice read button */}
              <button
                onClick={() => readModule(expanded)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6367FF, #8494FF)' }}
              >
                <Volume2 size={18} /> {t('education.voice_read')}
              </button>

              {/* Close */}
              <button
                onClick={() => setExpanded(null)}
                className="w-full py-3 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                {t('education.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
