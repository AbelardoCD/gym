import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, ButtonBase, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { rolesLabel } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { NAV_ITEMS } from '../navigation';
import { ChatBadge } from './Notifications';
import Brand from './Brand';
import UserAvatar from './UserAvatar';

const WIDTH = 248;

export default function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((i) => can(...i.permissions));
  const isActive = (path: string) => (path === '/' ? pathname === '/' || pathname.startsWith('/mis-rutinas') : pathname.startsWith(path));

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ px: 1, py: 1, mb: 2.5 }}><Brand /></Box>
      <List disablePadding sx={{ flex: 1 }}>
        {items.map((i) => (
          <ListItemButton
            key={i.path}
            selected={isActive(i.path)}
            onClick={() => {
              navigate(i.path);
              setOpen(false);
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{i.path === '/chat' ? <ChatBadge>{i.icon}</ChatBadge> : i.icon}</ListItemIcon>
            <ListItemText primary={i.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
        <ButtonBase
          onClick={() => {
            navigate('/perfil');
            setOpen(false);
          }}
          sx={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start',
            textAlign: 'left', borderRadius: 2, p: 0.5, bgcolor: pathname === '/perfil' ? 'action.selected' : undefined,
            '&:hover': { bgcolor: 'action.hover' },
          }}
          title="Mi perfil"
        >
          {user && <UserAvatar userId={user.id} name={user.fullName} photoVersion={user.photoVersion} />}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {user && rolesLabel(user.roles)}
            </Typography>
          </Box>
        </ButtonBase>
        <Tooltip title="Cerrar sesión">
          <IconButton size="small" onClick={logout}><LogoutOutlined fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: WIDTH, '& .MuiDrawer-paper': { width: WIDTH, borderRight: 1, borderColor: 'divider' } }}>
          {drawer}
        </Drawer>
      ) : (
        <>
          <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              <IconButton edge="start" onClick={() => setOpen(true)}><MenuOutlined /></IconButton>
              <Box sx={{ ml: 1 }}><Brand size={28} /></Box>
            </Toolbar>
          </AppBar>
          <Drawer open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: WIDTH } }}>
            {drawer}
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 4 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
