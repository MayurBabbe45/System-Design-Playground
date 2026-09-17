export interface PeerUser {
  name: string;
  color: string;
}

export interface PeerState {
  clientId: number;
  user: PeerUser;
  cursor?: { x: number; y: number } | null;
  selectedNodeId?: string | null;
  lastActive?: number;
}

export type CollabConnectionStatus = 'disconnected' | 'connecting' | 'connected';
