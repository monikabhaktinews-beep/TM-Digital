import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { submitWithdrawal, getLifetimeApprovedDeposits } from '../lib/db';
import { ShieldAlert, AlertCircle, CheckCircle, ArrowUpRight, HelpCircle, Wallet } from 'lucide-react';

interface WithdrawTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
}

export const WithdrawTab: React.FC<WithdrawTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab
}) => {
  const [amount, setAmount] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute lifetime approved deposits
  const lifetimeDeposits = getLifetimeApprovedDeposits(user.id, db);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (amtNum < 0.1) {
      setErrorMsg("Minimum withdrawal amount is 0.1 USDT.");
      return;
    }

    if (!walletAddress.trim()) {
      setErrorMsg("Please enter your receiving USDT TRC20 Wallet Address.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = submitWithdrawal(user.id, amtNum, walletAddress.trim());
      setLoading(false);
      
      if (res.success) {
        onUpdateState(res.user, res.db);
        setSuccessMsg(res.message);
        setAmount('');
        setWalletAddress('');
      } else {
        setErrorMsg(res.message);
      }
    }, 1500);
  };

  // User's withdrawal requests
  const withdrawalHistory = db.withdrawals.filter(w => w.userId === user.id);

  return (
    <div className="space-y-5">
      {/* Wallet Balance Card */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-tg-surface via-tg-dark/40 to-tg-surface flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-tg-text-muted text-xs">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider">Withdrawable USDT Balance</span>
          </div>
          <span className="text-3xl font-extrabold font-display text-emerald-400">
            ${user.balanceUSDT.toFixed(4)} <span className="text-xs text-tg-text-muted font-sans font-semibold">USDT</span>
          </span>
          <p className="text-[10px] text-tg-text-muted leading-relaxed">
            Earnings generated from daily holding staking, completed optional tasks, and referral commission rewards.
          </p>
        </div>

        <div className="bg-tg-dark/60 border border-white/5 rounded-xl p-3 space-y-1 md:w-52 shrink-0">
          <span className="text-[9px] text-tg-text-muted uppercase tracking-wider font-bold block">Approved Deposit History</span>
          <span className="text-lg font-bold font-mono text-white">${lifetimeDeposits.toFixed(2)} USDT</span>
          <p className="text-[9px] text-tg-text-muted">
            Used to check withdrawal rules eligibility. (Balance cannot be used).
          </p>
        </div>
      </div>

      {/* Rules Eligibility Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
        <div>
          <h4 className="font-semibold text-sm text-white font-display flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-tg-blue" />
            <span>Anti-Fraud Withdrawal Rules</span>
          </h4>
          <p className="text-[10px] text-tg-text-muted leading-relaxed">
            To maintain database health and prevent bot abuse, withdrawal tiers are unlocked based strictly on your <strong className="text-tg-blue-light">Lifetime Approved Deposit History</strong>.
          </p>
        </div>

        <div className="space-y-2">
          {db.withdrawalRules.map((rule) => {
            const isEligible = lifetimeDeposits >= rule.requiredLifetimeDepositUSDT;
            return (
              <div 
                key={rule.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  isEligible 
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                    : 'bg-tg-dark/40 border-white/5 text-tg-text-muted'
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`font-semibold ${isEligible ? 'text-white' : 'text-tg-text-muted'}`}>
                    Withdraw {rule.minAmountUSDT} – {rule.maxAmountUSDT} USDT
                  </span>
                  <p className="text-[10px] opacity-80">
                    Requires lifetime deposit history of <strong className={isEligible ? 'text-emerald-400' : 'text-tg-text'}>${rule.requiredLifetimeDepositUSDT.toFixed(2)} USDT</strong>
                  </p>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  isEligible 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-white/5 text-tg-text-muted border border-white/5'
                }`}>
                  {isEligible ? 'Eligible' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Form */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-white font-display">Request Instant Withdrawal</h4>
          <p className="text-[10px] text-tg-text-muted">Requests are processed manually within 1-12 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT Withdrawal Amount</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition font-mono font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Your Receiving USDT Wallet Address (TRC20 Only)</label>
            <input
              type="text"
              placeholder="Enter your USDT TRC20 Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-mono font-bold"
              required
            />
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tg-blue hover:bg-tg-blue-light text-white font-semibold font-display text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? 'Processing...' : 'Submit Withdrawal Request'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="space-y-2.5">
        <h4 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 font-display">Withdrawal History</h4>

        <div className="glass-panel rounded-xl border border-white/5 divide-y divide-white/5">
          {withdrawalHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-tg-text-muted">
              No withdrawals submitted yet in this account.
            </div>
          ) : (
            withdrawalHistory.map((w) => (
              <div key={w.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-white block">Withdrawal of {w.amountUSDT} USDT</span>
                  <span className="text-[9px] font-mono text-tg-text-muted block truncate max-w-xs">
                    To Address: {w.walletAddress}
                  </span>
                  <span className="text-[9px] text-tg-text-muted block">
                    {new Date(w.createdAt).toLocaleString()}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  w.status === 'Approved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : w.status === 'Rejected' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {w.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default WithdrawTab;
