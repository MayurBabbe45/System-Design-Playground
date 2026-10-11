import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { usePlaygroundStore } from '../src/store/usePlaygroundStore.ts';

describe('Zustand Modular Store Slices & State Invariants', () => {

  beforeEach(() => {
    // Reset to preset 0 pristine state before each test
    usePlaygroundStore.getState().loadPreset('classic-web-app');
  });

  describe('Canvas Slice Graph Operations & Cascade Invariants', () => {
    it('deleting a node cascades and removes all incident edges while preserving disjoint edges', () => {
      const store = usePlaygroundStore.getState();

      // Ensure we have nodes
      const initialNodes = store.nodes;
      const initialEdges = store.edges;
      assert.ok(initialNodes.length >= 2, 'Initial preset must have nodes');
      assert.ok(initialEdges.length >= 1, 'Initial preset must have edges');

      // Pick the first edge
      const edgeToBreak = initialEdges[0];
      const sourceNodeId = edgeToBreak.source;

      // Select the edge and source node
      store.setSelectedNodeId(sourceNodeId);
      store.setSelectedEdgeId(edgeToBreak.id);
      assert.equal(usePlaygroundStore.getState().selectedEdgeId, edgeToBreak.id);

      // Delete the source node
      store.deleteNode(sourceNodeId);

      const stateAfter = usePlaygroundStore.getState();
      assert.ok(!stateAfter.nodes.some((n) => n.id === sourceNodeId), 'Deleted node must be removed from nodes array');
      assert.ok(!stateAfter.edges.some((e) => e.source === sourceNodeId || e.target === sourceNodeId), 'All edges incident to deleted node must be purged');
      assert.equal(stateAfter.selectedNodeId, null, 'selectedNodeId must be cleared');
      assert.equal(stateAfter.selectedEdgeId, null, 'selectedEdgeId must be cleared when edge was removed');
    });

    it('reverses 10 sequential graph operations with perfect structural undo restoration', () => {
      const store = usePlaygroundStore.getState();
      const baselineNodeCount = store.nodes.length;
      const baselineEdgeCount = store.edges.length;

      // Snapshot initial state
      const initialSnapshot = JSON.stringify({
        nodes: store.nodes.map((n) => n.id),
        edges: store.edges.map((e) => e.id),
      });

      // Apply 10 non-trivial mutation operations
      store.addNodeFromPalette('waf', { x: 100, y: 100 });
      const addedNodeId1 = usePlaygroundStore.getState().selectedNodeId!;
      assert.ok(addedNodeId1);

      store.addNodeFromPalette('cache', { x: 200, y: 200 });
      const addedNodeId2 = usePlaygroundStore.getState().selectedNodeId!;

      store.appendConnectedNode(addedNodeId1, 'api_gateway');
      const addedNodeId3 = usePlaygroundStore.getState().selectedNodeId!;

      store.updateNodeData(addedNodeId1, { capacityRps: 99999 });
      store.updateNodeWafSettings(addedNodeId1, 50000, 15);
      store.toggleNodeKillSwitch(addedNodeId2);
      store.setSelectedNodeId(addedNodeId3);
      store.duplicateSelectedNode();
      const duplicatedId = usePlaygroundStore.getState().selectedNodeId!;

      store.toggleNodeKillSwitch(duplicatedId);
      store.deleteNode(addedNodeId2);
      store.deleteNode(duplicatedId);

      const mutatedState = usePlaygroundStore.getState();
      assert.ok(mutatedState.history.length >= 5, 'History must contain snapshots');

      // Perform 10 consecutive undos
      for (let i = 0; i < 15; i++) {
        if (usePlaygroundStore.getState().history.length > 0) {
          usePlaygroundStore.getState().undo();
        }
      }

      const restoredState = usePlaygroundStore.getState();
      assert.equal(restoredState.nodes.length, baselineNodeCount, 'Node count must match baseline after complete undo rollbacks');
      assert.equal(restoredState.edges.length, baselineEdgeCount, 'Edge count must match baseline after complete undo rollbacks');

      const restoredSnapshot = JSON.stringify({
        nodes: restoredState.nodes.map((n) => n.id),
        edges: restoredState.edges.map((e) => e.id),
      });
      assert.equal(restoredSnapshot, initialSnapshot, 'Graph topology must exactly match initial snapshot');

      // Now test redo stack restoration
      assert.ok(restoredState.future.length > 0, 'Future stack must be populated after undo');
      const futureLen = restoredState.future.length;
      for (let i = 0; i < futureLen; i++) {
        usePlaygroundStore.getState().redo();
      }

      const redoneState = usePlaygroundStore.getState();
      assert.equal(redoneState.future.length, 0, 'Future stack must be exhausted after full redo');
    });

    it('enforces directional data flow hierarchy when connecting nodes in reverse', () => {
      const store = usePlaygroundStore.getState();
      store.clearCanvas();

      // Add a Storage node (tier 7) and a WAF node (tier 1)
      store.addNodeFromPalette('relational_db', { x: 300, y: 100 });
      const dbId = usePlaygroundStore.getState().selectedNodeId!;

      store.addNodeFromPalette('waf', { x: 50, y: 100 });
      const wafId = usePlaygroundStore.getState().selectedNodeId!;

      // Simulate a user connecting in reverse: from DB (source) to WAF (target)
      store.onConnect({
        source: dbId,
        target: wafId,
        sourceHandle: 'left',
        targetHandle: 'right',
      });

      const edges = usePlaygroundStore.getState().edges;
      assert.equal(edges.length, 1);
      const edge = edges[0];

      // Auto-orient hierarchy must swap source to WAF and target to DB
      assert.equal(edge.source, wafId, 'Auto-orientation must orient upstream WAF as source');
      assert.equal(edge.target, dbId, 'Auto-orientation must orient downstream DB as target');
    });
  });

  describe('Simulation & Chaos Cross-Slice Interactions', () => {
    it('loadPreset resets dirty simulation and chaos state across slice boundaries', () => {
      const store = usePlaygroundStore.getState();

      // Dirty the simulation and chaos states
      store.toggleKillAz('us-east-1a');
      store.setGlobalInjectedLatencyMs(250);
      store.setGlobalPacketDropPercent(12.5);
      usePlaygroundStore.setState({
        isSimulating: true,
        isCascadeRunning: true,
        activeNodeIds: ['node-1', 'node-2'],
        bottleneckNodeId: 'node-1',
        bottleneckReason: 'Over capacity',
      });

      const dirtyState = usePlaygroundStore.getState();
      assert.equal(dirtyState.isSimulating, true);
      assert.equal(dirtyState.killedAzs.length, 1);
      assert.equal(dirtyState.bottleneckNodeId, 'node-1');

      // Load a different preset
      store.loadPreset('flash-sale-ecommerce');

      const cleanedState = usePlaygroundStore.getState();
      assert.equal(cleanedState.activePresetId, 'flash-sale-ecommerce');
      assert.equal(cleanedState.isSimulating, false, 'isSimulating must be reset to false');
      assert.equal(cleanedState.isCascadeRunning, false, 'isCascadeRunning must be reset to false');
      assert.equal(cleanedState.activeNodeIds.length, 0, 'activeNodeIds must be empty');
      assert.equal(cleanedState.bottleneckNodeId, null, 'bottleneckNodeId must be reset to null');
      assert.equal(cleanedState.bottleneckReason, null, 'bottleneckReason must be reset to null');
      assert.equal(cleanedState.killedAzs.length, 0, 'killedAzs must be reset on preset reload');
      assert.ok(cleanedState.nodes.length > 0, 'Preset nodes must be populated');
    });

    it('resetChaos restores all killed nodes to healthy status and closed circuit breakers', () => {
      const store = usePlaygroundStore.getState();
      const nodeToKill = store.nodes[0];
      assert.ok(nodeToKill);

      // Kill the node
      store.toggleNodeKillSwitch(nodeToKill.id);
      const stateWithKilled = usePlaygroundStore.getState();
      const killedNode = stateWithKilled.nodes.find((n) => n.id === nodeToKill.id)!;
      assert.equal(killedNode.data.isKilled, true);
      assert.equal(killedNode.data.status, 'dead');

      // Trigger chaos reset
      store.resetChaos();

      const stateAfterReset = usePlaygroundStore.getState();
      const recoveredNode = stateAfterReset.nodes.find((n) => n.id === nodeToKill.id)!;
      assert.equal(recoveredNode.data.isKilled, false, 'Node must no longer be killed');
      assert.equal(recoveredNode.data.status, 'healthy', 'Status must be restored to healthy');
      assert.equal(recoveredNode.data.circuitBreakerState, 'CLOSED', 'Circuit breaker must be CLOSED');
    });

    it('handles rapid sequential simulation speed and traffic profile adjustments', () => {
      const store = usePlaygroundStore.getState();

      const speeds = [1, 2, 5, 0.5, 1];
      const profiles = ['steady', 'spike', 'wave', 'random'] as const;

      for (const speed of speeds) {
        store.setSimulationSpeed(speed);
        assert.equal(usePlaygroundStore.getState().simulationSpeed, speed);
      }

      for (const profile of profiles) {
        store.setTrafficProfile(profile);
        assert.equal(usePlaygroundStore.getState().trafficProfile, profile);
      }
    });
  });

  describe('Project Slice URL Hash & Serialization Invariants', () => {
    it('compresses current architecture to LZString share URL and round-trips correctly via loadFromUrlHash', () => {
      const store = usePlaygroundStore.getState();
      store.loadPreset('flash-sale-ecommerce');

      const shareUrl = store.getCompressedShareUrl();
      assert.ok(shareUrl.includes('#architecture='), 'Share URL must contain compressed architecture parameter');

      // Now clear canvas and load from the generated hash
      store.clearCanvas();
      assert.equal(usePlaygroundStore.getState().nodes.length, 0);

      const hashParam = shareUrl.split('#')[1];
      const loaded = store.loadFromUrlHash(`#${hashParam}`);
      assert.equal(loaded, true, 'loadFromUrlHash must return true for valid payload');

      const restored = usePlaygroundStore.getState();
      assert.ok(restored.nodes.length >= 4, 'Must restore all nodes from compressed hash');
      assert.ok(restored.edges.length >= 3, 'Must restore all edges from compressed hash');
      assert.equal(restored.activePresetId, 'shared-url');
    });

    it('rejects malformed or corrupted URL hash payloads gracefully without throwing', () => {
      const store = usePlaygroundStore.getState();
      const corruptedHash = '#architecture=MALFORMED_GARBAGE_PAYLOAD_12345';
      const result = store.loadFromUrlHash(corruptedHash);
      assert.equal(result, false, 'Corrupted hash must return false safely');
    });

    it('manages activeProject metadata and rename operations correctly', async () => {
      const store = usePlaygroundStore.getState();
      usePlaygroundStore.setState({
        activeProject: {
          id: 'proj-test-1',
          name: 'Initial Cloud Architecture',
          description: 'A benchmark test',
        },
      });

      await store.renameActiveProject('Renamed Microservices Cluster');
      assert.equal(usePlaygroundStore.getState().activeProject?.name, 'Renamed Microservices Cluster');

      // Whitespace-only rename must be a no-op
      await store.renameActiveProject('   ');
      assert.equal(usePlaygroundStore.getState().activeProject?.name, 'Renamed Microservices Cluster');
    });
  });

  describe('UI Modal Slice & Clipboard Invariants', () => {
    it('manages modal toggle booleans independently without cross-talk', () => {
      const store = usePlaygroundStore.getState();

      // Initially all false
      assert.equal(store.isChaosCenterOpen, false);
      assert.equal(store.isCostModalOpen, false);
      assert.equal(store.isAuditModalOpen, false);
      assert.equal(store.isExportModalOpen, false);
      assert.equal(store.isCollabModalOpen, false);

      // Toggle Chaos
      store.toggleChaosCenter();
      assert.equal(usePlaygroundStore.getState().isChaosCenterOpen, true);
      assert.equal(usePlaygroundStore.getState().isCostModalOpen, false);

      // Toggle Cost
      store.toggleCostModal();
      assert.equal(usePlaygroundStore.getState().isCostModalOpen, true);

      // Toggle Canvas view mode
      assert.equal(store.canvasViewMode, 'simple');
      store.toggleCanvasViewMode();
      assert.equal(usePlaygroundStore.getState().canvasViewMode, 'detailed');
      store.toggleCanvasViewMode();
      assert.equal(usePlaygroundStore.getState().canvasViewMode, 'simple');
    });

    it('deep-clones selected node on copy/paste with positional offset +50px', () => {
      const store = usePlaygroundStore.getState();
      store.clearCanvas();

      store.addNodeFromPalette('cache', { x: 100, y: 150 });
      const cacheNodeId = usePlaygroundStore.getState().selectedNodeId!;
      assert.ok(cacheNodeId);

      // Copy node
      store.copySelectedNode();
      assert.ok(usePlaygroundStore.getState().copiedNode);

      // Paste node
      store.pasteNode();
      const stateAfterPaste = usePlaygroundStore.getState();
      assert.equal(stateAfterPaste.nodes.length, 2);

      const pastedNode = stateAfterPaste.nodes.find((n) => n.id !== cacheNodeId)!;
      assert.equal(pastedNode.position.x, 150);
      assert.equal(pastedNode.position.y, 200);
      assert.equal(pastedNode.data.typeId, 'cache');
      assert.notEqual(pastedNode.id, cacheNodeId);
    });
  });

});
