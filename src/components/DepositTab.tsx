import React, { useState, useRef } from 'react';
import { UserProfile, AppDatabase } from '../types';
import { submitDeposit } from '../lib/db';
import { Copy, QrCode, FileText, Upload, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DepositTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DepositTab: React.FC<DepositTabProps> = ({
  user,
  db,
  onUpdateState,
  onNavigateToTab
}) => {
  const [amount, setAmount] = useState<string>('');
  const [txid, setTxid] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(db.settings.walletAddressUSDT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-generate a beautiful mock receipt to make testing seamless
  const handleGenerateMockReceipt = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid deposit amount (e.g. 1 USDT) first.");
      return;
    }
    
    const mockTx = txid.trim() || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`;
    if (!txid) setTxid(`0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`);

    // Draw a digital receipt on HTML Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 500);
      grad.addColorStop(0, '#0e1621');
      grad.addColorStop(1, '#17212b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 500);

      // Rounded border lines
      ctx.strokeStyle = '#2481cc';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 380, 480);

      // Header logo/title
      ctx.fillStyle = '#2481cc';
      ctx.font = 'bold 24px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText('TM DIGITAL NETWORK', 200, 50);

      // Success Badge
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(200, 120, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Inter"';
      ctx.fillText('✓', 200, 132);

      // Receipt details
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px "Inter"';
      ctx.fillText('Transaction Confirmed', 200, 185);

      ctx.fillStyle = '#708499';
      ctx.font = '12px "Inter"';
      ctx.fillText('TRC20 Blockchain Transfer', 200, 205);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 230);
      ctx.lineTo(360, 230);
      ctx.stroke();

      // Details block
      ctx.textAlign = 'left';
      ctx.font = '13px "Inter"';

      // Amount Row
      ctx.fillStyle = '#708499';
      ctx.fillText('Transfer Amount:', 50, 260);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px "JetBrains Mono"';
      ctx.fillText(`${Number(amount).toFixed(2)} USDT`, 210, 260);

      // Status Row
      ctx.fillStyle = '#708499';
      ctx.font = '13px "Inter"';
      ctx.fillText('Payment Status:', 50, 295);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 13px "Inter"';
      ctx.fillText('SUCCESS', 210, 295);

      // Recipient Wallet Row
      ctx.fillStyle = '#708499';
      ctx.font = '13px "Inter"';
      ctx.fillText('To USDT Wallet:', 50, 330);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(db.settings.walletAddressUSDT.substring(0, 26) + '...', 210, 330);

      // TXID Row
      ctx.fillStyle = '#708499';
      ctx.font = '13px "Inter"';
      ctx.fillText('Transaction ID:', 50, 365);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(mockTx.substring(0, 22) + '...', 210, 365);

      // Date Row
      ctx.fillStyle = '#708499';
      ctx.font = '13px "Inter"';
      ctx.fillText('Timestamp:', 50, 400);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Inter"';
      ctx.fillText(new Date().toLocaleString(), 210, 400);

      // Footer brand stamp
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.font = 'bold 36px "Space Grotesk"';
      ctx.fillText('VERIFIED', 200, 450);
      
      const imgBase64 = canvas.toDataURL('image/png');
      setScreenshotUrl(imgBase64);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg("Please enter a valid deposit amount in USDT.");
      return;
    }

    if (!txid.trim()) {
      setErrorMsg("Transaction Hash (TXID) is required to verify the blockchain transfer.");
      return;
    }

    if (!screenshotUrl) {
      setErrorMsg("Please upload a deposit receipt screenshot or click 'Generate Demo Mock Receipt'.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = submitDeposit(user.id, amtNum, txid.trim(), screenshotUrl);
      setLoading(false);
      
      if (res.success) {
        onUpdateState(res.user, res.db);
        setSuccessMsg(res.message);
        setAmount('');
        setTxid('');
        setScreenshotUrl('');
      } else {
        setErrorMsg(res.message);
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
          <h3 className="font-semibold text-base text-white font-display">Deposit USDT (TRC20 Network Only)</h3>
          <p className="text-xs text-tg-text-muted mt-1 max-w-sm">
            Transfer USDT from any external exchange or wallet to our verified account below. Ensure you select the TRON (TRC20) network.
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

          {/* Screenshot file upload / generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Transfer Screenshot/Receipt</label>
              
              <button
                type="button"
                onClick={handleGenerateMockReceipt}
                className="text-[10px] text-tg-blue hover:text-tg-blue-light font-bold flex items-center gap-1 bg-tg-blue/10 px-2 py-1 rounded transition"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Generate Demo Mock Receipt</span>
              </button>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/5 hover:border-tg-blue/30 rounded-xl p-5 text-center cursor-pointer transition bg-tg-dark/20 flex flex-col items-center gap-1.5 relative overflow-hidden group min-h-32 justify-center"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              
              {screenshotUrl ? (
                <div className="absolute inset-0 bg-tg-dark/90 flex flex-col items-center justify-center p-3 text-xs gap-1.5 group-hover:opacity-100 transition-opacity">
                  <img 
                    src={screenshotUrl} 
                    alt="Receipt Screenshot" 
                    className="w-20 h-20 object-cover rounded border border-white/10 mb-1" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Receipt Attached (Tap to change)</span>
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-tg-text-muted group-hover:text-tg-blue transition-colors" />
                  <span className="text-xs font-semibold text-white">Upload Screenshot image</span>
                  <span className="text-[10px] text-tg-text-muted">Supports JPG, PNG files. Max 5MB.</span>
                </>
              )}
            </div>
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
