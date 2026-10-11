import React from 'react';
import { ComponentTypeId } from '../../types/playground';

export interface ComponentIconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * 1. Traffic Generator (n8n Webhook / Client Ingress Trigger)
 * Signature coral-orange trigger beacon with radiating pulse rings and electric lightning bolt.
 */
export const TrafficGeneratorIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#ff6d5a',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="tg-coral-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff7849" />
        <stop offset="1" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    {/* Outer dynamic pulse ring */}
    <circle cx="20" cy="20" r="17" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" strokeDasharray="4 3" />
    <circle cx="20" cy="20" r="13" stroke={color} strokeWidth="2" strokeOpacity="0.5" />

    {/* Core Ingress Hub */}
    <circle cx="20" cy="20" r="9.5" fill="url(#tg-coral-grad)" />

    {/* Clean White Lightning Bolt Trigger */}
    <path
      d="M21 13.5L16.5 20.5H20.5L19 26.5L24.5 19.5H20.5L21 13.5Z"
      fill="#ffffff"
      stroke="#ffffff"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 2. Load Balancer (Directional Routing Signpost / Dispatcher - matching n8n's iconic green/cyan switch node)
 * Solid vertical post with two clean horizontal directional signs pointing left and right with route arrowheads.
 */
export const LoadBalancerIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#06b6d4',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="lb-post" x1="18" y1="5" x2="22" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0891b2" />
        <stop offset="1" stopColor="#164e63" />
      </linearGradient>
      <linearGradient id="lb-sign-left" x1="7" y1="11" x2="27" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" />
        <stop offset="1" stopColor="#0891b2" />
      </linearGradient>
      <linearGradient id="lb-sign-right" x1="13" y1="21" x2="33" y2="29" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="1" stopColor="#0e7490" />
      </linearGradient>
    </defs>
    {/* Base Mounting Cap */}
    <ellipse cx="20" cy="34" rx="7" ry="2.5" fill="#0e7490" fillOpacity="0.4" />

    {/* Vertical Signpost */}
    <rect x="18.5" y="6" width="3" height="28" rx="1.5" fill="url(#lb-post)" />
    <circle cx="20" cy="6" r="2.5" fill="#22d3ee" />

    {/* Upper Sign (Pointing Left) */}
    <path
      d="M10 15L15 11H26C27.1 11 28 11.9 28 13V17C28 18.1 27.1 19 26 19H15L10 15Z"
      fill="url(#lb-sign-left)"
    />
    {/* Sign 1 Directional Indicator */}
    <path d="M15 15H23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 13L14 15L17 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Lower Sign (Pointing Right) */}
    <path
      d="M30 25L25 21H14C12.9 21 12 21.9 12 23V27C12 28.1 12.9 29 14 29H25L30 25Z"
      fill="url(#lb-sign-right)"
    />
    {/* Sign 2 Directional Indicator */}
    <path d="M17 25H25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M23 23L26 25L23 27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 3. App Server (EC2 Compute Pod / Multi-Core Processor)
 * Royal blue processor die with golden perimeter contact pins and central silicon core.
 */
export const WebServerIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#3b82f6',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="cpu-grad" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="core-grad" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Bus Contact Pins (Top & Bottom) */}
    <rect x="13" y="4" width="2.5" height="4" rx="1" fill="#93c5fd" />
    <rect x="18.75" y="4" width="2.5" height="4" rx="1" fill="#93c5fd" />
    <rect x="24.5" y="4" width="2.5" height="4" rx="1" fill="#93c5fd" />

    <rect x="13" y="32" width="2.5" height="4" rx="1" fill="#93c5fd" />
    <rect x="18.75" y="32" width="2.5" height="4" rx="1" fill="#93c5fd" />
    <rect x="24.5" y="32" width="2.5" height="4" rx="1" fill="#93c5fd" />

    {/* Bus Contact Pins (Left & Right) */}
    <rect x="4" y="13" width="4" height="2.5" rx="1" fill="#93c5fd" />
    <rect x="4" y="18.75" width="4" height="2.5" rx="1" fill="#93c5fd" />
    <rect x="4" y="24.5" width="4" height="2.5" rx="1" fill="#93c5fd" />

    <rect x="32" y="13" width="4" height="2.5" rx="1" fill="#93c5fd" />
    <rect x="32" y="18.75" width="4" height="2.5" rx="1" fill="#93c5fd" />
    <rect x="32" y="24.5" width="4" height="2.5" rx="1" fill="#93c5fd" />

    {/* Main Silicon Chip Chassis */}
    <rect x="7.5" y="7.5" width="25" height="25" rx="5" fill="url(#cpu-grad)" stroke="#93c5fd" strokeWidth="1.5" />

    {/* Central Processor Core */}
    <rect x="13.5" y="13.5" width="13" height="13" rx="2.5" fill="url(#core-grad)" stroke="#ffffff" strokeWidth="1.25" />

    {/* Core Circuit Center Matrix */}
    <rect x="17.5" y="17.5" width="5" height="5" rx="1" fill="#ffffff" />
  </svg>
);

