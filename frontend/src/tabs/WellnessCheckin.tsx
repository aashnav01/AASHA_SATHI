import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { Heart, Volume2, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, makeClientId, type OfflineWellnessCheckin } from '../db/offlineDb';

const MOOD_EMOJIS = ['😊', '😐', '😔', '😰', '😡'];
const AFFIRMATIONS_EN = [
  'Your effort today matters. Rest is productive too.',
  'You are strong. One village, one day at a time.',
  'Your care makes a difference. Be kind to yourself.',
  'Burnout is not weakness. Reach out for support.',
  'You deserve rest and support. Take tomorrow easy.',
  'Your heart is big. Remember to fill your own cup first.',
  'Every visit you make saves lives. Take care of yourself too.',
];

const AFFIRMATIONS_HI = [
  'आपके प्रयास कल मायने रखते हैं। आराम भी उत्पादक है।',
  'आप मजबूत हैं। एक गाँव, एक दिन पर ध्यान दें।',
  'आपकी देखभाल फर्क लाती है। अपने साथ दयालु रहें।',
  'थकावट कमजोरी नहीं है। समर्थन के लिए पहुँचें।',
  'आप आराम और समर्थन के योग्य हैं।',
  'आपका दिल बड़ा है। पहले अपने कप को भरें।',
  'हर दौरा जो आप करते हैं जान बचाता है। अपना ख्याल रखें।',
];


const QUESTIONS = [
  { key: 'tiredness', en: 'How tired are you today?', hi: 'आप आज कितने थके हुए हैं?' },
  { key: 'supervisor_support', en: 'Did you feel supported by your supervisor?', hi: 'क्या आपको अपने पर्यवेक्षक से समर्थन मिला?' },
  { key: 'completed_visits', en: 'Were you able to complete your planned visits?', hi: 'क्या आप अपने नियोजित दौरे को पूरा कर पाए?' },
];

