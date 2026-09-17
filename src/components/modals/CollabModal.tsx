import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { collabManager } from '../../collab/collabManager';
import { PeerState, CollabConnectionStatus, PeerUser } from '../../collab/types';

const PALETTE_COLORS = [
  '#38bdf8', // Sky
  '#4ade80', // Emerald
  '#f472b6', // Pink
  '#a78bfa', // Purple
  '#fbbf24', // Amber
  '#f87171', // Red
  '#34d399', // Mint
  '#818cf8', // Indigo
];

export const CollabModal: React.FC = () => {
  const { isCollabModalOpen, toggleCollabModal } = usePlaygroundStore();
  const [status, setStatus] = useState<CollabConnectionStatus>(collabManager.getStatus());
  const [peers, setPeers] = useState<PeerState[]>([]);
  const [currentUser, setCurrentUser] = useState<PeerUser>(collabManager.getCurrentUser());
  const [roomInput, setRoomInput] = useState(collabManager.getRoomName());
  const [copied, setCopied] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser.name);

  useEffect(() => {
    const unsubStatus = collabManager.onStatusChange((s) => setStatus(s));
    const unsubPeers = collabManager.onPeersChange((p) => setPeers(p));
    return () => {
      unsubStatus();
      unsubPeers();
    };
  }, []);

  if (!isCollabModalOpen) return null;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${collabManager.getRoomName()}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameInput.trim()) return;
    collabManager.setCurrentUser({ name: userNameInput.trim() });
    setCurrentUser(collabManager.getCurrentUser());
  };

  const handleColorSelect = (color: string) => {
    collabManager.setCurrentUser({ color });
    setCurrentUser(collabManager.getCurrentUser());
  };

  const handleSwitchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoom = roomInput.trim().replace(/\s+/g, '-');
    if (!cleanRoom) return;
    
    // Update URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.set('room', cleanRoom);
    window.history.pushState({}, '', url.toString());

    collabManager.connect(cleanRoom);
  };

  const handleReconnect = () => {
    collabManager.connect(collabManager.getRoomName());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[var(--surface-bg)] border border-[var(--surface-border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)] bg-[var(--canvas-bg)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                Real-Time Architecture Multiplayer
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  CRDT / Yjs
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Design and benchmark distributed systems synchronously with your team
              </p>
            </div>
          </div>
          <button
            onClick={toggleCollabModal}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Connection Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-[var(--canvas-bg)]/60 border-[var(--surface-border)]">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                status === 'connected' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' :
                status === 'connecting' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' :
                'bg-zinc-500'
              }`} />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span>
                    {status === 'connected' && 'Connected to WebSocket Relay'}
                    {status === 'connecting' && 'Connecting to Relay Server...'}
                    {status === 'disconnected' && 'Disconnected (Offline Mode)'}
                  </span>
                  {status === 'connected' ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {peers.length} active teammate{peers.length === 1 ? '' : 's'} in room <span className="font-mono text-[var(--text-primary)] font-semibold">"{collabManager.getRoomName()}"</span>
                </div>
              </div>
            </div>

            {status !== 'connected' && (
              <button
                onClick={handleReconnect}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reconnect
              </button>
            )}
          </div>

          {/* Share Room Link */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
              <span>Session Invitation Link</span>
              <span className="text-[10px] text-[var(--text-muted)]">Anyone with the link can collaborate live</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-[var(--canvas-bg)] border border-[var(--surface-border)] text-xs font-mono text-[var(--text-secondary)] truncate select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?room=${collabManager.getRoomName()}` : ''}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Link!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Your Profile & Avatar */}
          <div className="p-4 rounded-xl bg-[var(--canvas-bg)]/40 border border-[var(--surface-border)] space-y-3">
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Your Collaborative Persona</span>
            </div>

            <form onSubmit={handleUpdateName} className="flex items-center gap-2">
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Enter handle..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface-bg)] border border-[var(--surface-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--text-primary)] hover:border-indigo-500/50 transition-colors cursor-pointer"
              >
                Save
              </button>
            </form>

            <div className="space-y-1.5">
              <div className="text-[11px] text-[var(--text-muted)]">Cursor & Halo Color</div>
              <div className="flex items-center gap-2">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleColorSelect(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      currentUser.color === col
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Teammate Presence List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
              <span>Active Teammates ({peers.length + 1})</span>
              <span className="text-[10px] text-[var(--text-muted)]">Live CRDT Sync</span>
            </div>

            <div className="divide-y divide-[var(--surface-border)] rounded-xl border border-[var(--surface-border)] bg-[var(--canvas-bg)]/40 overflow-hidden">
              {/* Local user row */}
              <div className="flex items-center justify-between px-3.5 py-2.5 text-xs bg-indigo-500/5">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <div className="font-semibold text-[var(--text-primary)]">
                    {currentUser.name} <span className="text-[10px] font-normal text-indigo-400">(You)</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Host / Local
                </span>
              </div>

              {/* Remote peers */}
              {peers.length === 0 ? (
                <div className="px-3.5 py-4 text-center text-xs text-[var(--text-muted)]">
                  No other teammates in this room yet. Share the session link above to invite others!
                </div>
              ) : (
                peers.map((peer) => (
                  <div key={peer.clientId} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: peer.user.color }}
                      />
                      <div className="font-medium text-[var(--text-primary)]">
                        {peer.user.name}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {peer.selectedNodeId ? 'Editing Node' : 'Exploring'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Switch / Create Room */}
          <form onSubmit={handleSwitchRoom} className="space-y-2 pt-2 border-t border-[var(--surface-border)]">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
              <span>Switch or Join Room</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room name (e.g. prod-launch)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--canvas-bg)] border border-[var(--surface-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl text-xs font-medium bg-[var(--surface-hover)] hover:bg-[var(--surface-border)] border border-[var(--surface-border)] text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
