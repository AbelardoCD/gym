import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { MUSCLE_LABEL, type Exercise } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';

/** Catálogo de ejercicios con los que se arman las rutinas. */
export default function ExercisesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.exercises().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Ejercicios"
        subtitle="Catálogo para armar las rutinas"
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/ejercicios/nuevo')}>Nuevo ejercicio</Button>}
      />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(e) => e.id}
        searchText={(e) => `${e.name} ${MUSCLE_LABEL[e.muscleGroup]}`}
        onRowClick={(e) => navigate(`/ejercicios/${e.id}`)}
        empty="No hay ejercicios"
        columns={[
          { label: 'Ejercicio', render: (e) => <Typography variant="body2" fontWeight={600}>{e.name}</Typography> },
          { label: 'Grupo', render: (e) => MUSCLE_LABEL[e.muscleGroup] },
          { label: 'Rutinas', render: (e) => e.uses, align: 'right', hideOnMobile: true },
          {
            label: 'Estado',
            hideOnMobile: true,
            render: (e) => <Chip size="small" variant="outlined" color={e.active ? 'success' : 'default'} label={e.active ? 'Activo' : 'Inactivo'} />,
          },
        ]}
      />
    </>
  );
}
