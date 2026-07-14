import React, { useState, useEffect } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { Gift, Check, AlertCircle, Loader2, Sparkles, ArrowDownToLine, ReceiptText } from 'lucide-react';
import { motion } from 'motion/react';

interface GiftCodeTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'pending') => void;
}

export const GiftCodeTab: React.FC<GiftCodeTabProps> = ({
  user,
  db,
  onUpdateState,
  showToast
}) => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter out transactions related to claiming gift codes for this user
  const claimHistory = (db.transactions || [])
    .filter(tx => tx && tx.userId === user.id && typeof tx.description === 'string' && tx.description.includes('Gift Code Claimed'))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage({ text: '⚠️ Please enter a gift code first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/gift-code/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          code: code.trim()
        })
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse claim response as JSON:', responseText);
        throw new Error(`Server returned a non-JSON response (Status ${response.status}).`);
      }

      if (!response.ok || !data.success) {
        const errMsg = data.error || data.message || 'Failed to claim gift code.';
        setMessage({ text: errMsg, type: 'error' });
        if (showToast) {
          showToast(errMsg, 'error');
        }
      } else {
        // Success
        setMessage({ text: data.message, type: 'success' });
        if (showToast) {
          showToast(data.message, 'success');
        }
        setCode('');
        // Update state across app
        onUpdateState(data.user, data.db);
      }
    } catch (err: any) {
      console.error('[Gift Code Claim Error]', err);
      const errMsg = err.message || 'Server or connection error. Please try again.';
      setMessage({ text: `❌ ${errMsg}`, type: 'error' });
      if (showToast) {
        showToast(errMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in" id="gift_code_tab_container">
      {/* Top Banner Card */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/10 text-center" id="gift_code_top_card">
        {/* Decorative background glow */}
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-purple-400 mx-auto mb-2 shadow-inner border border-purple-500/10">
            <Gift className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">🎁 Claim Gift Code</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Enter a valid gift code below to instantly credit free USDT directly to your wallet balance!
          </p>
        </div>
      </div>

      {/* Claim Form Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden" id="gift_code_form_card">
        <form onSubmit={handleClaim} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="giftCodeInput" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Enter Gift Code
            </label>
            <div className="relative">
              <input
                id="giftCodeInput"
                type="text"
                placeholder="TM-GFT-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white text-center font-mono font-bold text-lg uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
              />
            </div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span className="text-sm font-medium leading-relaxed">{message.text}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 disabled:from-purple-800/40 disabled:to-pink-800/40 disabled:text-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base border border-purple-400/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validating Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>Claim Reward Instantly</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Claim History Feed */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10" id="gift_code_history_card">
        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
          <ReceiptText className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white">My Claim History</h3>
          <span className="ml-auto text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
            {claimHistory.length} claimed
          </span>
        </div>

        {claimHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 space-y-2">
            <ArrowDownToLine className="w-8 h-8 mx-auto text-gray-600 stroke-[1.5]" />
            <p className="text-sm">You haven't claimed any gift codes yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
             {claimHistory.map((tx) => {
               const desc = typeof tx.description === 'string' ? tx.description.replace('Gift Code Claimed: ', '') : 'Gift Reward';
               const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString(undefined, {
                 dateStyle: 'medium',
                 timeStyle: 'short'
               }) : 'N/A';
               const amount = typeof tx.amountUSDT === 'number' ? tx.amountUSDT : Number(tx.amountUSDT || 0);
               return (
                 <div
                   key={tx.id || Math.random().toString()}
                   className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3"
                 >
                   <div className="space-y-1">
                     <div className="text-sm font-mono font-bold text-white">
                       {desc}
                     </div>
                     <div className="text-xs text-gray-500">
                       {dateStr}
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm font-black text-emerald-400">
                       +${amount.toFixed(2)} USDT
                     </div>
                     <div className="text-[10px] text-emerald-500/70 font-semibold uppercase tracking-wider bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 inline-block">
                       Success
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
};
