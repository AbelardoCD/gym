import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { api } from '../api/client';
import { ACCESS_LABEL, PERIOD_LABEL, type MembershipPlan } from '../api/types';
import CatalogTable from '../components/CatalogTable';
import PageHeader from '../components/PageHeader';
import { fmtMoney } from '../components/billingFormat';

export default function PlansPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.plans().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Membresías"
        subtitle="Tipos de membresía y su precio"
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => navigate('/membresias/nueva')}>Nueva membresía</Button>}
      />
      <CatalogTable
        rows={rows}
        loading={loading}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.name} ${ACCESS_LABEL[p.access]} ${PERIOD_LABEL[p.period]}`}
        onRowClick={(p) => navigate(`/membresias/${p.id}`)}
        empty="No hay membresías"
        columns={[
          { label: 'Membresía', render: (p) => <Typography variant="body2" fontWeight={600}>{p.name}</Typography> },
          { label: 'Acceso', render: (p) => ACCESS_LABEL[p.access], hideOnMobile: true },
          { label: 'Periodo', render: (p) => PERIOD_LABEL[p.period] },
          {
            label: 'Precio',
            align: 'right',
            render: (p) => p.price > 0
              ? <Typography variant="body2" fontWeight={600}>{fmtMoney(p.price)}</Typography>
              : <Chip size="small" variant="outlined" color="warning" label="Sin precio" />,
          },
          { label: 'Pagos', render: (p) => p.payments, align: 'right', hideOnMobile: true },
          {
            label: 'Estado',
            render: (p) => <Chip size="small" variant="outlined" color={p.active ? 'success' : 'default'} label={p.active ? 'Activa' : 'Inactiva'} />,
            hideOnMobile: true,
          },
        ]}
      />
    </>
  );
}
