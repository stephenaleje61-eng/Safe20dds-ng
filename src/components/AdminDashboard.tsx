import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminStats, PredictionItem, UserProfile } from '../types';
import {
  ShieldAlert,
  PlusCircle,
  FileText,
  Users,
  Flag,
  CreditCard,
  BarChart3,
  CheckCircle,
  XCircle,
  Trash2,
  Pin,
  Clock,
  Crown,
  Ban,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, token } = useAuth();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<
    'stats' | 'new-prediction' | 'manage-predictions' | 'reports' | 'users' | 'subscriptions'
  >('stats');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form for new prediction
  const [predForm, setPredForm] = useState({
    competition: 'English Premier League',
    homeTeam: '',
    awayTeam: '',
    matchTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16),
    category: 'Over 2.5 Goals',
    confidence: 85,
    oddsIndicator: '1.85',
    adminAnalysis: '',
    imageUrl: '',
    isVipOnly: false,
    isPinned: false,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_e) {
      console.error('Error fetching admin stats');
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/predictions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    } catch (_e) {
      console.error('Error fetching predictions');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (_e) {
      console.error('Error fetching users');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (_e) {
      console.error('Error fetching reports');
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      fetchStats();
      fetchPredictions();
      fetchUsers();
      fetchReports();
    }
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-red-800/40 bg-red-950/20 p-12 text-center text-slate-100">
        <ShieldAlert className="w-12 h-12 mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-black text-white">403 — Unauthorized Access</h2>
        <p className="mt-2 text-xs text-slate-400">
          Administrator privileges are strictly required to access the Sure Odd operational controls.
        </p>
      </div>
    );
  }

  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(predForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to post prediction' });
      } else {
        setMsg({ type: 'success', text: 'Prediction published successfully to live feed!' });
        setPredForm({
          competition: 'English Premier League',
          homeTeam: '',
          awayTeam: '',
          matchTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16),
          category: 'Over 2.5 Goals',
          confidence: 85,
          oddsIndicator: '1.85',
          adminAnalysis: '',
          imageUrl: '',
          isVipOnly: false,
          isPinned: false,
        });
        fetchPredictions();
        fetchStats();
      }
    } catch (_e) {
      setMsg({ type: 'error', text: 'Network error posting prediction' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: 'WON' | 'LOST' | 'PENDING' | 'VOID',
    finalScore?: string
  ) => {
    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, finalScore }),
      });
      if (res.ok) {
        fetchPredictions();
        fetchStats();
      }
    } catch (_e) {
      console.error('Error updating status');
    }
  };

  const handleDeletePrediction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prediction?')) return;
    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPredictions();
        fetchStats();
      }
    } catch (_e) {
      console.error('Delete error');
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      await fetch(`/api/predictions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPinned: !currentPin }),
      });
      fetchPredictions();
    } catch (_e) {
      console.error('Pin error');
    }
  };

  const handleToggleVipUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-vip`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (_e) {
      console.error('VIP toggle error');
    }
  };

  const handleToggleBanUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (_e) {
      console.error('Ban error');
    }
  };

  const handleDismissReport = async (postId: string) => {
    try {
      await fetch(`/api/admin/reports/${postId}/dismiss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReports();
      fetchStats();
    } catch (_e) {
      console.error('Dismiss report error');
    }
  };

  const handleDeleteReportedPost = async (postId: string) => {
    try {
      await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReports();
      fetchStats();
    } catch (_e) {
      console.error('Delete reported post error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-red-700/50 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black text-white text-lg shadow-lg border border-red-400/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Sure Odd Management Console</h1>
                <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-700">
                  SUPERUSER
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Authorized administrator workspace: match modeling, moderation &amp; user controls.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchPredictions();
              fetchUsers();
              fetchReports();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-900/80 p-2 border border-slate-800">
        {[
          { id: 'stats', label: 'Platform Stats', icon: BarChart3 },
          { id: 'new-prediction', label: 'Post Prediction', icon: PlusCircle },
          { id: 'manage-predictions', label: 'Manage Matches', icon: FileText },
          { id: 'reports', label: 'Moderation Reports', icon: Flag, badge: stats?.openReportsCount },
          { id: 'users', label: 'User Accounts', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeAdminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminSubTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="rounded-full bg-red-950 px-1.5 text-[10px] text-red-300 border border-red-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
            msg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-red-950/60 border-red-700 text-red-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Subtab 1: Platform Statistics */}
      {activeAdminSubTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-semibold">Total Accounts</span>
              <p className="mt-2 text-2xl font-black text-white">{stats.totalUsers}</p>
              <span className="text-[11px] text-emerald-400">Registered users</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-semibold">Active VIPs</span>
              <p className="mt-2 text-2xl font-black text-amber-400">{stats.activeVipCount}</p>
              <span className="text-[11px] text-slate-400">Premium analytical subscribers</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-semibold">Historical Win Rate</span>
              <p className="mt-2 text-2xl font-black text-emerald-400">{stats.winRatePercent}%</p>
              <span className="text-[11px] text-slate-400">Finished matches verified</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-semibold">Open Reports</span>
              <p className="mt-2 text-2xl font-black text-red-400">{stats.openReportsCount}</p>
              <span className="text-[11px] text-slate-400">Awaiting moderator review</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Subscription Revenue Log (Analytical Access)
              </h3>
              <p className="text-2xl font-black text-emerald-400">
                ₦{stats.totalRevenueNgn.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                Total simulated subscriptions verified: {stats.totalSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Total Prediction Models
              </h3>
              <p className="text-2xl font-black text-white">{stats.totalPredictions}</p>
              <p className="text-xs text-slate-400">
                Total community analyst posts: {stats.totalCommunityPosts}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Post New Prediction */}
      {activeAdminSubTab === 'new-prediction' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-xl">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Publish New Sports Prediction Model
          </h2>

          <form onSubmit={handleCreatePrediction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Competition / Tournament
                </label>
                <input
                  type="text"
                  required
                  value={predForm.competition}
                  onChange={(e) => setPredForm({ ...predForm, competition: e.target.value })}
                  placeholder="e.g. UEFA Champions League, Premier League"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kickoff Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={predForm.matchTime}
                  onChange={(e) => setPredForm({ ...predForm, matchTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Home Team
                </label>
                <input
                  type="text"
                  required
                  value={predForm.homeTeam}
                  onChange={(e) => setPredForm({ ...predForm, homeTeam: e.target.value })}
                  placeholder="e.g. Real Madrid"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Away Team
                </label>
                <input
                  type="text"
                  required
                  value={predForm.awayTeam}
                  onChange={(e) => setPredForm({ ...predForm, awayTeam: e.target.value })}
                  placeholder="e.g. Manchester City"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prediction Category
                </label>
                <input
                  type="text"
                  required
                  value={predForm.category}
                  onChange={(e) => setPredForm({ ...predForm, category: e.target.value })}
                  placeholder="e.g. Both Teams To Score &amp; Over 2.5"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confidence Rating (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={predForm.confidence}
                  onChange={(e) =>
                    setPredForm({ ...predForm, confidence: parseInt(e.target.value, 10) || 80 })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reference Odds
                </label>
                <input
                  type="text"
                  value={predForm.oddsIndicator}
                  onChange={(e) => setPredForm({ ...predForm, oddsIndicator: e.target.value })}
                  placeholder="e.g. 1.85"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Tactical Analysis (Full Details)
              </label>
              <textarea
                required
                rows={4}
                value={predForm.adminAnalysis}
                onChange={(e) => setPredForm({ ...predForm, adminAnalysis: e.target.value })}
                placeholder="Detailed breakdown: formation matchups, attacking xG trends, key injuries, and tactical reasoning..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Match Banner Image URL (Optional)
              </label>
              <input
                type="url"
                value={predForm.imageUrl}
                onChange={(e) => setPredForm({ ...predForm, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={predForm.isVipOnly}
                  onChange={(e) => setPredForm({ ...predForm, isVipOnly: e.target.checked })}
                  className="rounded-sm border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="flex items-center gap-1 font-semibold text-amber-400">
                  <Crown className="w-3.5 h-3.5" /> VIP Exclusive (Restricted to Subscribers)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={predForm.isPinned}
                  onChange={(e) => setPredForm({ ...predForm, isPinned: e.target.checked })}
                  className="rounded-sm border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Pin className="w-3.5 h-3.5" /> Pin to Top of Predictions Feed
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Prediction Model'}
            </button>
          </form>
        </div>
      )}

      {/* Subtab 3: Manage Predictions */}
      {activeAdminSubTab === 'manage-predictions' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Final Score</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">
                        {p.homeTeam} vs {p.awayTeam}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.competition}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{p.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          p.status === 'WON'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : p.status === 'LOST'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-slate-800 text-amber-300 border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{p.finalScore || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const score = prompt('Enter final score (e.g. 2 - 1):', p.finalScore || '2 - 1');
                            if (score !== null) handleUpdateStatus(p.id, 'WON', score);
                          }}
                          className="rounded-md bg-emerald-950 border border-emerald-800 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900"
                        >
                          Mark Won
                        </button>
                        <button
                          onClick={() => {
                            const score = prompt('Enter final score (e.g. 0 - 1):', p.finalScore || '0 - 1');
                            if (score !== null) handleUpdateStatus(p.id, 'LOST', score);
                          }}
                          className="rounded-md bg-red-950 border border-red-800 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-900"
                        >
                          Mark Lost
                        </button>
                        <button
                          onClick={() => handleTogglePin(p.id, p.isPinned)}
                          className={`p-1 rounded-md ${
                            p.isPinned ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                          title="Toggle pin"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrediction(p.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Moderation Reports */}
      {activeAdminSubTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-slate-200">No reported content pending!</p>
              <p className="text-xs text-slate-500 mt-1">Community feed is clean and compliant.</p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-2xl border border-red-700/40 bg-slate-900/80 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">
                    Author: {rep.authorName} · {rep.reportsCount} report flags
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismissReport(rep.id)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Dismiss Flags
                    </button>
                    <button
                      onClick={() => handleDeleteReportedPost(rep.id)}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Delete Post
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {rep.content}
                </p>

                <div className="text-[11px] text-slate-400">
                  <strong className="text-red-400">Report reasons:</strong>{' '}
                  {rep.reasons?.map((r: any) => r.reason).join(', ') || 'Community flag'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subtab 5: Users & VIP Management */}
      {activeAdminSubTab === 'users' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">VIP Status</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">{u.username}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isVip ? (
                        <span className="rounded-md bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          VIP ACTIVE
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="rounded-md bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-800">
                          BANNED
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVipUser(u.id)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:text-white"
                        >
                          {u.isVip ? 'Revoke VIP' : 'Grant VIP'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBanUser(u.id)}
                            className="rounded-lg border border-red-900 bg-red-950/60 px-2 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-900 hover:text-white"
                          >
                            {u.isBanned ? 'Unban' : 'Ban User'}
                          </button>
                        )}
                      </div>
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
