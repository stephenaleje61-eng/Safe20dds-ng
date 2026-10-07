import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Phone, User as UserIcon, Shield, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);

  // Form states
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What is your favorite football club?');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(phone, password);
        if (!res.success) {
          setError(res.error || 'Login failed. Please check your credentials.');
        } else {
          onClose();
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const res = await register({
          phone,
          username,
          password,
          securityQuestion,
          securityAnswer,
        });
        if (!res.success) {
          setError(res.error || 'Registration failed.');
        } else {
          setSuccessMsg('Account created successfully! Welcome to Sure Odd.');
          setTimeout(() => onClose(), 800);
        }
      } else if (mode === 'recover') {
        const res = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            newPassword: password,
            securityAnswer,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Account recovery failed.');
        } else {
          setSuccessMsg(data.message || 'Password reset! You can now log in.');
          setTimeout(() => setMode('login'), 1200);
        }
      }
    } catch (_err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autofillAdmin = () => {
    setPhone('+2348000000000');
    setPassword('admin123');
    setError(null);
  };

  const autofillMember = () => {
    setPhone('+2348123456789');
    setPassword('user1234');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-800/40 bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Crest */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src="/icon.svg"
            alt="Sure Odd Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-md"
          />
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Sure Odd</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Secure Account
              </span>
            </h2>
            <p className="text-xs text-slate-400">Phone-based access · No email required</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950/70 p-1 mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('recover');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'recover'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recovery
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-800/40 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-700/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Display Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Victor_Analyst"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348012345678 or 08012345678"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              International or local mobile number
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mode === 'recover' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'recover') && (
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                Security Question: {mode === 'recover' ? 'Favorite Football Club' : 'Select Question'}
              </label>
              {mode === 'register' && (
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white mb-2 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="What is your favorite football club?">What is your favorite football club?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="What is your favorite sports legend name?">What is your favorite sports legend name?</option>
                </select>
              )}
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Your Answer (e.g. Arsenal, Chelsea, Messi)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <Shield className="w-4 h-4" />
                Sign In to Sure Odd
              </>
            ) : mode === 'register' ? (
              'Create Sure Odd Account'
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons for Testing */}
        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 text-center uppercase tracking-wider">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={autofillAdmin}
                className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/40 hover:text-white transition cursor-pointer text-left"
              >
                <span className="block text-[10px] text-red-400 font-bold">ADMIN ROLE</span>
                <span>+234 800 000 0000</span>
              </button>
              <button
                type="button"
                onClick={autofillMember}
                className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 hover:text-white transition cursor-pointer text-left"
              >
                <span className="block text-[10px] text-emerald-400 font-bold">VIP MEMBER</span>
                <span>+234 812 345 6789</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
