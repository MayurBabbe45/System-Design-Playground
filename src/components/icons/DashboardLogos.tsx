import React from 'react';

export interface DashboardLogoProps {
  size?: number;
  className?: string;
}

/**
 * 1. StudioBrandLogo
 * The flagship brand logo for System Design Playground:
 * An isometric distributed system cube with interconnected glowing nodes,
 * gradient data vectors, and an electric core hub.
 */
export const StudioBrandLogo: React.FC<DashboardLogoProps> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="brand-grad-bg" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563eb" />
        <stop offset="0.5" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id="brand-core-glow" x1="12" y1="12" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
      <filter id="brand-glow" x="-2" y="-2" width="40" height="40" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Rounded Squircle Container */}
    <rect width="36" height="36" rx="9" fill="url(#brand-grad-bg)" />
    
    {/* Subtle Inner Highlight */}
    <rect x="0.75" y="0.75" width="34.5" height="34.5" rx="8.25" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />

    {/* Distributed Architecture Network Vectors */}
    {/* Top Node to Center */}
    <line x1="18" y1="9" x2="18" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="2 1.5" />
    {/* Center to Bottom-Left */}
    <line x1="18" y1="18" x2="10" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="2 1.5" />
    {/* Center to Bottom-Right */}
    <line x1="18" y1="18" x2="26" y2="25" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="2 1.5" />

    {/* Lateral Interconnect Bus */}
    <path d="M10 25C13 28 23 28 26 25" stroke="rgba(56,189,248,0.85)" strokeWidth="1.2" strokeLinecap="round" />

    {/* Core Gateway Node */}
    <circle cx="18" cy="18" r="4.2" fill="url(#brand-core-glow)" stroke="#ffffff" strokeWidth="1.2" />

    {/* Peripheral Distributed Satellite Nodes */}
    {/* Top Ingress Node */}
    <circle cx="18" cy="9" r="2.8" fill="#ffffff" />
    <circle cx="18" cy="9" r="1.5" fill="#2563eb" />

    {/* Bottom Left Compute Node */}
    <circle cx="10" cy="25" r="2.8" fill="#ffffff" />
    <circle cx="10" cy="25" r="1.5" fill="#06b6d4" />

    {/* Bottom Right Database Node */}
    <circle cx="26" cy="25" r="2.8" fill="#ffffff" />
    <circle cx="26" cy="25" r="1.5" fill="#8b5cf6" />
  </svg>
);

/**
 * 2. TemplateBlankSvg
 * Clean architecture blueprint with drafting grid, crosshairs,
 * and an uncommitted initial node vector.
 */