/**
 * 4. PostgreSQL Relational Database
 * Iconic 3D cylindrical database with glossy disk tiers and relational table matrix.
 */
export const RelationalDbIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#2563eb',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="db-body" x1="7" y1="8" x2="33" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="db-top-disc" x1="7" y1="6" x2="33" y2="14" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    {/* Base Shadow */}
    <ellipse cx="20" cy="34" rx="13" ry="4" fill="#1e40af" fillOpacity="0.3" />

    {/* Database Cylinder Lower Body */}
    <path
      d="M7 10V29C7 32.5 12.8 35 20 35C27.2 35 33 32.5 33 29V10"
      fill="url(#db-body)"
      stroke="#1e40af"
      strokeWidth="1.5"
    />

    {/* Disk Tier Dividers */}
    <path d="M7 17C7 20 12.8 22.5 20 22.5C27.2 22.5 33 20 33 17" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 24C7 27 12.8 29.5 20 29.5C27.2 29.5 33 27 33 24" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />

    {/* Top Glossy Disk */}
    <ellipse cx="20" cy="10" rx="13" ry="5" fill="url(#db-top-disc)" stroke="#dbeafe" strokeWidth="1.5" />

    {/* Relational Grid Symbol Overlay */}
    <rect x="15.5" y="14" width="9" height="7.5" rx="1.5" fill="#ffffff" />
    <line x1="15.5" y1="17.75" x2="24.5" y2="17.75" stroke="#1d4ed8" strokeWidth="1.25" />
    <line x1="20" y1="14" x2="20" y2="21.5" stroke="#1d4ed8" strokeWidth="1.25" />
  </svg>
);

/**
 * 5. Redis Cache Cluster
 * High-speed layered crimson memory slabs with prominent golden electric lightning accelerator.
 */
export const CacheIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#ef4444',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="cache-slab-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f87171" />
        <stop offset="1" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="cache-bolt-grad" x1="16" y1="8" x2="24" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="1" stopColor="#eab308" />
      </linearGradient>
    </defs>
    {/* Base Memory Slab Bottom */}
    <path
      d="M6 25L20 32L34 25"
      stroke="#b91c1c"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Middle Memory Slab */}
    <path
      d="M6 19L20 26L34 19"
      stroke="#ef4444"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Top Memory Slab Diamond */}
    <path
      d="M6 13L20 6.5L34 13L20 19.5L6 13Z"
      fill="url(#cache-slab-grad)"
      stroke="#ffffff"
      strokeWidth="1.25"
    />

    {/* Golden Lightning Accelerator */}
    <path
      d="M22 8L14 18H20.5L17.5 28L26 17H19.5L22 8Z"
      fill="url(#cache-bolt-grad)"
      stroke="#ffffff"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 6. Kafka Message Queue (Event Streaming Bus)
 * Symmetrical distributed broker cluster: central nexus connected to 3 orbiting partition nodes with flowing messages.
 */
