import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar, Badge, Box, Button, Divider, IconButton, InputAdornment, List, ListItemAvatar, ListItemButton, ListItemText,
  ListSubheader, Paper, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import SendOutlined from '@mui/icons-material/SendOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import DoneOutlined from '@mui/icons-material/DoneOutlined';
import DoneAllOutlined from '@mui/icons-material/DoneAllOutlined';
import { api, errorMessage } from '../api/client';
import { connectRealtime } from '../api/realtime';
import { rolesLabel, type ChatEvent, type ChatRequest, type Conversation, type Message, type UserSummary } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../components/UserAvatar';
import { tones } from '../theme';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const avatarSx = { fontSize: 14 };
const subheader = (text: string) => <ListSubheader disableSticky sx={{ lineHeight: '32px', bgcolor: 'transparent', fontSize: 12 }}>{text}</ListSubheader>;

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const activeId = params.conversationId ? Number(params.conversationId) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [incoming, setIncoming] = useState<ChatRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ChatRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const refreshLists = useCallback(() => {
    api.conversations().then(setConversations);
    api.incomingRequests().then(setIncoming);
    api.outgoingRequests().then(setOutgoing);
  }, []);

  useEffect(refreshLists, [refreshLists]);

  // Eventos en tiempo real: mensajes nuevos, lecturas y solicitudes.
  useEffect(
    () =>
      connectRealtime((e: ChatEvent) => {
        if (e.type === 'MENSAJE') {
          if (e.payload.conversationId === activeRef.current) {
            setMessages((prev) => (prev.some((m) => m.id === e.payload.id) ? prev : [...prev, e.payload]));
            if (e.payload.senderId !== user?.id) api.markRead(e.payload.conversationId);
          }
          api.conversations().then(setConversations);
        } else if (e.type === 'LEIDO') {
          if (e.payload === activeRef.current) {
            setMessages((prev) => prev.map((m) => (m.readAt ? m : { ...m, readAt: new Date().toISOString() })));
          }
        } else {
          refreshLists();
        }
      }),
    [refreshLists, user?.id],
  );

  useEffect(() => {
    if (!activeId) return;
    api.messages(activeId).then((page) => setMessages([...page].reverse()));
    api.markRead(activeId).then(() => api.conversations().then(setConversations));
  }, [activeId]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => api.searchUsers(query).then(setResults), 300);
    return () => clearTimeout(t);
  }, [query]);

  async function request(u: UserSummary) {
    try {
      await api.sendChatRequest(u.id);
      setNotice(`Solicitud enviada a ${u.fullName}`);
      setQuery('');
      refreshLists();
    } catch (e) {
      setNotice(errorMessage(e));
    }
  }

  async function respond(r: ChatRequest, accept: boolean) {
    const res = accept ? await api.acceptRequest(r.id) : await api.rejectRequest(r.id);
    refreshLists();
    if (res.conversationId) navigate(`/chat/${res.conversationId}`);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !text.trim()) return;
    const m = await api.sendMessage(activeId, text);
    setText('');
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  const active = conversations.find((c) => c.id === activeId);
  const showList = desktop || !activeId;
  const showWindow = desktop || !!activeId;

  return (
    <Paper variant="outlined" sx={{ display: 'flex', height: { xs: 'calc(100vh - 96px)', md: 'calc(100vh - 64px)' }, overflow: 'hidden' }}>
      {showList && (
        <Box sx={{ width: { xs: '100%', md: 340 }, borderRight: { xs: 'none', md: `1px solid ${tones.border}` }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Chat</Typography>
            <TextField
              placeholder="Buscar personas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
            {notice && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{notice}</Typography>}
          </Box>
          <Divider />
          <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {results.length > 0 && subheader('Resultados')}
            {results.map((u) => (
              <ListItemButton key={u.id} onClick={() => request(u)}>
                <ListItemAvatar><Avatar sx={avatarSx}>{initials(u.fullName)}</Avatar></ListItemAvatar>
                <ListItemText primary={u.fullName} secondary={rolesLabel(u.roles)} />
                <Typography variant="caption" color="text.secondary">Enviar solicitud</Typography>
              </ListItemButton>
            ))}

            {incoming.length > 0 && subheader('Solicitudes recibidas')}
            {incoming.map((r) => (
              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
                <Avatar sx={avatarSx}>{initials(r.sender.fullName)}</Avatar>
                <Typography variant="body2" sx={{ flex: 1 }}>{r.sender.fullName}</Typography>
                <Button size="small" variant="contained" onClick={() => respond(r, true)}>Aceptar</Button>
                <Button size="small" color="inherit" onClick={() => respond(r, false)}>Rechazar</Button>
              </Box>
            ))}

            {outgoing.length > 0 && subheader('Esperando respuesta')}
            {outgoing.map((r) => (
              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, opacity: 0.7 }}>
                <Avatar sx={avatarSx}>{initials(r.receiver.fullName)}</Avatar>
                <Typography variant="body2">{r.receiver.fullName}</Typography>
              </Box>
            ))}

            {subheader('Conversaciones')}
            {conversations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>Busca a alguien y envíale una solicitud para empezar.</Typography>
            )}
            {conversations.map((c) => (
              <ListItemButton key={c.id} selected={c.id === activeId} onClick={() => navigate(`/chat/${c.id}`)}>
                <ListItemAvatar><Avatar sx={avatarSx}>{initials(c.contact.fullName)}</Avatar></ListItemAvatar>
                <ListItemText
                  primary={c.contact.fullName}
                  secondary={c.lastMessage?.content ?? 'Sin mensajes'}
                  primaryTypographyProps={{ fontWeight: c.unread ? 600 : 500, fontSize: 14 }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
                {c.unread > 0 && <Badge badgeContent={c.unread} color="primary" sx={{ mr: 1 }} />}
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}

      {showWindow && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: tones.canvas, minWidth: 0 }}>
          {!activeId ? (
            <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
              <Typography color="text.secondary">Elige una conversación</Typography>
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2, py: 1.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                {!desktop && <IconButton onClick={() => navigate('/chat')}><ArrowBackOutlined /></IconButton>}
                <Avatar sx={avatarSx}>{active && initials(active.contact.fullName)}</Avatar>
                <Box>
                  <Typography variant="subtitle2">{active?.contact.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{active && rolesLabel(active.contact.roles)}</Typography>
                </Box>
              </Stack>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <Box
                      key={m.id}
                      sx={{
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        bgcolor: mine ? 'primary.main' : tones.raised,
                        color: mine ? 'primary.contrastText' : 'text.primary',
                                              }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center', opacity: 0.7 }}>
                        <Typography variant="caption" sx={{ fontSize: 11 }}>{time(m.sentAt)}</Typography>
                        {mine && (m.readAt ? <DoneAllOutlined sx={{ fontSize: 14 }} /> : <DoneOutlined sx={{ fontSize: 14 }} />)}
                      </Stack>
                    </Box>
                  );
                })}
                <div ref={bottomRef} />
              </Box>
              <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 1, p: 1.5, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <TextField placeholder="Escribe un mensaje" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
                <IconButton type="submit" color="primary" disabled={!text.trim()}><SendOutlined /></IconButton>
              </Box>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
}
