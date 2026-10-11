export interface NodeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface CanvasErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export function createNodeErrorState(error: Error): NodeErrorBoundaryState {
  return {
    hasError: true,
    error,
  };
}

export function resetNodeErrorState(): NodeErrorBoundaryState {
  return {
    hasError: false,
    error: null,
  };
}

export function createCanvasErrorState(error: Error): CanvasErrorBoundaryState {
  return {
    hasError: true,
    error,
    copied: false,
  };
}

export function resetCanvasErrorState(): CanvasErrorBoundaryState {
  return {
    hasError: false,
    error: null,
    copied: false,
  };
}

export function formatDiagnosticsPayload(error: Error | null): string {
  if (!error) return '{}';
  return JSON.stringify({
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    stack: error.stack || '',
    timestamp: new Date().toISOString(),
  }, null, 2);
}
