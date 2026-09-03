import type { QueryClient } from '@tanstack/react-query';
import type { RegistrationDetail } from '@/domain/schemas';
import { RegistrationStatus, type RegistrationStatusValue } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';

/**
 * Patchar EN anmälans detalj-cache med serverns EGEN utsaga om status och
 * Notering. Delad av `cancel-registration`- och `rebook-registration`-
 * mutationerna, som båda svarar med exakt de två fälten för just detta ändamål
 * (`CancelRegistration.schema.ts` / `RebookRegistration.schema.ts`).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR INVALIDERINGEN INTE RÄCKER — OCH VARFÖR DET BLEV VÄRRE MED PERSIST
 * ═══════════════════════════════════════════════════════════════════════════
 * Skälet `TASK-368.3` skrev ned: mellan serverns svar och att
 * `get-registration` hunnit svara igen (mätt golv ~1-3 s varm mot staging)
 * hade sidan stått kvar med den GAMLA statusen — alltså med "Avboka anmälan"
 * synlig på en redan avbokad anmälan.
 *
 * `TASK-368.5` mätte ett ANDRA, längre fönster: cachen PERSISTAS till
 * localStorage (`ADR-072`, `src/queries/persist.ts`) med `staleTime` 5 min
 * (`src/router.ts`). En invalidering markerar bara AKTIVA queries för
 * omhämtning; den gamla anmälans detalj är avmonterad direkt efter en
 * ombokning (Lotta har navigerat till den NYA anmälan), och efter en
 * omladdning restaureras den ur localStorage som FÄRSK. Utan patchen kan den
 * gamla anmälans sida därför visa "Bekräftad" i upp till fem minuter efter en
 * ombokning som redan är gjord i basen. Mätt i den hermetiska fixturvärlden
 * 2026-09-03 (`anmalan-ombokning.acceptance.test.ts` § den GAMLA anmälan):
 * assertionen föll på exakt det, och blev grön med patchen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STATUS SKRIVS BARA NÄR DEN ÄR ETT KÄNT BASVÄRDE
 * ═══════════════════════════════════════════════════════════════════════════
 * Svarens `status` är `z.string()` (serverns ord), medan
 * `RegistrationSchema.status` är `z.enum(RegistrationStatus).nullable()`. Ett
 * okänt värde skulle alltså göra cachen schema-otrogen; då hoppas patchen över
 * helt och invalideringens omhämtning får bära bytet. Det är fail-safe åt rätt
 * håll: en utebliven patch kostar sekunder, en schema-otrogen cache kostar en
 * krasch i en vy som litar på enum:en.
 *
 * `notering` är HELA fältet efter appendet, inte bara den nya raden — den
 * skrivs därför rakt in, aldrig konkatenerad.
 */

/** Serverns statussträng, men bara om den är ett av basens sex kända värden. */
function kandStatus(status: string): RegistrationStatusValue | null {
  const kanda: readonly string[] = Object.values(RegistrationStatus);
  return kanda.includes(status) ? (status as RegistrationStatusValue) : null;
}

export function patchaAnmalansDetaljcache(
  queryClient: QueryClient,
  resultat: { registrationId: string; status: string; notering: string },
): void {
  const status = kandStatus(resultat.status);
  if (status === null) return;
  queryClient.setQueryData<RegistrationDetail>(
    queryKeys.registrations.detail(resultat.registrationId),
    (gammal) => (gammal ? { ...gammal, status, notering: resultat.notering } : gammal),
  );
}
