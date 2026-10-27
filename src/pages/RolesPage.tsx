import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Stack, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { roleLabel, type Permission, type RoleInfo } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';

export default function RolesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RoleInfo[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.roles(), api.permissions()])
      .then(([r, p]) => { setRows(r); setPerms(p); })
      .finally(() => setLoading(false));
  }, []);

  const permName = (code: string) => perms.find((p) => p.code === code)?.name ?? code;

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        subtitle="Cada rol decide qué pantallas puede ver"
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/roles/nuevo')}>Nuevo rol</Button>}
      />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${r.description ?? ''}`}
        onRowClick={(r) => navigate(`/roles/${r.id}`)}
        columns={[
          {
            label: 'Rol',
            render: (r) => (
              <>
                <Typography variant="body2" fontWeight={600}>{roleLabel(r.name)}</Typography>
                {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
              </>
            ),
          },
          {
            label: 'Pantallas',
            hideOnMobile: true,
            render: (r) => (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {[...r.permissions]
                  .sort((a, b) => perms.findIndex((p) => p.code === a) - perms.findIndex((p) => p.code === b))
                  .map((c) => <Chip key={c} size="small" variant="outlined" label={permName(c)} />)}
              </Stack>
            ),
          },
          { label: 'Usuarios', render: (r) => r.users, align: 'right', width: 100 },
        ]}
      />
    </>
  );
}
