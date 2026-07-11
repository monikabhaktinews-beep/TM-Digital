import React, { useState } from 'react';
import { UserProfile, SupportTicket, AppDatabase } from '../types';
import { submitSupportTicket, replyToTicket } from '../lib/db';
import { HelpCircle, Plus, Send, ChevronRight, MessageSquare, Check, ArrowLeft, Bot, Sparkles } from 'lucide-react';

interface SupportTabProps {
  user: UserProfile;
  db: AppDatabase;
  onUpdateState: (user: UserProfile, db: AppDatabase) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
  user,
  db,
  onUpdateState
}) => {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Create ticket fields
  const [subject, setSubject] = useState<string>('');
  const [initMessage, setInitMessage] = useState<string>('');
  
  // Chat fields
  const [replyText, setReplyText] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);

  // Filter tickets for this user
  const userTickets = db.tickets.filter(t => t.userId === user.id);
  const activeTicket = db.tickets.find(t => t.id === activeTicketId);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initMessage.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const res = submitSupportTicket(user.id, subject.trim(), initMessage.trim());
      setLoading(false);
      
      if (res.success) {
        onUpdateState(user, res.db);
        setSubject('');
        setInitMessage('');
        setIsCreating(false);
        // Automatically open the newly created ticket
        if (res.tickets.length > 0) {
          const sorted = [...res.tickets].sort((a, b) => b.id.localeCompare(a.id));
          setActiveTicketId(sorted[0].id);
        }
      } else {
        alert(res.message);
      }
    }, 1000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyText.trim()) return;

    const res = replyToTicket(user.id, activeTicketId, replyText.trim());
    if (res.success) {
      onUpdateState(user, res.db);
      setReplyText('');

      // TRIGGER MOCK ADMIN REPLY SIMULATOR
      // This is a premium addition to show that messages can receive responses!
      setTimeout(() => {
        const adminResponses = [
          "Thank you for contacting TM Digital support. We are verifying your account and will update you shortly.",
          "Our tech team is currently reviewing this transaction hash. It will be resolved within 30 minutes.",
          "We have verified your wallet details. Please let us know if there is anything else we can help with!",
          "Hello! Your request has been forwarded to our financial desk. Thank you for your patience."
        ];
        const randomReply = adminResponses[Math.floor(Math.random() * adminResponses.length)];
        
        // Directly inject into db state
        const localDb = { ...res.db };
        const tick = localDb.tickets.find(t => t.id === activeTicketId);
        if (tick) {
          tick.messages.push({
            sender: 'admin',
            text: `[Auto-Simulator]: ${randomReply}`,
            createdAt: new Date().toISOString()
          });
          tick.status = 'Replied';
          // Save and notify
          localStorage.setItem('tm_digital_database_v1', JSON.stringify(localDb));
          onUpdateState(user, localDb);
        }
      }, 2500);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button when inside a chat */}
      {activeTicket && (
        <button
          onClick={() => setActiveTicketId(null)}
          className="flex items-center gap-1 text-xs text-tg-blue hover:text-tg-blue-light transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to support tickets</span>
        </button>
      )}

      {activeTicket ? (
        /* Chat Interface */
        <div className="glass-panel rounded-2xl border border-white/5 flex flex-col h-[450px] overflow-hidden">
          {/* Header */}
          <div className="bg-tg-surface-light border-b border-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-tg-text-muted font-bold uppercase block">Support Chat Ticket</span>
              <h4 className="text-sm font-bold text-white font-display truncate max-w-xs">{activeTicket.subject}</h4>
            </div>

            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
              activeTicket.status === 'Closed' 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : activeTicket.status === 'Replied' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {activeTicket.status}
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-tg-dark/25">
            {activeTicket.messages.map((m, idx) => {
              const isAdmin = m.sender === 'admin';
              
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${isAdmin ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isAdmin 
                      ? 'bg-tg-surface-light border border-white/5 text-tg-text rounded-tl-none' 
                      : 'bg-tg-blue text-white rounded-tr-none'
                  }`}>
                    {isAdmin && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-tg-blue-light mb-1">
                        <Bot className="w-3.5 h-3.5 text-tg-blue-light" />
                        <span>Admin Specialist</span>
                      </span>
                    )}
                    <p>{m.text}</p>
                  </div>
                  <span className="text-[9px] text-tg-text-muted mt-1 font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Message input */}
          {activeTicket.status !== 'Closed' ? (
            <form onSubmit={handleSendReply} className="p-3 bg-tg-surface border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Type your message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-tg-dark/50 border border-white/5 focus:border-tg-blue/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                required
              />
              <button
                type="submit"
                className="bg-tg-blue hover:bg-tg-blue-light text-white p-2.5 rounded-xl transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-3 bg-tg-dark/50 border-t border-white/5 text-center text-[10px] text-red-400 font-bold">
              This support ticket has been closed by administration.
            </div>
          )}
        </div>
      ) : isCreating ? (
        /* Create Ticket Form */
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm text-white font-display">Create Support Ticket</h4>
              <p className="text-[10px] text-tg-text-muted">Describe your issue in detail for our technicians.</p>
            </div>
            
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-tg-text-muted hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Subject / Category</label>
              <input
                type="text"
                placeholder="e.g. Deposit missing, Withdrawal pending, Referral issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-tg-text-muted uppercase tracking-wider font-bold block">Detailed Message</label>
              <textarea
                placeholder="Provide blockchain TXIDs, dates, or detailed descriptions..."
                value={initMessage}
                onChange={(e) => setInitMessage(e.target.value)}
                rows={4}
                className="w-full bg-tg-dark/50 border border-white/5 focus:border-tg-blue/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tg-blue hover:bg-tg-blue-light text-white font-semibold font-display text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Creating...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>
      ) : (
        /* Ticket List */
        <div className="space-y-4 animate-fadeIn">
          {/* Description */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-tg-blue/10 text-tg-blue">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-white font-display">TM Digital Help & Support</h3>
              <p className="text-xs text-tg-text-muted leading-relaxed">
                Need help with blockchain validations, withdrawals, or referral tracking? Submit a secure, encrypted ticket. Our moderators are available 24/7.
              </p>
              
              <div className="pt-2 text-[10px] text-tg-blue-light flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Simulated auto-replies are active for instant evaluation!</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-tg-text-muted font-bold uppercase tracking-wider font-display">Active Support History</span>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-tg-blue hover:bg-tg-blue-light text-white font-semibold text-[11px] font-display py-1.5 px-3 rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </button>
          </div>

          {/* Ticket Listing Grid */}
          <div className="space-y-2.5">
            {userTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-tg-text-muted bg-tg-dark/30 rounded-2xl border border-dashed border-white/5">
                No active tickets. Click "Create Ticket" to get in touch with administration.
              </div>
            ) : (
              [...userTickets]
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setActiveTicketId(ticket.id)}
                    className="w-full glass-panel p-4 rounded-xl border border-white/5 hover:border-tg-blue/20 text-left transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg text-tg-text-muted">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-white leading-tight">{ticket.subject}</h4>
                        <span className="text-[10px] text-tg-text-muted block mt-1">
                          Opened: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        ticket.status === 'Closed' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : ticket.status === 'Replied' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-tg-text-muted" />
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SupportTab;
