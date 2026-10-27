import { Avatar, type SxProps, type Theme } from '@mui/material';
import { photoUrl } from '../api/client';

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

interface Props {
  userId: number;
  name: string;
  photoVersion?: string | null;
  size?: number;
  sx?: SxProps<Theme>;
}

/** Foto del usuario o, si no tiene (o no carga), sus iniciales. */
export default function UserAvatar({ userId, name, photoVersion, size = 34, sx }: Props) {
  return (
    <Avatar src={photoUrl(userId, photoVersion)} alt={name} sx={{ width: size, height: size, fontSize: size * 0.38, ...sx }}>
      {initials(name)}
    </Avatar>
  );
}