export const MessageQueueIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#6366f1',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="kafka-core-grad" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    {/* Connected Bus Pipelines */}
    <line x1="20" y1="20" x2="9" y2="12" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
    <line x1="20" y1="20" x2="31" y2="12" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
    <line x1="20" y1="20" x2="20" y2="33" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

    {/* Central Broker Hub */}
    <circle cx="20" cy="20" r="7.5" fill="url(#kafka-core-grad)" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="20" cy="20" r="3" fill="#ffffff" />

    {/* Top-Left Broker Partition */}
    <circle cx="9" cy="12" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="9" cy="12" r="2" fill="#c7d2fe" />

    {/* Top-Right Broker Partition */}
    <circle cx="31" cy="12" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="31" cy="12" r="2" fill="#c7d2fe" />

    {/* Bottom Stream Partition */}
    <circle cx="20" cy="33" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="20" cy="33" r="2" fill="#c7d2fe" />

    {/* Dynamic Flow Particles */}
    <circle cx="14.5" cy="16" r="1.5" fill="#ffffff" />
    <circle cx="25.5" cy="16" r="1.5" fill="#ffffff" />
    <circle cx="20" cy="26.5" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * 7. API Gateway (Security Shield & Route Portal)
 * Royal purple security shield with an illuminated archway gateway and golden keyhole.
 */
export const ApiGatewayIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#8b5cf6',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="gw-shield-grad" x1="7" y1="5" x2="33" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    {/* Security Perimeter Shield */}
    <path
      d="M20 4.5L7 9.5V19C7 27.5 12.6 34 20 36.5C27.4 34 33 27.5 33 19V9.5L20 4.5Z"
      fill="url(#gw-shield-grad)"
      stroke="#c4b5fd"
      strokeWidth="1.5"
    />

    {/* Illuminated Portal Archway */}
    <path
      d="M15 30V22C15 19.2386 17.2386 17 20 17C22.7614 17 25 19.2386 25 22V30"
      stroke="#ffffff"
      strokeWidth="2.75"
      strokeLinecap="round"
    />

    {/* Golden SSL Keyhole / Lock Core */}
    <circle cx="20" cy="12.5" r="2.75" fill="#fde047" stroke="#ca8a04" strokeWidth="0.75" />
    <path d="M20 14V17" stroke="#fde047" strokeWidth="2.25" strokeLinecap="round" />
  </svg>
);

/**
 * 8. CDN / Global Edge Network
 * Orbital global sphere with clean latitude rings and glowing Point-of-Presence edge cache nodes.
 */
export const CdnIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#0284c7',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="cdn-globe-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* Global Globe Core */}
    <circle cx="20" cy="20" r="14" fill="url(#cdn-globe-grad)" stroke="#bae6fd" strokeWidth="1.5" />

    {/* Meridians & Equator */}
    <ellipse cx="20" cy="20" rx="7" ry="14" stroke="#ffffff" strokeWidth="1.75" strokeOpacity="0.8" />
    <line x1="6" y1="20" x2="34" y2="20" stroke="#ffffff" strokeWidth="1.75" strokeOpacity="0.8" />

    {/* Edge PoP Discs (Distributed Worldwide) */}
    <circle cx="10" cy="12" r="3.25" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.25" />
    <circle cx="30" cy="12" r="3.25" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.25" />
    <circle cx="20" cy="29" r="3.25" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.25" />

    {/* Inner PoP Pulsing Cores */}
    <circle cx="10" cy="12" r="1.5" fill="#ffffff" />
    <circle cx="30" cy="12" r="1.5" fill="#ffffff" />
    <circle cx="20" cy="29" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * 9. NoSQL Database (Document / MongoDB / Sharded Store)
 * Layered emerald document index sheets with clean structured JSON data bars.
 */
