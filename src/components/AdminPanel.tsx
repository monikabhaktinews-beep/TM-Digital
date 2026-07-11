import React, { useState } from 'react';
import { 
  AppDatabase, UserProfile, Task, Channel, DepositRequest, 
  WithdrawalRequest, WithdrawalRule, SupportTicket, SystemSettings, Transaction 
} from '../types';
import { 
  getDB, saveDB, adminApproveDeposit, adminRejectDeposit, 
  adminApproveWithdrawal, adminRejectWithdrawal, adminModifyUserBalance, 
  adminSetUserStatus, adminReplyToTicket, adminCloseTicket 
} from '../lib/db';
import { 
  Shield, Key, Users, Coins, ArrowDownLeft, ArrowUpRight, BarChart2, 
  Settings, Clipboard, Sliders, CheckCircle2, XCircle, Search, Edit, 
  Plus, Trash2, Ban, Lock, Unlock, Eye, Send, ArrowRight, Wallet, Percent, 
  Info, RefreshCw, MessageSquare 
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'requests' | 'tasks' | 'support' | 'settings'>('dashboard');

  // Search & Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Manual Adjustments Form
  const [adjustTM, setAdjustTM] = useState('');
  const [adjustUSDT, setAdjustUSDT] = useState('');

  // CRUD Forms - Tasks & Channels
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Settings modification state
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...db.settings });

  // Ticket response state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === 'ffasarmy@gmail.com' && password === 'Arush600') {
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
  const totalUsers = db.users.length;
  // Let's assume users registered today (since 2026-07-11) are considered "Today's Users"
  const todayUsers = db.users.filter(u => u.registeredAt.startsWith('2026-07-11')).length + 1; // simulation fallback offset
  const onlineUsers = Math.max(2, Math.floor(Math.random() * 5) + 3); // Simulated live users

  const pendingDeposits = db.deposits.filter(d => d.status === 'Pending');
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'Pending');

  const totalRevenueUSDT = db.deposits
    .filter(d => d.status === 'Approved')
    .reduce((sum, d) => sum + d.amountUSDT, 0);

  const totalReferralsPaidUSDT = db.users.reduce((sum, u) => sum + u.referralEarningsUSDT, 0);

  const totalBonusClaimsUSDT = db.transactions
    .filter(tx => tx.type === 'DailyBonus')
    .reduce((sum, tx) => sum + tx.amountUSDT, 0);

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
                placeholder="ffasarmy@gmail.com"
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
            { id: 'requests', label: 'Pending Deposits & Claims', icon: Clipboard, badge: pendingDeposits.length + pendingWithdrawals.length },
            { id: 'tasks', label: 'Tasks & Channels', icon: Sliders },
            { id: 'support', label: 'Support Inbox', icon: MessageSquare, badge: db.tickets.filter(t => t.status === 'Open').length },
            { id: 'settings', label: 'Staking Settings', icon: Settings }
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
                      <span className="text-xs text-tg-blue-light block">@{selectedUser.username || 'NoUsername'}</span>
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
                  {db.users
                    .filter(u => {
                      const q = userSearchQuery.toLowerCase();
                      return u.firstName.toLowerCase().includes(q) || 
                             u.id.includes(q) || 
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
                            <span className="font-semibold text-xs text-white block">{user.firstName} {user.lastName || ''}</span>
                            <span className="text-[10px] text-tg-text-muted block">@{user.username || 'NoUsername'} (ID: {user.id})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-xs text-amber-400 block font-mono">{user.balanceTM} TM</span>
                            <span className="text-[9px] text-emerald-400 font-bold block">${user.balanceUSDT} USDT</span>
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
                          <span className="text-[9px] text-tg-text-muted uppercase font-bold block">USDT Receiving Address (TRC20 Only):</span>
                          <span className="text-xs font-mono text-tg-blue-light block select-all font-semibold pt-0.5">
                            {w.walletAddress}
                          </span>
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
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-semibold text-sm text-white font-display">Manage Join Channels ({db.channels.length})</h3>
                  <button
                    onClick={() => {
                      const name = prompt("Enter Channel Display Name:");
                      if (!name) return;
                      const userNm = prompt("Enter Channel Username (e.g. @tm_digital):");
                      const reward = parseInt(prompt("Enter Reward TM Amount:") || '100');
                      
                      const localDb = getDB();
                      localDb.channels.push({
                        id: `chan_${Date.now()}`,
                        name,
                        username: userNm || '@tg_channel',
                        inviteLink: `https://t.me/${(userNm || 'tg_channel').replace('@', '')}`,
                        rewardTM: reward,
                        isEnabled: true,
                        displayOrder: localDb.channels.length + 1,
                        isMandatory: true,
                        requiresVerification: true
                      });
                      saveDB(localDb);
                      onDbUpdate(localDb);
                      alert("Channel added!");
                    }}
                    className="bg-tg-blue hover:bg-tg-blue-light text-white text-[11px] px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Channel</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {db.channels.map((chan) => (
                    <div key={chan.id} className="p-3 bg-tg-dark/40 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">{chan.name}</span>
                        <span className="text-[10px] text-tg-text-muted block">Username: {chan.username} | Reward: {chan.rewardTM} TM</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newReward = parseInt(prompt("Enter new reward amount:", chan.rewardTM.toString()) || '');
                            if (isNaN(newReward)) return;
                            const localDb = getDB();
                            const matching = localDb.channels.find(c => c.id === chan.id);
                            if (matching) {
                              matching.rewardTM = newReward;
                              saveDB(localDb);
                              onDbUpdate(localDb);
                            }
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-tg-text-muted"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete channel?")) {
                              const localDb = getDB();
                              localDb.channels = localDb.channels.filter(c => c.id !== chan.id);
                              saveDB(localDb);
                              onDbUpdate(localDb);
                            }
                          }}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded border border-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks list (Editable) */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="font-semibold text-sm text-white font-display">Manage Mandatory & Secondary Tasks ({db.tasks.length})</h3>
                </div>

                <div className="space-y-2 text-xs">
                  {db.tasks.map((task) => (
                    <div key={task.id} className="p-3 bg-tg-dark/40 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">
                          {task.title} {task.isMandatory && <span className="text-amber-400 font-bold text-[9px] uppercase tracking-wider ml-1">Required</span>}
                        </span>
                        <p className="text-[10px] text-tg-text-muted max-w-sm truncate">{task.description}</p>
                        <span className="text-[10px] text-tg-blue-light">Reward: {task.rewardTM} TM ({task.type})</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newReward = parseInt(prompt("Enter new reward amount:", task.rewardTM.toString()) || '');
                            if (isNaN(newReward)) return;
                            const localDb = getDB();
                            const matching = localDb.tasks.find(t => t.id === task.id);
                            if (matching) {
                              matching.rewardTM = newReward;
                              saveDB(localDb);
                              onDbUpdate(localDb);
                            }
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-tg-text-muted"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const localDb = getDB();
                            const matching = localDb.tasks.find(t => t.id === task.id);
                            if (matching) {
                              matching.isEnabled = !matching.isEnabled;
                              saveDB(localDb);
                              onDbUpdate(localDb);
                              alert(`Task ${matching.isEnabled ? 'enabled' : 'disabled'}`);
                            }
                          }}
                          className={`p-1.5 text-[10px] font-bold rounded uppercase ${
                            task.isEnabled 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-white/5 text-tg-text-muted border border-white/5'
                          }`}
                        >
                          {task.isEnabled ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
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
                        onChange={(e) => setSettingsForm({ ...settingsForm, dailyBonusRateUSDT: parseFloat(e.target.value) || 0.05 })}
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
                      <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Company USDT TRC20 Wallet Address</label>
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
