import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNodeErrorState,
  resetNodeErrorState,
  createCanvasErrorState,
  resetCanvasErrorState,
  formatDiagnosticsPayload,
  type NodeErrorBoundaryState,
  type CanvasErrorBoundaryState,
} from '../src/components/common/errorBoundaryHelpers.ts';

describe('React Error Boundaries Invariant & Fault Tolerance Tests', () => {

  describe('Node Error Boundary State Transitions & Invariants', () => {
    it('correctly transitions from clean state to error state with stack and message intact', () => {
      const err = new TypeError('Cannot read property "metrics" of undefined in InfrastructureNode');
      const state = createNodeErrorState(err);

      assert.equal(state.hasError, true);
      assert.equal(state.error, err);
      assert.equal(state.error?.message, 'Cannot read property "metrics" of undefined in InfrastructureNode');
      assert.ok(state.error?.stack?.includes('TypeError'), 'Stack trace should preserve error type');
    });

    it('resets node error state cleanly to pristine un-errored condition', () => {
      const state = resetNodeErrorState();
      assert.equal(state.hasError, false);
      assert.equal(state.error, null);
    });

    it('survives 200 consecutive error-then-reset churn cycles without state leakage', () => {
      let state: NodeErrorBoundaryState = resetNodeErrorState();

      for (let i = 0; i < 200; i++) {
        const iterationError = new Error(`Simulated transient canvas explosion cycle #${i}`);
        state = createNodeErrorState(iterationError);
        assert.equal(state.hasError, true);
        assert.equal(state.error?.message, `Simulated transient canvas explosion cycle #${i}`);

        state = resetNodeErrorState();
        assert.equal(state.hasError, false);
        assert.equal(state.error, null);
      }
    });

    it('handles custom Error subclasses with arbitrary extra properties attached', () => {
      class ChaosSimulationError extends Error {
        public readonly nodeId: string;
        public readonly rpsLoad: number;

        constructor(nodeId: string, rpsLoad: number) {
          super(`Chaos blackout: Node ${nodeId} overloaded at ${rpsLoad} RPS`);
          this.name = 'ChaosSimulationError';
          this.nodeId = nodeId;
          this.rpsLoad = rpsLoad;
        }
      }

      const customErr = new ChaosSimulationError('node_api_gateway_1', 150000);
      const state = createNodeErrorState(customErr);

      assert.equal(state.hasError, true);
      assert.equal(state.error?.name, 'ChaosSimulationError');
      assert.equal((state.error as ChaosSimulationError).nodeId, 'node_api_gateway_1');
      assert.equal((state.error as ChaosSimulationError).rpsLoad, 150000);
    });
  });

  describe('Canvas Error Boundary State & Diagnostics Serialization', () => {
    it('captures canvas fatal crash and ensures copied state is explicitly false', () => {
      const canvasErr = new RangeError('WebGL/Canvas context lost: Maximum texture memory exceeded');
      const state = createCanvasErrorState(canvasErr);

      assert.equal(state.hasError, true);
      assert.equal(state.error, canvasErr);
      assert.equal(state.copied, false);
    });

    it('resets canvas error state back to default including copied flag', () => {
      const resetState = resetCanvasErrorState();

      assert.equal(resetState.hasError, false);
      assert.equal(resetState.error, null);
      assert.equal(resetState.copied, false);
    });

    it('formats diagnostic payloads into RFC3339 valid, strictly parseable JSON', () => {
      const testErr = new Error('Pan/Zoom matrix transform produced NaN coordinates');
      const payload = formatDiagnosticsPayload(testErr);

      assert.ok(typeof payload === 'string');
      const parsed = JSON.parse(payload);

      assert.equal(parsed.name, 'Error');
      assert.equal(parsed.message, 'Pan/Zoom matrix transform produced NaN coordinates');
      assert.ok(typeof parsed.stack === 'string');
      assert.ok(parsed.timestamp, 'Timestamp must exist in diagnostics payload');

      const parsedDate = new Date(parsed.timestamp);
      assert.ok(!isNaN(parsedDate.getTime()), 'Timestamp must be a valid ISO Date');
      const now = Date.now();
      assert.ok(Math.abs(now - parsedDate.getTime()) < 5000, 'Timestamp drift must be under 5 seconds');
    });

    it('returns empty JSON string on null error argument', () => {
      const payload = formatDiagnosticsPayload(null);
      assert.equal(payload, '{}');
      const parsed = JSON.parse(payload);
      assert.deepEqual(parsed, {});
    });

    it('safely handles errors without stack or with missing name/message', () => {
      const bareError = Object.create(Error.prototype);
      // missing name, message, stack
      const payload = formatDiagnosticsPayload(bareError);
      const parsed = JSON.parse(payload);

      assert.equal(parsed.name, 'Error');
      assert.equal(parsed.message, 'Unknown error');
      assert.equal(parsed.stack, '');
    });
  });

  describe('Isolated Multi-Node Fault Containment Simulation', () => {
    it('simulates 1 failing node among 10 healthy nodes without cascading corruption', () => {
      interface MockNodeState {
        id: string;
        boundaryState: NodeErrorBoundaryState;
      }

      // Initialize 10 nodes
      const nodes: MockNodeState[] = Array.from({ length: 10 }, (_, i) => ({
        id: `node-${i}`,
        boundaryState: resetNodeErrorState(),
      }));

      // Induce crash in node-4
      nodes[4].boundaryState = createNodeErrorState(new Error('SyntaxError in JSON node config'));

      // Verify node-4 hasError, all other 9 nodes remain healthy
      for (let i = 0; i < 10; i++) {
        if (i === 4) {
          assert.equal(nodes[i].boundaryState.hasError, true);
          assert.equal(nodes[i].boundaryState.error?.message, 'SyntaxError in JSON node config');
        } else {
          assert.equal(nodes[i].boundaryState.hasError, false);
          assert.equal(nodes[i].boundaryState.error, null);
        }
      }

      // Recover node-4
      nodes[4].boundaryState = resetNodeErrorState();
      assert.equal(nodes[4].boundaryState.hasError, false);
      assert.equal(nodes.every((n) => !n.boundaryState.hasError), true, 'All nodes must be healthy after recovery');
    });
  });

});
