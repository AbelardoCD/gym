import { Chip, type SvgIconProps } from '@mui/material';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import SportsGymnasticsOutlined from '@mui/icons-material/SportsGymnasticsOutlined';
import { DISCIPLINE_LABEL, type Discipline } from '../api/types';

export function DisciplineIcon({ discipline, ...props }: { discipline: Discipline } & SvgIconProps) {
  return discipline === 'CROSSFIT' ? <SportsGymnasticsOutlined {...props} /> : <FitnessCenterOutlined {...props} />;
}

/** Etiqueta discreta con el tipo de rutina: Gym o CrossFit. */
export default function DisciplineChip({ discipline }: { discipline: Discipline }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<DisciplineIcon discipline={discipline} />}
      label={DISCIPLINE_LABEL[discipline]}
      sx={{ '& .MuiChip-icon': { fontSize: 16, ml: 0.75 } }}
    />
  );
}
