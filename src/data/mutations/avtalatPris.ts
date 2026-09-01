import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Sätt ANMÄLANS avtalade pris — ensamt, utan att bokföra en betalning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR DEN FINNS (Marcus dom 2026-09-01)
 * ═══════════════════════════════════════════════════════════════════════════
 * Ordagrant: *"det finns ingen 'spara-knapp' ju?"*. Prisytan i
 * `RegistreraForm` hade ett fält men ingen egen skrivväg — värdet buntades
 * med registreringen och sattes först när Lotta tryckte "Registrera".
 *
 * MODELLEN ÄR SEMANTISKT RIKTIGARE, inte bara bekvämare: en
 * prisöverenskommelse är oberoende av en betalning. Lotta och deltagaren kan
 * komma överens om ett lägre pris i februari och få pengarna i mars — den
 * gamla formen tvingade henne att bokföra en betalning för att få sätta ett
 * pris, och den saknade helt väg för "vi sänkte priset, ingen har betalat
 * än".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SKRIVVÄGEN ÄR BEFINTLIG OCH ALLOWLISTAD — MÄTT, INTE ANTAGET
 * ═══════════════════════════════════════════════════════════════════════════
 * `update-record`-operationen **`write-registration-payment-mirror`**
 * (`supabase/functions/_shared/field-allowlists.ts`) pekar på tabellen
 * `Anmälningar` och bär `'Avtalat pris (kr)'` bland sina `allowedFields`.
 * Allowlisten gatar FÄLT, inte kombination — ett anrop som sätter ENBART
 * priset är därför lika giltigt som spegelanropets fulla patch.
 *
 * Allowlist-postens egen kommentar namnger dessutom exakt detta bruk:
 * *"'Avtalat pris (kr)' när Lotta sätter ett rabatterat pris via
 * betalningsformuläret"*. Vägen är alltså inte omtolkad, den är den avsedda.
 *
 * DETTA FALSIFIERAR EN BOKFÖRD GRÄNS. `RegistreraForm.tsx` § AVTALAT PRIS
 * påstod: *"Priset kan bara sättas I SAMMA OPERATION som en inbetalning
 * registreras — det finns ingen EF som sätter enbart priset."* Det stämde för
 * de DEDIKERADE betalnings-EF:erna (`registrera-inbetalning` m.fl.), men
 * missade den generiska `update-record`-ytan som hela repot redan skriver
 * anmälningsfält genom (`registrationPayments.ts`, `registrationLodging.ts`,
 * `attendance.ts`). Gränsen är riven i `RegistreraForm`s docblock, inte tyst
 * överskriven.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ÖPPEN RISK, BOKFÖRD I STÄLLET FÖR ANTAGEN: UTRULLNINGSLÄGET
 * ═══════════════════════════════════════════════════════════════════════════
 * Allowlist-posten landade i `b1ee194a` (TASK-346.2). Om den DEPLOYADE
 * `update-record`-buntet bär den posten är **inte verifierat här** — det
 * kräver `supabase functions list` mot miljön, vilket ligger utanför en
 * lokal designiteration. Backfill-skriptet
 * (`scripts/backfill-inbetalningar.mjs`) refererar visserligen operationen,
 * men bara för att VALIDERA sin patch mot allowlisten; det skriver direkt mot
 * Airtable-API:t och är därför inget bevis för att EF:en känner operationen.
 *
 * KONSEKVENSEN ÄR HANTERAD, INTE GÖMD: är operationen okänd för den utrullade
 * EF:en svarar den 400, och `RegistreraForm` visar felet i klartext i en
 * `role="alert"`. Ingen tyst förlust — Lotta får veta att priset inte
 * sparades. Krävs en deploy är det orkestrerarens moment.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN OPTIMISTISK CACHE-PATCH — OCH DET ÄR ETT VAL
 * ═══════════════════════════════════════════════════════════════════════════
 * `registrationPayments.ts` patchar cachen optimistiskt, eftersom kryssens
 * hela uttryck ÄR cache-tillståndet och en fördröjning där läser som en
 * trasig kryssruta. Här är läget ett annat: priset räknas om till "kvar att
 * betala" genom en HÄRLEDNING i EF:en (`betalningsharledning.ts`
 * `valjPris`/`harledBetalning`), inte genom ett fält UI:t kan spegla. En
 * optimistisk patch hade krävt att klienten dupliceras med serverns
 * prislogik — precis den drift `backfill-inbetalningar.mjs` § PENGALOGIKEN
 * importerar delad kod för att undvika.
 *
 * Ytan löser fördröjningen där den syns i stället: `RegistreraForm` behåller
 * sitt LOKALA utfallsöverdrag tills invalideringens refetch landat. Se dess
 * `sparatPris`-state.
 *
 * `betalningar.all` OCH `registrations.all` invalideras båda — samma par som
 * `useRegistreraInbetalning` (`inbetalningar.ts`), och av samma skäl: priset
 * ändrar både inkorgens härledda rader och anmälningsvyernas bild av vad som
 * är betalt.
 */
export function useSattAvtalatPris() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, { anmalanRecordId: string; avtalatPris: number }>({
    mutationFn: ({ anmalanRecordId, avtalatPris }) =>
      dataSource.updateRecord('write-registration-payment-mirror', anmalanRecordId, {
        'Avtalat pris (kr)': avtalatPris,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}
