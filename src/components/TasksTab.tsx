import React, { useState } from 'react';
import { Task, UserProfile, AppDatabase } from '../types';
import { completeUserTask } from '../lib/db';
import { CheckCircle2, Lock, Unlock, ArrowUpRight, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TasksTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab
}) => {
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [clickedTasks, setClickedTasks] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter tasks that are enabled
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => t.isMandatory);
  const optionalTasks = enabledTasks.filter(t => !t.isMandatory);

  // User's completed tasks
  const completedTaskIds = db.completedTasks[user.id] || [];

  // Mandatory progress
  const completedMandatoryCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalMandatoryCount = mandatoryTasks.length;
  const isDashboardUnlocked = completedMandatoryCount === totalMandatoryCount;

  // Total progress
  const completedTotalCount = enabledTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalCount = enabledTasks.length;

  const handleJoinClick = (task: Task) => {
    // Record that they clicked the task link
    if (!clickedTasks.includes(task.id)) {
      setClickedTasks([...clickedTasks, task.id]);
    }
    
    if (task.link && task.link !== "#") {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerify = (task: Task) => {
    if (!clickedTasks.includes(task.id) && task.requiresVerification) {
      alert("Please join or click the 'Join'/'Open' button first to initiate verification.");
      return;
    }

    setVerifyingTaskId(task.id);
    
    // Simulate API request to verify telegram membership/status
    setTimeout(() => {
      const result = completeUserTask(user.id, task.id);
      setVerifyingTaskId(null);
      if (result.success) {
        onUpdateState(result.user, result.db);
        setSuccessMsg(`🎉 Task Verified! +${task.rewardTM} TM credited.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(result.message);
      }
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Locked/Unlocked Banner */}
      <div className={`p-4 rounded-xl border ${
        isDashboardUnlocked 
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5 mt-0.5">
            {isDashboardUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              {isDashboardUnlocked ? 'Dashboard Fully Unlocked!' : 'Dashboard Access Locked'}
            </h3>
            <p className="text-xs opacity-80 mt-1">
              {isDashboardUnlocked 
                ? 'Excellent work! You have completed all mandatory tasks. Explore your Staking Dashboard, Referral earnings, and Daily Bonus claims now.'
                : 'Complete all mandatory Telegram tasks below to unlock your active TM balance, daily staking bonuses, and instant USDT withdrawals.'}
            </p>
            {isDashboardUnlocked && (
              <button
                onClick={() => onNavigateToTab('dashboard')}
                className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-tg-dark px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition duration-200"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3.5 rounded-xl">
          <span className="text-[10px] text-tg-text-muted uppercase tracking-wider block font-medium">Mandatory Tasks</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-display text-amber-400">{completedMandatoryCount}</span>
            <span className="text-xs text-tg-text-muted">/ {totalMandatoryCount}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${(completedMandatoryCount / (totalMandatoryCount || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl">
          <span className="text-[10px] text-tg-text-muted uppercase tracking-wider block font-medium">All Achievements</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-display text-tg-blue">{completedTotalCount}</span>
            <span className="text-xs text-tg-text-muted">/ {totalCount}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-tg-blue h-full transition-all duration-500"
              style={{ width: `${(completedTotalCount / (totalCount || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs font-medium text-center"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Task Section */}
      {mandatoryTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-tg-text-muted font-medium px-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>MANDATORY TASKS ({completedMandatoryCount}/{totalMandatoryCount})</span>
          </div>

          <div className="space-y-3">
            {mandatoryTasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);
              const isClicked = clickedTasks.includes(task.id);
              const isVerifying = verifyingTaskId === task.id;
              
              return (
                <div 
                  key={task.id}
                  className={`glass-panel p-4 rounded-xl border relative overflow-hidden transition duration-300 ${
                    isCompleted ? 'border-emerald-500/10 bg-emerald-950/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-white font-display leading-tight">{task.title}</h4>
                        <span className="bg-amber-400/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>
                      </div>
                      <p className="text-xs text-tg-text-muted leading-relaxed">{task.description}</p>
                      
                      <div className="flex items-center gap-2.5 pt-2">
                        <span className="text-xs font-mono font-bold text-tg-blue bg-tg-blue/10 px-2 py-0.5 rounded">
                          +{task.rewardTM} TM
                        </span>
                        <span className="text-[10px] text-tg-text-muted">
                          ≈ ${(task.rewardTM / db.settings.conversionRate).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 items-stretch w-20">
                          <button
                            onClick={() => handleJoinClick(task)}
                            className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-0.5 ${
                              isClicked 
                                ? 'bg-tg-surface-light text-tg-text-muted border border-white/5' 
                                : 'bg-tg-blue hover:bg-tg-blue-light text-white font-display'
                            }`}
                          >
                            <span>Join</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => handleVerify(task)}
                            disabled={isVerifying}
                            className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition ${
                              isVerifying 
                                ? 'bg-tg-surface border border-white/5 text-tg-text-muted' 
                                : isClicked
                                  ? 'bg-amber-500 hover:bg-amber-600 text-tg-dark'
                                  : 'bg-tg-surface-light text-tg-text-muted cursor-not-allowed border border-white/5'
                            }`}
                          >
                            {isVerifying ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Task Section */}
      {optionalTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-tg-text-muted font-medium px-1">
            <HelpCircle className="w-3.5 h-3.5 text-tg-blue" />
            <span>OPTIONAL BONUSES</span>
          </div>

          <div className="space-y-3">
            {optionalTasks.map((task) => {
              const isCompleted = completedTaskIds.includes(task.id);
              const isClicked = clickedTasks.includes(task.id);
              const isVerifying = verifyingTaskId === task.id;
              
              return (
                <div 
                  key={task.id}
                  className={`glass-panel p-4 rounded-xl border relative overflow-hidden transition duration-300 ${
                    isCompleted ? 'border-emerald-500/10 bg-emerald-950/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-sm text-white font-display leading-tight">{task.title}</h4>
                      <p className="text-xs text-tg-text-muted leading-relaxed">{task.description}</p>
                      
                      <div className="flex items-center gap-2.5 pt-2">
                        <span className="text-xs font-mono font-bold text-tg-blue bg-tg-blue/10 px-2 py-0.5 rounded">
                          +{task.rewardTM} TM
                        </span>
                        <span className="text-[10px] text-tg-text-muted">
                          ≈ ${(task.rewardTM / db.settings.conversionRate).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 items-stretch w-20">
                          {task.type === 'DailyCheckIn' ? (
                            <button
                              onClick={() => {
                                const result = completeUserTask(user.id, task.id);
                                if (result.success) {
                                  onUpdateState(result.user, result.db);
                                  setSuccessMsg(`Daily check-in success! +${task.rewardTM} TM.`);
                                  setTimeout(() => setSuccessMsg(null), 3000);
                                } else {
                                  alert(result.message);
                                }
                              }}
                              className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition font-display"
                            >
                              Check-In
                            </button>
                          ) : task.type === 'Referral' ? (
                            <button
                              onClick={() => onNavigateToTab('profile')} // referrals are under profile/dashboard
                              className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition font-display"
                            >
                              Share Link
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleJoinClick(task)}
                                className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition flex items-center justify-center gap-0.5 ${
                                  isClicked 
                                    ? 'bg-tg-surface-light text-tg-text-muted border border-white/5' 
                                    : 'bg-tg-blue hover:bg-tg-blue-light text-white font-display'
                                }`}
                              >
                                <span>Open</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                              
                              {task.requiresVerification ? (
                                <button
                                  onClick={() => handleVerify(task)}
                                  disabled={isVerifying}
                                  className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition ${
                                    isVerifying 
                                      ? 'bg-tg-surface border border-white/5 text-tg-text-muted' 
                                      : isClicked
                                        ? 'bg-amber-500 hover:bg-amber-600 text-tg-dark'
                                        : 'bg-tg-surface-light text-tg-text-muted cursor-not-allowed border border-white/5'
                                  }`}
                                >
                                  {isVerifying ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : (
                                    'Verify'
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const result = completeUserTask(user.id, task.id);
                                    if (result.success) {
                                      onUpdateState(result.user, result.db);
                                      setSuccessMsg(`Task completed! +${task.rewardTM} TM.`);
                                      setTimeout(() => setSuccessMsg(null), 3000);
                                    } else {
                                      alert(result.message);
                                    }
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-tg-dark text-[11px] font-semibold py-1.5 px-2 rounded-lg text-center transition font-display"
                                >
                                  Claim
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default TasksTab;
