/** Simple in-memory pub/sub for SSE notifications */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to data-change notifications. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Notify all connected SSE clients that data has changed. */
export function notify() {
  listeners.forEach((fn) => fn());
}