export const TemplateBlankSvg: React.FC<DashboardLogoProps> = ({
  size = 32,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="t-blank-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" stopOpacity="0.2" />
        <stop offset="1" stopColor="#0284c7" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    {/* Background Base */}
    <rect width="32" height="32" rx="8" fill="url(#t-blank-grad)" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" />

    {/* Blueprint Coordinate Crosshairs */}
    <line x1="16" y1="6" x2="16" y2="26" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 2" />
    <line x1="6" y1="16" x2="26" y2="16" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 2" />

    {/* Crosshair Marks at corners */}
    <path d="M8 8H11M8 8V11" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M24 8H21M24 8V11" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M8 24H11M8 24V21" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M24 24H21M24 24V21" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />

    {/* Center Bold Plus / Add Node Glyph */}
    <circle cx="16" cy="16" r="5" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.2" />
    <line x1="16" y1="13.5" x2="16" y2="18.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.5" y1="16" x2="18.5" y2="16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 3. TemplateMultiAzSvg
 * Multi-Availability Zone HA Architecture:
 * Load balancer distributor on top feeding redundant dual-zone
 * server stacks and synchronized database replicas.
 */
export const TemplateMultiAzSvg: React.FC<DashboardLogoProps> = ({
  size = 32,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="t-az-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" stopOpacity="0.25" />
        <stop offset="1" stopColor="#059669" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="t-az-shield" x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#t-az-grad)" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />

    {/* Load Balancer Gateway at top */}
    <rect x="12" y="6" width="8" height="4.5" rx="2" fill="#10b981" />
    <circle cx="16" cy="8.25" r="1" fill="#ffffff" />

    {/* Dual Diverging Traffic Channels */}
    <path d="M14 10.5L9.5 14" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18 10.5L22.5 14" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />

    {/* Zone A (Left Box) */}
    <rect x="6" y="14" width="7" height="9" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
    <line x1="8" y1="17" x2="11" y2="17" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
    <circle cx="8" cy="20.5" r="0.8" fill="#34d399" />
    <circle cx="10.5" cy="20.5" r="0.8" fill="#34d399" />

    {/* Zone B (Right Box) */}
    <rect x="19" y="14" width="7" height="9" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
    <line x1="21" y1="17" x2="24" y2="17" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />
    <circle cx="21" cy="20.5" r="0.8" fill="#34d399" />
    <circle cx="23.5" cy="20.5" r="0.8" fill="#34d399" />

    {/* Cross-AZ Replication Sync Bridge */}
    <line x1="13" y1="21" x2="19" y2="21" stroke="#34d399" strokeWidth="1" strokeDasharray="1.5 1.5" />

    {/* Small Heartbeat Shield Beacon */}
    <circle cx="16" cy="26" r="1.8" fill="#10b981" />
    <circle cx="16" cy="26" r="0.8" fill="#ffffff" />
  </svg>
);

/**
 * 4. TemplateFlashSaleSvg
 * Surge Pipeline & High Throughput Architecture:
 * Pulsing surge lightning, API Gateway rate-limit funnel,
 * and high-frequency message queue buffer.
 */
export const TemplateFlashSaleSvg: React.FC<DashboardLogoProps> = ({
  size = 32,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="t-surge-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" stopOpacity="0.25" />
        <stop offset="1" stopColor="#d97706" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="t-bolt-grad" x1="10" y1="6" x2="22" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24" />
        <stop offset="1" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#t-surge-grad)" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" />

    {/* Ingress Radiating Surge Waves */}
    <path d="M5 11C7 9.5 9 9.5 11 11" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M5 16C7 14.5 9 14.5 11 16" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 21C7 19.5 9 19.5 11 21" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />

    {/* Central Dynamic Lightning Bolt */}
    <path
      d="M18 5L11 15H17L14 27L23 14H17L18 5Z"
      fill="url(#t-bolt-grad)"
      stroke="#ffffff"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />

    {/* Right Queue Buffer Conveyor */}
    <rect x="23" y="10" width="4.5" height="12" rx="2" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
    <circle cx="25.25" cy="13" r="1" fill="#fde68a" />
    <circle cx="25.25" cy="16" r="1" fill="#fbbf24" />
    <circle cx="25.25" cy="19" r="1" fill="#f59e0b" />
  </svg>
);

/**
 * 5. TemplateCqrsSvg
 * CQRS, Event Sourcing & Decoupled Streaming Architecture:
 * Split Command Write Path and Query Read Path with central
 * Kafka Event Bus ring.
 */
export const TemplateCqrsSvg: React.FC<DashboardLogoProps> = ({
  size = 32,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="t-cqrs-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" stopOpacity="0.25" />
        <stop offset="1" stopColor="#6d28d9" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="t-cqrs-ring" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#t-cqrs-grad)" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" />

    {/* Central Event Streaming Ring */}
    <circle cx="16" cy="16" r="6" stroke="url(#t-cqrs-ring)" strokeWidth="1.6" strokeDasharray="4 2" />
    <circle cx="16" cy="16" r="2.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="0.8" />

    {/* Command Write Path (Top Arrow into event ring) */}
    <path d="M7 10H13M13 10L10.5 7.5M13 10L10.5 12.5" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="4" y="8" width="5" height="4" rx="1.5" fill="#831843" stroke="#ec4899" strokeWidth="0.8" />

    {/* Query Read Path (Bottom Arrow out of materialized view) */}
    <path d="M19 22H25M25 22L22.5 19.5M25 22L22.5 24.5" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="23" y="20" width="5" height="4" rx="1.5" fill="#164e63" stroke="#06b6d4" strokeWidth="0.8" />

    {/* Read Replica DB Cylinder at Top-Right */}
    <ellipse cx="24.5" cy="8.5" rx="2.5" ry="1.2" fill="#a78bfa" />
    <path d="M22 8.5V11C22 11.8 23.1 12.5 24.5 12.5C25.9 12.5 27 11.8 27 11V8.5" stroke="#a78bfa" strokeWidth="0.8" />

    {/* Event Log Store Cylinder at Bottom-Left */}
    <ellipse cx="7.5" cy="20.5" rx="2.5" ry="1.2" fill="#c084fc" />
    <path d="M5 20.5V23C5 23.8 6.1 24.5 7.5 24.5C8.9 24.5 10 23.8 10 23V20.5" stroke="#c084fc" strokeWidth="0.8" />
  </svg>
);

/**
 * 6. ArchitectureArchetypeIcon
 * Intelligently computes a rich, thematic SVG icon badge for any architecture
 * based on its name, metadata, or topology profile.
 */
export const ArchitectureArchetypeIcon: React.FC<{
  name: string;
  isFork?: boolean;
  size?: number;
}> = ({ name, isFork = false, size = 32 }) => {
  const lower = name.toLowerCase();

  // 1. Forked Architectures: Branching Topology SVG
  if (isFork || lower.includes('fork') || lower.includes('copy')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#0284c7" fillOpacity="0.12" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" />
        {/* Main branch trunk */}
        <line x1="11" y1="8" x2="11" y2="24" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
        {/* Diverging branch fork */}
        <path d="M11 20C11 16 16 15 21 15V8" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
        {/* Origin Commit */}
        <circle cx="11" cy="24" r="2.2" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
        {/* Forked Child Head */}
        <circle cx="21" cy="8" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
        {/* Master Branch Head */}
        <circle cx="11" cy="8" r="2.2" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }

  // 2. High-Throughput / Scale / Flash Sale / 1m System
  if (lower.includes('1m') || lower.includes('flash') || lower.includes('sale') || lower.includes('surge') || lower.includes('scale')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#ea580c" fillOpacity="0.12" stroke="#f97316" strokeWidth="1" strokeOpacity="0.35" />
        {/* Radiant Ingress Pulse Wave */}
        <path d="M7 16H13M13 16L17 9L19 23L22 16H25" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="9" r="1.5" fill="#fde047" />
        <circle cx="19" cy="23" r="1.5" fill="#ea580c" />
        <circle cx="25" cy="16" r="2" fill="#f97316" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="7" cy="16" r="1.8" fill="#ffedd5" />
      </svg>
    );
  }

  // 3. Multi-AZ / High Availability / Web App
  if (lower.includes('multi-az') || lower.includes('ha') || lower.includes('web') || lower.includes('zone')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeWidth="1" strokeOpacity="0.35" />
        {/* Dual Availability Zone Towers */}
        <rect x="7" y="11" width="7" height="13" rx="2" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
        <rect x="18" y="11" width="7" height="13" rx="2" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
        {/* Synchronous Replication Line */}
        <line x1="14" y1="17" x2="18" y2="17" stroke="#34d399" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
        {/* Load Balancer Crown Top */}
        <path d="M16 6L11 11H21L16 6Z" fill="#10b981" stroke="#34d399" strokeWidth="0.8" />
        <circle cx="16" cy="8.5" r="1" fill="#ffffff" />
      </svg>
    );
  }

  // 4. CQRS / Event Streaming / Kafka / Queue / Async
  if (lower.includes('cqrs') || lower.includes('stream') || lower.includes('kafka') || lower.includes('queue') || lower.includes('event')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#8b5cf6" fillOpacity="0.12" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.35" />
        {/* Circular Loop Stream */}
        <circle cx="16" cy="16" r="7" stroke="#a78bfa" strokeWidth="1.4" strokeDasharray="3 2" />
        <circle cx="16" cy="9" r="2" fill="#8b5cf6" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="23" cy="16" r="2" fill="#a78bfa" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="16" cy="23" r="2" fill="#6366f1" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="9" cy="16" r="2" fill="#c084fc" stroke="#ffffff" strokeWidth="0.8" />
      </svg>
    );
  }

  // 5. Default: Modern Distributed Mesh Architecture Blueprint
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#2563eb" fillOpacity="0.12" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" />
      {/* Topology Triangle */}
      <line x1="16" y1="8" x2="9" y2="23" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="2 1.5" />
      <line x1="16" y1="8" x2="23" y2="23" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="2 1.5" />
      <line x1="9" y1="23" x2="23" y2="23" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="2 1.5" />
      {/* Node Vertices */}
      <circle cx="16" cy="8" r="2.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
      <circle cx="9" cy="23" r="2.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
      <circle cx="23" cy="23" r="2.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
};
