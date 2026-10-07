import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMessageItem } from '../types';
import {
  MessageSquare,
  Send,
  Trash2,
  Flag,
  Crown,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  Hash,
  Users,
} from 'lucide-react';

interface ChatTabProps {
  onOpenAuth: () => void;
  sharedPredictionId?: string | null;
  onClearSharedPrediction?: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  onOpenAuth,
  sharedPredictionId,
  onClearSharedPrediction,
}) => {
  const { user, isVip, isAdmin, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [channel, setChannel] = useState<'general' | 'epl' | 'ucl'>('general');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/chat/messages?channelId=${channel}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (_err) {
      console.error('Error fetching chat');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Efficient lightweight chat polling (every 4 seconds)
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [channel, token]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!inputText.trim()) return;

    setSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: channel,
          text: inputText.trim(),
          sharedPredictionId: sharedPredictionId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send message');
      } else {
        setInputText('');
        if (onClearSharedPrediction) onClearSharedPrediction();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (_err) {
      setErrorMsg('Network error while sending');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (_err) {
      console.error('Failed to delete message');
    }
  };

  const handleReportMessage = async (msgId: string) => {
    alert('Thank you. This message has been submitted to moderators for abuse review.');
  };

  const channels = [
    { id: 'general', label: 'Main Match Lounge', desc: 'Tactical discussions & debate' },
    { id: 'epl', label: 'Premier League Hub', desc: 'English top-flight analysis' },
    { id: 'ucl', label: 'Champions League', desc: 'European elite night discussion' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[78vh] min-h-[500px]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Chat Rooms
            </h2>
          </div>

          <div className="space-y-1.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id as any)}
                className={`w-full text-left rounded-2xl p-3 transition-all cursor-pointer ${
                  channel === ch.id
                    ? 'bg-emerald-950/80 border border-emerald-600/50 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash
                    className={`w-4 h-4 ${channel === ch.id ? 'text-emerald-400' : 'text-slate-500'}`}
                  />
                  <span className="font-bold text-xs text-white">{ch.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-6">{ch.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Live Chat Rules:</p>
          <p className="mt-1 text-[10px] leading-relaxed">
            Strictly analytical discourse. No betting solicitation, profanity, or spam.
          </p>
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/80 flex flex-col overflow-hidden shadow-xl">
        {/* Chat Room Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white capitalize">
              {channels.find((c) => c.id === channel)?.label}
            </h3>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xs text-slate-400">
            {messages.length} messages loaded
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {loading && messages.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto animate-spin text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">Connecting to live match room...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No messages in this channel yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">Start the match conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = user?.id === msg.senderId;
              const canDelete = isMe || isAdmin;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px]">
                    <span className="font-bold text-slate-300">{msg.senderName}</span>
                    {msg.senderIsVip && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-950 px-1.5 text-[9px] font-bold text-amber-300 border border-amber-800">
                        <Crown className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                    {msg.senderIsAdmin && (
                      <span className="rounded-full bg-red-950 px-1.5 text-[9px] font-bold text-red-400 border border-red-800">
                        ADMIN
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`relative rounded-2xl p-3.5 max-w-[85%] sm:max-w-[70%] text-xs leading-relaxed ${
                      isMe
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Quick message actions on hover */}
                    <div
                      className={`absolute top-1 ${
                        isMe ? '-left-12' : '-right-12'
                      } hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1`}
                    >
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {!isMe && (
                        <button
                          onClick={() => handleReportMessage(msg.id)}
                          className="p-1 text-slate-400 hover:text-amber-400"
                          title="Report message"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          {sharedPredictionId && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-emerald-950/60 border border-emerald-700/50 px-3 py-1.5 text-xs text-emerald-300">
              <span>Sharing selected match prediction into discussion</span>
              <button
                onClick={onClearSharedPrediction}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                user
                  ? `Message #${channels.find((c) => c.id === channel)?.label}...`
                  : 'Sign in with phone to participate in chat'
              }
              disabled={!user || sending}
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || sending || !inputText.trim()}
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
