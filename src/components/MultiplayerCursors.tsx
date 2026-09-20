import React, { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { collabManager } from '../collab/collabManager';
import { PeerState } from '../collab/types';

export const MultiplayerCursors: React.FC = () => {
  const [peers, setPeers] = useState<PeerState[]>([]);
  const { flowToScreenPosition } = useReactFlow();

  useEffect(() => {
    const unsub = collabManager.onPeersChange((updatedPeers) => {
      setPeers(updatedPeers);
    });
    return unsub;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {peers.map((peer) => {
        if (!peer.cursor) return null;

        // Convert React Flow canvas coordinate to screen coordinate
        const screenPos = flowToScreenPosition(peer.cursor);

        return (
          <div
            key={peer.clientId}
            className="absolute transition-all duration-75 ease-out flex items-start gap-1"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* High-visibility Dual-tone Cursor SVG (Crisp dark outline ensures visibility on both Light and Dark mode) */}
            <svg
              className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              viewBox="0 0 24 24"
              fill={peer.user.color}
              stroke="#0f172a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 3 10 21 13 13 21 10 3 3" />
            </svg>

            {/* Peer Name Tag with High Contrast */}
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-md flex items-center gap-1 -mt-1 select-none whitespace-nowrap border"
              style={{
                backgroundColor: peer.user.color,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                borderColor: 'rgba(0,0,0,0.3)',
              }}
            >
              <span>{peer.user.name}</span>
              {peer.selectedNodeId && (
                <span className="opacity-90 text-[9px] font-mono bg-black/30 px-1 rounded">
                  editing
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
