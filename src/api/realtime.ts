import { Client } from '@stomp/stompjs';
import { API_URL, tokenStore } from './client';
import type { ChatEvent } from './types';

/** Conexión STOMP al backend; entrega los eventos de chat del usuario conectado. */
export function connectRealtime(onEvent: (e: ChatEvent) => void): () => void {
  const client = new Client({
    // Sin VITE_API_URL (frontend y backend en el mismo dominio) se usa el dominio de la página.
    brokerURL: (API_URL || window.location.origin).replace(/^http/, 'ws') + '/ws',
    connectHeaders: { Authorization: `Bearer ${tokenStore.get() ?? ''}` },
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe('/user/queue/events', (frame) => onEvent(JSON.parse(frame.body) as ChatEvent));
    },
  });
  client.activate();
  return () => void client.deactivate();
}
