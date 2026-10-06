import React, { useState, useEffect } from 'react';
import { Cookie, Shield, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacy?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('sdp_cookie_consent');
      if (!consent) {
        // Small delay to prevent initial page layout jump
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage unavailable/blocked
    }
  }, []);

  const handleConsent = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem('sdp_cookie_consent', level);
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-sm sm:max-w-md w-[calc(100%-2rem)] z-50 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl backdrop-blur-md animate-fadeIn"
      role="region"
      aria-label="Cookie consent banner"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>Cookie & Telemetry Preferences</span>
              <Shield className="w-3.5 h-3.5 text-blue-500" />
            </h2>
            <button
              onClick={() => handleConsent('essential')}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss banner with essential cookies only"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
            We use essential local storage for architectures and anonymous performance telemetry to optimize the simulation engine. Zero ad-trackers.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleConsent('all')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => handleConsent('essential')}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] text-[var(--text-main)] text-[11px] font-medium transition-colors cursor-pointer"
            >
              Essential Only
            </button>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-[11px] text-blue-500 hover:text-blue-400 underline ml-auto transition-colors cursor-pointer"
              >
                Learn More
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
