'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPusherClient } from '@/lib/pusher';

/**
 * Subscribe to a Pusher channel/event and auto-invalidate React Query cache keys.
 *
 * @param channel   - Pusher channel name (e.g. 'global')
 * @param event     - Event name to listen to (e.g. 'users-updated')
 * @param queryKeys - React Query cache keys to invalidate when event fires
 * @param onEvent   - Optional callback with the event payload
 */
export function useRealtime<T = unknown>(
  channel: string,
  event: string,
  queryKeys: string[][],
  onEvent?: (data: T) => void
) {
  const queryClient = useQueryClient();
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let pusherChannel: ReturnType<ReturnType<typeof getPusherClient>['subscribe']>;

    try {
      const pusher = getPusherClient();
      pusherChannel = pusher.subscribe(channel);

      pusherChannel.bind(event, (data: T) => {
        // Invalidate all specified query keys
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });

        // Call optional callback
        handlerRef.current?.(data);
      });
    } catch (err) {
      console.warn('[useRealtime] Could not subscribe to Pusher:', err);
    }

    return () => {
      try {
        pusherChannel?.unbind(event);
        getPusherClient().unsubscribe(channel);
      } catch {
        // ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, event, queryClient]);
}
