import React, { useState, useEffect } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { 
  Copy, Check, Mail, Calendar, Coins, Gift, 
  Send, History, CheckCircle2, UserCheck, AlertCircle, Edit2,
  Zap, Sparkles, Clock, ArrowDownLeft, ArrowUpRight, ChevronRight, RefreshCw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { lookupRecipientByUid, executeUserTransfer } from '../lib/db';

interface ProfileTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab?: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [copiedUid, setCopiedUid] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(user.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!user.email);
  
  // Staking sync/refresh state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Settlement Live Countdown timer
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00');

  // Transfer Funds State
  const [targetUidStr, setTargetUidStr] = useState<string>('');
  const [transferAmountStr, setTransferAmountStr] = useState<string>('');
  const [transferCurrency, setTransferCurrency] = useState<'TM' | 'USDT'>('TM');
  const [recipientInfo, setRecipientInfo] = useState<{ success: boolean; name?: string; uid?: number; message?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Show transfer logs drawer or section
  const [showLogsSection, setShowLogsSection] = useState<boolean>(false);

  // Countdown timer calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Next local 12:01 AM (midnight + 1 minute)
      const next1201 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, 1, 0, 0
      );
      if (next1201.getTime() <= now.getTime()) {
        next1201.setDate(next1201.getDate() + 1);
      }
      const diffMs = next1201.getTime() - now.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync balance action
  const handleSyncBalance = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      if (showToast) {
        showToast("🔄 Blockchain nodes synced! Staking logs are active.", "success");
      }
    }, 1000);
  };

  // Copy UID helper
  const handleCopyUid = () => {
    navigator.clipboard.writeText(String(user.uid));
    setCopiedUid(true);
    if (showToast) {
      showToast(`📋 UID ${user.uid} copied to clipboard!`, 'success');
    }
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Save/Update Email
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = emailInput.trim();
    if (cleanedEmail && !cleanedEmail.includes('@')) {
      if (showToast) showToast('❌ Please enter a valid email address.', 'error');
      return;
    }
    
    const updatedDb = { ...db };
    const matchedUser = updatedDb.users.find(u => u.id === user.id);
    if (matchedUser) {
      matchedUser.email = cleanedEmail || undefined;
      user.email = cleanedEmail || undefined;
      onUpdateState(user, updatedDb);
      setIsEditingEmail(false);
      if (showToast) {
        showToast('📧 Profile email updated successfully.', 'success');
      }
    }
  };

  // Live lookup recipient info based on entered UID
  useEffect(() => {
    const numericUid = parseInt(targetUidStr);
    if (!isNaN(numericUid) && targetUidStr.trim().length >= 6) {
      setIsVerifying(true);
      setTransferError(null);
      const timer = setTimeout(() => {
        const res = lookupRecipientByUid(numericUid);
        setRecipientInfo(res);
        setIsVerifying(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setRecipientInfo(null);
      setTransferError(null);
    }
  }, [targetUidStr]);

  // Execute peer transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    const numericUid = parseInt(targetUidStr);
    if (isNaN(numericUid)) {
      setTransferError('Please enter a valid recipient UID.');
      return;
    }

    if (user.uid === numericUid) {
      setTransferError('You cannot transfer funds to your own UID.');
      return;
    }

    const amount = parseFloat(transferAmountStr);
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (transferCurrency === 'USDT') {
      if (user.balanceUSDT < amount) {
        setTransferError(`Insufficient USDT balance. You only have $${user.balanceUSDT.toLocaleString()} USDT.`);
        return;
      }
    } else {
      if (user.balanceTM < amount) {
        setTransferError(`Insufficient TM balance. You only have ${user.balanceTM.toLocaleString()} TM.`);
        return;
      }
    }

    if (!recipientInfo || !recipientInfo.success) {
      setTransferError('Please enter a valid, active recipient UID.');
      return;
    }

    setIsTransferring(true);

    setTimeout(() => {
      const result = executeUserTransfer(user.id, numericUid, amount, transferCurrency);
      setIsTransferring(false);
      
      if (result.success && result.db) {
        // Retrieve fresh state of user
        const refreshedUser = result.db.users.find(u => u.id === user.id);
        if (refreshedUser) {
          onUpdateState(refreshedUser, result.db);
        }
        setTransferSuccess(result.message);
        setTargetUidStr('');
        setTransferAmountStr('');
        setRecipientInfo(null);
        if (showToast) {
          showToast(`💸 Sent ${amount.toLocaleString()} ${transferCurrency} to UID ${numericUid}!`, 'success');
        }
      } else {
        setTransferError(result.message || 'Transfer execution failed.');
        if (showToast) {
          showToast(result.message || 'Transfer failed.', 'error');
        }
      }
    }, 1200);
  };

  // Staking plans / Tiers mapping
  const getReturnPercent = (balanceTM: number) => {
    if (balanceTM >= 3000000) return 14.0;
    if (balanceTM >= 300000) return 13.0;
    if (balanceTM >= 20000) return 12.0;
    return 11.0;
  };

  const dailyReturnPercent = getReturnPercent(user.balanceTM);
  const conversionRate = db.settings.conversionRate || 1000;
  const dailyEarnUSDT = ((user.balanceTM / conversionRate) * dailyReturnPercent) / 100;
  
  // Total TM Earned: combine holding TM and lifetime earnings in TM
  const totalTMEarned = user.balanceTM + Math.round((user.lifetimeEarningsUSDT || 0) * conversionRate);

  // Get user's personal transfer history
  const userTransfers = (db.transfers || []).filter(
    t => t.senderUid === user.uid || t.receiverUid === user.uid
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Approved Staking/Deposit Records
  const activeDeposits = db.deposits.filter(d => d.userId === user.id && d.status === 'Approved');

  // Format Join Date
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const handleScrollToLogs = () => {
    const el = document.getElementById('transfer_history_card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowLogsSection(prev => !prev);
    }
  };

  return (
    <div className="space-y-5 pb-28" id="profile_tab_container">
      
      {/* 1. WELCOME HEADER (Matches Screenshot 1 layout) */}
      <div className="flex items-center justify-between p-1" id="welcome_header">
        <div className="flex items-center gap-3">
          {/* TM logo branding */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-tg-blue to-[#1e40af] flex items-center justify-center border border-white/10 text-white font-black text-base tracking-tighter shadow-md shadow-tg-blue/20">
            TM
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-tg-text-muted">
              <span>Welcome to,</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-tg-blue font-display leading-none tracking-tight">TM Digital</span>
              <span className="text-[10px] text-tg-text-muted font-mono font-bold">— ID:{user.id}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  if (showToast) showToast("📋 Telegram ID copied to clipboard!", "success");
                }}
                className="text-tg-text-muted/60 hover:text-white transition cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-amber-400 font-mono font-bold">UID: {user.uid}</span>
              <button 
                onClick={handleCopyUid}
                className="text-amber-400/60 hover:text-amber-300 transition cursor-pointer"
                title="Copy UID"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
            </div>
            {user.username && (
              <p className="text-[10px] text-tg-text-muted mt-0.5 font-medium">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="relative shrink-0">
          <img 
            src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.firstName}`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-tg-dark rounded-full" />
        </div>
      </div>

      {/* 2. TOTAL TM EARNED CARD (White/light-blue gradient bento card from Screenshot 1) */}
      <div className="bg-gradient-to-br from-white via-[#f4f7fd] to-[#e6eefc] text-[#0f172a] shadow-xl shadow-black/15 p-5 rounded-3xl border border-white relative overflow-hidden" id="total_earned_card">
        {/* Subtle circular grid background effect */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-tg-blue/5 rounded-full pointer-events-none" />
        
        {/* Yellow/Orange Badge for "+100 prize" withdrawal reward */}
        <div className="absolute -top-1.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-orange-500/30 animate-pulse">
          +$100 prize
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Withdrawable Balance</span>
              <button 
                onClick={handleScrollToLogs}
                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                id="view_earned_history"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>History</span>
              </button>
            </div>
            
            {/* Massive numbers */}
            <div className="text-3xl font-black font-display text-slate-800 tracking-tight leading-none mt-2 flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-500 mr-0.5">$</span>
              {(user.balanceUSDT || 0).toFixed(3)} <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider ml-0.5">USDT</span>
            </div>
          </div>

          {/* Withdraw button */}
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('withdraw')}
            className="bg-tg-blue hover:bg-tg-blue-light text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-tg-blue/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1 focus:outline-none"
            id="withdraw_earned_btn"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>withdraw</span>
          </button>
        </div>
      </div>

      {/* 3. TM BALANCE BLUE CARD (Immersive card from Screenshot 1) */}
      <div className="bg-gradient-to-br from-[#1e6bf0] via-[#0051e0] to-[#0041b3] text-white shadow-xl shadow-tg-blue/15 p-5 rounded-3xl relative overflow-hidden" id="tm_balance_blue_card">
        {/* Subtle Watermark Logo */}
        <div className="absolute right-4 top-4 text-white/5 font-black text-6xl tracking-tighter select-none pointer-events-none uppercase">
          TM
        </div>

        <div className="flex items-center justify-between relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10">
            <Coins className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span>TM Balance</span>
          </span>
          <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
            Staking Active
          </span>
        </div>

        {/* Big Balance Number */}
        <div className="my-5 relative z-10 flex items-center justify-center gap-2.5">
          <span className="text-4xl font-extrabold font-mono tracking-tight text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
            {user.balanceTM.toLocaleString()}
          </span>
          
          <button 
            onClick={handleSyncBalance}
            className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none cursor-pointer ${isSyncing ? 'animate-spin' : ''}`}
            title="Sync balance"
          >
            <RefreshCw className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Three column stats at the bottom of the card */}
        <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/10 p-3 rounded-2xl relative z-10 backdrop-blur-sm" id="blue_card_stats_grid">
          <div className="text-center border-r border-white/10 last:border-none">
            <span className="text-[9px] text-white/60 block font-medium uppercase tracking-wider">Daily Earn</span>
            <span className="text-xs font-bold text-amber-300 block mt-0.5 truncate">
              ${dailyEarnUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className="text-center border-r border-white/10 last:border-none">
            <span className="text-[9px] text-white/60 block font-medium uppercase tracking-wider">Return</span>
            <span className="text-xs font-bold text-white block mt-0.5">
              {dailyReturnPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-center last:border-none">
            <span className="text-[9px] text-white/60 block font-medium uppercase tracking-wider">Settlement</span>
            <span className="text-xs font-mono font-bold text-emerald-300 block mt-0.5">
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* 4. TWO BENTO QUICK NAVIGATION CARDS */}
      <div className="grid grid-cols-2 gap-3.5" id="bento_nav_grid">
        {/* Buy AE -> Deposit TM */}
        <div 
          onClick={() => onNavigateToTab && onNavigateToTab('deposit')}
          className="glass-panel p-4.5 rounded-2xl border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer transition duration-300 flex items-center gap-3 active:scale-98 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl" />
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Zap className="w-4.5 h-4.5 fill-amber-500/20" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white">Deposit TM</h4>
            <span className="text-[9px] text-tg-text-muted font-medium mt-0.5 block">Higher returns</span>
          </div>
        </div>

        {/* Refer Friend -> Invite */}
        <div 
          onClick={() => onNavigateToTab && onNavigateToTab('referral')}
          className="glass-panel p-4.5 rounded-2xl border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer transition duration-300 flex items-center gap-3 active:scale-98 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-12 h-12 bg-orange-500/5 rounded-full blur-xl" />
          <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
            <Gift className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white">Refer Friend</h4>
            <span className="text-[9px] text-tg-text-muted font-medium mt-0.5 block font-bold text-amber-400">Earn $28</span>
          </div>
        </div>
      </div>

      {/* 5. WEEKEND SPECIAL BANNER */}
      <div 
        onClick={() => onNavigateToTab && onNavigateToTab('deposit')}
        className="bg-gradient-to-r from-[#031535] via-[#0a2c6d] to-[#113a8c] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-xl shadow-black/20 cursor-pointer group hover:border-tg-blue/30 transition duration-350"
        id="weekend_banner"
      >
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-tg-blue/10 rounded-full blur-2xl" />
        {/* Floating background chart decoration */}
        <div className="absolute right-4 bottom-0 opacity-15 pointer-events-none group-hover:scale-105 transition duration-500">
          <svg className="w-32 h-20 text-white" viewBox="0 0 100 50" fill="none">
            <path d="M5 45 Q 25 35 45 42 T 85 10 T 95 5" stroke="currentColor" strokeWidth="3" fill="none" />
            <circle cx="95" cy="5" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[9px] text-amber-400 font-black uppercase tracking-wider">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>Weekend Special</span>
            </span>
            <h3 className="font-extrabold text-white text-sm mt-2 max-w-[190px] leading-snug">
              Earn up to <span className="text-amber-400">11% ROI</span> in just 10 Days
            </h3>
            <p className="text-[9px] text-tg-text-muted mt-1">Staking starts automatically on deposit</p>
          </div>

          <button className="bg-white text-tg-dark px-3 py-2 rounded-xl text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer">
            <span>START NOW</span>
            <ChevronRight className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 6. MY TM RECORDS SECTION */}
      <div className="space-y-2.5" id="tm_records_section">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-tg-text-muted font-bold uppercase tracking-wider font-display flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-tg-blue" />
            <span>My TM Records</span>
          </span>
          <button 
            onClick={() => onNavigateToTab && onNavigateToTab('deposit')}
            className="text-[10px] text-tg-blue hover:text-tg-blue-light font-bold flex items-center gap-0.5"
          >
            <span>View More</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* List of active Approved deposits as nodes */}
        <div className="glass-panel rounded-2xl border border-white/5 p-4 space-y-3">
          {activeDeposits.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-tg-text-muted">No custom staking agreements found.</p>
              
              {/* Default active Starter Node that everyone gets to show the feature off! */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Starter TM Staking Node</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Active & Compounding</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white block">1,000 TM</span>
                  <span className="text-[9px] text-tg-text-muted block">Yield: 11.0% Daily ($ USDT)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeDeposits.map((deposit) => {
                const depositTMVal = Math.round(deposit.amountUSDT * conversionRate);
                const tierPercent = getReturnPercent(depositTMVal);
                return (
                  <div key={deposit.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">Mining Pool Tier {tierPercent === 11.0 ? '1' : tierPercent === 12.0 ? '2' : tierPercent === 13.0 ? '3' : '4'}</span>
                      <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Approved & Active</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{depositTMVal.toLocaleString()} TM</span>
                      <span className="text-[9px] text-tg-text-muted block">Yield: {tierPercent.toFixed(1)}% Daily ($ USDT)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. PROFILE INFO CARD (Join date & Email edit) */}
      <div className="glass-panel rounded-2xl p-4.5 border border-white/5 space-y-4" id="profile_details_card">
        <h4 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider font-display">Account Details</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="profile_details_grid">
          {/* Join Date */}
          <div className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-xl border border-white/5">
            <div className="p-2 bg-tg-blue/10 rounded-lg text-tg-blue">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-tg-text-muted uppercase tracking-wider font-semibold">Join Date</p>
              <p className="text-xs text-white font-medium">{formatDate(user.registeredAt)}</p>
            </div>
          </div>

          {/* Email Address */}
          <div className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-xl border border-white/5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-tg-text-muted uppercase tracking-wider font-semibold">Email Address</p>
              {isEditingEmail ? (
                <form onSubmit={handleSaveEmail} className="flex items-center gap-1 mt-0.5">
                  <input 
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email"
                    className="w-full bg-tg-dark/50 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-tg-blue font-sans"
                    id="email_input"
                  />
                  <button 
                    type="submit"
                    className="p-1 bg-tg-blue hover:bg-tg-blue/80 text-white rounded-lg cursor-pointer"
                    id="save_email_btn"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 group mt-0.5">
                  <p className="text-xs text-white font-medium truncate">{user.email || 'Click edit icon'}</p>
                  <button 
                    onClick={() => setIsEditingEmail(true)}
                    className="text-tg-text-muted hover:text-white transition-colors cursor-pointer"
                    id="edit_email_btn"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 8. INSTANT UID TRANSFER (Toggleable section for TM transfer) */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4" id="transfer_section_container">
        <button 
          onClick={() => setShowLogsSection(prev => !prev)}
          className="w-full flex items-center justify-between focus:outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tg-blue/10 rounded-xl text-tg-blue">
              <Send className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight uppercase">Instant UID Transfer</h3>
              <p className="text-[10px] text-tg-text-muted mt-0.5">Send TM instantly to another member by UID</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-tg-text-muted transition duration-200 ${showLogsSection ? 'rotate-90' : ''}`} />
        </button>

        {showLogsSection && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 space-y-4 border-t border-white/5"
          >
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Currency Selector (TM vs USDT) */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold">Currency</label>
                <div className="grid grid-cols-2 gap-2 bg-tg-dark/40 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferCurrency('TM');
                      setTransferError(null);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      transferCurrency === 'TM'
                        ? 'bg-tg-blue text-white shadow-sm shadow-tg-blue/25'
                        : 'text-tg-text-muted hover:text-white'
                    }`}
                  >
                    TM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferCurrency('USDT');
                      setTransferError(null);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      transferCurrency === 'USDT'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                        : 'text-tg-text-muted hover:text-white'
                    }`}
                  >
                    USDT
                  </button>
                </div>
              </div>

              {/* Target UID Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold">Recipient UID</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={targetUidStr}
                    onChange={(e) => setTargetUidStr(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Enter 6+ digit UID (e.g. 117303)"
                    className="w-full bg-tg-dark/50 border border-white/5 rounded-xl py-2.5 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-tg-blue font-mono placeholder:text-white/20 placeholder:font-sans"
                    disabled={isTransferring}
                    id="transfer_uid_field"
                  />
                  
                  {/* Spinning Verification Status */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isVerifying ? (
                      <div className="w-4 h-4 border-2 border-tg-blue border-t-transparent rounded-full animate-spin" />
                    ) : recipientInfo ? (
                      recipientInfo.success ? (
                        <UserCheck className="w-4.5 h-4.5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4.5 h-4.5 text-red-400" />
                      )
                    ) : null}
                  </div>
                </div>

                {/* Recipient Verification Feedback */}
                <AnimatePresence mode="wait">
                  {recipientInfo && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium ${
                        recipientInfo.success 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}
                      id="recipient_info_alert"
                    >
                      {recipientInfo.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Ready to send to: <strong>{recipientInfo.name}</strong> (UID: {recipientInfo.uid})</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{recipientInfo.message}</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Transfer Amount Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold">Amount ({transferCurrency})</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="any"
                    value={transferAmountStr}
                    onChange={(e) => setTransferAmountStr(e.target.value)}
                    placeholder="0"
                    className="w-full bg-tg-dark/50 border border-white/5 rounded-xl py-2.5 pl-4 pr-16 text-xs text-white focus:outline-none focus:border-tg-blue font-mono placeholder:text-white/20 placeholder:font-sans"
                    disabled={isTransferring}
                    id="transfer_amount_field"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-tg-text-muted font-bold">{transferCurrency}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-tg-text-muted font-semibold px-1">
                  <span>Available balance: {transferCurrency === 'USDT' ? `$${user.balanceUSDT.toLocaleString()}` : `${user.balanceTM.toLocaleString()} TM`}</span>
                  {parseFloat(transferAmountStr) > 0 && (
                    <span className="text-amber-400">Fee: 0 {transferCurrency} (FREE)</span>
                  )}
                </div>
              </div>

              {/* Validation Feedback messages */}
              {transferError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-start gap-2 animate-pulse" id="transfer_error">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-xs text-green-400 flex items-start gap-2" id="transfer_success">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isTransferring || !targetUidStr || !transferAmountStr || isVerifying || (recipientInfo && !recipientInfo.success)}
                className="w-full py-3 bg-tg-blue disabled:bg-white/5 text-white disabled:text-tg-text-muted/40 font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-tg-blue/10 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
                id="execute_transfer_btn"
              >
                {isTransferring ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Transfer Funds Instantly</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* 9. TRANSFER LOGS HISTORY CARD */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4" id="transfer_history_card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-xl text-tg-text-muted">
            <History className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight uppercase">Transfer & Staking Logs</h3>
            <p className="text-[10px] text-tg-text-muted mt-0.5 font-medium">History of transaction receipts by UID</p>
          </div>
        </div>

        {/* History Scroll area */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1" id="transfer_history_scroll">
          {userTransfers.length === 0 ? (
            <div className="text-center py-6 text-xs text-tg-text-muted">
              No peer transfers recorded yet.
            </div>
          ) : (
            userTransfers.map((tx) => {
              const isSender = tx.senderUid === user.uid;
              return (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg text-[10px] font-black ${
                      isSender ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {isSender ? 'OUT' : 'IN'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isSender ? `To UID: ${tx.receiverUid}` : `From UID: ${tx.senderUid}`}
                      </p>
                      <p className="text-[9px] text-tg-text-muted">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black ${isSender ? 'text-red-400' : 'text-green-400'}`}>
                      {isSender ? '-' : '+'}{tx.currency === 'USDT' ? (tx.amountUSDT || 0).toLocaleString() : (tx.amountTM !== undefined ? tx.amountTM : (tx.amountUSDT || 0)).toLocaleString()} {tx.currency || 'TM'}
                    </p>
                    <p className="text-[8px] uppercase tracking-wider text-green-400 font-bold">
                      {tx.status}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfileTab;
