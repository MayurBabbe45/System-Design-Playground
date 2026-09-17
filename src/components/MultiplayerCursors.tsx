import React, { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { collabManager } from '../collab/collabManager';
import { PeerState } from '../collab/types';
import { MousePointer2 } from 'lucide-react';

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
            {/* Custom Colored Cursor Icon */}
            <MousePointer2
              className="w-4 h-4 drop-shadow-md"
              style={{
                color: peer.user.color,
                fill: peer.user.color,
              }}
            />

            {/* Peer Name Tag */}
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide text-white shadow-lg backdrop-blur-md flex items-center gap-1 -mt-1 select-none whitespace-nowrap border"
              style={{
                backgroundColor: `${peer.user.color}dd`,
                borderColor: `${peer.user.color}`,
              }}
            >
              <span>{peer.user.name}</span>
              {peer.selectedNodeId && (
                <span className="opacity-75 text-[9px] font-mono">
                  [editing]
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
