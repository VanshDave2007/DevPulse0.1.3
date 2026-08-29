import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Sparkles,
  X,
  LogOut,
  Check,
  Shield,
  Activity,
  Award,
  Layers,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  signUpUser,
  signInUser,
  logOutUser,
  updateUserProfileDoc,
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, setUserProfile, isGuest } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email || !password || !name) {
          setError('Please complete all fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const newUser = await signUpUser(email, password, name);
        await updateUserProfileDoc(newUser.uid, {
          displayName: name,
          learningLevel,
        });

        setSuccessMsg('Account created successfully! Cloud sync enabled.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        if (!email || !password) {
          setError('Please provide your email and password.');
          setLoading(false);
          return;
        }

        await signInUser(email, password);
        setSuccessMsg('Welcome back to DevPulse!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please Sign In.');
      } else {
        setError(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
      setUserProfile(null);
      onClose();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <div
      id="devpulse-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-pulse-surface border border-pulse-subtle rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-pulse-muted hover:text-pulse-primary rounded-xl hover:bg-pulse-elevated transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {user ? (
          /* Profile View */
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xl font-mono">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <h3 className="text-base font-bold text-pulse-primary truncate">
                  {user.displayName || 'DevPulse Engineer'}
                </h3>
                <p className="text-xs text-pulse-muted truncate font-mono">{user.email}</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Cloud Firestore Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-pulse-muted font-mono">
                  <Activity className="h-3.5 w-3.5 text-teal-500" />
                  <span>Analyses Run</span>
                </div>
                <div className="text-lg font-bold font-mono text-pulse-primary">
                  {userProfile?.analysisCount || 1}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-pulse-bg border border-pulse-subtle space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-pulse-muted font-mono">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>Learning Level</span>
                </div>
                <div className="text-xs font-bold capitalize text-pulse-primary mt-1">
                  {userProfile?.learningLevel || 'Intermediate'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-pulse-muted">
                Signed in with secure Firebase Auth
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-pulse-accent mb-2">
                <Shield className="h-6 w-6 text-teal-500 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-extrabold text-pulse-primary tracking-tight">
                {mode === 'signin' ? 'Sign In to DevPulse' : 'Create DevPulse Account'}
              </h3>
              <p className="text-xs text-pulse-muted">
                Sync analysis history, learning checkpoints & custom rules across devices
              </p>
            </div>

            {/* Toggle Modes */}
            <div className="flex rounded-2xl bg-pulse-bg p-1 border border-pulse-subtle">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-pulse-surface text-pulse-primary shadow-sm'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-pulse-surface text-pulse-primary shadow-sm'
                    : 'text-pulse-muted hover:text-pulse-primary'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-pulse-secondary block mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3.5 py-2.5 bg-pulse-bg border border-pulse-subtle rounded-xl text-xs text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-pulse-accent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-pulse-secondary block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@devpulse.io"
                    className="w-full px-3.5 py-2.5 bg-pulse-bg border border-pulse-subtle rounded-xl text-xs text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-pulse-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-pulse-secondary block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-pulse-bg border border-pulse-subtle rounded-xl text-xs text-pulse-primary placeholder:text-pulse-muted focus:outline-none focus:border-pulse-accent"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-pulse-secondary block mb-1">
                    Experience Level (for tailored AI explanations)
                  </label>
                  <select
                    value={learningLevel}
                    onChange={(e) => setLearningLevel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-pulse-bg border border-pulse-subtle rounded-xl text-xs text-pulse-primary focus:outline-none focus:border-pulse-accent"
                  >
                    <option value="beginner">Beginner (Intuitive analogies & step-by-step)</option>
                    <option value="intermediate">Intermediate (Pragmatic patterns & trade-offs)</option>
                    <option value="advanced">Advanced (Deep memory model & systems)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                {loading
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? 'Sign In to DevPulse'
                  : 'Create Free Account'}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-pulse-muted">
                Guest access is always supported. Creating an account enables cloud persistence.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
