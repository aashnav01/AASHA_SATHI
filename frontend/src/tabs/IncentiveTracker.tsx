import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTranslation } from 'react-i18next';
import { IndianRupee, TrendingUp, Clock, CheckCircle, Plus, Share2, Loader2, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, makeClientId } from '../db/offlineDb';
import { useCountUp } from '../hooks/useCountUp';
import { NRHM_TASKS, NRHM_CATEGORIES, type NRHMTask } from '../data/nrhm74Tasks';

interface OfflineIncentiveLog {
  clientId: string;
  clientTimestamp: string;
  task_id: string;
  task_name: string;
  category: string;
  amount_earned: number;
  date_completed: string;
  status: 'pending' | 'submitted' | 'paid';
}

interface ChartData {
  week: string;
  amount: number;
}

type CategoryFilter = 'all' | NRHMTask['category'];

export const IncentiveTracker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { speak } = useTextToSpeech();

  // State
  const [logs, setLogs] = useState<OfflineIncentiveLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<NRHMTask | null>(null);
  const [dateCompleted, setDateCompleted] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Load logs on mount
  useEffect(() => {
    loadLogs();
    const timer = setTimeout(() => {
      speak(t('incentive.voice_intro', 'Incentive tracker. View your earnings and log completed tasks.'));
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const loadLogs = async () => {
    try {
      const allLogs = await db.unsyncedIncentiveLogs.toArray();
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const summary = useMemo(() => {
    const total = logs.reduce((sum, log) => sum + log.amount_earned, 0);
    const pending = logs.filter(log => log.status === 'pending').reduce((sum, log) => sum + log.amount_earned, 0);
    const submitted = logs.filter(log => log.status === 'submitted').reduce((sum, log) => sum + log.amount_earned, 0);
    const paid = logs.filter(log => log.status === 'paid').reduce((sum, log) => sum + log.amount_earned, 0);
    const taskCount = logs.length;
    return { total, pending, submitted, paid, taskCount };
  }, [logs]);

  const { total } = summary;

  // Animate total on load
  const animatedTotal = useCountUp(total, 700);

  // Filter tasks by category, and exclude tasks already logged (e.g. auto-logged
  // when completed in the Workload Manager checklist) so nothing gets double-counted.
  const filteredTasks = useMemo(() => {
    const loggedTaskIds = new Set(logs.map(l => l.task_id));
    const available = NRHM_TASKS.filter(task => !loggedTaskIds.has(task.id));
    return selectedCategory === 'all'
      ? available
      : available.filter(task => task.category === selectedCategory);
  }, [selectedCategory, logs]);

  // Generate chart data (weekly earnings)
  const chartData: ChartData[] = useMemo(() => {
    const weekData: { [key: string]: number } = {};

    logs.forEach(log => {
      const date = new Date(log.date_completed);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weekData[weekKey] = (weekData[weekKey] || 0) + log.amount_earned;
    });

    return Object.entries(weekData)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .slice(-4)
      .map(([week, amount]) => ({
        week: new Date(week).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount
      }));
  }, [logs]);

  // Handle task logging
  const handleLogTask = async () => {
    if (!selectedTask || !dateCompleted) {
      speak(t('common.error', 'Please select a task and date'));
      return;
    }

    setIsLoading(true);
    try {
      const logEntry: OfflineIncentiveLog = {
        clientId: makeClientId(),
        clientTimestamp: new Date().toISOString(),
        task_id: selectedTask.id,
        task_name: selectedTask.name,
        category: selectedTask.category,
        amount_earned: selectedTask.incentive_amount,
        date_completed: dateCompleted,
        status: 'pending'
      };

      await db.unsyncedIncentiveLogs.add(logEntry);

      setSelectedTask(null);
      setDateCompleted(new Date().toISOString().split('T')[0]);
      setShowForm(false);

      speak(`${t('common.success', 'Success')}. Logged ${selectedTask.name} for ₹${selectedTask.incentive_amount}`);
      
      await loadLogs();
    } catch (error) {
      console.error('Error logging task:', error);
      speak(t('common.error', 'Failed to log task'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submit to ANM
  const handleSubmitToANM = async () => {
    const pendingLogs = logs.filter(log => log.status === 'pending');
    if (pendingLogs.length === 0) {
      speak(t('incentive.no_pending', 'No pending tasks to submit'));
      return;
    }

    const summaryText = generateSummaryText(pendingLogs);
    copyToClipboard(summaryText);
  };

  // Generate summary text for ANM submission
  const generateSummaryText = (logsToSubmit: OfflineIncentiveLog[]): string => {
    const lines = [
      `📋 INCENTIVE SUMMARY - ${new Date().toLocaleDateString('en-IN')}`,
      ``,
      `📊 TOTAL TASKS: ${logsToSubmit.length}`,
      `💰 TOTAL AMOUNT: ₹${logsToSubmit.reduce((sum, log) => sum + log.amount_earned, 0).toLocaleString('en-IN')}`,
      ``,
      `📝 TASK DETAILS:`,
      ...logsToSubmit.map((log, idx) => `${idx + 1}. ${log.task_name} - ₹${log.amount_earned} (${log.date_completed})`),
      ``,
      `✅ Ready for ANM verification and payment processing`
    ];
    return lines.join('\n');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopied(true);
      speak(t('incentive.copied', 'Summary copied to clipboard'));
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  // Logs only store a language-neutral task_name/category; resolve them back
  // to the current UI language via the canonical task list where possible.
  const localizedTaskName = (log: OfflineIncentiveLog): string => {
    const task = NRHM_TASKS.find(t => t.id === log.task_id);
    if (!task) return log.task_name;
    return i18n.language === 'hi' ? task.name_hi : task.name;
  };

  const localizedCategory = (categoryId: string): string => {
    const cat = NRHM_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return categoryId;
    return i18n.language === 'hi' ? cat.name_hi : cat.name;
  };

  // Category tabs — sourced from the same 8 NRHM categories as Workload Manager
  const categories: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: t('incentive.all_tasks', 'All') },
    ...NRHM_CATEGORIES.map(cat => ({
      value: cat.id as CategoryFilter,
      label: i18n.language === 'hi' ? cat.name_hi : cat.name,
    })),
  ];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{t('incentive.title', 'Incentive Tracker')}</h2>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">{t('incentive.subtitle', 'Track earnings and log tasks')}</p>
        </div>
        <IndianRupee size={32} className="text-green-500" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Earned */}
        <Card className="!p-4 border-0" style={{ background: 'linear-gradient(135deg, rgba(42,125,82,0.1), rgba(42,125,82,0.05))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#2A7D52' }}>{t('incentive.total_earned')}</p>
              <p className="text-xl font-extrabold" style={{ color: '#2A7D52' }}>₹{animatedTotal.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp size={24} style={{ color: '#2A7D52', opacity: 0.7 }} />
          </div>
        </Card>

        {/* Pending Count */}
        <Card className="!p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">{t('incentive.pending_count', 'Pending')}</p>
              <p className="text-xl font-extrabold text-amber-900">{logs.filter(l => l.status === 'pending').length}</p>
              <p className="text-xs text-amber-700 mt-1">₹{summary.pending.toLocaleString('en-IN')}</p>
            </div>
            <Clock size={24} className="text-amber-500 opacity-70" />
          </div>
        </Card>

        {/* Submitted */}
        <Card className="!p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-700 mb-1">{t('incentive.submitted', 'Submitted')}</p>
              <p className="text-xl font-extrabold text-blue-900">{logs.filter(l => l.status === 'submitted').length}</p>
              <p className="text-xs text-blue-700 mt-1">₹{summary.submitted.toLocaleString('en-IN')}</p>
            </div>
            <AlertCircle size={24} className="text-blue-500 opacity-70" />
          </div>
        </Card>

        {/* Paid */}
        <Card className="!p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 mb-1">{t('incentive.paid', 'Paid')}</p>
              <p className="text-xl font-extrabold text-emerald-900">{logs.filter(l => l.status === 'paid').length}</p>
              <p className="text-xs text-emerald-700 mt-1">₹{summary.paid.toLocaleString('en-IN')}</p>
            </div>
            <CheckCircle size={24} className="text-emerald-500 opacity-70" />
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          {t('incentive.log_task', 'Log Task')}
        </button>

        <button
          onClick={handleSubmitToANM}
          disabled={logs.filter(l => l.status === 'pending').length === 0}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={18} />
          {t('incentive.submit_anm', 'Submit ANM')}
        </button>
      </div>

      {/* Log Task Form */}
      {showForm && (
        <Card className="!p-4 space-y-4 bg-green-50 border-green-200 animate-slide-up">
          <h3 className="font-bold text-gray-900">{t('incentive.log_new_task', 'Log New Task')}</h3>

          {/* Category Tabs (Horizontal Scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">{t('incentive.select_task', 'Select Task')}</label>
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                {t('incentive.all_logged', 'All tasks in this category are already logged.')}
              </p>
            ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {filteredTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedTask?.id === task.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{i18n.language === 'hi' ? task.name_hi : task.name}</p>
                  <p className="text-xs text-green-600 mt-1">₹{task.incentive_amount}</p>
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Date Completed */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">{t('incentive.date_completed', 'Date Completed')}</label>
            <input
              type="date"
              value={dateCompleted}
              onChange={(e) => setDateCompleted(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleLogTask}
              disabled={isLoading || !selectedTask}
              className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {t('common.submit', 'Submit')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 px-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-all"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </Card>
      )}

      {/* Weekly Earnings Chart */}
      {chartData.length > 0 && (
        <Card className="!p-4 space-y-3">
          <h3 className="font-bold text-gray-900">{t('incentive.weekly_earnings', 'Weekly Earnings')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
              <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <Card className="!p-4 space-y-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            {t('incentive.recent_logs', 'Recent Logs')} ({logs.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.slice().reverse().map(log => (
              <div
                key={log.clientId}
                className={`p-3 rounded-lg border text-sm ${
                  log.status === 'pending'
                    ? 'bg-amber-50 border-amber-200'
                    : log.status === 'submitted'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{localizedTaskName(log)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      ₹{log.amount_earned} • {log.date_completed} • {localizedCategory(log.category)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    log.status === 'pending'
                      ? 'bg-amber-200 text-amber-900'
                      : log.status === 'submitted'
                      ? 'bg-blue-200 text-blue-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Copied Notification */}
      {showCopied && (
        <Card className="!p-3 bg-green-100 border-green-300 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <p className="text-sm font-bold text-green-900">{t('incentive.summary_ready', 'Summary ready to share!')}</p>
        </Card>
      )}

      {/* Empty State */}
      {logs.length === 0 && (
        <Card className="!p-6 text-center bg-gray-50 border-gray-200">
          <p className="text-gray-600 font-bold mb-2">{t('incentive.no_logs', 'No tasks logged yet')}</p>
          <p className="text-xs text-gray-500">{t('incentive.tap_to_add', 'Tap "Log Task" to add your first incentive entry')}</p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="!p-4 bg-blue-50 border-blue-200 space-y-2 text-sm">
        <p className="font-bold text-blue-900">💡 {t('incentive.tip', 'Tip')}</p>
        <p className="text-blue-800 text-xs">
          {t('incentive.tip_text', 'Log tasks after completion. Use "Submit ANM" to share your summary for verification and payment processing.')}
        </p>
      </Card>
    </div>
  );
};
