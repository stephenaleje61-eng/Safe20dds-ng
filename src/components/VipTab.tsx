import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SubscriptionItem, PredictionItem } from '../types';
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  CreditCard,
  History,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface VipTabProps {
  onOpenAuth: () => void;
}

export const VipTab: React.FC<VipTabProps> = ({ onOpenAuth }) => {
  const { user, isVip, token, refreshUser } = useAuth();
  const [history, setHistory] = useState<SubscriptionItem[]>([]);
  const [vipPredictions, setVipPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch history & VIP predictions
  const loadVipData = async () => {
    try {
      if (token) {
        const hRes = await fetch('/api/vip/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hRes.ok) {
          const data = await hRes.json();
          setHistory(data.subscriptions || []);
        }

        const pRes = await fetch('/api/predictions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const data = await pRes.json();
          const all: PredictionItem[] = data.predictions || [];
          setVipPredictions(all.filter((p) => p.isVipOnly));
        }
      }
    } catch (_err) {
      console.error('Failed to load VIP data');
    }
  };

  useEffect(() => {
    loadVipData();
  }, [token, isVip]);

  const handleSubscribe = async (tierName: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setSubscribingTier(tierName);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/vip/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to complete subscription');
      } else {
        setSuccessMessage(data.message || `Successfully upgraded to ${tierName}!`);
        await refreshUser();
        await loadVipData();
      }
    } catch (_err) {
      setErrorMessage('Network error during subscription activation.');
    } finally {
      setLoading(false);
      setSubscribingTier(null);
    }
  };

  const plans = [
    {
      id: 'Weekly VIP',
      name: 'Weekly VIP',
      price: '₦1,000',
      period: 'per 7 days',
      features: [
        'Full tactical analysis models',
        'Daily high-confidence picks',
        'Early lineup & injury previews',
        'VIP Lounge match chat access',
      ],
      popular: false,
    },
    {
      id: '₦2,000 Monthly VIP',
      name: '₦2,000 Monthly VIP',
      price: '₦2,000',
      period: 'per 30 days',
      features: [
        'All Weekly VIP capabilities',
        'Full European Cup & UCL models',
        'Statistical xG & referee models',
        'VIP Community badge & flair',
        'Direct Analyst Q&A forum',
      ],
      popular: true,
    },
    {
      id: '₦5,000 Monthly Premium',
      name: '₦5,000 Monthly Premium',
      price: '₦5,000',
      period: 'quarterly (90 days)',
      features: [
        'All Monthly VIP privileges',
        '90-Day VIP unbroken access',
        'Priority feature requests',
        'In-depth statistical archive access',
        'Gold Elite Member styling',
      ],
      popular: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl border border-amber-600/30 bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-700/60 mb-3">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>PREMIUM SPORTS TACTICAL ANALYSIS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Elevate Your Match Understanding with <span className="text-amber-400">Sure Odd VIP</span>
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Exclusive tactical analysis, expected goals (xG) metrics, historical referee tendencies, and deep team structure insights. Subscriptions are exclusively for sports analysis and educational content.
          </p>

          {/* Active status indicator if user is VIP */}
          {isVip && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-emerald-950/90 border border-emerald-600/60 px-4 py-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Your VIP Membership is Active!</p>
                <p className="text-[11px] text-emerald-300">
                  Tier: {user?.vipTier || 'Active VIP'} · Valid through:{' '}
                  {user?.vipExpiresAt ? new Date(user.vipExpiresAt).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-700/60 bg-emerald-950/50 p-4 text-xs sm:text-sm text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-700/60 bg-red-950/50 p-4 text-xs sm:text-sm text-red-300">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentTier = user?.vipTier === plan.id && isVip;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border flex flex-col justify-between transition-all p-6 sm:p-7 ${
                plan.popular
                  ? 'border-amber-500/80 bg-slate-900/95 shadow-xl ring-2 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                  Most Popular Choice
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  <Crown
                    className={`w-5 h-5 ${plan.popular ? 'text-amber-400' : 'text-slate-500'}`}
                  />
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Full access to locked sports analytics models.
                </p>

                <div className="mt-6 space-y-2.5 border-t border-slate-800 pt-5">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || isCurrentTier}
                  className={`w-full rounded-2xl py-3 text-xs sm:text-sm font-black transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                    isCurrentTier
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 cursor-default'
                      : plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 active:scale-95'
                      : 'bg-emerald-700 text-white hover:bg-emerald-600 active:scale-95'
                  }`}
                >
                  {subscribingTier === plan.id ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isCurrentTier ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Current Active Plan
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Activate {plan.name}
                    </>
                  )}
                </button>
                <p className="mt-2 text-[10px] text-center text-slate-500">
                  Secure instant verification · Card details are never stored
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIP Exclusive Analysis Feed */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">VIP Analysis Vault</h2>
          </div>
          <span className="text-xs text-slate-400">
            {vipPredictions.length} models available
          </span>
        </div>

        {vipPredictions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
            <Lock className="w-8 h-8 mx-auto text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              VIP match models are updated on game mornings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vipPredictions.map((pred) => (
              <div
                key={pred.id}
                className="rounded-2xl border border-amber-600/30 bg-slate-900/80 p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">{pred.competition}</span>
                  <span className="rounded-md bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
                    VIP MODEL
                  </span>
                </div>

                <div className="flex items-center justify-between font-black text-white text-base">
                  <span>{pred.homeTeam}</span>
                  <span className="text-slate-500 text-xs font-mono">VS</span>
                  <span>{pred.awayTeam}</span>
                </div>

                <div className="rounded-xl bg-slate-950 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">CATEGORY</span>
                    <span className="text-emerald-400 font-black">{pred.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">PROBABILITY</span>
                    <span className="text-amber-400 font-mono font-bold">{pred.confidence}%</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="block text-slate-400 text-[10px] uppercase mb-1">
                    Tactical Reasoning:
                  </strong>
                  <p className="leading-relaxed">{pred.adminAnalysis}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription History */}
      {history.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Your Subscription History</h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">{sub.tier}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {sub.paymentReference}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                      ₦{sub.amountNgn.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(sub.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(sub.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
