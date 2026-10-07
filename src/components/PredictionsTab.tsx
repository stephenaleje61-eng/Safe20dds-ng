import React, { useState, useEffect } from 'react';
import { PredictionItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Pin,
  Lock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';

interface PredictionsTabProps {
  onShareToChat?: (prediction: PredictionItem) => void;
  onOpenVipTab?: () => void;
}

export const PredictionsTab: React.FC<PredictionsTabProps> = ({
  onShareToChat,
  onOpenVipTab,
}) => {
  const { user, isVip, isAdmin, token } = useAuth();
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');
  const [competitionFilter, setCompetitionFilter] = useState<string>('ALL');
  const [vipFilter, setVipFilter] = useState<boolean>(false);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/predictions', { headers });
      if (!res.ok) throw new Error('Failed to load predictions');
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [token]);

  // Unique competitions
  const competitions = Array.from(new Set(predictions.map((p) => p.competition)));

  // Filtered list
  const filtered = predictions.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (competitionFilter !== 'ALL' && p.competition !== competitionFilter) return false;
    if (vipFilter && !p.isVipOnly) return false;
    return true;
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner (Zero Gambling / Analytical Information Only) */}
      <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-4 sm:p-5 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-emerald-900/60 p-2.5 text-emerald-400 shrink-0 border border-emerald-700/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                Entertainment &amp; Sports Analytics Notice
              </h2>
              <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                100% Free to Play
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              All predictions and game breakdowns on Sure Odd are provided for educational, analytical, and entertainment purposes only. Sure Odd does NOT provide betting slips, real-money wagering, or guaranteed winnings.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Models</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{predictions.length}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Daily verified fixtures</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Win Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">86.4%</p>
          <span className="text-[11px] text-slate-400">Statistical consistency</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Fixtures</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">
            {predictions.filter((p) => p.status === 'PENDING').length}
          </p>
          <span className="text-[11px] text-slate-400">Upcoming kickoff today</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>VIP Insights</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {predictions.filter((p) => p.isVipOnly).length}
          </p>
          <span className="text-[11px] text-amber-300 font-medium">Exclusive tactical sets</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
        {/* Status segmented buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Matches' : st === 'PENDING' ? 'Upcoming' : st}
            </button>
          ))}

          <button
            onClick={() => setVipFilter(!vipFilter)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              vipFilter
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Only</span>
          </button>
        </div>

        {/* Competition Dropdown & Refresh */}
        <div className="flex items-center gap-2">
          <select
            value={competitionFilter}
            onChange={(e) => setCompetitionFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">All Competitions</option>
            {competitions.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>

          <button
            onClick={fetchPredictions}
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Refresh match predictions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Prediction Cards Feed */}
      {loading && predictions.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-semibold">Loading tactical prediction models...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-16 text-center text-slate-400">
          <Info className="w-8 h-8 mx-auto text-slate-500 mb-3" />
          <p className="text-sm font-semibold text-slate-300">No predictions matching this filter.</p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setCompetitionFilter('ALL');
              setVipFilter(false);
            }}
            className="mt-3 text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isWon = item.status === 'WON';
            const isLost = item.status === 'LOST';
            const isPending = item.status === 'PENDING';

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border transition-all overflow-hidden ${
                  item.isPinned
                    ? 'border-emerald-500/50 bg-slate-900/90 shadow-lg ring-1 ring-emerald-500/20'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <Pin className="w-3 h-3 rotate-45" /> PINNED
                      </span>
                    )}
                    <span className="font-bold text-slate-300">{item.competition}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isVipOnly && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800/60">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}

                    {/* Status indicator */}
                    {isWon && (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> WON ({item.finalScore || 'Verified'})
                      </span>
                    )}
                    {isLost && (
                      <span className="flex items-center gap-1 rounded-md bg-red-950 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-800">
                        <XCircle className="w-3 h-3" /> LOST ({item.finalScore || 'Final'})
                      </span>
                    )}
                    {isPending && (
                      <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-slate-700">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Match Time & Kickoff */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(item.matchTime)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Kickoff: {formatTime(item.matchTime)}
                    </span>
                  </div>

                  {/* Teams Matchup Header */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 text-left">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {item.homeTeam}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">Home</span>
                    </div>

                    <div className="px-3 text-center">
                      <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-black text-emerald-400">
                        VS
                      </span>
                    </div>

                    <div className="flex-1 text-right">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {item.awayTeam}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400">Away</span>
                    </div>
                  </div>

                  {/* Prediction Category & Odds Tag */}
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Analyst Prediction Category
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {item.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Probability Rating
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-white">
                        <span>{item.confidence}%</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-amber-400 font-mono">@{item.oddsIndicator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Tactical Analysis */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tactical Breakdown &amp; Team Form</span>
                    </div>

                    {item.isLocked ? (
                      <div className="py-3 text-center space-y-2">
                        <Lock className="w-6 h-6 mx-auto text-amber-400" />
                        <p className="text-xs text-amber-200/90">
                          {item.adminAnalysis}
                        </p>
                        <button
                          onClick={onOpenVipTab}
                          className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow-sm cursor-pointer"
                        >
                          Unlock VIP Analysis
                        </button>
                      </div>
                    ) : (
                      <p className="leading-relaxed text-slate-300">
                        {item.adminAnalysis}
                      </p>
                    )}
                  </div>

                  {/* Share to Chat & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <span className="text-[11px] text-slate-500">
                      Posted by Official Sure Odd Analysts
                    </span>

                    <button
                      onClick={() => onShareToChat && onShareToChat(item)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 font-semibold transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discuss in Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
