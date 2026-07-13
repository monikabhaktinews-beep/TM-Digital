import React, { useState, useEffect } from 'react';
import { Task, UserProfile, AppDatabase } from '../types';
import { verifyTaskOnServer, completeOnboardingOnServer } from '../lib/db';
import { CheckCircle2, Lock, ArrowRight, ExternalLink, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MandatoryTasksPopupProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'pending') => void;
}

export const MandatoryTasksPopup: React.FC<MandatoryTasksPopupProps> = ({
  user,
  db,
  onUpdateState,
  onClose,
  showToast
}) => {
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [clickedTasks, setClickedTasks] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedTaskIds, setFailedTaskIds] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<any>(null);

  const fetchDiagnostics = async () => {
    setDiagnosticsLoading(true);
    setDiagnosticsReport(null);
    try {
      const response = await fetch(`/api/diagnostics?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiagnosticsReport(data);
      } else {
        setDiagnosticsReport({
          error: `HTTP Error ${response.status}`
        });
      }
    } catch (err: any) {
      setDiagnosticsReport({
        error: err.message || err
      });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    if (showDiagnostics) {
      fetchDiagnostics();
    }
  }, [showDiagnostics]);

  // Define the exact 3 mandatory tasks we are looking for
  const requiredTaskIds = ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"];
  
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => requiredTaskIds.includes(t.id));
  
  // User's completed tasks
  const completedTaskIds = db.completedTasks[user.id] || [];
  
  // Calculate verified count among the 3 specific channels
  const completedCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalCount = 3; // Exactly 3 channels

  // Verification status
  const isUnlocked = completedCount === totalCount;

  const handleJoinClick = (task: Task) => {
    if (!clickedTasks.includes(task.id)) {
      setClickedTasks([...clickedTasks, task.id]);
    }
    if (task.link && task.link !== '#') {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerifyClick = async (task: Task) => {
    setErrorMsg(null);
    setVerifyingTaskId(task.id);
    showToast(`Checking channel membership for ${task.title}...`, 'pending');

    const result = await verifyTaskOnServer(user.id, task.id, clickedTasks.includes(task.id));
    setVerifyingTaskId(null);

    if (result.success) {
      setFailedTaskIds(prev => prev.filter(id => id !== task.id));
      onUpdateState(result.user, result.db);
      showToast(`Successfully verified: ${task.title}! +${task.rewardTM} TM`, 'success');
    } else {
      if (!failedTaskIds.includes(task.id)) {
        setFailedTaskIds(prev => [...prev, task.id]);
      }
      setErrorMsg(result.message);
      showToast(result.message, 'error');
    }
  };

  const handleContinue = async () => {
    if (!isUnlocked) return;
    
    const result = await completeOnboardingOnServer(user.id);
    if (result.success) {
      onUpdateState(result.user, result.db);
      showToast('Welcome to TM Digital! All features unlocked.', 'success');
    }
    onClose();
  };

  // Automatically close and go to home page after completing all mandatory verifications
  useEffect(() => {
    if (isUnlocked && !user.mandatoryCompleted) {
      const timer = setTimeout(async () => {
        const result = await completeOnboardingOnServer(user.id);
        if (result.success) {
          onUpdateState(result.user, result.db);
          showToast('Welcome to TM Digital! All features unlocked.', 'success');
        }
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, user.mandatoryCompleted, user.id, onUpdateState, onClose]);

  const progressPercent = Math.min(100, (completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#060913] backdrop-blur-lg flex flex-col justify-between overflow-y-auto p-4 sm:p-6 select-none font-sans">
      
      {/* Decorative ambient neon glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-tg-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="w-full max-w-md mx-auto pt-6 pb-2 space-y-4 text-center relative z-10">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-tg-blue/20 to-indigo-500/20 border border-tg-blue/30 shadow-lg shadow-tg-blue/10">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight leading-none uppercase">
            Channel Verification
          </h2>
          <p className="text-xs text-tg-text-muted max-w-xs mx-auto leading-relaxed">
            Welcome to <strong className="text-white">TM Digital</strong>! You must join and verify our official Telegram channels to release encryption and gain full dashboard access.
          </p>
        </div>

        {/* Progress indicator card */}
        <div className="glass-panel p-4 rounded-2xl border border-white/5 space-y-3 bg-tg-surface/40 shadow-xl shadow-black/40">
          <div className="flex justify-between items-center text-xs font-bold font-display">
            <span className="text-tg-text-muted uppercase tracking-wider text-[10px]">Verification Stage</span>
            <span className="text-amber-400 font-mono text-sm bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Progress: {completedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-tg-dark rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-tg-blue via-indigo-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="text-[10px] text-tg-text-muted/85 flex justify-between items-center leading-none">
            <span>Claim 500 TM total rewards</span>
            {isUnlocked ? (
              <span className="text-emerald-400 font-extrabold">✨ Complete! Entering dashboard...</span>
            ) : (
              <span>Join required channels below</span>
            )}
          </div>
        </div>
      </div>

      {/* Task list container */}
      <div className="flex-1 w-full max-w-md mx-auto py-4 space-y-3 overflow-y-auto max-h-[45vh] pr-1.5 scrollbar relative z-10">
        {errorMsg && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mandatoryTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isVerifying = verifyingTaskId === task.id;
            const hasClicked = clickedTasks.includes(task.id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden ${
                  isCompleted 
                    ? 'bg-emerald-950/10 border-emerald-500/30' 
                    : 'bg-tg-surface-light/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Background glow on active verification */}
                {isVerifying && (
                  <div className="absolute inset-0 bg-tg-blue/5 animate-pulse pointer-events-none" />
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                    )}
                    <span className={`text-xs font-bold truncate block ${isCompleted ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-tg-text-muted/85 leading-relaxed pl-6">
                    {task.description}
                  </p>
                  <div className="text-[10px] font-mono font-bold text-amber-400/90 leading-none pl-6 flex items-center gap-1">
                    <span>Reward:</span>
                    <span className="text-amber-300">{task.rewardTM} TM Tokens</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  {isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                      Verified
                    </span>
                  ) : (
                    <>
                      {/* Join Button */}
                      <button
                        onClick={() => handleJoinClick(task)}
                        disabled={isVerifying}
                        className={`text-[10px] font-bold px-3 py-2 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                          hasClicked 
                            ? 'bg-white/5 border-white/5 text-tg-text-muted' 
                            : 'bg-tg-blue/10 border-tg-blue/30 text-tg-blue-light hover:bg-tg-blue/20'
                        }`}
                      >
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {/* Verify Button */}
                      <button
                        onClick={() => handleVerifyClick(task)}
                        disabled={isVerifying}
                        className={`text-[10px] font-bold px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 min-w-[65px] cursor-pointer ${
                          failedTaskIds.includes(task.id)
                            ? 'bg-red-500 hover:bg-red-400 text-white shadow-md shadow-red-500/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-tg-dark'
                        }`}
                      >
                        {isVerifying ? (
                          <Loader2 className={`w-3 h-3 animate-spin ${failedTaskIds.includes(task.id) ? 'text-white' : 'text-tg-dark'}`} />
                        ) : failedTaskIds.includes(task.id) ? (
                          <span>Retry</span>
                        ) : (
                          <span>Verify</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Continue Action Button Footer */}
      <div className="w-full max-w-md mx-auto pt-4 pb-6 relative z-10 space-y-4">
        <button
          onClick={handleContinue}
          disabled={!isUnlocked}
          className={`w-full py-3.5 rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
            isUnlocked
              ? 'bg-gradient-to-r from-tg-blue to-indigo-600 hover:from-tg-blue-light hover:to-indigo-500 text-white border-tg-blue-light shadow-lg shadow-tg-blue/20 glow-blue'
              : 'bg-tg-surface-light/10 border-white/5 text-tg-text-muted opacity-35 cursor-not-allowed'
          }`}
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="space-y-3.5 pt-1">
          <p className="text-[9px] text-center text-tg-text-muted/65 uppercase tracking-wider block">
            Locked Security Layer • 500 TM Token Claim Pending
          </p>

          <button
            type="button"
            onClick={() => setShowDiagnostics(true)}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition duration-200 uppercase tracking-wider flex items-center justify-center gap-1.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl mx-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>🛠️ Run System Diagnostics</span>
          </button>
        </div>
      </div>

      {/* System Diagnostics Overlay */}
      <AnimatePresence>
        {showDiagnostics && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 z-50 bg-[#040712] flex flex-col p-4 sm:p-6 overflow-y-auto select-text select-none selection:bg-tg-blue/30 selection:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                  Telegram Bot API Integration Diagnostics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="text-tg-text-muted hover:text-white text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold uppercase transition tracking-wider border border-white/5 cursor-pointer"
              >
                Close [X]
              </button>
            </div>

            {/* Test Results Panel */}
            <div className="flex-1 space-y-4 max-w-2xl mx-auto w-full pb-8">
              <div className="space-y-1.5">
                <p className="text-xs text-tg-text-muted leading-relaxed">
                  Stuck with verification issues? This page tests the server-to-Telegram pipeline in real time. It contacts the Telegram Bot API directly using your loaded token to check credentials, connectivity, and group permissions.
                </p>
              </div>

              {diagnosticsLoading ? (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4 bg-tg-surface/40 min-h-[300px]">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-mono font-bold text-amber-400">CONNECTING TO TELEGRAM BOT API...</p>
                    <p className="text-[10px] text-tg-text-muted">Fetching live status from Telegram endpoints</p>
                  </div>
                </div>
              ) : diagnosticsReport ? (
                <div className="space-y-4">
                  {diagnosticsReport.error ? (
                    <div className="bg-red-950/20 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs font-semibold flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>Diagnostics Failed to execute:</span>
                      </div>
                      <p className="font-mono text-[10px] bg-black/30 p-2 rounded border border-white/5 text-red-400">
                        {diagnosticsReport.error}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 select-text">
                      {/* 1. Bot Token Loaded */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-2 bg-tg-surface/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">1. Bot Token Loaded Status</span>
                          {diagnosticsReport.botTokenLoaded ? (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded uppercase font-mono">✅ Loaded</span>
                          ) : (
                            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-2 py-0.5 rounded uppercase font-mono">❌ Missing</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-tg-text-muted space-y-1 bg-black/25 p-2 rounded border border-white/5">
                          <div>• TELEGRAM_BOT_TOKEN: {diagnosticsReport.botTokenLoaded ? "Present" : "Absent"}</div>
                          <div>• Token Masked: <span className="text-amber-400">{diagnosticsReport.botTokenPrefix}</span></div>
                        </div>
                        {!diagnosticsReport.botTokenLoaded && (
                          <div className="bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[10px] p-2.5 rounded-lg space-y-1">
                            <p className="font-bold">💡 How to fix:</p>
                            <p>You have not configured the Telegram Bot Token. Go to the Settings panel and set the environment variable:</p>
                            <pre className="p-1.5 bg-black/40 rounded border border-white/5 text-[9px] overflow-x-auto text-amber-400 font-mono select-all">TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN</pre>
                          </div>
                        )}
                      </div>

                      {/* 2. Telegram API Reachable */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-2 bg-tg-surface/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">2. Telegram Bot API Connectivity</span>
                          {diagnosticsReport.telegramApiReachable ? (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded uppercase font-mono">✅ Reachable</span>
                          ) : (
                            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold px-2 py-0.5 rounded uppercase font-mono">❌ Failed</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-tg-text-muted space-y-1 bg-black/25 p-2 rounded border border-white/5">
                          <div>• API Endpoint: https://api.telegram.org</div>
                          <div>• Response status: {diagnosticsReport.telegramApiReachable ? "OK (200)" : "Failed"}</div>
                          {diagnosticsReport.botMeResponse && (
                            <div>• Bot ID: <span className="text-white">{diagnosticsReport.botMeResponse.result?.id || "N/A"}</span></div>
                          )}
                          {diagnosticsReport.botMeResponse && (
                            <div>• Bot Username: <span className="text-tg-blue">{diagnosticsReport.botMeResponse.result?.username ? `@${diagnosticsReport.botMeResponse.result.username}` : "N/A"}</span></div>
                          )}
                          {diagnosticsReport.telegramApiError && (
                            <div className="text-red-400 font-bold">• Error: {diagnosticsReport.telegramApiError}</div>
                          )}
                        </div>
                        {!diagnosticsReport.telegramApiReachable && (
                          <div className="bg-red-950/20 border border-red-500/20 text-red-300 text-[10px] p-2.5 rounded-lg space-y-1">
                            <p className="font-bold">💡 How to fix:</p>
                            {diagnosticsReport.telegramApiError === "Unauthorized" || (diagnosticsReport.botMeResponse && diagnosticsReport.botMeResponse.error_code === 401) ? (
                              <p className="leading-normal">
                                The Telegram API returned <strong className="text-white">401 Unauthorized</strong>. Your bot token is incorrect.
                                <br />Please re-copy your bot token from your chat with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-tg-blue hover:underline">@BotFather</a> and replace your env variable. Ensure there are no leading or trailing spaces.
                              </p>
                            ) : (
                              <p>Connection failed or was blocked. Please check that your server has outbound network access to `api.telegram.org`.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. User ID Received */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-2 bg-tg-surface/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">3. Telegram WebApp User Context</span>
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded uppercase font-mono">✅ Active</span>
                        </div>
                        <div className="text-[10px] font-mono text-tg-text-muted space-y-1 bg-black/25 p-2 rounded border border-white/5">
                          <div>• Logged-In User ID: <span className="text-amber-400 font-bold">{user.id}</span></div>
                          <div>• First Name: {user.firstName || "N/A"}</div>
                          <div>• Username: {user.username ? `@${user.username}` : "N/A"}</div>
                          <div>• Session Mode: {user.id.startsWith("11111") || user.id.startsWith("22222") ? "Simulated Profile (No initData signature validation)" : "Real Telegram Account (Crypto HMAC validated)"}</div>
                        </div>
                      </div>

                      {/* 4, 5, 6. Channels verification detail */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3 bg-tg-surface/40">
                        <span className="text-xs font-bold text-white block">4 & 5. Required Channel Status Checking</span>
                        
                        <div className="space-y-3.5">
                          {diagnosticsReport.channels && diagnosticsReport.channels.length > 0 ? (
                            diagnosticsReport.channels.map((chan: any) => {
                              const hasError = !chan.exists || !chan.botIsAdmin;
                              return (
                                <div key={chan.channelId} className="border-t border-white/5 pt-3 first:border-0 first:pt-0 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-white">{chan.channelName}</span>
                                      <span className="text-[9px] font-mono text-tg-text-muted">({chan.channelId})</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      {chan.exists ? (
                                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono">Channel Exists</span>
                                      ) : (
                                        <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-mono">Not Found</span>
                                      )}

                                      {chan.botIsAdmin ? (
                                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono">Bot Is Admin</span>
                                      ) : (
                                        <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-mono">Bot Not Admin</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-[9px] font-mono text-tg-text-muted bg-black/25 p-2 rounded border border-white/5 space-y-1">
                                    <div className="text-white font-bold text-[8px] uppercase tracking-wider text-amber-400/80 mb-1">Raw Telegram getChatMember response:</div>
                                    <pre className="overflow-x-auto whitespace-pre-wrap max-h-24 text-[8.5px] leading-tight select-text scrollbar bg-black/30 p-1.5 rounded">
                                      {JSON.stringify(chan.getChatMemberResponse || { ok: false, error: chan.error || "Could not fetch member info" }, null, 2)}
                                    </pre>
                                  </div>

                                  {hasError && (
                                    <div className="bg-amber-950/20 border border-amber-500/10 text-amber-300 text-[10px] p-2.5 rounded-lg space-y-1">
                                      <p className="font-bold text-amber-400">💡 Recommended Action for {chan.channelName}:</p>
                                      {chan.error && (chan.error.includes("chat not found") || chan.error.includes("Chat not found")) ? (
                                        <p className="leading-normal">
                                          Telegram says "chat not found". This means the channel/chat ID <code className="text-amber-400 font-mono">{chan.channelId}</code> is incorrect, OR the bot has not been added to the channel at all.
                                          <br /><strong>Fix:</strong> Add the bot <code className="text-tg-blue">@TM_DigitalBot</code> to the channel first.
                                        </p>
                                      ) : (
                                        <p className="leading-normal">
                                          The bot doesn't have privileges to check membership.
                                          <br /><strong>Fix:</strong> Add <code className="text-tg-blue">@TM_DigitalBot</code> as an <strong className="text-white">Administrator</strong> with 'Invite Users' or 'Manage Chat' privileges inside the channel settings in Telegram.
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-red-400">No channels configured on the server, check database.</p>
                          )}
                        </div>
                      </div>

                      {/* Corrected Code Instructions Panel */}
                      <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-2 bg-tg-surface/40 select-text">
                        <span className="text-xs font-bold text-white flex items-center gap-1">💡 Server Configuration Helper</span>
                        <p className="text-[10px] text-tg-text-muted leading-relaxed">
                          Verify your <code className="text-amber-400 font-mono bg-black/40 px-1 py-0.5 rounded">.env</code> configuration matches this template. Ensure no brackets, spaces, or quotes are in the token:
                        </p>
                        <pre className="p-3 bg-black/45 rounded-lg border border-white/5 text-[9px] text-amber-400 font-mono overflow-x-auto select-all">
                          {"# File: .env\nTELEGRAM_BOT_TOKEN=" + (diagnosticsReport.botTokenLoaded ? "8905253397:AA[REST_OF_YOUR_TOKEN]" : "8905253397:YOUR_ACTUAL_TOKEN") + "\nNODE_ENV=development"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <button
                    type="button"
                    onClick={fetchDiagnostics}
                    className="bg-amber-500 hover:bg-amber-400 text-tg-dark font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Run Integration Diagnostics
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
