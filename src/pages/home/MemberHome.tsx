import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import { api } from '../../api/client';
import { DISCIPLINE_LABEL, exerciseCount, type FileType, type MembershipStatus, type Routine } from '../../api/types';
import { MembershipChip, fmtDay } from '../../components/billingFormat';
import { useAuth } from '../../auth/AuthContext';
import CatalogTable from '../../components/CatalogTable';
import CredentialDialog from '../../components/CredentialDialog';
import DisciplineChip from '../../components/DisciplineChip';
import PageHeader from '../../components/PageHeader';

const COUNT_LABELS: Record<FileType, [string, string]> = {
  VIDEO: ['video', 'videos'],
  PDF: ['PDF', 'PDF'],
  EXCEL: ['Excel', 'Excel'],
  IMAGEN: ['foto', 'fotos'],
};

function FileSummary({ routine }: { routine: Routine }) {
  const counts = routine.files.reduce<Partial<Record<FileType, number>>>((acc, f) => ({ ...acc, [f.fileType]: (acc[f.fileType] ?? 0) + 1 }), {});
  const entries = Object.entries(counts) as [FileType, number][];
  const n = exerciseCount(routine);
  const days = routine.days.length;
  if (entries.length === 0 && n === 0) return <Typography variant="body2" color="text.secondary">Sin contenido</Typography>;
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {days > 0 && <Chip size="small" variant="outlined" label={`${days} ${days === 1 ? 'día' : 'días'}`} />}
      {n > 0 && <Chip size="small" variant="outlined" label={`${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`} />}
      {entries.map(([t, n]) => <Chip key={t} size="small" variant="outlined" label={`${n} ${COUNT_LABELS[t][n === 1 ? 0 : 1]}`} />)}
    </Stack>
  );
}

/** Inicio: las rutinas asignadas al usuario conectado. */
export default function MemberHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [credential, setCredential] = useState(false);
  const isMember = !!user?.roles.includes('SOCIO');

  useEffect(() => {
    api.myRoutines().then(setRows).finally(() => setLoading(false));
    if (isMember) api.myPayments().then((m) => setMembership(m.status));
  }, [isMember]);

  return (
    <>
      <PageHeader title={`Hola, ${user?.fullName.split(' ')[0] ?? ''}`} subtitle="Estas son las rutinas que tienes asignadas" />
      {membership && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', py: '14px !important' }}>
            <div>
              <Typography variant="subtitle2">Tu membresía</Typography>
              <Typography variant="caption" color="text.secondary">
                Inscrito desde el {fmtDay(membership.enrolledOn)}
                {membership.state === 'VENCIDA' || membership.state === 'SIN_PAGOS' ? ' · Pasa a recepción para renovar' : ''}
              </Typography>
            </div>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <MembershipChip status={membership} />
              <Button size="small" variant="outlined" color="inherit" startIcon={<QrCode2Outlined />} onClick={() => setCredential(true)}>
                Mi credencial
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
      <CredentialDialog open={credential} onClose={() => setCredential(false)} name={user?.fullName ?? ''} load={api.myQr} />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${DISCIPLINE_LABEL[r.discipline]} ${r.trainer.fullName}`}
        onRowClick={(r) => navigate(`/mis-rutinas/${r.id}`)}
        empty="Todavía no tienes rutinas asignadas"
        columns={[
          {
            label: 'Rutina',
            render: (r) => (
              <>
                <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
              </>
            ),
          },
          { label: 'Tipo', render: (r) => <DisciplineChip discipline={r.discipline} />, hideOnMobile: true },
          { label: 'Entrenador', render: (r) => r.trainer.fullName, hideOnMobile: true },
          { label: 'Material', render: (r) => <FileSummary routine={r} /> },
          { label: 'Asignada', render: (r) => new Date(r.createdAt).toLocaleDateString(), hideOnMobile: true },
        ]}
      />
    </>
  );
}
