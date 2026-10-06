import React, { useState } from 'react';
import { 
  Network, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  Sun, 
  Moon, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  ShieldCheck,
  Server,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

interface AuthScreenProps {
  onSuccess?: () => void;
  onOpenLegal?: (tab: 'privacy' | 'terms') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onOpenLegal }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, register, continueAsGuest, isLoading, authError, clearError } = useAuthStore();
  const { theme, toggleTheme } = usePlaygroundStore();

  const handleClearErrors = () => {
    if (validationError) setValidationError(null);
    if (authError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearErrors();

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    if (isSignUp && !name.trim()) {
      setValidationError('Please enter your name');
      return;
    }

    let success = false;
    if (isSignUp) {
      success = await register(cleanEmail, password, name.trim());
    } else {
      success = await login(cleanEmail, password);
    }

    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] p-4 overflow-hidden select-none">
      {/* Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-panel)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shadow-sm cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl relative z-10 transition-all duration-200">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 mb-3.5">
            <Network className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
            System Design Playground
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs leading-relaxed">
            Interactive distributed systems architecture simulator & resilience testing canvas
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); handleClearErrors(); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); handleClearErrors(); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {(validationError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{validationError || authError}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={(e) => { setName(e.target.value); handleClearErrors(); }}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); handleClearErrors(); }}
                placeholder="engineer@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); handleClearErrors(); }}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-subtle)]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <span className="bg-[var(--bg-surface)] px-2.5">or</span>
          </div>
        </div>

        {/* Continue as Guest Button */}
        <button
          type="button"
          onClick={handleGuest}
          className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] text-[var(--text-main)] text-xs font-medium flex items-center justify-between group transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-xs">Continue as Guest</div>
              <div className="text-[10px] text-[var(--text-muted)]">Instant demo mode — no password needed</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all" />
        </button>

        {/* Highlights Footer */}
        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]/60 grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--text-muted)]">
          <div className="flex flex-col items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Simulation Engine</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Chaos Resilience</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Local & Cloud Saves</span>
          </div>
        </div>

        {/* Legal Links Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/40 flex items-center justify-center gap-3 text-[10px] text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => onOpenLegal?.('terms')}
            className="hover:text-[var(--text-main)] underline transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenLegal?.('privacy')}
            className="hover:text-[var(--text-main)] underline transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};
