import React, { useState, useEffect } from 'react';
import { TelegramUser } from '../types';
import { AppDatabase } from '../types';
import { getDB, resetDB } from '../lib/db';
import { Shield, Sparkles, RefreshCw, Smartphone, User, Users, CheckCircle, Info } from 'lucide-react';

interface TelegramSimulatorProps {
  onUserChange: (user: TelegramUser) => void;
  activeUser: TelegramUser;
  db: AppDatabase;
  onDbReset: (newDb: AppDatabase) => void;
  onNavigateToAdmin: () => void;
}

export const SIMULATED_PROFILES: TelegramUser[] = [
  {
    id: "111111111",
    username: "cryptoking",
    firstName: "Sarah",
    lastName: "Connor",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces",
    languageCode: "en"
  },
  {
    id: "222222222",
    username: "tg_rich",
    firstName: "Michael",
    lastName: "Scott",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
    languageCode: "en"
  },
  {
    id: "333333333",
    username: "new_joiner",
    firstName: "Dwight",
    lastName: "Schrute",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
    languageCode: "de"
  },
  {
    id: "444444444",
    username: "frozentg",
    firstName: "Jim",
    lastName: "Halpert",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces",
    languageCode: "en"
  }
];

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  onUserChange,
  activeUser,
  db,
  onDbReset,
  onNavigateToAdmin
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewportSize, setViewportSize] = useState<'default' | 'tall' | 'compact'>('default');
  const [isRealTelegram, setIsRealTelegram] = useState(false);

  useEffect(() => {
    // Detect if inside real Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      setIsRealTelegram(true);
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser) {
        onUserChange({
          id: tgUser.id.toString(),
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          photoUrl: tgUser.photo_url,
          languageCode: tgUser.language_code
        });
      }
    }
  }, []);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the localStorage database? All modifications will be cleared.")) {
      const freshDb = resetDB();
      onDbReset(freshDb);
      // Re-trigger user profile fetch
      onUserChange({ ...activeUser });
    }
  };

  const selectProfile = (profile: TelegramUser) => {
    onUserChange(profile);
  };

  return (
    <div className="w-full bg-tg-surface border-b border-white/5 px-4 py-2 flex flex-col gap-2 z-50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-tg-text-muted flex items-center gap-1.5">
            {isRealTelegram ? (
              <>
                <span className="text-emerald-400 font-semibold">Telegram WebApp Mode</span> (Connected)
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-tg-blue" />
                <span>Simulating Telegram environment</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToAdmin}
            className="text-xs bg-tg-blue hover:bg-tg-blue-light text-white px-3 py-1 rounded-md font-medium transition flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default TelegramSimulator;