export const NoSqlDbIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#10b981',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="nosql-card-grad" x1="6" y1="9" x2="28" y2="33" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Shadow Shard / Secondary Document Sheet */}
    <rect x="12" y="5" width="21" height="23" rx="4" fill="#047857" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />

    {/* Primary Document Sheet */}
    <rect x="7" y="10" width="22" height="24" rx="4" fill="url(#nosql-card-grad)" stroke="#a7f3d0" strokeWidth="1.5" />

    {/* Structured Document Content Bars */}
    <rect x="11.5" y="15" width="13" height="2.5" rx="1.25" fill="#ffffff" />
    <rect x="11.5" y="20" width="9" height="2.5" rx="1.25" fill="#ffffff" />
    <rect x="11.5" y="25" width="6" height="2.5" rx="1.25" fill="#ffffff" />

    {/* Shard Partition Node Dot */}
    <circle cx="22.5" cy="26" r="2" fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
  </svg>
);

/**
 * 10. S3 Object Storage (Cloud Storage Bucket)
 * Amber/Gold cloud storage bucket with folded rim and stacked binary data payload blocks.
 */
export const ObjectStorageIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#f59e0b',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="s3-bucket-grad" x1="6" y1="10" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="s3-rim-grad" x1="6" y1="8" x2="34" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fde68a" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    {/* Bucket Base Body */}
    <path
      d="M7 11L9.5 30.5C9.7 32.5 11.3 34 13.3 34H26.7C28.7 34 30.3 32.5 30.5 30.5L33 11"
      fill="url(#s3-bucket-grad)"
      stroke="#b45309"
      strokeWidth="1.5"
    />

    {/* Bucket Top Rim */}
    <ellipse cx="20" cy="11" rx="13" ry="4.5" fill="url(#s3-rim-grad)" stroke="#d97706" strokeWidth="1.5" />

    {/* Stacked Binary Object Blocks */}
    <rect x="14" y="18" width="12" height="10" rx="2" fill="#ffffff" stroke="#d97706" strokeWidth="1" />
    <line x1="20" y1="18" x2="20" y2="28" stroke="#d97706" strokeWidth="1" />
    <line x1="14" y1="23" x2="26" y2="23" stroke="#d97706" strokeWidth="1" />
  </svg>
);

/**
 * 11. DNS Router (Route 53 / Anycast DNS)
 * Navigational compass with directional routing arrows and multi-destination bifurcation.
 */
export const DnsRouterIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#0ea5e9',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="dns-bg-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="14" fill="url(#dns-bg-grad)" stroke="#bae6fd" strokeWidth="1.5" />
    <circle cx="20" cy="20" r="11" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.7" />
    {/* Compass Needle */}
    <polygon points="20,9 23,20 20,18 17,20" fill="#ffffff" />
    <polygon points="20,31 23,20 20,22 17,20" fill="#0369a1" />
    <circle cx="20" cy="20" r="2.5" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1" />
    {/* Cardinal Pointers */}
    <circle cx="20" cy="8" r="1.5" fill="#ffffff" />
    <circle cx="32" cy="20" r="1.5" fill="#ffffff" />
    <circle cx="8" cy="20" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * 12. WAF (Web Application Firewall / Shield)
 * Reinforced security shield with defensive inspection grid and threat barrier.
 */
export const WafIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#f43f5e',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="waf-shield-grad" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb7185" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
    </defs>
    <path
      d="M20 6L32 10.5V20C32 26.8 26.9 33.1 20 35C13.1 33.1 8 26.8 8 20V10.5L20 6Z"
      fill="url(#waf-shield-grad)"
      stroke="#fecdd3"
      strokeWidth="1.5"
    />
    {/* Brick / Filter Inspection Grid */}
    <line x1="13" y1="16" x2="27" y2="16" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="11" y1="22" x2="29" y2="22" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="14" y1="28" x2="26" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="20" y1="16" x2="20" y2="22" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="16" y1="22" x2="16" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="24" y1="22" x2="24" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
    {/* Core Alert Spark */}
    <circle cx="20" cy="12" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * 13. Serverless Function (Lambda / Worker)
 * Greek letter Lambda (λ) with reactive energy halo and event-driven trigger sparks.
 */
