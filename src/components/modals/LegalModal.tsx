import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  // Sync tab when opened with specific tab
  React.useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {activeTab === 'privacy' ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base font-bold text-[var(--text-main)]">
                {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Last updated: October 2026 • Effective immediately
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border-subtle)] px-6 bg-[var(--bg-panel)]/40">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs text-[var(--text-muted)] space-y-5 leading-relaxed">
          {activeTab === 'privacy' ? (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  1. Privacy Commitment & GDPR/CCPA Compliance
                </h3>
                <p>
                  System Design Playground values your privacy and is engineered with minimal telemetry and zero surveillance.
                  We do not sell, rent, or trade your personal data with third-party advertisers. All data handling strictly adheres to GDPR, CCPA, and global privacy standards.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  2. Local Browser Storage
                </h3>
                <p>
                  By default, guest architectures, local presets, canvas layouts, and theme preferences are stored entirely client-side using browser <code className="px-1.5 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-main)] font-mono">localStorage</code>. 
                  This data never leaves your computer unless you explicitly choose to authenticate or share a cloud link.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  3. Telemetry & Performance Buffer
                </h3>
                <p>
                  During simulation runs, anonymous aggregate metrics (e.g. system throughput, P95 latency distributions, queue utilization, and bottleneck types) are buffered to analyze simulation accuracy. 
                  These telemetry points contain zero personally identifiable information (PII).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  4. Authentication & Data Erasure
                </h3>
                <p>
                  When you register an account, your email and cryptographically hashed password (via bcrypt) are securely stored. You retain full rights to request complete deletion of your account and associated architecture designs at any time.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  1. Acceptable Use
                </h3>
                <p>
                  System Design Playground provides an educational and technical design environment for simulating distributed systems architecture, capacity planning, and resilience engineering. 
                  You agree not to use the service for denial-of-service simulations targeting external networks or distributing malicious payloads.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  2. Simulation Fidelity Disclaimer
                </h3>
                <p>
                  The discrete-event simulation engine and Jackson network queuing models produce stochastic approximations based on configured parameters. 
                  While calibrated for realistic behavior, simulation outputs are educational models and do not constitute absolute engineering guarantees or production SLAs.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  3. Intellectual Property
                </h3>
                <p>
                  All architectural diagrams, topologies, and configurations you design remain your exclusive intellectual property. 
                  You grant System Design Playground only the minimal non-exclusive rights necessary to render, simulate, and synchronize your canvas across collaborating peers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  4. Limitation of Liability
                </h3>
                <p>
                  The software is provided &quot;as is&quot;, without warranty of any kind. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of the simulator.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]/30">
          <span className="text-[11px] text-[var(--text-muted)]">
            Questions? Contact support@systemdesignplayground.com
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
