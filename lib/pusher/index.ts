import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// ─── Server-side Pusher instance ──────────────────────────────────────────────

let pusherServer: PusherServer | null = null;

export function getPusherServer(): PusherServer {
  if (!pusherServer) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    // If Pusher is not configured, return a no-op compatible object for dev
    if (!appId || appId === 'your_pusher_app_id') {
      console.warn('[Pusher] Credentials not configured. Real-time events will be disabled.');
      // Return a mock-safe object
      return {
        trigger: async () => {},
      } as unknown as PusherServer;
    }

    pusherServer = new PusherServer({
      appId: appId!,
      key: key!,
      secret: secret!,
      cluster: cluster!,
      useTLS: true,
    });
  }
  return pusherServer;
}

/**
 * Trigger a real-time event on a channel
 * @param channel - e.g. 'global' or 'user-{userId}'
 * @param event   - e.g. 'new-item' or 'item-updated'
 * @param data    - any serializable payload
 */
export async function triggerEvent(channel: string, event: string, data: unknown) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.error('[Pusher] Failed to trigger event:', err);
  }
}

// ─── Client-side Pusher singleton ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var _pusherClient: PusherClient | undefined;
}

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('getPusherClient() must be called in the browser');
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || key === 'your_pusher_key') {
    // Return a mock client in dev when Pusher is not configured yet
    console.warn('[Pusher] Client key not configured. Real-time disabled.');
    return {
      subscribe: () => ({ bind: () => {}, unbind: () => {} }),
      unsubscribe: () => {},
    } as unknown as PusherClient;
  }

  if (!globalThis._pusherClient) {
    globalThis._pusherClient = new PusherClient(key!, {
      cluster: cluster!,
    });
  }

  return globalThis._pusherClient;
}
