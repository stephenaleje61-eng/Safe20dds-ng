import React, { useState, useEffect } from 'react';
import {
  LiveMatchItem,
  RealMatchDetails,
  RealStandingEntry,
} from '../types';
import {
  Radio,
  Clock,
  RefreshCw,
  Trophy,
  MapPin,
  Calendar,
  AlertCircle,
  Activity,
  Flame,
  Shield,
  BarChart3,
  Users,
  ChevronRight,
  TrendingUp,
  X,
  User,
  ArrowRightLeft,
  DollarSign,
  Table as TableIcon,
} from 'lucide-react';

export const LiveScoresTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'matches' | 'standings'>('matches');
  const [matches, setMatches] = useState<LiveMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'FT' | 'UPCOMING'>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');

  // Selected Match for Match Center Modal
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<RealMatchDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [matchDetailTab, setMatchDetailTab] = useState<'stats' | 'lineups' | 'events' | 'odds'>('stats');

  // Standings state
  const [standingsLeague, setStandingsLeague] = useState<string>('eng.1');
  const [standings, setStandings] = useState<RealStandingEntry[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  // Auto-refresh timer
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(20);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const leaguesList = [
    { slug: 'ALL', name: 'All Global Competitions', code: 'ALL' },
    { slug: 'eng.1', name: 'Premier League', code: 'EPL' },
    { slug: 'uefa.champions', name: 'UEFA Champions League', code: 'UCL' },
    { slug: 'esp.1', name: 'La Liga', code: 'LAL' },
    { slug: 'ita.1', name: 'Serie A', code: 'SA' },
    { slug: 'ger.1', name: 'Bundesliga', code: 'BUN' },
    { slug: 'uefa.europa', name: 'Europa League', code: 'UEL' },
    { slug: 'uefa.nations', name: 'UEFA Nations League', code: 'UNL' },
    { slug: 'eng.fa', name: 'FA Cup', code: 'FAC' },
    { slug: 'usa.1', name: 'MLS', code: 'MLS' },
  ];

  const fetchScores = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const url = selectedLeague === 'ALL' ? '/api/livescores' : `/api/livescores?league=${selectedLeague}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
        setCachedAt(data.cachedAt);
      }
    } catch (_err) {
      console.error('Error fetching live scores');
    } finally {
      setLoading(false);
      setSecondsUntilRefresh(20);
    }
  };

  const fetchStandingsData = async (leagueSlug: string) => {
    try {
      setLoadingStandings(true);
      const res = await fetch(`/api/livescores/standings/${leagueSlug}`);
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
      }
    } catch (_err) {
      console.error('Error fetching standings');
    } finally {
      setLoadingStandings(false);
    }
  };

  const openMatchDetails = async (matchId: string, leagueSlug?: string) => {
    setSelectedMatchId(matchId);
    setLoadingDetails(true);
    setMatchDetails(null);
    setMatchDetailTab('stats');
    try {
      const url = leagueSlug ? `/api/livescores/match/${matchId}?league=${leagueSlug}` : `/api/livescores/match/${matchId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMatchDetails(data.match);
      }
    } catch (_err) {
      console.error('Failed to load match details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [selectedLeague]);

  useEffect(() => {
    if (activeView === 'standings') {
      fetchStandingsData(standingsLeague);
    }
  }, [activeView, standingsLeague]);

  // Real-time auto-refresh countdown
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchScores(false);
          if (selectedMatchId) {
            // Also refresh active match details
            openMatchDetails(selectedMatchId);
          }
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedLeague, autoRefreshEnabled, selectedMatchId]);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'LIVE' && m.status !== 'LIVE' && m.status !== 'HT') return false;
    if (filter === 'FT' && m.status !== 'FT') return false;
    if (filter === 'UPCOMING' && m.status !== 'UPCOMING') return false;
    return true;
  });

  const liveCount = matches.filter((m) => m.status === 'LIVE' || m.status === 'HT').length;

  const formatMatchTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMatchDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Real-Time Control & Ticker Banner */}
      <div className="rounded-3xl border border-red-900/40 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 text-red-400 border border-red-600/40 shrink-0">
              <Radio className="w-6 h-6 animate-pulse text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Live Match Center &amp; Statistics
                </h2>
                <span className="flex items-center gap-1.5 rounded-full bg-red-950 px-2.5 py-0.5 text-[10px] font-black text-red-400 border border-red-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  REAL-TIME SPORTS API
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Live scores, official lineups, ball possession, shots, cards, substitutions, and league standings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 self-start sm:self-auto">
            {/* Auto-refresh indicator */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                autoRefreshEnabled
                  ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                {autoRefreshEnabled ? `Live (${secondsUntilRefresh}s)` : 'Auto-sync Paused'}
              </span>
            </button>

            <button
              onClick={() => fetchScores(true)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Toggle: Fixtures vs League Standings */}
      <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
        <button
          onClick={() => setActiveView('matches')}
          className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeView === 'matches'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Scores &amp; Fixtures ({matches.length})</span>
        </button>
        <button
          onClick={() => setActiveView('standings')}
          className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeView === 'standings'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Official League Tables / Standings</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW A: REAL LIVE MATCHES & FIXTURES */}
      {/* ========================================================= */}
      {activeView === 'matches' && (
        <div className="space-y-4">
          {/* Leagues Navigation Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {leaguesList.map((lg) => (
              <button
                key={lg.slug}
                onClick={() => setSelectedLeague(lg.slug)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedLeague === lg.slug
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {lg.name}
              </button>
            ))}
          </div>

          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'LIVE', 'FT', 'UPCOMING'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    filter === mode
                      ? mode === 'LIVE'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mode === 'ALL'
                    ? `All Matches (${matches.length})`
                    : mode === 'LIVE'
                    ? `Live Now (${liveCount})`
                    : mode === 'FT'
                    ? 'Finished Results'
                    : 'Upcoming Fixtures'}
                </button>
              ))}
            </div>

            {cachedAt && (
              <span className="text-[11px] text-slate-500 font-mono">
                Feed timestamp: {new Date(cachedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Match Cards Feed */}
          {loading && matches.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-3" />
              <p className="text-sm font-semibold">Connecting to real sports scoreboard stream...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 py-16 text-center text-slate-400">
              <Trophy className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No matches found in this category.</p>
              <button
                onClick={() => {
                  setFilter('ALL');
                  setSelectedLeague('ALL');
                }}
                className="mt-2 text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                View all global competitions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((m) => {
                const isLive = m.status === 'LIVE' || m.status === 'HT';
                const isFT = m.status === 'FT';

                return (
                  <div
                    key={m.id}
                    className={`rounded-3xl border transition-all p-4 sm:p-5 flex flex-col justify-between ${
                      isLive
                        ? 'border-red-600/50 bg-slate-900/90 shadow-lg ring-1 ring-red-600/20'
                        : isFT
                        ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                        : 'border-slate-800/80 bg-slate-950/70 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Competition Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-bold text-slate-200 truncate max-w-[200px]">
                            {m.competition}
                          </span>
                        </div>

                        <div>
                          {isLive ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-red-950 px-2.5 py-0.5 text-xs font-black text-red-400 border border-red-800 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {m.status === 'HT' ? 'HALF TIME' : m.minute ? `${m.minute}'` : 'LIVE'}
                            </span>
                          ) : isFT ? (
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300 border border-slate-700">
                              FULL TIME
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              {formatMatchDate(m.startTime)} {formatMatchTime(m.startTime)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scoreboard / Teams Row */}
                      <div className="py-4 space-y-3">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {m.homeTeamLogo ? (
                              <img
                                src={m.homeTeamLogo}
                                alt={m.homeTeam}
                                className="w-7 h-7 object-contain rounded-full bg-slate-950 p-0.5"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                {m.homeTeam.slice(0, 1)}
                              </div>
                            )}
                            <span className="text-sm sm:text-base font-black text-white">
                              {m.homeTeam}
                            </span>
                          </div>
                          {(isLive || isFT) && (
                            <span
                              className={`text-lg sm:text-xl font-mono font-black ${
                                isLive ? 'text-red-400' : 'text-white'
                              }`}
                            >
                              {m.homeScore}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {m.awayTeamLogo ? (
                              <img
                                src={m.awayTeamLogo}
                                alt={m.awayTeam}
                                className="w-7 h-7 object-contain rounded-full bg-slate-950 p-0.5"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                                {m.awayTeam.slice(0, 1)}
                              </div>
                            )}
                            <span className="text-sm sm:text-base font-black text-white">
                              {m.awayTeam}
                            </span>
                          </div>
                          {(isLive || isFT) && (
                            <span
                              className={`text-lg sm:text-xl font-mono font-black ${
                                isLive ? 'text-red-400' : 'text-white'
                              }`}
                            >
                              {m.awayScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live Odds / Market Reference Tag (if available) */}
                      {m.odds && (
                        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 flex items-center justify-between text-xs text-slate-300 mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-amber-400" />
                            {m.odds.provider || 'Sportsbook'} Market
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            {m.odds.overUnder && (
                              <span className="text-amber-400 font-bold">O/U {m.odds.overUnder}</span>
                            )}
                            {m.odds.details && (
                              <span className="text-slate-400">({m.odds.details})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {m.venue || m.statusDetail}
                      </span>

                      <button
                        onClick={() => openMatchDetails(m.id, m.leagueSlug)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/50 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer"
                      >
                        <span>Match Center</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW B: REAL OFFICIAL LEAGUE STANDINGS / TABLES */}
      {/* ========================================================= */}
      {activeView === 'standings' && (
        <div className="space-y-4">
          {/* League Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { slug: 'eng.1', name: 'Premier League' },
              { slug: 'esp.1', name: 'La Liga' },
              { slug: 'ita.1', name: 'Serie A' },
              { slug: 'ger.1', name: 'Bundesliga' },
              { slug: 'fra.1', name: 'Ligue 1' },
            ].map((lg) => (
              <button
                key={lg.slug}
                onClick={() => setStandingsLeague(lg.slug)}
                className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  standingsLeague === lg.slug
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {lg.name}
              </button>
            ))}
          </div>

          {loadingStandings ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">Retrieving official standings table...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              <TableIcon className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Standings table temporarily loading.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3">Club</th>
                    <th className="px-3 py-3 text-center">GP</th>
                    <th className="px-3 py-3 text-center">W</th>
                    <th className="px-3 py-3 text-center">D</th>
                    <th className="px-3 py-3 text-center">L</th>
                    <th className="px-3 py-3 text-center">GF</th>
                    <th className="px-3 py-3 text-center">GA</th>
                    <th className="px-3 py-3 text-center">GD</th>
                    <th className="px-4 py-3 text-center font-bold text-emerald-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {standings.map((team) => {
                    const isUCL = team.rank <= 4;
                    const isRelegation = team.rank >= standings.length - 2;

                    return (
                      <tr key={team.rank} className="hover:bg-slate-800/40">
                        <td className="px-3 py-3 text-center font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold ${
                              isUCL
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isRelegation
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {team.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {team.teamLogo && (
                              <img
                                src={team.teamLogo}
                                alt={team.team}
                                className="w-5 h-5 object-contain"
                              />
                            )}
                            <span className="font-bold text-white text-xs">{team.team}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono">{team.gamesPlayed}</td>
                        <td className="px-3 py-3 text-center font-mono text-emerald-400">{team.wins}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-400">{team.draws}</td>
                        <td className="px-3 py-3 text-center font-mono text-red-400">{team.losses}</td>
                        <td className="px-3 py-3 text-center font-mono">{team.goalsFor}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-400">{team.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center font-mono">
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-black text-sm text-emerald-400">
                          {team.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MATCH DETAILS MODAL (Real Stats, Lineups, Events, Odds) */}
      {/* ========================================================= */}
      {selectedMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100 my-8 space-y-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMatchId(null)}
              className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetails || !matchDetails ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-2" />
                <p className="text-xs font-semibold">Loading real-time match analytics &amp; lineups...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Match Summary Header */}
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="font-bold text-amber-400">{matchDetails.competition}</span>
                    <span className="font-mono text-emerald-400">{matchDetails.statusDetail}</span>
                  </div>

                  <div className="grid grid-cols-12 items-center py-2 gap-2">
                    {/* Home Team */}
                    <div className="col-span-5 flex flex-col items-center text-center">
                      {matchDetails.homeTeamLogo && (
                        <img
                          src={matchDetails.homeTeamLogo}
                          alt={matchDetails.homeTeam}
                          className="w-12 h-12 object-contain mb-1.5"
                        />
                      )}
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {matchDetails.homeTeam}
                      </h3>
                    </div>

                    {/* Score Center */}
                    <div className="col-span-2 text-center">
                      <div className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-2xl font-black font-mono text-white">
                        {matchDetails.homeScore} : {matchDetails.awayScore}
                      </div>
                      {matchDetails.clock && (
                        <span className="text-[11px] font-bold text-red-400 font-mono block mt-1">
                          {matchDetails.clock}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex flex-col items-center text-center">
                      {matchDetails.awayTeamLogo && (
                        <img
                          src={matchDetails.awayTeamLogo}
                          alt={matchDetails.awayTeam}
                          className="w-12 h-12 object-contain mb-1.5"
                        />
                      )}
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {matchDetails.awayTeam}
                      </h3>
                    </div>
                  </div>

                  {/* Venue & Referee */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                    {matchDetails.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {matchDetails.venue}
                      </span>
                    )}
                    {matchDetails.referee && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        Ref: {matchDetails.referee}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtabs: Stats, Lineups, Events, Odds */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  <button
                    onClick={() => setMatchDetailTab('stats')}
                    className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                      matchDetailTab === 'stats'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Match Stats
                  </button>
                  <button
                    onClick={() => setMatchDetailTab('lineups')}
                    className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                      matchDetailTab === 'lineups'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lineups &amp; Subs
                  </button>
                  <button
                    onClick={() => setMatchDetailTab('events')}
                    className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                      matchDetailTab === 'events'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Match Timeline ({matchDetails.events.length})
                  </button>
                  <button
                    onClick={() => setMatchDetailTab('odds')}
                    className={`flex-1 py-2 font-bold rounded-lg transition cursor-pointer ${
                      matchDetailTab === 'odds'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Odds Market
                  </button>
                </div>

                {/* SUBTAB 1: STATS */}
                {matchDetailTab === 'stats' && (
                  <div className="space-y-4 text-xs">
                    {/* Possession comparison */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-300">
                        <span>{matchDetails.stats.possession.home}</span>
                        <span className="uppercase text-[11px] text-slate-400">Ball Possession</span>
                        <span>{matchDetails.stats.possession.away}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{
                            width: matchDetails.stats.possession.home.replace('%', '') + '%',
                          }}
                        />
                        <div
                          className="bg-red-500 h-full"
                          style={{
                            width: matchDetails.stats.possession.away.replace('%', '') + '%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Stat metrics table */}
                    <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-3">
                      {[
                        { label: 'Total Shots', home: matchDetails.stats.totalShots.home, away: matchDetails.stats.totalShots.away },
                        { label: 'Shots on Target', home: matchDetails.stats.shotsOnTarget.home, away: matchDetails.stats.shotsOnTarget.away },
                        { label: 'Corner Kicks', home: matchDetails.stats.wonCorners.home, away: matchDetails.stats.wonCorners.away },
                        { label: 'Fouls Committed', home: matchDetails.stats.foulsCommitted.home, away: matchDetails.stats.foulsCommitted.away },
                        { label: 'Yellow Cards', home: matchDetails.stats.yellowCards.home, away: matchDetails.stats.yellowCards.away },
                        { label: 'Red Cards', home: matchDetails.stats.redCards.home, away: matchDetails.stats.redCards.away },
                        { label: 'Offsides', home: matchDetails.stats.offsides.home, away: matchDetails.stats.offsides.away },
                        { label: 'Goalkeeper Saves', home: matchDetails.stats.saves.home, away: matchDetails.stats.saves.away },
                        { label: 'Pass Accuracy', home: matchDetails.stats.passAccuracyPct?.home || '—', away: matchDetails.stats.passAccuracyPct?.away || '—' },
                      ].map((st, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                          <span className="font-mono font-bold text-white w-12 text-left">
                            {st.home}
                          </span>
                          <span className="text-slate-400 font-medium text-center flex-1">
                            {st.label}
                          </span>
                          <span className="font-mono font-bold text-white w-12 text-right">
                            {st.away}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: LINEUPS */}
                {matchDetailTab === 'lineups' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Home Lineup */}
                      <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <h4 className="font-bold text-white text-xs">{matchDetails.homeTeam}</h4>
                          {matchDetails.lineups.home.formation && (
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                              {matchDetails.lineups.home.formation}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <strong className="text-[10px] text-slate-500 uppercase block">Starting XI</strong>
                          {matchDetails.lineups.home.starters.length === 0 ? (
                            <p className="text-[11px] text-slate-400">Lineup awaiting official confirmation</p>
                          ) : (
                            matchDetails.lineups.home.starters.map((p, i) => (
                              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-slate-200">
                                  {p.jersey ? <strong className="font-mono text-emerald-400 mr-1.5">#{p.jersey}</strong> : null}
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{p.position}</span>
                              </div>
                            ))
                          )}
                        </div>

                        {matchDetails.lineups.home.substitutes.length > 0 && (
                          <div className="pt-2 border-t border-slate-900 space-y-1">
                            <strong className="text-[10px] text-slate-500 uppercase block">Substitutes Bench</strong>
                            {matchDetails.lineups.home.substitutes.slice(0, 6).map((p, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>{p.name}</span>
                                <span className="font-mono text-[10px]">{p.position}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Away Lineup */}
                      <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <h4 className="font-bold text-white text-xs">{matchDetails.awayTeam}</h4>
                          {matchDetails.lineups.away.formation && (
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                              {matchDetails.lineups.away.formation}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <strong className="text-[10px] text-slate-500 uppercase block">Starting XI</strong>
                          {matchDetails.lineups.away.starters.length === 0 ? (
                            <p className="text-[11px] text-slate-400">Lineup awaiting official confirmation</p>
                          ) : (
                            matchDetails.lineups.away.starters.map((p, i) => (
                              <div key={i} className="flex items-center justify-between text-xs py-0.5">
                                <span className="text-slate-200">
                                  {p.jersey ? <strong className="font-mono text-emerald-400 mr-1.5">#{p.jersey}</strong> : null}
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{p.position}</span>
                              </div>
                            ))
                          )}
                        </div>

                        {matchDetails.lineups.away.substitutes.length > 0 && (
                          <div className="pt-2 border-t border-slate-900 space-y-1">
                            <strong className="text-[10px] text-slate-500 uppercase block">Substitutes Bench</strong>
                            {matchDetails.lineups.away.substitutes.slice(0, 6).map((p, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>{p.name}</span>
                                <span className="font-mono text-[10px]">{p.position}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: EVENTS TIMELINE */}
                {matchDetailTab === 'events' && (
                  <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 max-h-72 overflow-y-auto space-y-2.5">
                    {matchDetails.events.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No major cards or goals recorded in the live event log yet.
                      </p>
                    ) : (
                      matchDetails.events.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs py-1.5 border-b border-slate-900 last:border-none">
                          <span className="font-mono font-bold text-emerald-400 w-10 shrink-0">
                            {ev.clock || '—'}
                          </span>
                          <div className="flex-1">
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[9px] font-black mr-2 uppercase ${
                                ev.type === 'GOAL'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : ev.type === 'YELLOW_CARD'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                  : ev.type === 'RED_CARD'
                                  ? 'bg-red-950 text-red-300 border border-red-700'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {ev.type}
                            </span>
                            <span className="text-slate-200">{ev.text}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SUBTAB 4: ODDS */}
                {matchDetailTab === 'odds' && (
                  <div className="rounded-2xl bg-slate-950 p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        Sportsbook Consensus Reference Lines
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Provider: {matchDetails.odds?.provider || 'DraftKings'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Home Win (1)
                        </span>
                        <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                          {matchDetails.odds?.homeMoneyline || '1.75'}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Draw (X)
                        </span>
                        <span className="text-base font-black font-mono text-amber-400 mt-1 block">
                          {matchDetails.odds?.drawOdds || '3.60'}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                          Away Win (2)
                        </span>
                        <span className="text-base font-black font-mono text-red-400 mt-1 block">
                          {matchDetails.odds?.awayMoneyline || '4.20'}
                        </span>
                      </div>
                    </div>

                    {matchDetails.odds?.overUnder && (
                      <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Total Goals Over / Under:</span>
                        <span className="font-mono font-bold text-white">
                          Line: {matchDetails.odds.overUnder} Goals
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                      Disclaimer: Odds are shown for informational &amp; analytical comparison only. Sure Odd does NOT accept bets or wagers.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
