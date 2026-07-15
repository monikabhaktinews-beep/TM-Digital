import React, { useState, useEffect } from 'react';
import { TelegramUser, UserProfile, AppDatabase } from './types';
import { getDB, getUserProfile, saveDB, loadDBFromServer } from './lib/db';
import TelegramSimulator, { SIMULATED_PROFILES } from './components/TelegramSimulator';
import TasksTab from './components/TasksTab';
import DepositTab from './components/DepositTab';
import WithdrawTab from './components/WithdrawTab';
import { ProfileTab } from './components/ProfileTab';
import { GiftCodeTab } from './components/GiftCodeTab';
import { ReferralTab } from './components/ReferralTab';
import SupportTab from './components/SupportTab';
import AdminPanel from './components/AdminPanel';
import { MandatoryTasksPopup } from './components/MandatoryTasksPopup';
import { NotificationCenter } from './components/NotificationCenter';
import { 
  CheckSquare, ArrowDownLeft, ArrowUpRight, User, HelpCircle, Gift,
  Lock, KeyRound, AlertTriangle, MessageSquare, Bot, Bell, Shield, Info, CheckCircle2, AlertCircle, RefreshCw, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => getDB());
  const [activeUser, setActiveUser] = useState<TelegramUser>(SIMULATED_PROFILES[0]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile(SIMULATED_PROFILES[0]));
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false);
  const [blockedTab, setBlockedTab] = useState<string>('');

  // Notification center and Toast states
  const [showNotifCenter, setShowNotifCenter] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info' | 'pending'; message: string }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'pending' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auto-detect Admin path in browser
  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (path === '/admin' || hash === '#/admin' || hash === '#admin' || params.get('admin') === 'true') {
        setIsAdminView(true);
      } else {
        setIsAdminView(false);
      }
    };
    
    handleLocationCheck();
    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);
    return () => {
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  // Load and sync database with Express server on mount/active user change
  useEffect(() => {
    let active = true;
    const fetchServerDB = async () => {
      let startParam = '';
      
      // 1. Try to get from Telegram WebApp SDK directly (the most robust way inside Telegram)
      const telegramObj = (window as any).Telegram;
      if (telegramObj?.WebApp?.initDataUnsafe) {
        startParam = telegramObj.WebApp.initDataUnsafe.start_param || 
                     telegramObj.WebApp.initDataUnsafe.startParam || '';
      }
      
      // 2. Fallback to URL search parameters
      if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        startParam = urlParams.get('tgWebAppStartParam') || 
                     urlParams.get('start_param') || 
                     urlParams.get('ref') || 
                     urlParams.get('startapp') || 
                     urlParams.get('start') || '';
      }
      
      // 3. Fallback to hash parameters
      if (!startParam && window.location.hash) {
        try {
          const hashParts = window.location.hash.split('?');
          const hashQuery = hashParts[1] || (hashParts[0].includes('?') ? hashParts[0].split('?')[1] : '');
          if (hashQuery) {
            const hashParams = new URLSearchParams(hashQuery);
            startParam = hashParams.get('tgWebAppStartParam') || 
                         hashParams.get('start_param') || 
                         hashParams.get('ref') || 
                         hashParams.get('startapp') || 
                         hashParams.get('start') || '';
          }
        } catch (e) {}
      }

      const serverDb = await loadDBFromServer(activeUser.id, {
        username: activeUser.username || '',
        firstName: activeUser.firstName,
        lastName: activeUser.lastName || '',
        photoUrl: activeUser.photoUrl || '',
        languageCode: activeUser.languageCode || '',
        ref: startParam || ''
      });
      if (active) {
        setDb(serverDb);
        const profile = serverDb.users.find(u => u.id === activeUser.id) || getUserProfile(activeUser);
        setUserProfile(profile);
      }
    };
    fetchServerDB();
    return () => {
      active = false;
    };
  }, [activeUser.id]);

  // Sync user profile when active user changes or DB updates
  useEffect(() => {
    const profile = db.users.find(u => u.id === activeUser.id) || getUserProfile(activeUser);
    setUserProfile(profile);
  }, [activeUser, db]);

  const handleUserChange = (newTgUser: TelegramUser) => {
    setActiveUser(newTgUser);
    
    // Automatically reset tab to profile if switching users
    setActiveTab('profile');
  };

  const handleStateUpdate = (updatedProfile: UserProfile, updatedDb: AppDatabase) => {
    setDb(updatedDb);
    setUserProfile(updatedProfile);
  };

  // Determine if Dashboard is unlocked
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => t.isMandatory);
  const completedTaskIds = db.completedTasks[userProfile.id] || [];
  const completedMandatoryCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalMandatoryCount = mandatoryTasks.length;
  
  // Stricter unlock checks (always unlocked so no channel joins are required)
  const isUnlocked = true;

  const navigateToTab = (tabId: string) => {
    if (tabId === 'tasks') {
      setActiveTab(tabId);
      return;
    }

    if (!isUnlocked) {
      setBlockedTab(tabId);
      setShowLockedModal(true);
      return;
    }

    setActiveTab(tabId);
  };

  const handleDbReset = (newDb: AppDatabase) => {
    setDb(newDb);
  };

  // Handle manual /admin navigation
  const navigateToAdmin = () => {
    setIsAdminView(true);
    window.location.hash = '/admin';
  };

  const handleExitAdmin = () => {
    setIsAdminView(false);
    window.location.hash = '';
  };

  // Unread notification count for active user
  const unreadCount = (db.notifications || []).filter(n => n.userId === userProfile.id && !n.read).length;

  // -------------------------------------------------------------
  // ADMIN WORKSPACE ROUTE
  // -------------------------------------------------------------
  if (isAdminView) {
    return (
      <AdminPanel 
        db={db} 
        onDbUpdate={setDb} 
        onExitAdmin={handleExitAdmin} 
      />
    );
  }

  // -------------------------------------------------------------
  // TELEGRAM MINI APP LAYOUT
  // -------------------------------------------------------------
  // Bypassed mandatory tasks popup completely so user can claim instantly and navigate freely.
  if (false && !userProfile.mandatoryCompleted && mandatoryTasks.length > 0) {
    return (
      <div className="min-h-screen bg-tg-dark text-tg-text font-sans flex flex-col relative selection:bg-tg-blue/30 selection:text-white">
        {/* Central Interactive Developer simulator */}
        <TelegramSimulator 
          onUserChange={handleUserChange}
          activeUser={activeUser}
          db={db}
          onDbReset={handleDbReset}
          onNavigateToAdmin={navigateToAdmin}
        />

        <MandatoryTasksPopup
          user={userProfile}
          db={db}
          onUpdateState={handleStateUpdate}
          onClose={() => {
            setActiveTab('profile');
          }}
          showToast={showToast}
        />

        {/* Floating native-like dynamic Toast alerts */}
        <div className="fixed top-4 inset-x-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`p-3 rounded-xl border shadow-xl flex items-center gap-2.5 pointer-events-auto backdrop-blur-md bg-tg-surface/90 ${
                  toast.type === 'success' 
                    ? 'border-emerald-500/30 shadow-emerald-950/20' 
                    : toast.type === 'error'
                      ? 'border-red-500/30 shadow-red-950/20'
                      : toast.type === 'pending'
                        ? 'border-tg-blue/30 shadow-tg-blue/20'
                        : 'border-white/10 shadow-black/40'
                }`}
              >
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {toast.type === 'pending' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }} className="shrink-0"><RefreshCw className="w-4 h-4 text-tg-blue-light animate-spin" /></motion.div>}
                {toast.type === 'info' && <Info className="w-4 h-4 text-tg-blue-light shrink-0" />}

                <div className="text-xs font-semibold text-white leading-snug flex-1 pr-1">
                  {toast.message}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGULAR MAIN APP VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-tg-dark text-tg-text font-sans flex flex-col relative selection:bg-tg-blue/30 selection:text-white">
      
      {/* Central Interactive Developer simulator */}
      <TelegramSimulator 
        onUserChange={handleUserChange}
        activeUser={activeUser}
        db={db}
        onDbReset={handleDbReset}
        onNavigateToAdmin={navigateToAdmin}
      />

      {/* Global announcement system */}
      {db.settings.announcement && (
        <div className="bg-tg-blue/15 border-b border-tg-blue/25 px-4 py-2 text-center text-[10px] text-tg-blue-light font-semibold font-display tracking-wide uppercase">
          {db.settings.announcement}
        </div>
      )}

      {/* Primary body view wrapper */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-32 space-y-4">
        {/* Header client identity */}
        <div className="flex items-center justify-between glass-panel p-4 rounded-2xl relative overflow-hidden shadow-xl shadow-black/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tg-blue/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={userProfile.photoUrl} 
                alt={userProfile.firstName} 
                className="w-11 h-11 rounded-full border border-tg-blue/45 object-cover shadow-md" 
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-tg-dark shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white font-display leading-none tracking-tight">{userProfile.firstName}</span>
                <span className="text-[8px] bg-tg-blue/15 text-tg-blue-light font-mono px-1.5 py-0.5 rounded-md font-bold border border-tg-blue/20">VIP LEVEL</span>
              </div>
              <span className="text-xs text-tg-text-muted/80">@{userProfile.username || 'NoUsername'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* System alert bell */}
            <button
              onClick={() => setShowNotifCenter(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-tg-text-muted hover:text-white hover:bg-white/10 transition relative cursor-pointer"
              id="header_alert_bell"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full scale-90 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold tracking-wider text-tg-text-muted block">TM Balance</span>
              <span className="text-base font-extrabold font-display text-amber-400 font-mono tracking-tight flex items-center justify-end gap-1">
                {userProfile.balanceTM.toLocaleString()}
                <span className="text-[10px] font-sans font-extrabold text-amber-500/80 uppercase">TM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab display views switchboard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'tasks' && (
              <TasksTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
                showToast={showToast}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab}
                showToast={showToast}
              />
            )}

            {activeTab === 'referral' && (
              <ReferralTab 
                user={userProfile} 
                db={db} 
                showToast={showToast}
              />
            )}

            {activeTab === 'deposit' && (
              <DepositTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
                showToast={showToast}
              />
            )}

            {activeTab === 'withdraw' && (
              <WithdrawTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
                showToast={showToast}
              />
            )}

            {activeTab === 'giftCode' && (
              <GiftCodeTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                showToast={showToast}
              />
            )}

            {activeTab === 'support' && (
              <SupportTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                showToast={showToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Locked verification popup dialog */}
      <AnimatePresence>
        {showLockedModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-center animate-pulse-slow"
            >
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/25 animate-bounce">
                <Lock className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base font-display">Holding Dashboard Locked</h3>
                <p className="text-xs text-tg-text-muted leading-relaxed">
                  You requested to view the <strong className="text-tg-blue-light capitalize">{blockedTab}</strong> tab, but holding dashboards remain locked until you complete all mandatory Telegram tasks first.
                </p>
              </div>

              {/* Progress summary inside blocker modal */}
              <div className="p-3 bg-tg-dark/50 rounded-xl text-xs flex justify-between items-center border border-white/5">
                <span className="text-tg-text-muted">Mandatory Tasks:</span>
                <span className="font-bold text-amber-400 font-mono">{completedMandatoryCount} / {Math.min(db.settings.mandatoryTaskCount ?? totalMandatoryCount, totalMandatoryCount)} Done</span>
              </div>

              <div className="flex gap-2.5 pt-1.5">
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="w-full bg-tg-blue hover:bg-tg-blue-light text-white text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Complete Mandatory Tasks
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Frozen or Banned Screen Blockers */}
      {(userProfile.isFrozen || userProfile.isBanned) && (
        <div className="fixed inset-0 z-50 bg-[#060913]/95 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-red-500/20 space-y-4 glow-blue">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base font-display">
                {userProfile.isBanned ? 'Telegram ID Banned' : 'Account Temporarily Frozen'}
              </h3>
              <p className="text-xs text-tg-text-muted leading-relaxed">
                {userProfile.isBanned 
                  ? 'Your account has been permanently banned from the TM Digital network due to multiple verification violations.'
                  : 'Your staking logs have been frozen temporarily by the compliance board pending TXID screenshot audit.'}
              </p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl text-xs text-tg-text-muted font-semibold">
              Telegram ID: {userProfile.id}
            </div>

            <p className="text-[10px] text-tg-text-muted pt-2">
              If this was a mistake, switch to another Simulated Profile in the developer settings above.
            </p>
          </div>
        </div>
      )}

      {/* Sticky Native Telegram-like Bottom Navigation Bar */}
      <nav className="fixed bottom-4 inset-x-4 glass-panel border border-white/10 py-2 px-1 z-40 max-w-md mx-auto flex justify-around items-center rounded-2xl shadow-2xl shadow-black/70 bg-tg-surface/90 backdrop-blur-xl">
        {[
          { id: 'profile', label: 'Home', icon: Home, lockable: true },
          { id: 'giftCode', label: 'Gift Code', icon: Gift, lockable: true },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, lockable: true },
          { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, lockable: true },
          { id: 'support', label: 'Support', icon: HelpCircle, lockable: true }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const isLocked = tab.lockable && !isUnlocked;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className="flex flex-col items-center gap-1 py-1 px-2 relative transition-all duration-200 focus:outline-none shrink-0 cursor-pointer group"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-all duration-200 transform group-hover:scale-105 ${
                  isSelected 
                    ? 'text-tg-blue filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                    : isLocked 
                      ? 'text-tg-text-muted opacity-35' 
                      : 'text-tg-text-muted group-hover:text-white'
                }`} />
                {isLocked && (
                  <div className="absolute -top-1.5 -right-1.5 p-0.5 bg-amber-500 text-tg-dark rounded-full border border-tg-dark">
                    <Lock className="w-1.5 h-1.5" />
                  </div>
                )}
              </div>
              
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${
                isSelected 
                  ? 'text-tg-blue' 
                  : isLocked 
                    ? 'text-tg-text-muted opacity-35' 
                    : 'text-tg-text-muted group-hover:text-white'
              }`}>
                {tab.label}
              </span>

              {/* Active navigation dot indicator */}
              {isSelected && (
                <div className="absolute -bottom-1 w-1 h-1 bg-tg-blue rounded-full glow-blue" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Floating native-like dynamic Toast alerts */}
      <div className="fixed top-4 inset-x-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`p-3 rounded-xl border shadow-xl flex items-center gap-2.5 pointer-events-auto backdrop-blur-md bg-tg-surface/90 ${
                toast.type === 'success' 
                  ? 'border-emerald-500/30 shadow-emerald-950/20' 
                  : toast.type === 'error'
                    ? 'border-red-500/30 shadow-red-950/20'
                    : toast.type === 'pending'
                      ? 'border-tg-blue/30 shadow-tg-blue/20'
                      : 'border-white/10 shadow-black/40'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {toast.type === 'pending' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }} className="shrink-0"><RefreshCw className="w-4 h-4 text-tg-blue-light animate-spin" /></motion.div>}
              {toast.type === 'info' && <Info className="w-4 h-4 text-tg-blue-light shrink-0" />}

              <div className="text-xs font-semibold text-white leading-snug flex-1 pr-1">
                {toast.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Slide-in Notification Drawer overlay */}
      <AnimatePresence>
        {showNotifCenter && (
          <NotificationCenter
            user={userProfile}
            db={db}
            onUpdateState={handleStateUpdate}
            onClose={() => setShowNotifCenter(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
