import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import { api } from '../api/client';
import { DISCIPLINE_LABEL, type ProgressRow } from '../api/types';
import { fmtDay } from '../components/billingFormat';
import CatalogTable from '../components/CatalogTable';
import DisciplineChip from '../components/DisciplineChip';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';

/** Socios activos con su última toma de medidas; al abrir uno se ve su perfil y progreso. */
export default function ProgressPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Progreso" subtitle="Perfil y medidas de los socios" />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(r) => r.userId}
        searchText={(r) => `${r.fullName} ${r.disciplines.map((d) => DISCIPLINE_LABEL[d]).join(' ')}`}
        onRowClick={(r) => navigate(`/progreso/${r.userId}`)}
        empty="No hay socios activos"
        columns={[
          {
            label: 'Socio',
            render: (r) => (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <UserAvatar userId={r.userId} name={r.fullName} photoVersion={r.photoVersion} size={30} />
                <Typography variant="body2" fontWeight={600}>{r.fullName}</Typography>
              </Stack>
            ),
          },
          {
            label: 'Tipo',
            hideOnMobile: true,
            render: (r) => (
              <Stack direction="row" spacing={0.5}>{r.disciplines.map((d) => <DisciplineChip key={d} discipline={d} />)}</Stack>
            ),
          },
          {
            label: 'Última toma',
            render: (r) => (r.lastMeasuredOn ? fmtDay(r.lastMeasuredOn) : <Typography variant="body2" color="text.secondary">Sin medidas</Typography>),
          },
          {
            label: 'Peso',
            align: 'right',
            render: (r) => (r.lastWeightKg != null ? `${Number(r.lastWeightKg).toLocaleString([], { maximumFractionDigits: 1 })} kg` : '—'),
          },
        ]}
      />
    </>
  );
}
