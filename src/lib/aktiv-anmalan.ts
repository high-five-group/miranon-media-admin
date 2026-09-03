import type { Registration } from '@/domain/models/Registration';
import { RegistrationStatus } from '@/domain/types/Status';

/**
 * AKTIV anmälan (basens `Anmälningar.Är aktiv (1/0)`-formel, fld4j7PeckDViTdIB).
 * EN definition, delade konsumenter (Deltagares register-summeringar/topp-
 * räknare, Gruppdynamiks mix, Åtgärdssidans betalningsskrivyta) — ändras
 * basens formel ändras predikatet HÄR, aldrig i flera filer (shotgun
 * surgery-vakten; samma ETT-uppslag-disciplin som `genomford.ts`).
 *
 * Extraherad ur tre identiska kopior (Deltagare.tsx, Gruppdynamik.tsx,
 * AtgardsSida.tsx) i samband med TASK-368.1/TASK-213.8 — ren refaktorering,
 * ingen beteendeändring i denna commit.
 */
export function arAktivAnmalan(r: Registration): boolean {
  return r.status !== RegistrationStatus.AVBOKAD;
}
