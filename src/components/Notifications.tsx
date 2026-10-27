import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, IconButton, Paper, Slide, Snackbar, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { api } from '../api/client';
import { connectRealtime } from '../api/realtime';
import type { ChatEvent } from '../api/types';
import { useAuth } from '../auth/AuthContext';

type Listener = (e: ChatEvent) => void;

interface Notice {
  key: number;
  title: string;
  body: string;
  to: string;
}

interface NotificationsValue {
  /** Mensajes sin leer más solicitudes de chat pendientes. */
  unread: number;
  /** Vuelve a contar los pendientes (por ejemplo, después de marcar una conversación como leída). */
  refreshUnread: () => void;
  /** Recibe los eventos en tiempo real; devuelve la función para dejar de escuchar. */
  subscribe: (l: Listener) => () => void;
  /** Permiso de avisos del navegador: 'unsupported' si el navegador no los tiene. */
  browserPermission: NotificationPermission | 'unsupported';
  askBrowserPermission: () => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return ctx;
}

const BASE_TITLE = document.title;
const browserSupport = (): NotificationPermission | 'unsupported' => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

/**
 * Una sola conexión en tiempo real mientras hay sesión: cuenta los pendientes del chat, avisa con una
 * tarjeta dentro de la app y, si la pestaña está en segundo plano y hay permiso, con un aviso del navegador.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const listeners = useRef(new Set<Listener>());
  const [unread, setUnread] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(browserSupport);
  const enabled = !!user && can('CHAT');

  const refreshUnread = useCallback(() => {
    if (!enabled) return;
    Promise.all([api.conversations(), api.incomingRequests()])
      .then(([conversations, requests]) => setUnread(conversations.reduce((n, c) => n + c.unread, 0) + requests.length))
      .catch(() => undefined);
  }, [enabled]);

  const show = useCallback((title: string, body: string, to: string) => {
    setNotice({ key: Date.now(), title, body, to });
    if (document.hidden && browserSupport() === 'granted') {
      const n = new Notification(title, { body, tag: to });
      n.onclick = () => {
        window.focus();
        navigate(to);
        n.close();
      };
    }
  }, [navigate]);

  useEffect(() => {
    if (!enabled) {
      setUnread(0);
      return;
    }
    refreshUnread();
    const disconnect = connectRealtime((e) => {
      listeners.current.forEach((l) => l(e));
      if (e.type === 'MENSAJE') {
        const m = e.payload;
        const viewing = pathRef.current === `/chat/${m.conversationId}` && !document.hidden;
        if (m.senderId !== user?.id && !viewing) {
          // El mensaje no trae el nombre de quien lo envía; se toma de la conversación.
          api.conversations().then((cs) => {
            const name = cs.find((c) => c.id === m.conversationId)?.contact.fullName ?? 'Nuevo mensaje';
            show(name, m.content, `/chat/${m.conversationId}`);
          });
        }
      } else if (e.type === 'SOLICITUD_RECIBIDA') {
        show('Solicitud de chat', `${e.payload.sender.fullName} quiere chatear contigo`, '/chat');
      } else if (e.type === 'SOLICITUD_ACEPTADA') {
        show('Solicitud aceptada', `${e.payload.receiver.fullName} aceptó tu solicitud`, e.payload.conversationId ? `/chat/${e.payload.conversationId}` : '/chat');
      }
      refreshUnread();
    });
    return disconnect;
  }, [enabled, user?.id, refreshUnread, show]);

  // El número de pendientes también se ve en la pestaña del navegador.
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${BASE_TITLE}` : BASE_TITLE;
  }, [unread]);

  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  const askBrowserPermission = useCallback(() => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(setBrowserPermission);
  }, []);

  const close = () => setNotice(null);

  return (
    <NotificationsContext.Provider value={{ unread, refreshUnread, subscribe, browserPermission, askBrowserPermission }}>
      {children}
      <Snackbar
        key={notice?.key}
        open={!!notice}
        onClose={(_, reason) => reason !== 'clickaway' && close()}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Paper
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, pl: 2, width: { xs: 'calc(100vw - 32px)', sm: 360 }, boxShadow: 6 }}
        >
          <ChatBubbleOutlineOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{notice?.title}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{notice?.body}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                if (notice) navigate(notice.to);
                close();
              }}
            >
              Ver
            </Button>
            <IconButton size="small" aria-label="Cerrar aviso" onClick={close}><CloseOutlined fontSize="small" /></IconButton>
          </Stack>
        </Paper>
      </Snackbar>
    </NotificationsContext.Provider>
  );
}

/** Ícono del menú con el número de pendientes del chat. */
export function ChatBadge({ children }: { children: ReactNode }) {
  const { unread } = useNotifications();
  return (
    <Badge
      badgeContent={unread}
      max={99}
      sx={{ '& .MuiBadge-badge': { fontSize: 10, fontWeight: 700, height: 16, minWidth: 16, px: 0.5, bgcolor: 'text.primary', color: 'background.default' } }}
    >
      {children}
    </Badge>
  );
}
