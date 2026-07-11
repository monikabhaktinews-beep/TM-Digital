import React, { useState, useEffect } from 'react';
import { TelegramUser, UserProfile, AppDatabase } from './types';
import { getDB, getUserProfile, saveDB } from './lib/db';
import TelegramSimulator, { SIMULATED_PROFILES } from './components/TelegramSimulator';
import TasksTab from './components/TasksTab';
import DashboardTab from './components/DashboardTab';
import DepositTab from './components/DepositTab';
import WithdrawTab from './components/WithdrawTab';
import ProfileTab from './components/ProfileTab';
import SupportTab from './components/SupportTab';
import AdminPanel from './components/AdminPanel';
import { 
  CheckSquare, BarChart2, ArrowDownLeft, ArrowUpRight, User, HelpCircle, 
  Lock, KeyRound, AlertTriangle, MessageSquare, Bot 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => getDB());
  const [activeUser, setActiveUser] = useState<TelegramUser>(SIMULATED_PROFILES[0]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile(SIMULATED_PROFILES[0]));
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [showLockedModal, setShowLockedModal] = useState<boolean>(false);
  const [blockedTab, setBlockedTab] = useState<string>('');

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

  // Sync user profile when active user changes or DB updates
  useEffect(() => {
    const profile = getUserProfile(activeUser);
    setUserProfile(profile);
  }, [activeUser, db]);

  const handleUserChange = (newTgUser: TelegramUser) => {
    setActiveUser(newTgUser);
    const profile = getUserProfile(newTgUser);
    setUserProfile(profile);
    
    // Automatically reset tab to tasks if switching users
    setActiveTab('tasks');
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
  const isUnlocked = completedMandatoryCount === totalMandatoryCount;

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
      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-28 space-y-4">
        {/* Header client identity */}
        <div className="flex items-center justify-between bg-tg-surface/40 p-3.5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <img 
              src={userProfile.photoUrl} 
              alt={userProfile.firstName} 
              className="w-10 h-10 rounded-full border border-tg-blue/30 object-cover" 
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white font-display leading-tight">{userProfile.firstName}</span>
                <span className="text-[10px] bg-tg-blue/15 text-tg-blue-light font-mono px-1 py-0.2 rounded font-bold">VIP</span>
              </div>
              <span className="text-xs text-tg-text-muted">@{userProfile.username || 'NoUsername'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider text-tg-text-muted block">TM Active Balance</span>
            <span className="text-sm font-extrabold font-display text-amber-400 font-mono">{userProfile.balanceTM.toLocaleString()} <span className="text-[10px] font-sans font-bold">TM</span></span>
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
              />
            )}
            
            {activeTab === 'dashboard' && (
              <DashboardTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
              />
            )}

            {activeTab === 'deposit' && (
              <DepositTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
              />
            )}

            {activeTab === 'withdraw' && (
              <WithdrawTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
                onNavigateToTab={navigateToTab} 
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
              />
            )}

            {activeTab === 'support' && (
              <SupportTab 
                user={userProfile} 
                db={db} 
                onUpdateState={handleStateUpdate} 
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
              className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-center"
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
                <span className="font-bold text-amber-400 font-mono">{completedMandatoryCount} / {totalMandatoryCount} Done</span>
              </div>

              <div className="flex gap-2.5 pt-1.5">
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="w-full bg-tg-blue hover:bg-tg-blue-light text-white text-xs font-semibold py-2.5 rounded-xl transition"
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
        <div className="fixed inset-0 z-50 bg-tg-dark flex flex-col justify-center items-center p-6 text-center">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-red-500/10 space-y-4 glow-blue">
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
      <nav className="fixed bottom-0 inset-x-0 bg-tg-surface border-t border-white/5 py-2 px-2 z-40 max-w-md mx-auto flex justify-around items-center">
        {[
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'dashboard', label: 'Staking', icon: BarChart2, lockable: true },
          { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft, lockable: true },
          { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, lockable: true },
          { id: 'profile', label: 'Referral', icon: User, lockable: true },
          { id: 'support', label: 'Support', icon: HelpCircle, lockable: true }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const isLocked = tab.lockable && !isUnlocked;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className="flex flex-col items-center gap-1 py-1 px-2.5 relative transition duration-150 focus:outline-none shrink-0"
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${
                  isSelected 
                    ? 'text-tg-blue' 
                    : isLocked 
                      ? 'text-tg-text-muted opacity-40' 
                      : 'text-tg-text-muted'
                }`} />
                {isLocked && (
                  <div className="absolute -top-1 -right-1.5 p-0.5 bg-amber-400 text-tg-dark rounded-full">
                    <Lock className="w-1.5 h-1.5" />
                  </div>
                )}
              </div>
              
              <span className={`text-[10px] font-semibold transition-colors ${
                isSelected 
                  ? 'text-tg-blue' 
                  : isLocked 
                    ? 'text-tg-text-muted opacity-40' 
                    : 'text-tg-text-muted'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