export const WellnessCheckin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useTextToSpeech();

  // State
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ tiredness: number; supervisor_support: number; completed_visits: number }>({
    tiredness: -1,
    supervisor_support: -1,
    completed_visits: -1,
  });
  const [weeklyData, setWeeklyData] = useState<OfflineWellnessCheckin[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showStressAlert, setShowStressAlert] = useState(false);
  const [message, setMessage] = useState('');


  // Load data and read affirmation on mount
  useEffect(() => {
    loadWeeklyData();
    checkIfAlreadySubmittedToday();
    
    const timer = setTimeout(() => {
      const affirmation = i18n.language === 'hi' 
        ? AFFIRMATIONS_HI[Math.floor(Math.random() * AFFIRMATIONS_HI.length)]
        : AFFIRMATIONS_EN[Math.floor(Math.random() * AFFIRMATIONS_EN.length)];
      speak(affirmation);
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeeklyData = async () => {
    try {
      const allEntries = await db.wellnessCheckins.toArray();
      // Get last 7 days
      const last7 = allEntries.slice(-7);
      setWeeklyData(last7);

      // Check for 3+ consecutive high-stress days
      checkForHighStressAlert(last7);
    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
  };

  const checkForHighStressAlert = (data: OfflineWellnessCheckin[]) => {
    if (data.length < 3) return;

    // Check last 3 days for high stress (score > 7)
    const last3 = data.slice(-3);
    const allHighStress = last3.every(entry => (entry.overall_score || 0) > 7);
    
    if (allHighStress) {
      setShowStressAlert(true);
    }
  };

  const checkIfAlreadySubmittedToday = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await db.wellnessCheckins
        .where('date').equals(today)
        .first();
      
      if (existing) {
        setTodayMood(existing.mood);
        setAnswers({
          tiredness: existing.tiredness || 0,
          supervisor_support: existing.supervisor_support || 0,
          completed_visits: existing.completed_visits || 0,
        });
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking existing entry:', error);
    }
  };

  const calculateScore = (): number => {
    return (answers.tiredness || 0) + (answers.supervisor_support || 0) + (answers.completed_visits || 0);
  };

  const isFormComplete = (): boolean => {
    return todayMood !== null && 
           answers.tiredness >= 0 && 
           answers.supervisor_support >= 0 && 
           answers.completed_visits >= 0;
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      speak(t('wellness.complete_form', 'Please answer all questions'));
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const score = calculateScore();

      const entry: OfflineWellnessCheckin = {
        clientId: makeClientId(),
        clientTimestamp: new Date().toISOString(),
        date: today,
        mood: todayMood!,
        tiredness: answers.tiredness,
        supervisor_support: answers.supervisor_support,
        completed_visits: answers.completed_visits,
        overall_score: score,
        sync_status: 'pending',
      };

      if (submitted) {
        await db.wellnessCheckins.where('date').equals(today).modify(entry);
      } else {
        await db.wellnessCheckins.add(entry);
      }

      setSubmitted(true);
      const thankYouMsg = i18n.language === 'hi' 
        ? 'आपका ध्यान रखना महत्वपूर्ण है।'
        : 'Your well-being matters. Great job checking in!';
      
      setMessage(thankYouMsg);
      speak(thankYouMsg);
      
      setTimeout(() => setMessage(''), 3000);
      loadWeeklyData();
    } catch (error) {
      console.error('Error saving wellness entry:', error);
      setMessage(t('common.error', 'Error saving'));
      speak(t('common.error', 'Error saving'));
    }
  };

  // Prepare chart data
  const chartData = weeklyData.map(entry => ({
    date: entry.date.slice(5), // MM-DD
    mood: entry.mood,
    score: entry.overall_score || 0,
  }));

  const avgMood = weeklyData.length > 0
    ? (weeklyData.reduce((sum, e) => sum + e.mood, 0) / weeklyData.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('wellness.title', 'Your Wellness')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            {submitted ? t('wellness.today_checked', 'Today\'s check-in saved ✓') : t('wellness.today_pending', 'How are you today?')}
          </p>
        </div>
        <button
          onClick={() => {
            const affirmation = i18n.language === 'hi' 
              ? AFFIRMATIONS_HI[Math.floor(Math.random() * AFFIRMATIONS_HI.length)]
              : AFFIRMATIONS_EN[Math.floor(Math.random() * AFFIRMATIONS_EN.length)];
            speak(affirmation);
          }}
          className="p-3 rounded-full hover:scale-110 active:scale-95 transition-all"
          style={{ background: 'rgba(236, 72, 153, 0.1)' }}
          aria-label="Read affirmation"
        >
          <Volume2 size={22} className="text-rose-500" />
        </button>
      </div>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 !p-4 space-y-2">
        <p className="text-sm font-bold text-rose-900">💫 {t('wellness.daily_affirmation', 'Today\'s Message')}</p>
        <p className="text-sm leading-relaxed text-rose-800">
          {i18n.language === 'hi' 
            ? AFFIRMATIONS_HI[Math.floor(Math.random() * AFFIRMATIONS_HI.length)]
            : AFFIRMATIONS_EN[Math.floor(Math.random() * AFFIRMATIONS_EN.length)]
          }
        </p>
      </Card>

      {/* Mood Selection */}
      <Card className="!p-4 space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-bold text-gray-900">{t('wellness.mood_question', 'How is your mood today?')}</h3>
        <p className="text-xs text-gray-500">{t('wellness.mood_tap', 'Tap one emoji')}</p>
        
        <div className="flex justify-between gap-2">
          {MOOD_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => setTodayMood(idx + 1)}
              className={`flex-1 p-3 rounded-xl transition-all transform flex items-center justify-center ${
                todayMood === idx + 1
                  ? 'bg-blue-500 shadow-lg scale-125 text-3xl'
                  : 'bg-white text-2xl hover:scale-110'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Card>

      {/* Three Quick Questions */}
      {QUESTIONS.map((q) => (
        <Card key={q.key} className="!p-4 space-y-2 bg-white border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            {i18n.language === 'hi' ? q.hi : q.en}
          </h3>
          
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map(score => (
              <button
                key={score}
                onClick={() => setAnswers({ ...answers, [q.key]: score })}
                className={`py-3 px-2 rounded-lg font-bold text-sm transition-all ${
                  answers[q.key as keyof typeof answers] === score
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {score === 0 ? '😞' : score === 1 ? '😕' : score === 2 ? '😊' : '😄'}
                <div className="text-xs mt-1">{score}</div>
              </button>
            ))}
          </div>
        </Card>
      ))}

      {/* Score Display */}
      {(answers.tiredness >= 0 || answers.supervisor_support >= 0 || answers.completed_visits >= 0) && (
        <Card className="!p-3 bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-700">{t('wellness.stress_score', 'Stress Score')}</p>
            <p className="text-2xl font-black text-indigo-900">{calculateScore()}/9</p>
          </div>
          <Zap 
            size={28} 
            className={calculateScore() > 7 ? 'text-red-500' : calculateScore() > 4 ? 'text-amber-500' : 'text-green-500'}
          />
        </Card>
      )}

      {/* Submit Button */}
      <Card className="!p-4">
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete()}
          className={`w-full py-3 px-4 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isFormComplete()
              ? 'bg-rose-500 hover:bg-rose-600 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 size={20} />
          {submitted ? t('wellness.update', 'Update Check-in') : t('wellness.submit', 'Save Check-in')}
        </button>
        {message && (
          <p className="mt-2 p-2 rounded text-center text-sm font-bold bg-green-200 text-green-900">
            {message}
          </p>
        )}
      </Card>

      {/* High Stress Alert */}
      {showStressAlert && (
        <Card className="!p-4 border-2 border-red-400 bg-red-50 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">{t('wellness.high_stress_warning', 'You\'ve been working very hard')}</p>
              <p className="text-sm text-red-800 mt-1">
                {i18n.language === 'hi'
                  ? 'आप बहुत मेहनत कर रहे हैं। आराम करना याद रखें। अपने ANM पर्यवेक्षक से संपर्क करें यदि आपको समर्थन की आवश्यकता है।'
                  : 'Remember to rest. Contact your ANM supervisor if you need support.'
                }
              </p>
              <p className="text-xs font-semibold text-red-700 mt-2">
                📞 ASHA Federation Helpline: 1800-180-1111 (toll-free)
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Chart */}
      {weeklyData.length > 1 && (
        <Card className="!p-4 space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            {t('wellness.mood_trend', 'Your 7-Day Mood Trend')}
          </h3>

          <div className="h-40 w-full -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value) => `${value}`}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ background: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#a78bfa" 
                  dot={{ fill: '#a78bfa', r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs font-bold text-gray-600">{t('wellness.avg_mood', 'Average Mood')}</p>
              <p className="text-2xl font-black mt-1">
                {MOOD_EMOJIS[Math.max(0, Math.round(parseFloat(avgMood as any)) - 1)]}
              </p>
              <p className="text-xs text-gray-500 mt-1">{avgMood}/5</p>
            </div>

            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs font-bold text-gray-600">{t('wellness.days_tracked', 'Days Tracked')}</p>
              <p className="text-2xl font-black mt-1">{weeklyData.length}</p>
              <p className="text-xs text-gray-500 mt-1">last 7 days</p>
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="!p-4 bg-green-50 border-green-200 space-y-2">
        <p className="text-xs font-bold text-green-900">💚 {t('wellness.privacy_note', 'Your Privacy')}</p>
        <p className="text-xs text-green-800">
          {t('wellness.privacy_text', 'Wellness data is stored on your phone and synced securely when you use the Sync tab. Only aggregate trends are shared — never individual responses.')}
        </p>
      </Card>

      {/* Scientific Note */}
      <div className="sci-ref-card flex items-start gap-2">
        <Heart size={14} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 font-medium leading-relaxed">
          {t('wellness.scientific_note', 'Research shows ASHA workers experience high rates of depression and cognitive issues due to workload. This wellness tracker helps identify stress patterns early. Contact your ANM or federation if stress persists.')}
        </p>
      </div>
    </div>
  );
};