export const ServerlessFunctionIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#f97316',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="lambda-bg-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb923c" />
        <stop offset="1" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    <rect x="7" y="7" width="26" height="26" rx="7" fill="url(#lambda-bg-grad)" stroke="#ffedd5" strokeWidth="1.5" />
    {/* Clean Lambda Path */}
    <path
      d="M14 28L18.5 19.5M26 28L19.5 14H16.5"
      stroke="#ffffff"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Reactive Trigger Spark */}
    <circle cx="27" cy="13" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.75" />
    <circle cx="27" cy="13" r="1" fill="#ffffff" />
  </svg>
);

/**
 * 14. Background Worker (Consumer / Cron Task)
 * Interlocking precision gears with cyclical task draining arrows.
 */
export const BackgroundWorkerIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#8b5cf6',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="worker-gear-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa" />
        <stop offset="1" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="14" fill="url(#worker-gear-grad)" stroke="#ddd6fe" strokeWidth="1.5" />
    {/* Large Primary Gear */}
    <circle cx="18" cy="19" r="6" stroke="#ffffff" strokeWidth="2" strokeDasharray="3.5 2" />
    <circle cx="18" cy="19" r="2.5" fill="#ffffff" />
    {/* Small Interlocking Gear */}
    <circle cx="27" cy="25" r="4" stroke="#f5d0fe" strokeWidth="1.75" strokeDasharray="2.5 1.5" />
    <circle cx="27" cy="25" r="1.5" fill="#ffffff" />
    {/* Continuous Cycle Dot */}
    <circle cx="11" cy="13" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * 15. Standard Queue (SQS / RabbitMQ)
 * FIFO sequential packet stack with ordered task buffering.
 */
export const StandardQueueIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#059669',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="queue-box-grad" x1="6" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* FIFO Packet 1 (Back) */}
    <rect x="17" y="7" width="16" height="9" rx="2" fill="#047857" stroke="#10b981" strokeWidth="1" opacity="0.6" />
    {/* FIFO Packet 2 (Middle) */}
    <rect x="12" y="14" width="18" height="9" rx="2" fill="#059669" stroke="#6ee7b7" strokeWidth="1.25" opacity="0.85" />
    {/* FIFO Packet 3 (Front / In-Flight) */}
    <rect x="7" y="21" width="20" height="10" rx="2.5" fill="url(#queue-box-grad)" stroke="#a7f3d0" strokeWidth="1.5" />
    <line x1="11" y1="26" x2="23" y2="26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    {/* FIFO Flow Arrow */}
    <path d="M30 24L34 26L30 28" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 16. Pub/Sub Topic (SNS / EventBridge)
 * Central broadcasting antenna with 1-to-N radial fan-out wave propagation.
 */
export const PubSubIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#d946ef',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="pubsub-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e879f9" />
        <stop offset="1" stopColor="#c026d3" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="14" fill="url(#pubsub-grad)" stroke="#f5d0fe" strokeWidth="1.5" />
    {/* Broadcasting Waves */}
    <path d="M14 14C17.3 11.2 22.7 11.2 26 14" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M11 10C16 6 24 6 29 10" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.75" />
    {/* Central Broadcaster Core */}
    <circle cx="20" cy="20" r="3" fill="#ffffff" />
    <path d="M18 23L16 29M22 23L24 29" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    {/* Fan-Out Destination Nodes */}
    <circle cx="9" cy="28" r="2" fill="#fdf4ff" stroke="#a21caf" strokeWidth="1" />
    <circle cx="31" cy="28" r="2" fill="#fdf4ff" stroke="#a21caf" strokeWidth="1" />
    <circle cx="20" cy="32" r="2" fill="#fdf4ff" stroke="#a21caf" strokeWidth="1" />
  </svg>
);

/**
 * 17. Search Engine (Elasticsearch / Meilisearch)
 * Inverted index partitions with magnifying search loupe.
 */
export const SearchEngineIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#eab308',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="search-bg-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#facc15" />
        <stop offset="1" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
    {/* Indexed Document Card */}
    <rect x="7" y="7" width="22" height="26" rx="4" fill="url(#search-bg-grad)" stroke="#fef08a" strokeWidth="1.5" />
    <line x1="11" y1="13" x2="20" y2="13" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11" y1="18" x2="18" y2="18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11" y1="23" x2="16" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    {/* Magnifying Loupe */}
    <circle cx="24" cy="23" r="6" fill="#fef9c3" stroke="#854d0e" strokeWidth="2" />
    <circle cx="24" cy="23" r="4.25" fill="#ffffff" fillOpacity="0.4" />
    <line x1="28.5" y1="27.5" x2="33" y2="32" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/**
 * 18. Analytics Database (ClickHouse / Snowflake OLAP)
 * Columnar data aggregation cylinders with performance bar analytics.
 */
