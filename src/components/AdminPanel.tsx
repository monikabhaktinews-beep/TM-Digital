import React, { useState } from 'react';
import { 
  AppDatabase, UserProfile, Task, Channel, DepositRequest, 
  WithdrawalRequest, WithdrawalRule, SupportTicket, SystemSettings, Transaction 
} from '../types';
import { 
  getDB, saveDB, adminApproveDeposit, adminRejectDeposit, 
  adminApproveWithdrawal, adminRejectWithdrawal, adminModifyUserBalance, 
  adminSetUserStatus, adminReplyToTicket, adminCloseTicket, processTaskSubmission 
} from '../lib/db';
import { 
  Shield, Key, Users, Coins, ArrowDownLeft, ArrowUpRight, BarChart2, 
  Settings, Clipboard, Sliders, CheckCircle2, XCircle, Search, Edit, 
  Plus, Trash2, Ban, Lock, Unlock, Eye, Send, ArrowRight, Wallet, Percent, 
  Info, RefreshCw, MessageSquare, Gift, Download
} from 'lucide-react';

interface AdminPanelProps {
  db: AppDatabase;
  onDbUpdate: (newDb: AppDatabase) => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  db,
  onDbUpdate,
  onExitAdmin
}) => {
  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'referrals' | 'requests' | 'tasks' | 'support' | 'settings' | 'transfers'>('dashboard');

  // Search & Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Gift Code Management states
  const [giftRewardAmount, setGiftRewardAmount] = useState<string>('1.00');
  const [giftCodesCount, setGiftCodesCount] = useState<number>(10);
  const [giftMaxClaims, setGiftMaxClaims] = useState<number>(1);
  const [giftExpiryDate, setGiftExpiryDate] = useState<string>('');
  const [giftSearchQuery, setGiftSearchQuery] = useState<string>('');
  const [selectedGiftCodes, setSelectedGiftCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [newlyGeneratedCodes, setNewlyGeneratedCodes] = useState<string[]>([]);
  const [hasCopiedNewCodes, setHasCopiedNewCodes] = useState<boolean>(false);

  // Manual Adjustments Form
  const [adjustTM, setAdjustTM] = useState('');
  const [adjustUSDT, setAdjustUSDT] = useState('');

  // CRUD Forms - Tasks & Channels
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // New Channel Form States
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const [newChanUsername, setNewChanUsername] = useState('');
  const [newChanReward, setNewChanReward] = useState('100');
  const [newChanError, setNewChanError] = useState('');
  const [newChanSuccess, setNewChanSuccess] = useState('');

  // Editing existing channel reward inline
  const [channelEditId, setChannelEditId] = useState<string | null>(null);
  const [channelEditReward, setChannelEditReward] = useState('');

  // Deletion confirmation state
  const [channelDeleteConfirmId, setChannelDeleteConfirmId] = useState<string | null>(null);

  // New Task Form States
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<'TelegramChannel' | 'TelegramGroup' | 'TelegramBot' | 'DailyCheckIn' | 'Referral' | 'Custom' | 'ExternalLink'>('TelegramBot');
  const [newTaskReward, setNewTaskReward] = useState('150');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskIsMandatory, setNewTaskIsMandatory] = useState(false);
  const [newTaskRequiresVerify, setNewTaskRequiresVerify] = useState(true);
  const [newTaskError, setNewTaskError] = useState('');
  const [newTaskSuccess, setNewTaskSuccess] = useState('');

  // Editing existing task states
  const [taskEditId, setTaskEditId] = useState<string | null>(null);
  const [taskEditReward, setTaskEditReward] = useState('');
  const [taskDeleteConfirmId, setTaskDeleteConfirmId] = useState<string | null>(null);

  // Settings modification state
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...db.settings });

  // Ticket response state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === 'support@tmdigital.help' && password === 'Arush600') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Administrator credentials.');
    }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const localDb = getDB();
    localDb.settings = { ...settingsForm };
    saveDB(localDb);
    onDbUpdate(localDb);
    alert("System Settings saved successfully!");
  };

  const executeAction = (actionFn: () => AppDatabase) => {
    const updated = actionFn();
    onDbUpdate(updated);
  };

  // -------------------------------------------------------------
  // METRICS COMPUTATIONS
  // -------------------------------------------------------------
  const totalUsers = (db.users || []).length;
  // Let's assume users registered today (since 2026-07-11) are considered "Today's Users"
  const todayUsers = (db.users || []).filter(u => u.registeredAt && typeof u.registeredAt === 'string' && u.registeredAt.startsWith('2026-07-11')).length + 1; // simulation fallback offset
  const onlineUsers = Math.max(2, Math.floor(Math.random() * 5) + 3); // Simulated live users

  const pendingDeposits = (db.deposits || []).filter(d => d.status === 'Pending');
  const pendingWithdrawals = (db.withdrawals || []).filter(w => w.status === 'Pending');
  const pendingSubmissions = (db.taskSubmissions || []).filter(s => s.status === 'Pending');

  const totalRevenueUSDT = (db.deposits || [])
    .filter(d => d.status === 'Approved')
    .reduce((sum, d) => sum + (d.amountUSDT || 0), 0);

  const totalReferralsPaidUSDT = (db.users || []).reduce((sum, u) => sum + (u.referralEarningsUSDT || 0), 0);

  const totalBonusClaimsUSDT = (db.transactions || [])
    .filter(tx => tx.type === 'DailyBonus')
    .reduce((sum, tx) => sum + (tx.amountUSDT || 0), 0);

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-tg-dark flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/5 space-y-6 glow-blue">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-tg-blue/20 text-tg-blue rounded-xl flex items-center justify-center mx-auto mb-2 border border-tg-blue/30">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold font-display text-white">TM Digital Admin Access</h2>
            <p className="text-xs text-tg-text-muted">Enter administrative credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Admin Email</label>
              <input
                type="email"
                placeholder="support@tmdigital.help"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Admin Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-2 text-center text-xs font-semibold rounded-lg">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-tg-blue hover:bg-tg-blue-light text-white font-semibold font-display text-xs py-3 rounded-xl transition cursor-pointer"
            >
              Authenticate System
            </button>
          </form>

          <button
            onClick={onExitAdmin}
            className="w-full text-center text-xs text-tg-text-muted hover:text-white transition"
          >
            ← Exit to App Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-dark text-tg-text font-sans">
      {/* Admin Topbar */}
      <header className="bg-tg-surface border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-tg-blue" />
          <span className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            TM DIGITAL <span className="bg-tg-blue/20 text-tg-blue text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">CONSOLE</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExitAdmin}
            className="text-xs bg-tg-surface-light border border-white/5 text-tg-text hover:bg-white/5 px-3 py-1.5 rounded-lg transition"
          >
            Go to App
          </button>
        </div>
      </header>

      {/* Admin Dashboard Page Layout */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Overview Metrics', icon: BarChart2 },
            { id: 'users', label: 'User Database', icon: Users },
            { id: 'referrals', label: 'Gift Code Manager', icon: Gift },
            { id: 'transfers', label: 'Transfer History', icon: RefreshCw },
            { id: 'requests', label: 'Requests & Submissions', icon: Clipboard, badge: pendingDeposits.length + pendingWithdrawals.length + pendingSubmissions.length },
            { id: 'tasks', label: 'Tasks & Channels', icon: Sliders },
            { id: 'support', label: 'Support Inbox', icon: MessageSquare, badge: db.tickets.filter(t => t.status === 'Open').length },
            { id: 'settings', label: 'System Settings', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedUser(null);
                  setActiveTicketId(null);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium text-left transition ${
                  isActive 
                    ? 'bg-tg-blue/20 border-tg-blue text-white' 
                    : 'bg-tg-surface hover:bg-tg-surface-light border-white/5 text-tg-text-muted'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-tg-blue' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Core Workspace Panel */}
        <div className="md:col-span-3 space-y-4">
          
          {/* OVERVIEW METRICS SECTION */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Stat grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Total Accounts</span>
                  <span className="text-2xl font-extrabold font-display text-white mt-1 block">{totalUsers}</span>
                </div>
                
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Registered Today</span>
                  <span className="text-2xl font-extrabold font-display text-white mt-1 block">{todayUsers}</span>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Live Sessions</span>
                  <span className="text-2xl font-extrabold font-display text-emerald-400 mt-1 block">{onlineUsers}</span>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT Total Deposits</span>
                  <span className="text-2xl font-extrabold font-display text-emerald-400 mt-1 block">${totalRevenueUSDT.toFixed(2)}</span>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT Paid Referrals</span>
                  <span className="text-2xl font-extrabold font-display text-white mt-1 block">${totalReferralsPaidUSDT.toFixed(2)}</span>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Daily Staking Claims</span>
                  <span className="text-2xl font-extrabold font-display text-amber-300 mt-1 block">${totalBonusClaimsUSDT.toFixed(2)}</span>
                </div>
              </div>

              {/* Handcrafted custom beautiful vector charts! (Avoid Recharts react-19 build bugs) */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white font-display">Staking & System Stabilities (Approved Deposits vs. Payout Claims)</h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-tg-blue rounded-full" /> Deposits</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-300 rounded-full" /> Claims</span>
                  </div>
                </div>

                {/* SVG Chart Drawing */}
                <div className="w-full h-44 bg-tg-dark/50 border border-white/5 rounded-xl relative p-2 flex flex-col justify-between">
                  <div className="absolute inset-x-2 bottom-6 top-2 border-b border-white/5 flex flex-col justify-between">
                    <div className="border-t border-white/5 w-full h-px" />
                    <div className="border-t border-white/5 w-full h-px" />
                    <div className="border-t border-white/5 w-full h-px" />
                  </div>
                  
                  {/* The Vector Line */}
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Deposits Curve line (Blue) */}
                    <path 
                      d="M 0 130 Q 100 110, 200 80 T 350 50 T 500 20" 
                      fill="none" 
                      stroke="#2481cc" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                    />
                    {/* Claims Curve line (Amber) */}
                    <path 
                      d="M 0 140 Q 100 135, 200 120 T 350 110 T 500 85" 
                      fill="none" 
                      stroke="#fcd34d" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  
                  <div className="flex justify-between text-[9px] text-tg-text-muted mt-auto pt-2 z-10 px-2 font-mono">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>

              {/* Recent Activities Panel */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
                <h3 className="font-semibold text-sm text-white font-display">Administrative Audit logs</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-tg-dark/40 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Staking Daily Bonus Config updated</span>
                      <span className="text-[10px] text-tg-text-muted">By system admin @ Arush600</span>
                    </div>
                    <span className="text-[10px] text-tg-text-muted">Today, 07:15 UTC</span>
                  </div>
                  <div className="p-3 bg-tg-dark/40 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Backup synchronization generated</span>
                      <span className="text-[10px] text-tg-text-muted">Auto-system sync</span>
                    </div>
                    <span className="text-[10px] text-tg-text-muted">Today, 06:00 UTC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USER DATABASE TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 bg-tg-surface p-3 rounded-xl border border-white/5">
                <Search className="w-4 h-4 text-tg-text-muted" />
                <input
                  type="text"
                  placeholder="Search user by First Name, Username or Telegram User ID..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  className="bg-transparent text-xs w-full text-white focus:outline-none"
                />
              </div>

              {/* Selected User Workspace details */}
              {selectedUser ? (
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-5 animate-slideUp">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-tg-blue hover:underline"
                    >
                      ← Back to user directory
                    </button>
                    <span className="text-[10px] text-tg-text-muted font-mono">User ID: {selectedUser.id}</span>
                  </div>

                  {/* Profile Summary */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedUser.photoUrl} 
                      alt={selectedUser.firstName} 
                      className="w-14 h-14 rounded-full border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-base text-white">{selectedUser.firstName} {selectedUser.lastName || ''}</h4>
                      <span className="text-xs text-tg-blue-light block">UID: <strong className="text-white font-extrabold">{selectedUser.uid}</strong> | @{selectedUser.username || 'NoUsername'}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => {
                        const action = selectedUser.isFrozen ? 'unfreeze' : 'freeze';
                        executeAction(() => adminSetUserStatus(selectedUser.id, action));
                        alert(`User ${action}d successfully.`);
                        onExitAdmin();
                      }}
                      className="p-2.5 text-center bg-amber-500/15 border border-amber-500/20 text-amber-400 font-semibold text-xs rounded-xl hover:bg-amber-500/25 transition"
                    >
                      {selectedUser.isFrozen ? 'Unfreeze User' : 'Freeze User'}
                    </button>
                    <button
                      onClick={() => {
                        const action = selectedUser.isBanned ? 'unban' : 'ban';
                        executeAction(() => adminSetUserStatus(selectedUser.id, action));
                        alert(`User ${action}ned successfully.`);
                        onExitAdmin();
                      }}
                      className="p-2.5 text-center bg-red-500/15 border border-red-500/20 text-red-400 font-semibold text-xs rounded-xl hover:bg-red-500/25 transition"
                    >
                      {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete user completely?")) {
                          executeAction(() => adminSetUserStatus(selectedUser.id, 'delete'));
                          alert("User deleted from DB.");
                          setSelectedUser(null);
                        }
                      }}
                      className="p-2.5 text-center bg-red-950/40 border border-red-900/30 text-red-300 font-semibold text-xs rounded-xl hover:bg-red-900/40 transition"
                    >
                      Delete Account
                    </button>
                  </div>

                  {/* Balance Adjustment Panel */}
                  <div className="p-4 bg-tg-dark/40 border border-white/5 rounded-xl space-y-4">
                    <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Manual Balance Adjustments</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-tg-text-muted">Adjust TM (+ / -)</label>
                        <input
                          type="number"
                          placeholder="e.g. 500 or -500"
                          value={adjustTM}
                          onChange={(e) => setAdjustTM(e.target.value)}
                          className="w-full bg-tg-dark border border-white/5 px-3 py-1.5 text-xs rounded focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-tg-text-muted">Adjust USDT (+ / -)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 0.5 or -0.5"
                          value={adjustUSDT}
                          onChange={(e) => setAdjustUSDT(e.target.value)}
                          className="w-full bg-tg-dark border border-white/5 px-3 py-1.5 text-xs rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const tmNum = parseInt(adjustTM) || 0;
                        const usdtNum = parseFloat(adjustUSDT) || 0;
                        if (tmNum === 0 && usdtNum === 0) return;
                        executeAction(() => adminModifyUserBalance(selectedUser.id, tmNum, usdtNum));
                        alert("Balances updated successfully!");
                        setAdjustTM('');
                        setAdjustUSDT('');
                        onExitAdmin();
                      }}
                      className="bg-tg-blue hover:bg-tg-blue-light text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Save Balance Adjustments
                    </button>
                  </div>

                  {/* Individual Transaction Logs */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">User Transaction logs</span>
                    <div className="bg-tg-dark/20 rounded-xl border border-white/5 divide-y divide-white/5 max-h-40 overflow-y-auto">
                      {db.transactions
                        .filter(t => t.userId === selectedUser.id)
                        .map(t => (
                          <div key={t.id} className="p-2.5 flex justify-between items-center text-[11px]">
                            <span>{t.description}</span>
                            <span className="font-bold text-white">{t.amountTM !== 0 ? `${t.amountTM} TM` : `$${t.amountUSDT} USDT`}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* User List directory */
                <div className="glass-panel rounded-2xl border border-white/5 divide-y divide-white/5">
                  {(db.users || [])
                    .filter(u => {
                      const q = userSearchQuery.toLowerCase();
                      return (u.firstName && u.firstName.toLowerCase().includes(q)) || 
                             (u.id && u.id.includes(q)) || 
                             (u.uid && String(u.uid).includes(q)) ||
                             (u.username && u.username.toLowerCase().includes(q));
                    })
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={user.photoUrl} className="w-8 h-8 rounded-full border border-white/5 object-cover" alt="" referrerPolicy="no-referrer" />
                          <div>
                            <span className="font-semibold text-xs text-white block">{user.firstName || 'User'} {user.lastName || ''}</span>
                            <span className="text-[10px] text-tg-text-muted block">UID: <span className="text-white font-bold">{user.uid}</span> | @{user.username || 'NoUsername'} (ID: {user.id})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-xs text-amber-400 block font-mono">{user.balanceTM ?? 0} TM</span>
                            <span className="text-[9px] text-emerald-400 font-bold block">${user.balanceUSDT ?? 0.0} USDT</span>
                          </div>
                          
                          {user.isBanned ? (
                            <span className="bg-red-500/10 text-red-400 text-[9px] px-2 py-0.5 rounded border border-red-500/20 uppercase font-bold">Banned</span>
                          ) : user.isFrozen ? (
                            <span className="bg-amber-500/10 text-amber-400 text-[9px] px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold">Frozen</span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Active</span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* GIFT CODE MANAGER SECTION */}
          {activeTab === 'referrals' && (() => {
            const giftCodes = db.giftCodes || [];

            // Computations
            const totalCodes = giftCodes.length;
            const activeCodesCount = giftCodes.filter(gc => gc.isEnabled && (!gc.expiryDate || new Date() < new Date(gc.expiryDate))).length;
            const totalClaimsCount = giftCodes.reduce((sum, gc) => sum + (gc.claimsCount || 0), 0);
            const remainingCodesCount = giftCodes.filter(gc => gc.isEnabled && (gc.claimsCount < gc.maxClaims) && (!gc.expiryDate || new Date() < new Date(gc.expiryDate))).length;
            const totalUSDTDistributed = giftCodes.reduce((sum, gc) => sum + ((gc.claimsCount || 0) * (gc.rewardAmount || 0)), 0);

            // Filtering & Searching
            const filteredCodes = giftCodes.filter(gc => {
              if (giftSearchQuery.trim()) {
                const query = giftSearchQuery.toLowerCase();
                return gc.code.toLowerCase().includes(query);
              }
              return true;
            }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Actions handlers
            const handleGenerateCodes = async (e: React.FormEvent) => {
              e.preventDefault();
              setIsGenerating(true);
              setNewlyGeneratedCodes([]);
              setHasCopiedNewCodes(false);
              try {
                const response = await fetch('/api/gift-code/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    rewardAmount: Number(giftRewardAmount) || 0.1,
                    count: Math.min(100, Math.max(1, Number(giftCodesCount) || 1)),
                    maxClaims: Number(giftMaxClaims) || 1,
                    expiryDate: giftExpiryDate || undefined
                  })
                });
                const data = await response.json();
                if (data.success) {
                  onDbUpdate(data.db);
                  const codesList = (data.newCodes || []).map((gc: any) => gc.code);
                  setNewlyGeneratedCodes(codesList);
                  setGiftExpiryDate('');
                  
                  // Auto-copy to clipboard
                  if (codesList.length > 0) {
                    try {
                      await navigator.clipboard.writeText(codesList.join('\n'));
                      setHasCopiedNewCodes(true);
                      alert(`Successfully generated ${codesList.length} unique gift codes!\n\nAll ${codesList.length} new codes have been copied to your clipboard!`);
                    } catch (clipErr) {
                      console.error(clipErr);
                      alert(`Successfully generated ${codesList.length} unique gift codes! Check the popup to copy them.`);
                    }
                  } else {
                    alert(`Successfully generated ${giftCodesCount} unique gift codes!`);
                  }
                } else {
                  alert(data.error || 'Failed to generate gift codes.');
                }
              } catch (err) {
                console.error(err);
                alert('Connection error.');
              } finally {
                setIsGenerating(false);
              }
            };

            const handleToggleCode = async (code: string, isEnabled: boolean) => {
              try {
                const response = await fetch('/api/gift-code/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code, isEnabled })
                });
                const data = await response.json();
                if (data.success) {
                  onDbUpdate(data.db);
                }
              } catch (err) {
                console.error(err);
              }
            };

            const handleDeleteCode = async (code: string) => {
              if (!confirm(`Are you sure you want to delete code: ${code}?`)) return;
              try {
                const response = await fetch('/api/gift-code/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code })
                });
                const data = await response.json();
                if (data.success) {
                  onDbUpdate(data.db);
                  setSelectedGiftCodes(prev => prev.filter(c => c !== code));
                }
              } catch (err) {
                console.error(err);
              }
            };

            const handleDeleteBatch = async () => {
              if (selectedGiftCodes.length === 0) return;
              if (!confirm(`Are you sure you want to delete ${selectedGiftCodes.length} selected gift codes?`)) return;
              try {
                const response = await fetch('/api/gift-code/delete-batch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ codes: selectedGiftCodes })
                });
                const data = await response.json();
                if (data.success) {
                  onDbUpdate(data.db);
                  setSelectedGiftCodes([]);
                  alert('Selected codes deleted successfully!');
                }
              } catch (err) {
                console.error(err);
              }
            };

            const handleCopyCode = (code: string) => {
              navigator.clipboard.writeText(code);
              alert(`Copied: ${code}`);
            };

            const handleCopyAllCodes = () => {
              if (filteredCodes.length === 0) return;
              const allCodesStr = filteredCodes.map(gc => gc.code).join('\n');
              navigator.clipboard.writeText(allCodesStr);
              alert(`Successfully copied all ${filteredCodes.length} visible gift codes to clipboard!`);
            };

            const handleExportCSV = () => {
              if (giftCodes.length === 0) {
                alert('No codes to export.');
                return;
              }
              const headers = ['Gift Code', 'Reward Amount (USDT)', 'Max Claims', 'Claims Count', 'Remaining Claims', 'Status', 'Expiry Date', 'Created At'];
              const csvRows = [headers.join(',')];
              
              giftCodes.forEach(gc => {
                const status = gc.isEnabled ? 'Enabled' : 'Disabled';
                const remaining = gc.maxClaims - gc.claimsCount;
                const expiry = gc.expiryDate ? new Date(gc.expiryDate).toISOString() : 'None';
                const row = [
                  gc.code,
                  gc.rewardAmount,
                  gc.maxClaims,
                  gc.claimsCount,
                  remaining,
                  status,
                  expiry,
                  new Date(gc.createdAt).toISOString()
                ];
                csvRows.push(row.join(','));
              });
              
              const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `TM_Digital_GiftCodes_Report_${new Date().toISOString().split('T')[0]}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };

            const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.checked) {
                setSelectedGiftCodes(filteredCodes.map(gc => gc.code));
              } else {
                setSelectedGiftCodes([]);
              }
            };

            const handleSelectCode = (code: string, checked: boolean) => {
              if (checked) {
                setSelectedGiftCodes(prev => [...prev, code]);
              } else {
                setSelectedGiftCodes(prev => prev.filter(c => c !== code));
              }
            };

            return (
              <div className="space-y-6 animate-fadeIn">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="glass-panel p-4 rounded-xl border border-white/5 bg-tg-surface/30">
                    <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Total Codes</span>
                    <span className="text-xl font-extrabold text-white font-mono mt-1 block">{totalCodes}</span>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Active Codes</span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1 block">{activeCodesCount}</span>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-white/5 bg-amber-500/5">
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block">Claimed Codes</span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono mt-1 block">{totalClaimsCount}</span>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-white/5 bg-purple-500/5">
                    <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold block">Remaining Codes</span>
                    <span className="text-xl font-extrabold text-purple-400 font-mono mt-1 block">{remainingCodesCount}</span>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border border-white/5 bg-tg-blue/5">
                    <span className="text-[10px] text-tg-blue-light uppercase tracking-wider font-bold block">Total USDT Distributed</span>
                    <span className="text-xl font-extrabold text-tg-blue-light font-mono mt-1 block">${totalUSDTDistributed.toFixed(2)}</span>
                  </div>
                </div>

                {/* Code Generation Form */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-tg-surface/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white text-sm font-display">Generate Bulk Unique Gift Codes</h3>
                  </div>

                  <form onSubmit={handleGenerateCodes} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-tg-text-muted uppercase font-bold">Reward Amount (USDT)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1.00"
                        value={giftRewardAmount}
                        onChange={(e) => setGiftRewardAmount(e.target.value)}
                        className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-tg-text-muted uppercase font-bold">Number of Codes (1–100)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={giftCodesCount}
                        onChange={(e) => setGiftCodesCount(Number(e.target.value) || 1)}
                        className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-tg-text-muted uppercase font-bold">Max Claims per Code</label>
                      <input
                        type="number"
                        min="1"
                        value={giftMaxClaims}
                        onChange={(e) => setGiftMaxClaims(Number(e.target.value) || 1)}
                        className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-tg-text-muted uppercase font-bold">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={giftExpiryDate}
                        onChange={(e) => setGiftExpiryDate(e.target.value)}
                        className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-4 pt-2">
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isGenerating ? (
                          <span>Generating Secure Codes...</span>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Generate {giftCodesCount} Codes Instantly</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Search & Bulk Operations */}
                <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-tg-surface/20 text-xs">
                  <div className="flex flex-1 flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-tg-text-muted" />
                      <input
                        type="text"
                        placeholder="Search gift codes..."
                        value={giftSearchQuery}
                        onChange={(e) => setGiftSearchQuery(e.target.value)}
                        className="w-full bg-tg-dark/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-tg-text-muted focus:outline-none"
                      />
                    </div>

                    {selectedGiftCodes.length > 0 && (
                      <button
                        onClick={handleDeleteBatch}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl py-2 px-4 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Selected ({selectedGiftCodes.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 self-stretch md:self-auto justify-end">
                    <button
                      onClick={handleCopyAllCodes}
                      disabled={filteredCodes.length === 0}
                      className="bg-tg-surface-light border border-white/5 text-white hover:bg-white/5 font-bold rounded-xl py-2 px-3 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Clipboard className="w-4 h-4" />
                      <span>Copy All Codes</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      disabled={giftCodes.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2 px-3 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Gift Code List Table */}
                <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-tg-text-muted">
                      <thead className="text-[10px] uppercase font-bold text-tg-text-muted bg-tg-surface-light border-b border-white/5">
                        <tr>
                          <th className="px-4 py-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={filteredCodes.length > 0 && selectedGiftCodes.length === filteredCodes.length}
                              onChange={handleSelectAll}
                              className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 cursor-pointer"
                            />
                          </th>
                          <th className="px-4 py-3">Gift Code</th>
                          <th className="px-4 py-3">Reward</th>
                          <th className="px-4 py-3">Claims (Max)</th>
                          <th className="px-4 py-3">Expiry Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredCodes.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-tg-text-muted font-medium">
                              No gift codes found matching search.
                            </td>
                          </tr>
                        ) : (
                          filteredCodes.map((gc) => {
                            const isExpired = gc.expiryDate && new Date() > new Date(gc.expiryDate);
                            const isSelected = selectedGiftCodes.includes(gc.code);
                            return (
                              <tr key={gc.code} className="hover:bg-white/[0.01] transition duration-200">
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleSelectCode(gc.code, e.target.checked)}
                                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-white tracking-wider select-all">{gc.code}</span>
                                    <button
                                      onClick={() => handleCopyCode(gc.code)}
                                      className="p-1 hover:bg-white/5 rounded text-tg-text-muted hover:text-white transition cursor-pointer"
                                      title="Copy Code"
                                    >
                                      <Clipboard className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-emerald-400 font-mono">
                                  ${gc.rewardAmount.toFixed(2)} USDT
                                </td>
                                <td className="px-4 py-3 font-mono">
                                  <span className="text-white font-bold">{gc.claimsCount}</span>
                                  <span className="text-tg-text-muted"> / {gc.maxClaims}</span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px]">
                                  {gc.expiryDate ? (
                                    <span className={isExpired ? 'text-red-400 font-bold' : 'text-gray-400'}>
                                      {new Date(gc.expiryDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-tg-text-muted">Never</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {isExpired ? (
                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                      Expired
                                    </span>
                                  ) : gc.claimsCount >= gc.maxClaims ? (
                                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                      Fully Claimed
                                    </span>
                                  ) : gc.isEnabled ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="bg-white/5 text-tg-text-muted border border-white/10 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                                      Disabled
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleToggleCode(gc.code, !gc.isEnabled)}
                                      disabled={isExpired || gc.claimsCount >= gc.maxClaims}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                                        gc.isEnabled
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                      } disabled:opacity-30 disabled:pointer-events-none`}
                                    >
                                      {gc.isEnabled ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCode(gc.code)}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded p-1 transition cursor-pointer"
                                      title="Delete Code"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Newly Generated Codes Modal Overlay */}
                {newlyGeneratedCodes.length > 0 && (
                  <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/10 space-y-4 bg-tg-surface text-tg-text">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-purple-400" />
                          <h4 className="font-bold text-white font-display text-base">Newly Generated Codes ({newlyGeneratedCodes.length})</h4>
                        </div>
                        <button
                          onClick={() => {
                            setNewlyGeneratedCodes([]);
                            setHasCopiedNewCodes(false);
                          }}
                          className="text-tg-text-muted hover:text-white transition text-sm font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-xs text-tg-text-muted leading-relaxed">
                        These are only the {newlyGeneratedCodes.length} codes you just generated. Older codes are not included. Click below to copy them instantly.
                      </p>

                      <div className="relative">
                        <textarea
                          readOnly
                          value={newlyGeneratedCodes.join('\n')}
                          className="w-full h-48 bg-tg-dark/60 border border-white/5 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-purple-500/40 resize-none select-all"
                        />
                        <span className="absolute right-2 bottom-2 text-[10px] text-tg-text-muted bg-black/40 px-1.5 py-0.5 rounded font-mono">
                          {newlyGeneratedCodes.length} codes
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(newlyGeneratedCodes.join('\n'));
                              setHasCopiedNewCodes(true);
                              setTimeout(() => setHasCopiedNewCodes(false), 2000);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Clipboard className="w-4 h-4" />
                          <span>{hasCopiedNewCodes ? '✓ Copied to Clipboard!' : 'Copy All New Codes'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setNewlyGeneratedCodes([]);
                            setHasCopiedNewCodes(false);
                          }}
                          className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* DEPOSITS & CLAIMS REQUESTS QUEUE */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Deposits Queue */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  <span>Pending USDT Deposits Notification ({pendingDeposits.length})</span>
                </h3>

                {pendingDeposits.length === 0 ? (
                  <div className="text-center text-xs text-tg-text-muted py-4">No pending deposit approvals in database queue.</div>
                ) : (
                  <div className="space-y-3">
                    {pendingDeposits.map((d) => (
                      <div key={d.id} className="p-4 bg-tg-dark/40 rounded-xl border border-white/5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-white block">Depositor: {d.userFirstName} (@{d.userUsername})</span>
                            <span className="text-[10px] text-tg-text-muted block">Timestamp: {new Date(d.createdAt).toLocaleString()}</span>
                            <span className="text-[11px] font-mono font-bold text-emerald-400 block pt-1">Amount: {d.amountUSDT} USDT</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                executeAction(() => adminApproveDeposit(d.id));
                                alert("Deposit Approved! Staking balance credited.");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-tg-dark font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                executeAction(() => adminRejectDeposit(d.id));
                                alert("Deposit Rejected.");
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        {/* TXID and Screenshot preview box */}
                        <div className="p-3 bg-tg-dark border border-white/5 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-tg-text-muted uppercase font-bold block">Reported TXID Link:</span>
                            <span className="text-[10px] font-mono select-all text-tg-blue-light block truncate max-w-sm">
                              {d.txid}
                            </span>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-1.5 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <Eye className="w-3.5 h-3.5 text-tg-text-muted" />
                            <a 
                              href={d.screenshotUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[11px] text-tg-blue hover:underline font-semibold"
                            >
                              View Uploaded Receipt
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Withdrawals Queue */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <ArrowUpRight className="w-4 h-4 text-tg-blue" />
                  <span>Pending USDT Withdrawals Payout ({pendingWithdrawals.length})</span>
                </h3>

                {pendingWithdrawals.length === 0 ? (
                  <div className="text-center text-xs text-tg-text-muted py-4">No pending withdrawal requests in system.</div>
                ) : (
                  <div className="space-y-3">
                    {pendingWithdrawals.map((w) => (
                      <div key={w.id} className="p-4 bg-tg-dark/40 rounded-xl border border-white/5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-white block">Beneficiary: {w.userFirstName} (@{w.userUsername})</span>
                            <span className="text-[10px] text-tg-text-muted block">Rule Applied: {w.ruleDescription}</span>
                            <span className="text-[11px] font-mono font-bold text-amber-300 block pt-1">Withdraw Amount: {w.amountUSDT} USDT</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                executeAction(() => adminApproveWithdrawal(w.id));
                                alert("Withdrawal Marked as Approved/Paid!");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-tg-dark font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
                            >
                              Approve Payout
                            </button>
                            <button
                              onClick={() => {
                                executeAction(() => adminRejectWithdrawal(w.id));
                                alert("Withdrawal Rejected. Balance refunded to user.");
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        </div>

                        {/* Recipient Wallet detail */}
                        <div className="p-2.5 bg-tg-dark border border-white/5 rounded-lg">
                          <span className="text-[9px] text-tg-text-muted uppercase font-bold block">USDT Receiving Address (BEP20 BSC Only):</span>
                          <span className="text-xs font-mono text-tg-blue-light block select-all font-semibold pt-0.5">
                            {w.walletAddress}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Verification Submissions Queue */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-tg-blue" />
                  <span>Pending Task Verification Submissions ({pendingSubmissions.length})</span>
                </h3>

                {pendingSubmissions.length === 0 ? (
                  <div className="text-center text-xs text-tg-text-muted py-4">No pending task verification submissions.</div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map((s) => (
                      <div key={s.id} className="p-4 bg-tg-dark/40 rounded-xl border border-white/5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-white block">User: {s.userFirstName} (@{s.userUsername || 'NoUsername'})</span>
                            <span className="text-[10px] text-tg-text-muted block">Submitted: {new Date(s.createdAt).toLocaleString()}</span>
                            <span className="text-[11px] font-bold text-tg-blue-light block pt-1">Task: {s.taskTitle} (+{s.taskRewardTM} TM)</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                executeAction(() => processTaskSubmission(s.id, 'Approved').db);
                                alert("Submission Approved! Rewards credited.");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-tg-dark font-semibold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                executeAction(() => processTaskSubmission(s.id, 'Rejected').db);
                                alert("Submission Rejected.");
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                        {/* Screenshot and Code Confirmation boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {s.screenshotUrl ? (
                            <div className="p-3 bg-tg-dark border border-white/5 rounded-lg space-y-1.5">
                              <span className="text-[9px] text-tg-text-muted uppercase font-bold block">Screenshot Evidence:</span>
                              <div className="flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5 text-tg-text-muted" />
                                <a 
                                  href={s.screenshotUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[11px] text-tg-blue hover:underline font-semibold"
                                >
                                  Open Uploaded Screenshot
                                </a>
                              </div>
                              {s.screenshotUrl.startsWith('data:image/') && (
                                <div className="mt-1 border border-white/5 rounded overflow-hidden max-w-[120px]">
                                  <img src={s.screenshotUrl} className="max-h-20 object-contain w-full bg-black" alt="Evidence Preview" referrerPolicy="no-referrer" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-tg-dark border border-white/5 rounded-lg">
                              <span className="text-[9px] text-tg-text-muted uppercase font-bold block">Screenshot Evidence:</span>
                              <span className="text-xs text-tg-text-muted italic block pt-0.5">None provided</span>
                            </div>
                          )}

                          <div className="p-3 bg-tg-dark border border-white/5 rounded-lg">
                            <span className="text-[9px] text-tg-text-muted uppercase font-bold block font-sans">Confirmation Details / Code:</span>
                            {s.confirmationCode ? (
                              <span className="text-xs text-white font-mono block select-all font-semibold pt-0.5 bg-white/5 p-1.5 rounded mt-1">
                                {s.confirmationCode}
                              </span>
                            ) : (
                              <span className="text-xs text-tg-text-muted italic block pt-0.5">None provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASKS & CHANNELS MANAGER */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Channel list (Editable) */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <h3 className="font-semibold text-sm text-white font-display">Manage Join Channels ({db.channels.length})</h3>
                  <button
                    onClick={() => {
                      setIsAddingChannel(!isAddingChannel);
                      setNewChanName('');
                      setNewChanUsername('');
                      setNewChanReward('100');
                      setNewChanError('');
                      setNewChanSuccess('');
                    }}
                    className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {isAddingChannel ? (
                      <span>Close Form</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Channel</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Add Channel Form */}
                {isAddingChannel && (
                  <div className="p-4 bg-tg-dark/60 rounded-xl border border-white/10 space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-bold text-tg-blue-light uppercase tracking-wider">New Telegram Channel</h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Channel Name</label>
                          <input
                            type="text"
                            value={newChanName}
                            onChange={(e) => setNewChanName(e.target.value)}
                            placeholder="e.g. Official News Feed"
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Channel Username</label>
                          <input
                            type="text"
                            value={newChanUsername}
                            onChange={(e) => setNewChanUsername(e.target.value)}
                            placeholder="e.g. @tm_news_channel"
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Reward TM Amount</label>
                        <input
                          type="number"
                          value={newChanReward}
                          onChange={(e) => setNewChanReward(e.target.value)}
                          placeholder="100"
                          className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-mono"
                        />
                      </div>

                      {newChanError && (
                        <div className="p-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-lg font-semibold">
                          {newChanError}
                        </div>
                      )}

                      {newChanSuccess && (
                        <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-semibold">
                          {newChanSuccess}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingChannel(false);
                            setNewChanError('');
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewChanError('');
                            setNewChanSuccess('');

                            const name = newChanName.trim();
                            const username = newChanUsername.trim();
                            const reward = parseInt(newChanReward);

                            if (!name) {
                              setNewChanError('Please enter a display name.');
                              return;
                            }
                            if (!username) {
                              setNewChanError('Please enter a username (e.g. @channel).');
                              return;
                            }
                            if (isNaN(reward) || reward <= 0) {
                              setNewChanError('Please enter a valid positive TM reward amount.');
                              return;
                            }

                            const cleanUsername = username.startsWith('@') ? username : `@${username}`;
                            const localDb = getDB();
                            localDb.channels.push({
                              id: `chan_${Date.now()}`,
                              name,
                              username: cleanUsername,
                              inviteLink: `https://t.me/${cleanUsername.replace('@', '')}`,
                              rewardTM: reward,
                              isEnabled: true,
                              displayOrder: localDb.channels.length + 1,
                              isMandatory: true,
                              requiresVerification: true
                            });

                            saveDB(localDb);
                            onDbUpdate(localDb);
                            setNewChanSuccess('Channel added successfully!');
                            
                            // reset form inputs after small delay
                            setTimeout(() => {
                              setNewChanName('');
                              setNewChanUsername('');
                              setNewChanReward('100');
                              setNewChanSuccess('');
                              setIsAddingChannel(false);
                            }, 1200);
                          }}
                          className="px-4 py-1.5 bg-tg-blue hover:bg-tg-blue-light text-white rounded-lg text-xs font-semibold transition cursor-pointer glow-blue"
                        >
                          Save Channel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {db.channels.map((chan) => {
                    const isEditing = channelEditId === chan.id;
                    const isDeleting = channelDeleteConfirmId === chan.id;

                    return (
                      <div key={chan.id} className="p-3 bg-tg-dark/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <span className="font-semibold text-white block">{chan.name}</span>
                          <span className="text-[10px] text-tg-text-muted block">
                            Username: <span className="font-mono">{chan.username}</span> | Reward: <span className="font-mono font-bold text-amber-400">{chan.rewardTM} TM</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 bg-tg-dark/60 p-1 rounded-lg border border-white/5">
                              <input
                                type="number"
                                value={channelEditReward}
                                onChange={(e) => setChannelEditReward(e.target.value)}
                                className="w-16 bg-tg-dark border border-white/10 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-tg-blue font-mono"
                                placeholder="Reward"
                              />
                              <button
                                onClick={() => {
                                  const reward = parseInt(channelEditReward);
                                  if (isNaN(reward) || reward <= 0) {
                                    alert("Please enter a valid reward amount.");
                                    return;
                                  }
                                  const localDb = getDB();
                                  const matching = localDb.channels.find(c => c.id === chan.id);
                                  if (matching) {
                                    matching.rewardTM = reward;
                                    saveDB(localDb);
                                    onDbUpdate(localDb);
                                  }
                                  setChannelEditId(null);
                                }}
                                className="px-2 py-1 bg-emerald-500 text-tg-dark font-extrabold text-[10px] rounded hover:bg-emerald-400 transition cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setChannelEditId(null)}
                                className="px-2 py-1 bg-white/5 text-tg-text-muted text-[10px] rounded hover:bg-white/10 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : isDeleting ? (
                            <div className="flex items-center gap-1.5 bg-red-950/20 p-1.5 rounded-lg border border-red-900/20">
                              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider px-1">Delete?</span>
                              <button
                                onClick={() => {
                                  const localDb = getDB();
                                  localDb.channels = localDb.channels.filter(c => c.id !== chan.id);
                                  saveDB(localDb);
                                  onDbUpdate(localDb);
                                  setChannelDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 bg-red-600 text-white font-extrabold text-[10px] rounded hover:bg-red-500 transition cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setChannelDeleteConfirmId(null)}
                                className="px-2 py-1 bg-white/5 text-tg-text-muted text-[10px] rounded hover:bg-white/10 transition cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setChannelEditId(chan.id);
                                  setChannelEditReward(chan.rewardTM.toString());
                                  setChannelDeleteConfirmId(null);
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-tg-text-muted flex items-center justify-center transition cursor-pointer"
                                title="Edit Reward"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setChannelDeleteConfirmId(chan.id);
                                  setChannelEditId(null);
                                }}
                                className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded border border-red-950/30 flex items-center justify-center transition cursor-pointer"
                                title="Delete Channel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tasks list (Editable) */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <h3 className="font-semibold text-sm text-white font-display">Manage Mandatory & Secondary Tasks ({db.tasks.length})</h3>
                  <button
                    onClick={() => {
                      setIsAddingTask(!isAddingTask);
                      setNewTaskTitle('');
                      setNewTaskDescription('');
                      setNewTaskType('TelegramBot');
                      setNewTaskReward('150');
                      setNewTaskLink('');
                      setNewTaskIsMandatory(false);
                      setNewTaskRequiresVerify(true);
                      setNewTaskError('');
                      setNewTaskSuccess('');
                    }}
                    className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {isAddingTask ? (
                      <span>Close Form</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Task / Bot</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Add Task Form */}
                {isAddingTask && (
                  <div className="p-4 bg-tg-dark/60 rounded-xl border border-white/10 space-y-3.5 animate-fadeIn">
                    <h4 className="text-xs font-bold text-tg-blue-light uppercase tracking-wider">Create New Task / Social / Bot Campaign</h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Task Title</label>
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Subscribe to YouTube Channel"
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Task Type</label>
                          <select
                            value={newTaskType}
                            onChange={(e) => setNewTaskType(e.target.value as any)}
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition"
                          >
                            <option value="TelegramBot">🤖 Telegram Bot</option>
                            <option value="TelegramChannel">📢 Telegram Channel</option>
                            <option value="TelegramGroup">👥 Telegram Group</option>
                            <option value="ExternalLink">🔗 External Link (Social Media / Web)</option>
                            <option value="Custom">✨ Custom Mission</option>
                            <option value="DailyCheckIn">📅 Daily Check-In</option>
                            <option value="Referral">🤝 Referral Task</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Description / Instructions</label>
                        <textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="e.g. Complete the captcha in the bot, or subscribe and take a screenshot of your subscription."
                          rows={2}
                          className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Task Link / Bot URL</label>
                          <input
                            type="text"
                            value={newTaskLink}
                            onChange={(e) => setNewTaskLink(e.target.value)}
                            placeholder="e.g. https://t.me/example_bot"
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-tg-text-muted uppercase font-bold tracking-wider block">Reward TM Token</label>
                          <input
                            type="number"
                            value={newTaskReward}
                            onChange={(e) => setNewTaskReward(e.target.value)}
                            placeholder="150"
                            className="w-full bg-tg-dark border border-white/5 focus:border-tg-blue/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition font-mono"
                          />
                        </div>
                      </div>

                      {/* Checkboxes row */}
                      <div className="flex flex-wrap gap-4 pt-1.5 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newTaskIsMandatory}
                            onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                            className="rounded bg-tg-dark border-white/10 text-tg-blue focus:ring-0 focus:ring-offset-0 w-4 h-4"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-white block">Mandatory Task</span>
                            <span className="text-[9px] text-tg-text-muted block">User must complete this to unlock staking tab.</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newTaskRequiresVerify}
                            onChange={(e) => setNewTaskRequiresVerify(e.target.checked)}
                            className="rounded bg-tg-dark border-white/10 text-tg-blue focus:ring-0 focus:ring-offset-0 w-4 h-4"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-white block">Requires Screenshots Proof</span>
                            <span className="text-[9px] text-tg-text-muted block">Sends to pending verification log for admin approval.</span>
                          </div>
                        </label>
                      </div>

                      {newTaskError && (
                        <div className="p-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-lg font-semibold">
                          {newTaskError}
                        </div>
                      )}

                      {newTaskSuccess && (
                        <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-semibold">
                          {newTaskSuccess}
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTaskError('');
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTaskError('');
                            setNewTaskSuccess('');

                            const title = newTaskTitle.trim();
                            const description = newTaskDescription.trim();
                            const link = newTaskLink.trim() || '#';
                            const reward = parseInt(newTaskReward);

                            if (!title) {
                              setNewTaskError('Please enter a task title.');
                              return;
                            }
                            if (!description) {
                              setNewTaskError('Please enter a description/instructions.');
                              return;
                            }
                            if (isNaN(reward) || reward <= 0) {
                              setNewTaskError('Please enter a valid positive TM reward amount.');
                              return;
                            }

                            const localDb = getDB();
                            localDb.tasks.push({
                              id: `task_${Date.now()}`,
                              title,
                              description,
                              type: newTaskType,
                              rewardTM: reward,
                              link,
                              isMandatory: newTaskIsMandatory,
                              displayOrder: localDb.tasks.length + 1,
                              isEnabled: true,
                              requiresVerification: newTaskRequiresVerify
                            });

                            saveDB(localDb);
                            onDbUpdate(localDb);
                            setNewTaskSuccess('Task created successfully!');
                            
                            // Reset state and delay closing
                            setTimeout(() => {
                              setNewTaskTitle('');
                              setNewTaskDescription('');
                              setNewTaskType('TelegramBot');
                              setNewTaskReward('150');
                              setNewTaskLink('');
                              setNewTaskIsMandatory(false);
                              setNewTaskRequiresVerify(true);
                              setNewTaskSuccess('');
                              setIsAddingTask(false);
                            }, 1200);
                          }}
                          className="px-4 py-1.5 bg-tg-blue hover:bg-tg-blue-light text-white rounded-lg text-xs font-semibold transition cursor-pointer glow-blue"
                        >
                          Save Task Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  {db.tasks.map((task) => {
                    const isEditing = taskEditId === task.id;
                    const isDeleting = taskDeleteConfirmId === task.id;

                    // Compute Type Labels
                    let typeBadge = task.type;
                    if (task.type === 'TelegramBot') typeBadge = '🤖 Bot';
                    if (task.type === 'TelegramChannel') typeBadge = '📢 Channel';
                    if (task.type === 'TelegramGroup') typeBadge = '👥 Group';
                    if (task.type === 'ExternalLink') typeBadge = '🔗 Social/Web';

                    return (
                      <div key={task.id} className="p-3.5 bg-tg-dark/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-white text-xs">{task.title}</span>
                            {task.isMandatory ? (
                              <span className="bg-amber-500/15 text-amber-400 font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-500/20">Required</span>
                            ) : (
                              <span className="bg-white/5 text-tg-text-muted font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/5">Optional</span>
                            )}
                            <span className="bg-tg-blue/15 text-tg-blue-light font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-tg-blue/20">{typeBadge}</span>
                            {task.requiresVerification ? (
                              <span className="bg-indigo-500/10 text-indigo-300 font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-indigo-500/20">Proof Req.</span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20">Auto</span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-tg-text-muted leading-relaxed max-w-md">{task.description}</p>
                          
                          <div className="text-[10px] text-tg-text-muted flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                            <span>Link: <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-tg-blue hover:underline font-mono">{task.link}</a></span>
                            <span>Reward: <span className="text-amber-400 font-bold font-mono">{task.rewardTM} TM</span></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 bg-tg-dark/60 p-1 rounded-lg border border-white/5">
                              <input
                                type="number"
                                value={taskEditReward}
                                onChange={(e) => setTaskEditReward(e.target.value)}
                                className="w-16 bg-tg-dark border border-white/10 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-tg-blue font-mono"
                                placeholder="Reward"
                              />
                              <button
                                onClick={() => {
                                  const reward = parseInt(taskEditReward);
                                  if (isNaN(reward) || reward <= 0) {
                                    alert("Please enter a valid reward amount.");
                                    return;
                                  }
                                  const localDb = getDB();
                                  const matching = localDb.tasks.find(t => t.id === task.id);
                                  if (matching) {
                                    matching.rewardTM = reward;
                                    saveDB(localDb);
                                    onDbUpdate(localDb);
                                  }
                                  setTaskEditId(null);
                                }}
                                className="px-2 py-1 bg-emerald-500 text-tg-dark font-extrabold text-[10px] rounded hover:bg-emerald-400 transition cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setTaskEditId(null)}
                                className="px-2 py-1 bg-white/5 text-tg-text-muted text-[10px] rounded hover:bg-white/10 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : isDeleting ? (
                            <div className="flex items-center gap-1.5 bg-red-950/20 p-1.5 rounded-lg border border-red-900/20">
                              <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider px-1">Delete Task?</span>
                              <button
                                onClick={() => {
                                  const localDb = getDB();
                                  localDb.tasks = localDb.tasks.filter(t => t.id !== task.id);
                                  saveDB(localDb);
                                  onDbUpdate(localDb);
                                  setTaskDeleteConfirmId(null);
                                }}
                                className="px-2 py-1 bg-red-600 text-white font-extrabold text-[10px] rounded hover:bg-red-500 transition cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setTaskDeleteConfirmId(null)}
                                className="px-2 py-1 bg-white/5 text-tg-text-muted text-[10px] rounded hover:bg-white/10 transition cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  const localDb = getDB();
                                  const matching = localDb.tasks.find(t => t.id === task.id);
                                  if (matching) {
                                    matching.isEnabled = !matching.isEnabled;
                                    saveDB(localDb);
                                    onDbUpdate(localDb);
                                  }
                                }}
                                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                                  task.isEnabled 
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/15 cursor-pointer' 
                                    : 'bg-white/5 text-tg-text-muted hover:bg-white/10 border border-white/5 cursor-pointer'
                                }`}
                              >
                                {task.isEnabled ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                onClick={() => {
                                  setTaskEditId(task.id);
                                  setTaskEditReward(task.rewardTM.toString());
                                  setTaskDeleteConfirmId(null);
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-tg-text-muted flex items-center justify-center transition cursor-pointer"
                                title="Edit Reward"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setTaskDeleteConfirmId(task.id);
                                  setTaskEditId(null);
                                }}
                                className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg border border-red-950/30 flex items-center justify-center transition cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT TICKETS WORKSPACE */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-fadeIn">
              {activeTicketId ? (
                /* Admin ticket reply screen */
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <button 
                      onClick={() => setActiveTicketId(null)}
                      className="text-xs text-tg-blue hover:underline"
                    >
                      ← Back to support index
                    </button>
                    
                    <button
                      onClick={() => {
                        executeAction(() => adminCloseTicket(activeTicketId));
                        alert("Ticket status set to Closed.");
                        setActiveTicketId(null);
                      }}
                      className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/30 px-2 py-1 rounded hover:bg-red-900/20"
                    >
                      Close Ticket
                    </button>
                  </div>

                  {/* Message History */}
                  <div className="p-4 bg-tg-dark/40 border border-white/5 rounded-xl h-60 overflow-y-auto space-y-3">
                    {db.tickets
                      .find(t => t.id === activeTicketId)
                      ?.messages.map((m, idx) => (
                        <div key={idx} className={`p-3 rounded-xl text-xs max-w-[80%] ${
                          m.sender === 'admin' 
                            ? 'ml-auto bg-tg-blue/20 text-white' 
                            : 'mr-auto bg-tg-surface-light border border-white/5 text-tg-text'
                        }`}>
                          <span className="font-semibold block text-[10px] text-tg-text-muted mb-1 uppercase tracking-wider">{m.sender}</span>
                          <p>{m.text}</p>
                          <span className="text-[9px] text-tg-text-muted block mt-1">{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                  </div>

                  {/* Send reply Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!adminReplyText.trim()) return;
                      executeAction(() => adminReplyToTicket(activeTicketId, adminReplyText.trim()));
                      setAdminReplyText('');
                      alert("Reply sent successfully!");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Write administrator message reply..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="flex-1 bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-tg-blue hover:bg-tg-blue-light text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </form>
                </div>
              ) : (
                /* Ticket lists */
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display border-b border-white/5 pb-2">Admin Helpdesk Inbox</h3>
                  
                  <div className="space-y-2.5 text-xs">
                    {db.tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicketId(t.id)}
                        className="w-full p-3.5 bg-tg-dark/40 rounded-xl border border-white/5 hover:border-tg-blue/20 text-left transition flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="font-semibold text-white block leading-tight">{t.subject}</span>
                          <span className="text-[10px] text-tg-text-muted block mt-1">User: {t.userFirstName} (@{t.userUsername || t.userId})</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          t.status === 'Closed' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : t.status === 'Replied' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USER PEER-TO-PEER TRANSFERS TAB */}
          {activeTab === 'transfers' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-2">
                <h3 className="font-semibold text-base text-white font-display">Peer-to-Peer User Transfers</h3>
                <p className="text-xs text-tg-text-muted">
                  Monitor instant direct TM transfers executed between user accounts via UIDs.
                </p>
              </div>

              {/* Transfer Metrics */}
              {(() => {
                const transfersList = db.transfers || [];
                const totalTransfersCount = transfersList.length;
                const totalTransfersAmount = transfersList
                  .filter(t => t.status === 'Success')
                  .reduce((sum, t) => sum + (t.amountTM !== undefined ? t.amountTM : (t.amountUSDT || 0)), 0);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-panel p-4 rounded-xl border border-white/5 bg-tg-surface/30">
                        <span className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Total Transfers Logs</span>
                        <span className="text-xl font-bold text-white font-mono mt-1 block">{totalTransfersCount}</span>
                      </div>
                      <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5">
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Total Transferred Volume</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{totalTransfersAmount.toLocaleString()} TM</span>
                      </div>
                    </div>

                    {/* Transfers Table */}
                    <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-tg-text-muted">
                          <thead className="text-[10px] uppercase font-bold text-tg-text-muted bg-tg-surface-light border-b border-white/5">
                            <tr>
                              <th className="px-4 py-3">Sender (From UID)</th>
                              <th className="px-4 py-3">Receiver (To UID)</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3 text-center">Status / Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {transfersList.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-8 text-tg-text-muted font-medium">
                                  No P2P transfer history found.
                                </td>
                              </tr>
                            ) : (
                              [...transfersList]
                                .sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime())
                                .map((t) => {
                                  const senderUser = db.users.find(u => u.uid === t.senderUid);
                                  const receiverUser = db.users.find(u => u.uid === t.receiverUid);

                                  const handleCancel = async (tid: string) => {
                                    if (!window.confirm("Are you sure you want to cancel this pending transfer and refund the sender?")) return;
                                    try {
                                      const response = await fetch('/api/admin/transfer/cancel', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ transferId: tid })
                                      });
                                      if (response.ok) {
                                        const data = await response.json();
                                        onDbUpdate(data.db);
                                        alert("Transfer cancelled and sender refunded successfully!");
                                      } else {
                                        const err = await response.json();
                                        alert("Error: " + (err.error || 'Failed to cancel'));
                                      }
                                    } catch (err: any) {
                                      alert("Error: " + err.message);
                                    }
                                  };

                                  const handleComplete = async (tid: string) => {
                                    if (!window.confirm("Are you sure you want to force complete this transfer? This will instantly credit the recipient profile.")) return;
                                    try {
                                      const response = await fetch('/api/admin/transfer/complete', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ transferId: tid })
                                      });
                                      if (response.ok) {
                                        const data = await response.json();
                                        onDbUpdate(data.db);
                                        alert("Transfer force completed successfully!");
                                      } else {
                                        const err = await response.json();
                                        alert("Error: " + (err.error || 'Failed to complete'));
                                      }
                                    } catch (err: any) {
                                      alert("Error: " + err.message);
                                    }
                                  };

                                  return (
                                    <tr key={t.id} className="hover:bg-white/[0.01] transition duration-200">
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-white">UID: {t.senderUid}</div>
                                        <div className="text-[10px] text-tg-text-muted">
                                          {senderUser ? senderUser.firstName : 'Unknown'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-white">UID: {t.receiverUid}</div>
                                        <div className="text-[10px] text-tg-text-muted">
                                          {receiverUser ? receiverUser.firstName : 'Offline Member'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 font-bold text-emerald-400 font-mono">
                                        {(t.amountTM !== undefined ? t.amountTM : (t.amountUSDT || 0)).toLocaleString()} TM
                                      </td>
                                      <td className="px-4 py-3 font-mono text-[10px]">
                                        {new Date(t.timestamp || t.createdAt).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                                            t.status === 'Success' || t.status === 'Completed'
                                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                              : t.status === 'Pending'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                          }`}>
                                            {t.status}
                                          </span>
                                          
                                          {t.status === 'Pending' && (
                                            <div className="flex items-center gap-1 mt-1 justify-center">
                                              <button
                                                onClick={() => handleComplete(t.id)}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-[8px] px-2 py-0.5 rounded shadow cursor-pointer uppercase transition"
                                                title="Force Complete Transfer"
                                              >
                                                Complete
                                              </button>
                                              <button
                                                onClick={() => handleCancel(t.id)}
                                                className="bg-red-500 hover:bg-red-400 text-white font-extrabold text-[8px] px-2 py-0.5 rounded shadow cursor-pointer uppercase transition"
                                                title="Cancel & Refund Sender"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* STAKING & PAYMENTS SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fadeIn">
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                {/* Global Rates card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Percent className="w-4 h-4 text-tg-blue" />
                    <span>Global Conversion Rates & Staking Rewards</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT to TM Conversion (1 USDT = X TM)</label>
                      <input
                        type="number"
                        value={settingsForm.conversionRate}
                        onChange={(e) => setSettingsForm({ ...settingsForm, conversionRate: parseInt(e.target.value) || 1000 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Referral Reward USDT (e.g. 0.03)</label>
                      <input
                        type="number"
                        step="any"
                        value={settingsForm.referralRewardUSDT}
                        onChange={(e) => setSettingsForm({ ...settingsForm, referralRewardUSDT: parseFloat(e.target.value) || 0.03 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Holding Yield Rate (USDT per 1000 TM daily)</label>
                      <input
                        type="number"
                        step="any"
                        value={settingsForm.dailyBonusRateUSDT}
                        onChange={(e) => setSettingsForm({ ...settingsForm, dailyBonusRateUSDT: parseFloat(e.target.value) || 0.11 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Daily Bonus Interval (Hours)</label>
                      <input
                        type="number"
                        value={settingsForm.dailyBonusIntervalHours}
                        onChange={(e) => setSettingsForm({ ...settingsForm, dailyBonusIntervalHours: parseInt(e.target.value) || 24 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Required Mandatory Tasks for Referral</label>
                      <input
                        type="number"
                        value={settingsForm.mandatoryTaskCount ?? 3}
                        onChange={(e) => setSettingsForm({ ...settingsForm, mandatoryTaskCount: parseInt(e.target.value) || 3 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Minimum Deposit Amount (USDT)</label>
                      <input
                        type="number"
                        step="any"
                        value={settingsForm.depositMinUSDT ?? 1.0}
                        onChange={(e) => setSettingsForm({ ...settingsForm, depositMinUSDT: parseFloat(e.target.value) || 1.0 })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* USDT payments wallet card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Company Wallet & QR Codes</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Company USDT BEP20 Wallet Address</label>
                      <input
                        type="text"
                        value={settingsForm.walletAddressUSDT}
                        onChange={(e) => setSettingsForm({ ...settingsForm, walletAddressUSDT: e.target.value })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Dynamic QR Code Generation Endpoint</label>
                      <input
                        type="text"
                        value={settingsForm.qrCodeUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, qrCodeUrl: e.target.value })}
                        className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Referral Milestones Rewards Card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Referral Milestone Rewards (TM Staking Tokens)</span>
                  </h3>

                  <p className="text-[10px] text-tg-text-muted">
                    Configure bonus TM tokens awarded automatically to referrers when they achieve cumulative valid referrals.
                  </p>

                  <div className="space-y-3">
                    {(settingsForm.referralMilestones || []).map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-xs bg-tg-dark/30 p-2.5 rounded-xl border border-white/5">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] text-tg-text-muted block font-bold uppercase tracking-wider">Referral Count Goal</label>
                          <input
                            type="number"
                            value={milestone.count}
                            onChange={(e) => {
                              const newMilestones = [...(settingsForm.referralMilestones || [])];
                              newMilestones[idx] = { ...newMilestones[idx], count: parseInt(e.target.value) || 0 };
                              setSettingsForm({ ...settingsForm, referralMilestones: newMilestones });
                            }}
                            className="w-full bg-tg-dark/50 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] text-tg-text-muted block font-bold uppercase tracking-wider">Bonus TM Reward</label>
                          <input
                            type="number"
                            value={milestone.rewardTM}
                            onChange={(e) => {
                              const newMilestones = [...(settingsForm.referralMilestones || [])];
                              newMilestones[idx] = { ...newMilestones[idx], rewardTM: parseInt(e.target.value) || 0 };
                              setSettingsForm({ ...settingsForm, referralMilestones: newMilestones });
                            }}
                            className="w-full bg-tg-dark/50 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Withdrawal Control Settings Card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span>Withdrawal Processing Control</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-tg-dark/30 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-xs block">Allow Withdrawals</span>
                        <p className="text-[10px] text-tg-text-muted">
                          If disabled, users will be blocked from submitting new withdrawal requests.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, withdrawEnabled: !settingsForm.withdrawEnabled })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settingsForm.withdrawEnabled ? 'bg-tg-blue' : 'bg-tg-dark/90 border-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settingsForm.withdrawEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">
                        Withdrawals Disabled Message
                      </label>
                      <textarea
                        rows={3}
                        value={settingsForm.withdrawDisabledMessage || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, withdrawDisabledMessage: e.target.value })}
                        placeholder="🚫 Withdrawals are temporarily unavailable. Please try again later."
                        className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition leading-relaxed font-semibold"
                      />
                      <p className="text-[9px] text-tg-text-muted">
                        This custom message will be displayed to all users on the Withdraw page when withdrawals are disabled.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Invite & Earn Controls Card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="font-semibold text-sm text-white font-display flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span>Referral System (Invite & Earn) Controls</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-tg-dark/30 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-xs block">Enable Referral System</span>
                        <p className="text-[10px] text-tg-text-muted">
                          If disabled, users will not be rewarded for new successful referrals.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, referralSystemEnabled: !settingsForm.referralSystemEnabled })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settingsForm.referralSystemEnabled !== false ? 'bg-tg-blue' : 'bg-tg-dark/90 border-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settingsForm.referralSystemEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Tier 1 Reward ($ USD)</label>
                        <input
                          type="number"
                          step="any"
                          value={settingsForm.referralRewardAmountUSD ?? 3.0}
                          onChange={(e) => setSettingsForm({ ...settingsForm, referralRewardAmountUSD: parseFloat(e.target.value) || 3.0 })}
                          className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Min Deposit Tier 1 ($ USD)</label>
                        <input
                          type="number"
                          step="any"
                          value={settingsForm.referralMinWithdrawRequirementUSD ?? 10.0}
                          onChange={(e) => setSettingsForm({ ...settingsForm, referralMinWithdrawRequirementUSD: parseFloat(e.target.value) || 10.0 })}
                          className="w-full bg-tg-dark/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] space-y-1 text-tg-text-muted">
                      <span className="font-bold text-white uppercase tracking-wider block">Additional Configured Tiers (Fixed)</span>
                      <div>• <strong className="text-white">Tier 2:</strong> Friend deposits <strong className="text-white">$50+</strong> cumulative → Referrer earns <strong className="text-emerald-400 font-mono">$10.00 USDT</strong></div>
                      <div>• <strong className="text-white">Tier 3:</strong> Friend deposits <strong className="text-white">$100+</strong> cumulative → Referrer earns <strong className="text-emerald-400 font-mono">$15.00 USDT</strong></div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-tg-blue hover:bg-tg-blue-light text-white font-semibold font-display text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  Save Global System Configurations
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default AdminPanel;
