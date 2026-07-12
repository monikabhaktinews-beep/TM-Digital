import React, { useState } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { submitDeposit } from '../lib/db';
import { Copy, QrCode, CheckCircle, AlertCircle } from 'lucide-react';

interface DepositTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const DepositTab: React.FC<DepositTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab,
  showToast
}) => {
  const [amount, setAmount] = useState<string>('');
  const [txid, setTxid] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(db.settings.walletAddressUSDT);
    setIsCopied(true);
    if (showToast) {
      showToast("USDT BEP20 address copied to clipboard!", "success");
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg("Please enter a valid deposit amount in USDT.");
      if (showToast) showToast("Invalid deposit amount.", "error");
      return;
    }

    const minDeposit = db.settings.depositMinUSDT ?? 1.0;
    if (amtNum < minDeposit) {
      setErrorMsg(`Minimum deposit amount is ${minDeposit} USDT.`);
      if (showToast) showToast(`Minimum deposit is ${minDeposit} USDT.`, "error");
      return;
    }

    if (!txid.trim()) {
      setErrorMsg("Transaction Hash (TXID) is required to verify the blockchain transfer.");
      if (showToast) showToast("Transaction TXID hash is required.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = submitDeposit(user.id, amtNum, txid.trim(), "");
      setLoading(false);
      
      if (res.success) {
        onUpdateState(res.user, res.db);
        if (showToast) {
          showToast("Deposit submitted! Admin will audit the TXID shortly.", "success");
        } else {
          setSuccessMsg(res.message);
        }
        setAmount('');
        setTxid('');
      } else {
        setErrorMsg(res.message);
        if (showToast) showToast(res.message, "error");
      }
    }, 1500);
  };

  // Filter current user's deposit request history
  const depositHistory = db.deposits.filter(d => d.userId === user.id);

  return (
    <div className="space-y-5">
      {/* USDT QR and Copy section */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-4">
        <div>
          <h3 className="font-semibold text-base text-white font-display">Deposit USDT (BEP20 Network Only)</h3>
          <p className="text-xs text-tg-text-muted mt-1 max-w-sm">
            Transfer USDT from any external exchange or wallet to our verified account below. Ensure you select the Binance Smart Chain (BEP20 / BSC) network.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-xl border border-white/10 glow-blue">
          <img 
            src={db.settings.qrCodeUrl} 
            alt="Deposit QR Code" 
            className="w-40 h-40 object-contain" 
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Wallet address copy widget */}
        <div className="w-full space-y-1">
          <span className="text-[10px] text-tg-text-muted font-bold uppercase tracking-wider block">Your Deposit Wallet Address:</span>
          <div className="flex items-center gap-1.5 bg-tg-dark/50 border border-white/5 rounded-xl p-2.5 max-w-md mx-auto">
            <span className="text-xs font-mono select-all truncate text-tg-blue-light font-semibold block flex-1">
              {db.settings.walletAddressUSDT}
            </span>
            <button
              onClick={handleCopyAddress}
              className={`p-1.5 rounded-lg transition ${
                isCopied 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-white/5 hover:bg-white/10 text-tg-text-muted'
              }`}
            >
              {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {isCopied && <span className="text-[10px] text-emerald-400 font-medium">Copied address to clipboard!</span>}
        </div>

        {/* Conversion Rate Alert */}
        <div className="bg-tg-blue/10 border border-tg-blue/20 rounded-xl p-3 w-full text-left text-xs text-tg-blue-light flex items-start gap-2 max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-white">Conversion Rate: 1 USDT = {db.settings.conversionRate} TM</span>
            Deposits are approved manually. On approval, TM staking balances are instantly credited based on your deposit amount.
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-white font-display">Submit Deposit Notification</h4>
          <p className="text-[10px] text-tg-text-muted">Fill out the blockchain transfer details below for approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">USDT Amount Transferred</label>
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
            <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Transaction Hash (TXID / TxHash)</label>
            <input
              type="text"
              placeholder="Enter full 64-character transaction hash"
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-mono"
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
            {loading ? 'Submitting...' : 'Submit Deposit Notification'}
          </button>
        </form>
      </div>

      {/* Local History */}
      <div className="space-y-2.5">
        <h4 className="text-xs text-tg-text-muted font-bold uppercase tracking-wider px-1 font-display">Your Deposit Submissions</h4>

        <div className="glass-panel rounded-xl border border-white/5 divide-y divide-white/5">
          {depositHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-tg-text-muted">
              You haven't submitted any deposit requests yet.
            </div>
          ) : (
            depositHistory.map((d) => (
              <div key={d.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-white block">Deposited {d.amountUSDT} USDT</span>
                  <span className="text-[9px] font-mono text-tg-text-muted block truncate max-w-xs">
                    TXID: {d.txid.substring(0, 15)}...{d.txid.slice(-15)}
                  </span>
                  <span className="text-[9px] text-tg-text-muted block">
                    {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  d.status === 'Approved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : d.status === 'Rejected' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {d.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default DepositTab;