export const AnalyticsDbIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#14b8a6',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="olap-bg-grad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2dd4bf" />
        <stop offset="1" stopColor="#0d9488" />
      </linearGradient>
    </defs>
    <rect x="7" y="7" width="26" height="26" rx="6" fill="url(#olap-bg-grad)" stroke="#ccfbf1" strokeWidth="1.5" />
    {/* Analytical Bar Columns */}
    <rect x="11" y="22" width="3.5" height="7" rx="1" fill="#ffffff" />
    <rect x="16.5" y="17" width="3.5" height="12" rx="1" fill="#ffffff" />
    <rect x="22" y="13" width="3.5" height="16" rx="1" fill="#ffffff" />
    <rect x="27.5" y="10" width="3.5" height="19" rx="1" fill="#ffffff" />
    {/* Aggregation Trend Line */}
    <path d="M12.5 20L18 15L23.5 11L29 8" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 19. External API (3rd-Party SaaS / Webhook)
 * Perimeter cloud boundary with outbound handshake plug and chaos timeout trigger.
 */
export const ExternalApiIcon: React.FC<ComponentIconProps> = ({
  className = '',
  size = 40,
  color = '#64748b',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="ext-cloud-grad" x1="6" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#94a3b8" />
        <stop offset="1" stopColor="#475569" />
      </linearGradient>
    </defs>
    {/* Cloud Body */}
    <path
      d="M13 28H27C30.3 28 33 25.3 33 22C33 19 30.8 16.5 28 16.1C27.5 11.5 23.6 8 19 8C15 8 11.6 10.8 10.4 14.6C7.9 15.2 6 17.4 6 20C6 23.3 8.7 26 12 26"
      fill="url(#ext-cloud-grad)"
      stroke="#e2e8f0"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Outbound Connector Plug / Webhook Arrow */}
    <line x1="20" y1="21" x2="28" y2="29" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <polyline points="23,29 28,29 28,24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Chaos Jitter Spark */}
    <circle cx="15" cy="18" r="1.5" fill="#fde047" />
  </svg>
);

/**
 * Component Icon Registry Map
 */
export const COMPONENT_ICON_MAP: Record<ComponentTypeId, React.FC<ComponentIconProps>> = {
  traffic_generator: TrafficGeneratorIcon,
  cdn: CdnIcon,
  api_gateway: ApiGatewayIcon,
  load_balancer: LoadBalancerIcon,
  web_server: WebServerIcon,
  cache: CacheIcon,
  relational_db: RelationalDbIcon,
  nosql_db: NoSqlDbIcon,
  message_queue: MessageQueueIcon,
  object_storage: ObjectStorageIcon,
  dns_router: DnsRouterIcon,
  waf: WafIcon,
  serverless_function: ServerlessFunctionIcon,
  background_worker: BackgroundWorkerIcon,
  standard_queue: StandardQueueIcon,
  pub_sub: PubSubIcon,
  search_engine: SearchEngineIcon,
  analytics_db: AnalyticsDbIcon,
  external_api: ExternalApiIcon,
};

/**
 * Universal Component Icon Renderer
 */
export const ComponentIcon: React.FC<{
  typeId: ComponentTypeId;
  className?: string;
  size?: number;
  color?: string;
}> = ({ typeId, className, size = 40, color }) => {
  const Icon = COMPONENT_ICON_MAP[typeId] || WebServerIcon;
  return <Icon className={className} size={size} color={color} />;
};

export function getComponentIcon(typeId: ComponentTypeId): React.FC<ComponentIconProps> {
  return COMPONENT_ICON_MAP[typeId] || WebServerIcon;
}
