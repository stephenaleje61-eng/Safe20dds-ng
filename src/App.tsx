import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarqueeBanner } from './components/MarqueeBanner';
import { Header, ActiveTab } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { PredictionsTab } from './components/PredictionsTab';
import { LiveScoresTab } from './components/LiveScoresTab';
import { VipTab } from './components/VipTab';
import { CommunityTab } from './components/CommunityTab';
import { ChatTab } from './components/ChatTab';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfileModal } from './components/UserProfileModal';
import { PredictionItem } from './types';
import { Shield, Sparkles, Heart, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('predictions');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [sharedPredictionId, setSharedPredictionId] = useState<string | null>(null);

  const handleShareToChat = (prediction: PredictionItem) => {
    setSharedPredictionId(prediction.id);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-16 md:pb-0">
      {/* 1. Continuous Top Scrolling Banner */}
      <MarqueeBanner />

      {/* 2. Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalUserId(user?.id || null)}
      />

      {/* 3. Main Body Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'predictions' && (
          <PredictionsTab
            onShareToChat={handleShareToChat}
            onOpenVipTab={() => setActiveTab('vip')}
          />
        )}

        {activeTab === 'livescores' && <LiveScoresTab />}

        {activeTab === 'vip' && <VipTab onOpenAuth={() => setAuthModalOpen(true)} />}

        {activeTab === 'community' && (
          <CommunityTab
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenUserProfile={(uid) => setProfileModalUserId(uid)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            onOpenAuth={() => setAuthModalOpen(true)}
            sharedPredictionId={sharedPredictionId}
            onClearSharedPrediction={() => setSharedPredictionId(null)}
          />
        )}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/icon.svg"
                alt="Sure Odd Logo"
                className="h-8 w-8 rounded-lg object-contain shadow-sm"
              />
              <div>
                <span className="font-black text-white text-sm">SURE ODD</span>
                <span className="text-[11px] text-slate-400 block">
                  Free-to-Play Sports Predictions &amp; Live Match Statistics
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <PWAInstallButton compact />
              <button
                onClick={() => setActiveTab('predictions')}
                className="hover:text-emerald-400 transition"
              >
                Predictions
              </button>
              <button
                onClick={() => setActiveTab('livescores')}
                className="hover:text-emerald-400 transition"
              >
                Live Scores
              </button>
              <button
                onClick={() => setActiveTab('vip')}
                className="hover:text-emerald-400 transition"
              >
                VIP Analysis
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className="hover:text-emerald-400 transition"
              >
                Community
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 block mb-1">
              Important Compliance &amp; Entertainment Notice:
            </strong>
            Sure Odd is an entertainment and analytical information service. We do not accept bets, place wagers, provide betting slips, or guarantee match results. Match predictions reflect statistical models and editorial analysis only. Subscriptions provide analytical sports insights and do not facilitate gambling.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px] pt-4 border-t border-slate-900">
            <p>© {new Date().getFullYear()} Sure Odd. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Android-installable Progressive Web App (PWA)
            </p>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Indicators */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <UserProfileModal
        userId={profileModalUserId}
        onClose={() => setProfileModalUserId(null)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
