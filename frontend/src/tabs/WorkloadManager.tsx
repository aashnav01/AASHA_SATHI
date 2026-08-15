import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { NRHM_TASKS, NRHM_CATEGORIES, type NRHMTask, getTasksByCategory, getIncentiveByCategory, getCategoryMetadata } from '../data/nrhm74Tasks';
import { db, makeClientId, type OfflineTaskCompletion } from '../db/offlineDb';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { useCountUp } from '../hooks/useCountUp';
import { SaveToast } from '../components/SaveToast';
import { CheckCircle2, Circle, Volume2, Zap, Calendar, Briefcase, AlertCircle } from 'lucide-react';

export const WorkloadManager: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useTextToSpeech();
  const [selectedCategory, setSelectedCategory] = useState<string>('maternal');
  const [completedTasks, setCompletedTasks] = useState<Map<string, OfflineTaskCompletion>>(new Map());
  const [weeklyCompletions, setWeeklyCompletions] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [poppingTask, setPoppingTask] = useState<string | null>(null);
  const [ripplingTask, setRipplingTask] = useState<string | null>(null);
  const animatedCount = useCountUp(weeklyCompletions, 650);

  useEffect(() => {
    loadTaskCompletions();
    const timer = setTimeout(() => speak(t('workload.voice_intro')), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTaskCompletions = async () => {
    try {
      setLoading(true);
      const completions = await db.taskCompletions.toArray();
      const completed = new Map<string, OfflineTaskCompletion>();
      completions.forEach(c => completed.set(c.task_id, c));
      setCompletedTasks(completed);
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      setWeeklyCompletions(completions.filter(c => c.date >= weekStart.toISOString().split('T')[0]).length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTaskComplete = async (task: NRHMTask) => {
    if (completedTasks.has(task.id)) return;
    setPoppingTask(task.id);
    setRipplingTask(task.id);
    setTimeout(() => setPoppingTask(null), 420);
    setTimeout(() => setRipplingTask(null), 580);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      await db.taskCompletions.add({
        clientId: makeClientId(), clientTimestamp: nowIso,
        task_id: task.id, task_name: task.name, category: task.category,
        completed_at: nowIso, date: dateStr,
        frequency: task.frequency, incentive_amount: task.incentive_amount, sync_status: 'pending',
      });
      // Completing a task earns its incentive automatically — no separate
      // manual entry in Incentive Tracker needed for tasks tracked here.
      if (task.incentive_amount > 0) {
        await db.unsyncedIncentiveLogs.add({
          clientId: makeClientId(), clientTimestamp: nowIso,
          task_id: task.id, task_name: task.name, category: task.category,
          amount_earned: task.incentive_amount, date_completed: dateStr, status: 'pending',
        });
      }
      speak(`${t('workload.completed')}: ${task.name}`);
      setShowToast(true);
      await loadTaskCompletions();
    } catch (e) { console.error(e); speak(t('common.error')); }
  };

  const handleReadTasks = () => {
    const tasks = getTasksByCategory(selectedCategory as any);
    const pending = tasks.filter(t => !completedTasks.has(t.id));
    if (pending.length === 0) { speak(t('workload.all_done_category')); return; }
    speak(`Pending tasks: ${pending.slice(0, 5).map(t => t.name).join(', ')}${pending.length > 5 ? ` and ${pending.length - 5} more` : ''}`);
  };

  const categoryTasks = getTasksByCategory(selectedCategory as any);
  const completedCount = categoryTasks.filter(t => completedTasks.has(t.id)).length;
  const completionPercent = categoryTasks.length > 0 ? Math.round((completedCount / categoryTasks.length) * 100) : 0;
  const categoryIncentive = getIncentiveByCategory(selectedCategory as any);
  const categoryMeta = getCategoryMetadata(selectedCategory);
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = categoryTasks.filter(t => {
    if (completedTasks.has(t.id)) return completedTasks.get(t.id)!.date < today;
    return (t.frequency === 'daily' || t.frequency === 'weekly') && !completedTasks.has(t.id);
  }).length;

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('workload.title')}</h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#B08CC0' }}>{t('workload.subtitle')}</p>
        </div>
        <button onClick={handleReadTasks} className="p-3 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'rgba(124,77,159,0.1)', color: '#7C4D9F' }} aria-label="Read tasks">
          <Volume2 size={22} />
        </button>
      </div>

      {/* Weekly stat — count-up */}
      <Card className="border-0 animate-slide-up" style={{ background: 'linear-gradient(135deg, rgba(42,125,82,0.08), rgba(42,125,82,0.04))', borderLeft: '4px solid #2A7D52' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2A7D52' }}>{t('workload.this_week')}</p>
            <p className="text-3xl font-black mt-1" style={{ color: '#2A7D52' }}>
              {animatedCount}/{NRHM_TASKS.length}
              <span className="text-lg ml-2">{t('workload.tasks_completed')}</span>
            </p>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: '#2A7D52' }}>
              {Math.round((weeklyCompletions / NRHM_TASKS.length) * 100)}% of all tasks
            </p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(42,125,82,0.15)" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#2A7D52" strokeWidth="8"
                strokeDasharray={`${(weeklyCompletions / NRHM_TASKS.length) * 314} 314`}
                strokeLinecap="round" className="transition-all duration-1000" />
              <text x="60" y="70" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#2A7D52" className="select-none">
                {Math.round((weeklyCompletions / NRHM_TASKS.length) * 100)}%
              </text>
            </svg>
          </div>
        </div>
      </Card>

      {/* Category grid */}
      <div className="space-y-2">
        <p className="section-label text-xs">{t('workload.categories')}</p>
        <div className="grid grid-cols-2 gap-2">
          {NRHM_CATEGORIES.map(cat => {
            const catTasks = getTasksByCategory(cat.id as any);
            const done = catTasks.filter(t => completedTasks.has(t.id)).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-xl border-2 transition-all ${isSelected ? 'shadow-md' : 'border-gray-200 bg-white/60'}`}
                style={{ borderColor: isSelected ? cat.color : undefined, background: isSelected ? `${cat.color}12` : undefined }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="font-bold text-xs text-gray-800 line-clamp-2">{i18n.language === 'hi' ? cat.name_hi : cat.name}</span>
                </div>
                <div className="text-[10px] font-black text-gray-600">{done}/{catTasks.length}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category progress */}
      {categoryMeta && (
        <Card className="animate-slide-up" style={{ borderTop: `4px solid ${categoryMeta.color}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold" style={{ color: categoryMeta.color }}>{i18n.language === 'hi' ? categoryMeta.name_hi : categoryMeta.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{completedCount} of {categoryTasks.length} tasks</p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={categoryMeta.color} strokeWidth="6"
                  strokeDasharray={`${(completionPercent / 100) * 251} 251`} strokeLinecap="round" className="transition-all duration-1000" />
                <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill={categoryMeta.color} className="select-none">{completionPercent}%</text>
              </svg>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-600">{t('workload.potential_incentive')}</span>
              <span className="text-sm font-black" style={{ color: '#D4A017' }}>₹{categoryIncentive}</span>
            </div>
            <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400" /><p className="text-[10px] text-gray-500">All tasks in this category</p></div>
          </div>
          {overdueCount > 0 && (
            <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(166,61,87,0.07)', border: '1px solid rgba(166,61,87,0.2)' }}>
              <AlertCircle size={16} style={{ color: '#A63D57' }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: '#A63D57' }}>{t('workload.overdue')}</p>
                <p className="text-[10px]" style={{ color: '#A63D57' }}>{overdueCount} daily/weekly tasks pending</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Staggered task list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="section-label text-xs">{t('workload.tasks')}</p>
          <span className="text-xs font-bold text-gray-500">{categoryTasks.length} total</span>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl shimmer-bg" />)}</div>
        ) : categoryTasks.length === 0 ? (
          <Card className="text-center py-8"><AlertCircle size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-400">{t('workload.no_tasks')}</p></Card>
        ) : (
          <div className="space-y-2">
            {categoryTasks.map((task, idx) => {
              const isCompleted = completedTasks.has(task.id);
              const completion = completedTasks.get(task.id);
              const isOverdue = completion && completion.date < today;
              const isPopping = poppingTask === task.id;
              const isRippling = ripplingTask === task.id;
              return (
                <div key={task.id} className={`animate-stagger-item stagger-delay-${Math.min(idx + 1, 8)}`}>
                  <Card
                    className={`border-l-4 !pl-4 cursor-pointer transition-all ${isRippling ? 'animate-green-ripple' : ''} ${isCompleted ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'}`}
                    style={{ borderLeftColor: isCompleted ? '#2A7D52' : isOverdue ? '#A63D57' : '#e5e7eb', background: isOverdue && !isCompleted ? 'rgba(166,61,87,0.04)' : undefined }}
                    onClick={() => handleTaskComplete(task)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={isPopping ? 'animate-spring-pop' : ''}>
                        {isCompleted ? <CheckCircle2 size={20} className="mt-1 flex-shrink-0" style={{ color: '#2A7D52' }} />
                          : isOverdue ? <AlertCircle size={20} className="mt-1 flex-shrink-0" style={{ color: '#A63D57' }} />
                          : <Circle size={20} className="mt-1 flex-shrink-0 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-bold text-sm leading-snug ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {i18n.language === 'hi' ? task.name_hi : task.name}
                          </h4>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                            style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017' }}>₹{task.incentive_amount}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-semibold mt-1">
                          <span className="flex items-center gap-1"><Calendar size={10} />{task.frequency}</span>
                          {isCompleted && completion && (
                            <span className="font-bold" style={{ color: '#2A7D52' }}>
                              ✓ {new Date(completion.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); speak(`${task.name}. ₹${task.incentive_amount}.`); }}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-primary transition-colors flex-shrink-0 mt-0.5" aria-label="Read task">
                        <Volume2 size={12} />
                      </button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sci-ref-card flex items-start gap-2">
        <Zap size={14} className="text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 font-medium leading-relaxed">{t('workload.nrhm_note')}</p>
      </div>

      <SaveToast show={showToast} onDone={() => setShowToast(false)} customMessage="Task marked complete ✓" />
    </div>
  );
};
