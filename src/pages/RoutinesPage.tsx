import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarGroup, Avatar, Button, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { DAY_LABEL, DISCIPLINE_LABEL, exerciseCount, type Routine } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import DisciplineChip from '../components/DisciplineChip';
import { initials } from '../components/UserAvatar';
import PageHeader from '../components/PageHeader';

export default function RoutinesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.routines().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Rutinas"
        subtitle="Crea rutinas, súbeles material y asígnalas a los usuarios"
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/rutinas/nueva')}>Nueva rutina</Button>}
      />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${DISCIPLINE_LABEL[r.discipline]} ${r.trainer.fullName} ${r.members.map((m) => m.fullName).join(' ')}`}
        onRowClick={(r) => navigate(`/rutinas/${r.id}`)}
        empty="No hay rutinas. Crea la primera con «Nueva rutina»."
        columns={[
          { label: 'Rutina', render: (r) => <Typography variant="body2" fontWeight={600}>{r.name}</Typography> },
          { label: 'Tipo', render: (r) => <DisciplineChip discipline={r.discipline} /> },
          { label: 'Entrenador', render: (r) => r.trainer.fullName, hideOnMobile: true },
          {
            label: 'Asignada a',
            render: (r) =>
              r.members.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nadie</Typography>
              ) : (
                <AvatarGroup max={5} sx={{ width: 'fit-content', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 } }}>
                  {r.members.map((m) => (
                    <Tooltip key={m.id} title={m.fullName}>
                      <Avatar>{initials(m.fullName)}</Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              ),
          },
          {
            label: 'Días',
            render: (r) => r.days.length ? r.days.map((d) => DAY_LABEL[d.dayOfWeek].slice(0, 3)).join(' · ') : '—',
            hideOnMobile: true,
          },
          { label: 'Ejercicios', render: (r) => exerciseCount(r), align: 'right', hideOnMobile: true },
          { label: 'Archivos', render: (r) => r.files.length, align: 'right', hideOnMobile: true },
          { label: 'Creada', render: (r) => new Date(r.createdAt).toLocaleDateString(), hideOnMobile: true },
        ]}
      />
    </>
  );
}
