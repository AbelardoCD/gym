import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Stack, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { DISCIPLINE_LABEL, roleLabel, type MembershipStatus, type User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { MembershipChip } from '../components/billingFormat';

/** "Socio · Gym y CrossFit" para los socios; el nombre del rol para los demás. */
function roleChipLabel(u: User, role: string) {
  if (role !== 'SOCIO' || u.disciplines.length === 0) return roleLabel(role);
  return `${roleLabel(role)} · ${u.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(' y ')}`;
}
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';

export default function UsersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { can } = useAuth();
  const [statuses, setStatuses] = useState<Record<number, MembershipStatus>>({});

  useEffect(() => {
    api.listUsers().then(setRows).finally(() => setLoading(false));
    if (can('PAGOS')) api.membershipStatuses().then((l) => setStatuses(Object.fromEntries(l.map((s) => [s.userId, s]))));
  }, [can]);

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle={`${rows.length} usuarios registrados`}
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/usuarios/nuevo')}>Nuevo usuario</Button>}
      />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(u) => u.id}
        searchText={(u) => `${u.fullName} ${u.email} ${u.roles.join(' ')} ${u.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(' ')}`}
        onRowClick={(u) => navigate(`/usuarios/${u.id}`)}
        columns={[
          {
            label: 'Nombre',
            render: (u) => (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <UserAvatar userId={u.id} name={u.fullName} photoVersion={u.photoVersion} size={30} />
                <div>
                  <Typography variant="body2" fontWeight={600}>{u.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { md: 'none' } }}>{u.email}</Typography>
                </div>
              </Stack>
            ),
          },
          { label: 'Correo', render: (u) => u.email, hideOnMobile: true },
          {
            label: 'Roles',
            render: (u) => (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {u.roles.map((r) => <Chip key={r} size="small" label={roleChipLabel(u, r)} />)}
              </Stack>
            ),
          },
          ...(can('PAGOS')
            ? [{
                label: 'Membresía',
                render: (u: User) => (u.roles.includes('SOCIO') ? <MembershipChip status={statuses[u.id]} /> : null),
                hideOnMobile: true,
              }]
            : []),
          {
            label: 'Estado',
            render: (u) => <Chip size="small" variant="outlined" color={u.active ? 'success' : 'default'} label={u.active ? 'Activo' : 'Inactivo'} />,
          },
        ]}
      />
    </>
  );
}
