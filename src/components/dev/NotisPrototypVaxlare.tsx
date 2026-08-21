import { useQueryState } from 'nuqs';
import {
  type PrototypeDataLage,
  PrototypeSwitcher,
  type PrototypeVariant,
} from '@/components/dev/PrototypeSwitcher';

/**
 * [PROTOTYPE — KONVERGENS, S109] Växlare för uppdateringsnotisen.
 *
 * Notisen är app-global (`AppUpdateBanner` i `__root.tsx`), så prototypen
 * tar spjärn mot VARJE befintlig vy (underform A) i stället för en egen
 * dev-route: `/hem?variant=1&data=ny-version`, `/personer?variant=1&…`.
 * Växlaren monteras bara när `?variant` finns i URL:en — utan parametern är
 * DEV-appen exakt den skarpa. Rivs mekaniskt efter Marcus godkännande
 * (ADR-103); formen som rivs är växeln, aldrig notisen.
 */
const VARIANTER: PrototypeVariant[] = [
  { key: '1', label: 'Överlagrad notis', steg: 1, stegLabel: 'Konvergensvarv 1' },
];

const DATA_LAGEN: PrototypeDataLage[] = [
  { value: null, label: 'Skarp' },
  { value: 'ny-version', label: 'Ny' },
  { value: 'chunk', label: 'Chunk' },
];

export function NotisPrototypVaxlare() {
  const [variant] = useQueryState('variant');
  if (variant == null) return null;
  return <PrototypeSwitcher variants={VARIANTER} dataLagen={DATA_LAGEN} />;
}
