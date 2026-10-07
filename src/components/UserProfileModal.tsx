import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Crown,
  Shield,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Ban,
  X,
  Edit2,
  Save,
  Phone,
} from 'lucide-react';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  onClose,
  onOpenAuth,
}) => {
  const { user: currentUser, token, updateUser } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states for own profile
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const isMe = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/community/users/${userId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setEditUsername(data.user.username);
          setEditBio(data.user.bio || '');
        }
      } catch (_err) {
        console.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, token]);

  if (!userId) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setProfile((prev: any) => ({ ...prev, ...data.user }));
        setIsEditing(false);
      }
    } catch (_err) {
      console.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFriendAction = async (action: 'friend-request' | 'accept-friend' | 'remove-friend' | 'block') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await fetch(`/api/community/users/${userId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/community/users/${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch (_err) {
      console.error('Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !profile ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading profile information...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-900 flex items-center justify-center text-xl font-black text-white shadow-lg border border-emerald-500/30">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{profile.username}</h3>
                  {profile.isVip && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
                      <Crown className="w-3 h-3" /> VIP
                    </span>
                  )}
                  {profile.role === 'admin' && (
                    <span className="rounded-full bg-red-950 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-800">
                      ADMIN
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {isMe ? currentUser?.phone : profile.phoneMasked}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Network Friends
                </span>
                <span className="text-base font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {profile.friendsCount || 0}
                </span>
              </div>

              <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Member Since
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Analyst Bio
              </span>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    placeholder="Short bio..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800 leading-relaxed">
                  {profile.bio || 'This analyst hasn’t written a bio yet.'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              {isMe ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full justify-between">
                  {profile.isFriend ? (
                    <button
                      onClick={() => handleFriendAction('remove-friend')}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-400"
                    >
                      Remove Friend
                    </button>
                  ) : profile.hasPendingReceived ? (
                    <button
                      onClick={() => handleFriendAction('accept-friend')}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Accept Friend Request
                    </button>
                  ) : profile.hasPendingSent ? (
                    <span className="text-xs text-amber-400 font-semibold">Request Pending</span>
                  ) : (
                    <button
                      onClick={() => handleFriendAction('friend-request')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Send Friend Request</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleFriendAction('block')}
                    className="flex items-center gap-1 rounded-xl border border-red-900 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{profile.isBlocked ? 'Unblock' : 'Block'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
