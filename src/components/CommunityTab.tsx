import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PostItem, CommentItem } from '../types';
import {
  Users,
  MessageCircle,
  Heart,
  Share2,
  Flag,
  Send,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Sparkles,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';

interface CommunityTabProps {
  onOpenAuth: () => void;
  onOpenUserProfile: (userId: string) => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  onOpenAuth,
  onOpenUserProfile,
}) => {
  const { user, isVip, isAdmin, token } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Post composer
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Active comments modal / drawer
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Report modal
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Spam or promotional gambling links');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // User search modal
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/community/posts', { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (_err) {
      console.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newContent.trim()) return;

    setPosting(true);
    setPostError(null);

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newContent,
          imageUrl: newImageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error || 'Failed to submit post');
      } else {
        setNewContent('');
        setNewImageUrl('');
        fetchPosts();
      }
    } catch (_err) {
      setPostError('Network error while posting.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_err) {
      fetchPosts();
    }
  };

  const openComments = async (postId: string) => {
    setActiveCommentsPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (_err) {
      console.error('Error fetching comments');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newComment.trim() || !activeCommentsPostId) return;

    setCommenting(true);
    try {
      const res = await fetch(`/api/community/posts/${activeCommentsPostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        // Update comments count on post
        setPosts((prev) =>
          prev.map((p) =>
            p.id === activeCommentsPostId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          )
        );
      }
    } catch (_err) {
      console.error('Failed to post comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleReportPost = async () => {
    if (!reportingPostId || !user) return;
    try {
      const res = await fetch(`/api/community/posts/${reportingPostId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      setReportSuccess(data.message || 'Report submitted to moderators.');
      setTimeout(() => {
        setReportingPostId(null);
        setReportSuccess(null);
      }, 1500);
    } catch (_err) {
      console.error('Failed to report');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post?')) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (_err) {
      console.error('Failed to delete post');
    }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/community/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (_err) {
      console.error('Search error');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      await fetch(`/api/community/users/${targetId}/friend-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, hasPendingRequest: true } : u))
      );
    } catch (_err) {
      console.error('Friend request failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Community Header & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white">Sports Analysts Community</h2>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Share match insights, debate tactical lineups, connect with sports fans, and build your analyst network.
          </p>
        </div>

        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Find Other Analysts</span>
        </button>
      </div>

      {/* Post Composer */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <form onSubmit={handleCreatePost} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700/60 flex items-center justify-center text-xs font-black text-emerald-300">
              {user ? user.username.slice(0, 2).toUpperCase() : 'SO'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {user ? user.username : 'Guest User'}
              </p>
              <p className="text-[10px] text-slate-400">
                {user ? (isVip ? 'VIP Sports Analyst' : 'Member') : 'Sign in to publish analysis'}
              </p>
            </div>
          </div>

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share your match analysis, tactical thoughts, or predictions discussion... (Strictly no gambling links)"
            rows={3}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Optional Match Image URL (https://...)"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-1 focus:border-emerald-500 focus:outline-hidden"
            />

            <button
              type="submit"
              disabled={posting || !newContent.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer shrink-0"
            >
              {posting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Analysis</span>
                </>
              )}
            </button>
          </div>

          {postError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{postError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Community Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-2" />
            <p className="text-xs font-semibold">Loading community discourse...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No community posts yet.</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to share a match prediction!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOwner = user?.id === post.authorId;
            const canDelete = isOwner || isAdmin;

            return (
              <div
                key={post.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-md hover:border-slate-700/80 transition-all space-y-4"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenUserProfile(post.authorId)}
                      className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-900 border border-emerald-600/30 flex items-center justify-center text-xs font-black text-emerald-300 cursor-pointer"
                    >
                      {post.authorName.slice(0, 2).toUpperCase()}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenUserProfile(post.authorId)}
                          className="text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer text-left"
                        >
                          {post.authorName}
                        </button>
                        {post.authorIsVip && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-950 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-800">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {post.authorPhoneMasked} · {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setReportingPostId(post.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Report inappropriate content"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Post Image */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-80 bg-slate-950">
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                        post.hasLiked ? 'text-red-500' : 'hover:text-red-400'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${post.hasLiked ? 'fill-current text-red-500' : ''}`}
                      />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => openComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-emerald-400 font-semibold transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comments Drawer / Modal */}
      {activeCommentsPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Comments &amp; Analysis Responses
              </h3>
              <button
                onClick={() => setActiveCommentsPostId(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No comments yet. Share your thoughts!
                </p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        {comm.authorName}
                        {comm.authorIsVip && (
                          <Crown className="w-3 h-3 text-amber-400 inline" />
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(comm.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{comm.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment input form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a constructive sports comment..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Search & Network Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Find Analysts &amp; Fans
              </h3>
              <button
                onClick={() => setShowSearch(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or phone..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <p className="text-xs text-slate-400 py-6 text-center">Searching analysts...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Enter a name to connect with other prediction enthusiasts.
                </p>
              ) : (
                searchResults.map((usr) => (
                  <div
                    key={usr.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setShowSearch(false);
                            onOpenUserProfile(usr.id);
                          }}
                          className="font-bold text-xs text-white hover:text-emerald-400"
                        >
                          {usr.username}
                        </button>
                        {usr.isVip && (
                          <Crown className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{usr.phoneMasked}</p>
                    </div>

                    <div>
                      {usr.isFriend ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5" /> Friends
                        </span>
                      ) : usr.hasPendingRequest ? (
                        <span className="text-[11px] text-amber-400 font-semibold">
                          Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(usr.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-red-700/50 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" />
                Report Post
              </h3>
              <button
                onClick={() => setReportingPostId(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <p className="text-xs text-emerald-300 py-4 text-center">{reportSuccess}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select why you are flagging this post for administrator moderation:
                </p>

                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                >
                  <option value="Spam or promotional gambling links">Spam or promotional gambling links</option>
                  <option value="Fake guaranteed winnings or scam claims">Fake guaranteed winnings or scam claims</option>
                  <option value="Abusive or offensive language">Abusive or offensive language</option>
                  <option value="Harassment or rule violation">Harassment or rule violation</option>
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setReportingPostId(null)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportPost}
                    className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-500 transition"
                  >
                    Confirm Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
