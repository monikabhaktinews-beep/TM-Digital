import React, { useState, useEffect } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { 
  User, Copy, Check, Mail, Calendar, Coins, DollarSign, Gift, 
  ArrowRight, Send, History, CheckCircle2, UserCheck, AlertCircle, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { lookupRecipientByUid, executeUserTransfer, getDB, saveDB } from '../lib/db';

interface ProfileTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  db,
  onUpdateState,
  showToast
}) => {
  const [copiedUid, setCopiedUid] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(user.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!user.email);
  
  // Transfer Funds State
  const [targetUidStr, setTargetUidStr] = useState<string>('');
  const [transferAmountStr, setTransferAmountStr] = useState<string>('');
  const [recipientInfo, setRecipientInfo] = useState<{ success: boolean; name?: string; uid?: number; message?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

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

    if (user.balanceTM < amount) {
      setTransferError(`Insufficient TM balance. You only have ${user.balanceTM.toLocaleString()} TM.`);
      return;
    }

    if (!recipientInfo || !recipientInfo.success) {
      setTransferError('Please enter a valid, active recipient UID.');
      return;
    }

    setIsTransferring(true);

    setTimeout(() => {
      const result = executeUserTransfer(user.id, numericUid, amount);
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
          showToast(`💸 Sent ${amount.toLocaleString()} TM to UID ${numericUid}!`, 'success');
        }
      } else {
        setTransferError(result.message || 'Transfer execution failed.');
        if (showToast) {
          showToast(result.message || 'Transfer failed.', 'error');
        }
      }
    }, 1200);
  };

  // Get user's personal transfer history
  const userTransfers = (db.transfers || []).filter(
    t => t.senderUid === user.uid || t.receiverUid === user.uid
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  return (
    <div className="space-y-6 pb-24" id="profile_tab_container">
      {/* Upper Profile Overview Card */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/10" id="profile_card">
        {/* Ambient glow decoration */}
        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-tg-blue/20 rounded-full blur-2xl" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          {/* Avatar Picture */}
          <div className="relative">
            <img 
              src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.firstName}`} 
              alt="Avatar" 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              referrerPolicy="no-referrer"
              id="profile_avatar"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-tg-dark rounded-full shadow" />
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              {user.firstName} {user.lastName || ''}
            </h2>
            <p className="text-sm text-tg-text-muted">
              {user.username ? `@${user.username}` : 'No Telegram username'}
            </p>
            
            {/* UID Section */}
            <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-xs font-mono">
              <span className="text-tg-text-muted">UID:</span>
              <span className="text-tg-blue font-bold tracking-wider">{user.uid}</span>
              <button 
                onClick={handleCopyUid}
                className="ml-1 text-tg-text-muted hover:text-white transition-colors focus:outline-none cursor-pointer"
                title="Copy UID"
                id="copy_uid_btn"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5" id="profile_details_grid">
          {/* Join Date */}
          <div className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-2xl">
            <div className="p-2 bg-tg-blue/10 rounded-xl text-tg-blue">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-tg-text-muted uppercase tracking-wider font-semibold">Join Date</p>
              <p className="text-xs text-white font-medium">{formatDate(user.registeredAt)}</p>
            </div>
          </div>

          {/* Email Address */}
          <div className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-2xl relative">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-tg-text-muted uppercase tracking-wider font-semibold">Email Address</p>
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
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 group mt-0.5">
                  <p className="text-xs text-white font-medium truncate">{user.email}</p>
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

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-4" id="financial_cards_container">
        {/* Wallet Balance Card */}
        <div className="glass-panel rounded-3xl p-4 border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-[-10px] left-[-10px] w-14 h-14 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-tg-text-muted font-medium">Wallet Balance</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white leading-none">${user.balanceUSDT.toFixed(2)}</div>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">USDT Balance</p>
          </div>
        </div>

        {/* Total Referral Rewards Card */}
        <div className="glass-panel rounded-3xl p-4 border border-white/10 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-[-10px] left-[-10px] w-14 h-14 bg-tg-blue/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-tg-text-muted font-medium">Referral Rewards</span>
            <div className="p-1.5 bg-tg-blue/10 text-tg-blue rounded-lg">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white leading-none">${(user.referralEarningsUSDT || 0).toFixed(2)}</div>
            <p className="text-[10px] text-tg-blue font-semibold mt-1">Total Fixed Earnings</p>
          </div>
        </div>
      </div>

      {/* User-to-User Transfer System Container */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4" id="transfer_section_container">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tg-blue/10 rounded-xl text-tg-blue">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Instant UID Transfer</h3>
            <p className="text-xs text-tg-text-muted">Send TM instantly to another active member by UID</p>
          </div>
        </div>

        <form onSubmit={handleTransferSubmit} className="space-y-4 pt-1">
          {/* Target UID Field */}
          <div className="space-y-1.5">
            <label className="text-xs text-tg-text-muted font-semibold">Recipient UID</label>
            <div className="relative">
              <input 
                type="text"
                value={targetUidStr}
                onChange={(e) => setTargetUidStr(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Enter 6+ digit UID (e.g. 100003)"
                className="w-full bg-tg-dark/50 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-tg-blue font-mono placeholder:text-white/20 placeholder:font-sans"
                disabled={isTransferring}
                id="transfer_uid_field"
              />
              
              {/* Spinning Verification Status */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-tg-blue border-t-transparent rounded-full animate-spin" />
                ) : recipientInfo ? (
                  recipientInfo.success ? (
                    <UserCheck className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
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
            <label className="text-xs text-tg-text-muted font-semibold">Amount (TM)</label>
            <div className="relative">
              <input 
                type="number"
                step="any"
                value={transferAmountStr}
                onChange={(e) => setTransferAmountStr(e.target.value)}
                placeholder="0"
                className="w-full bg-tg-dark/50 border border-white/10 rounded-2xl py-3 pl-4 pr-16 text-sm text-white focus:outline-none focus:border-tg-blue font-mono placeholder:text-white/20 placeholder:font-sans"
                disabled={isTransferring}
                id="transfer_amount_field"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-tg-text-muted font-bold">TM</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-tg-text-muted font-semibold px-1">
              <span>Available balance: {user.balanceTM.toLocaleString()} TM</span>
              {parseFloat(transferAmountStr) > 0 && (
                <span className="text-amber-400">Fee: 0 TM (FREE)</span>
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
            className="w-full py-3.5 bg-tg-blue disabled:bg-white/5 text-white disabled:text-tg-text-muted/40 font-bold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-tg-blue/10 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
            id="execute_transfer_btn"
          >
            {isTransferring ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transfer Funds Instantly</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Transfer Logs History Card */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-4" id="transfer_history_card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-xl text-tg-text-muted">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Transfer Logs</h3>
            <p className="text-xs text-tg-text-muted">History of funds sent or received by UID</p>
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
                  className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-xs font-bold ${
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
                      {isSender ? '-' : '+'}{(tx.amountTM !== undefined ? tx.amountTM : (tx.amountUSDT || 0)).toLocaleString()} TM
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
