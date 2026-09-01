import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type {
  HanteraInbetalningResult,
  KoaKvittonInput,
  KoaKvittonResult,
  OppnaBetalningar,
  RegistreraInbetalningInput,
  RegistreraInbetalningResult,
} from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-346.6] Inkorgens två skrivvägar: registrera en inbetalning, och köa
 * kvittona.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN AKTIVITETSLOGGNING HÄR — SERVERN GÖR DET REDAN
 * ═══════════════════════════════════════════════════════════════════════════
 * `receipts.ts` och `actionEmail.ts` skriver aktivitetsloggen från KLIENTEN,
 * eftersom deras Edge Functions inte gör det. Betalningsdomänens EF:er gör
 * det själva: `registrera-inbetalning/index.ts` § "Steg 4: aktivitetsloggen"
 * och `koa-kvitton/index.ts` importerar båda `_shared/aktivitetslogg.ts`.
 * En andra loggning härifrån hade gett Lotta två rader för en handling.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INVALIDERINGEN ÄR BRED, OCH DET ÄR AVSIKTLIGT
 * ═══════════════════════════════════════════════════════════════════════════
 * En registrerad inbetalning ändrar inkorgens lista, anmälans egen rad,
 * personens rad och (via spegeln) basens `Saknas (kr)`. Vilka av dem som
 * råkar vara monterade vet bara React Query, och `invalidateQueries` hämtar
 * bara om AKTIVA queries — bredden kostar därför noll extra nätverksanrop
 * för de vyer som inte visas. Samma resonemang som `useJobbRealtime` redan
 * bär för `queryKeys.betalningar.all`.
 *
 * `registrations.all` invalideras OCKSÅ, och det är inte överdrift: spegeln
 * skriver `Summa inbetalt (kr)` på ANMÄLAN i basen, och Åtgärds-sidan läser
 * det fältet. Utan raden hade den sidan visat ett gammalt tal tills något
 * annat råkade invalidera den.
 */

/**
 * Skriv in SERVERNS EGEN omräkning i listan över öppna betalningar, direkt.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VILKET PROBLEM DEN LÖSER (Marcus 2026-09-01, mätt kedja)
 * ═══════════════════════════════════════════════════════════════════════════
 * Ordagrant: *"När jag registrerar en betalning … så ska ju raden dyka upp i
 * granskningsblocket, och kortet i listan försvinna, men det är en delay på
 * att kortet i listan försvinner"*, och därefter: *"det är samma sak när man
 * ångrar en betalningsregistrering, det måste vara instant också ju."*
 *
 * KEDJAN, SPÅRAD I KODEN OCH BEKRÄFTAD:
 *   1. `RegistreraForm` → `onKlar` → `BetalningsInkorg.vidRegistrerad`
 *      sätter `registrerade`/`kvittenser` ur LOKALT state — omedelbart.
 *   2. Kortets försvinnande styrs av något helt annat: `rader` härleds ur
 *      `useOppnaBetalningar` (`harledRad` → `klar: kvar <= 0`), och den
 *      queryn hade bara invaliderats. Invalidering betyder REFETCH, alltså
 *      en full nätverksrundtur mot `hamta-oppna-betalningar` (som i sin tur
 *      läser Airtable).
 * Två state-vägar med olika latens i samma handling — därav delayn. Samma
 * asymmetri gällde Ångra-vägen spegelvänt: granskningsraden försvann
 * omedelbart ur lokalt state medan kortet återuppstod först vid refetch.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DETTA ÄR INTE EN OPTIMISTISK GISSNING — DET ÄR SERVERNS SVAR, TIDIGARE
 * ═══════════════════════════════════════════════════════════════════════════
 * Både `RegistreraInbetalningResult` och `HanteraInbetalningResult` bär ett
 * `harledning`-objekt med serverns EGNA omräknade `summa` och
 * `gallandePris` (`Betalningar.schema.ts`). Det är exakt de två fält
 * `harledRad` räknar `kvar`/`klar` ur. Vi skriver alltså in tal servern
 * redan beräknat och skickat — ingen parallell pengalogik uppstår här, och
 * kravet "uppfinn ingen egen beräkning" är uppfyllt strukturellt, inte av
 * disciplin.
 *
 * Det gör också kravet "bara vid LYCKAD mutation" trivialt uppfyllt: talen
 * FINNS inte förrän servern svarat. En `onMutate`-variant hade varit
 * omöjlig att skriva utan att gissa, vilket är precis vad pengalogik inte
 * ska göra.
 *
 * SERVERN FÖRBLIR FACIT. Anroparen behåller sin `invalidateQueries` efter
 * detta anrop, så en refetch skriver över med sanningen. React Query
 * behåller den patchade datan medan refetchen pågår, så ytan hinner aldrig
 * blinka tillbaka.
 *
 * `anmalanRecordId` ÄR FRIVILLIG MED AVSIKT. Kan anroparen inte peka ut
 * raden (t.ex. en väg där bara inbetalnings-ID:t är känt) hoppas patchen
 * över och invalideringen sköter jobbet som förut — långsammare, aldrig
 * fel. Att hitta på en koppling hade varit värre än en fördröjning.
 */
function skrivHarledningTillOppna(
  queryClient: QueryClient,
  anmalanRecordId: string | undefined,
  harledning: { summa: number; gallandePris: number | null },
) {
  if (anmalanRecordId === undefined) return;
  queryClient.setQueryData<OppnaBetalningar>(queryKeys.betalningar.oppna, (gammal) =>
    gammal === undefined
      ? gammal
      : {
          ...gammal,
          betalningar: gammal.betalningar.map((b) =>
            b.anmalanRecordId === anmalanRecordId
              ? {
                  ...b,
                  summaInbetalt: harledning.summa,
                  gallandePris: harledning.gallandePris,
                }
              : b,
          ),
        },
  );
}

export function useRegistreraInbetalning() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<RegistreraInbetalningResult, Error, RegistreraInbetalningInput>({
    mutationFn: (input) => dataSource.registreraInbetalning(input),
    onSuccess: (resultat, input) => {
      // Kortet i inkorgen ska försvinna i SAMMA tick — se
      // `skrivHarledningTillOppna` för den uppmätta kedjan.
      skrivHarledningTillOppna(queryClient, input.anmalanRecordId, resultat.harledning);
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}

/**
 * "Skicka N kvitton" — ETT klick, ETT jobb, N rader (ADR-129 beslut 3).
 *
 * Svaret kommer DIREKT och innehåller inte utfallet: kvittona genereras och
 * skickas i bakgrunden. Raderna tickar via Realtime plus läsningen i
 * `useJobbstatus`. Det är hela poängen med jobbmotorn, och skälet till att
 * denna mutation aldrig ska vänta på något.
 */
export function useKoaKvitton() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<KoaKvittonResult, Error, KoaKvittonInput>({
    mutationFn: (input) => dataSource.koaKvitton(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
    },
  });
}

/**
 * [TASK-346.9 AC #1] Radera — tillåtet ENDAST innan ett kvitto utfärdats
 * (se `hantera-inbetalning/index.ts`s filhuvud). Samma bredda invalidering
 * som `useRegistreraInbetalning`, av samma skäl: en raderad rad ändrar
 * inkorgens lista, anmälans egen rad, personens rad och (via spegeln)
 * basens `Saknas (kr)`.
 */
export function useRaderaInbetalning() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<
    HanteraInbetalningResult,
    Error,
    { inbetalningId: string; anmalanRecordId?: string }
  >({
    mutationFn: ({ inbetalningId }) => dataSource.raderaInbetalning(inbetalningId),
    onSuccess: (resultat, input) => {
      // ÅNGRA-RIKTNINGEN, symmetriskt med registreringen: kortet ska
      // återuppstå i listan direkt, inte vid nästa refetch.
      skrivHarledningTillOppna(queryClient, input.anmalanRecordId, resultat.harledning);
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}

/**
 * [TASK-346.9 AC #2] Makulera — skälet är obligatoriskt (EF:en fäller utan
 * det). Kvittot BESTÅR i ledgern, märkt makulerat i samma operation
 * (`hantera-inbetalning/index.ts` § "Kvittot BESTÅR, märkt makulerat").
 */
export function useMakuleraInbetalning() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<
    HanteraInbetalningResult,
    Error,
    { inbetalningId: string; skal: string; anmalanRecordId?: string }
  >({
    mutationFn: ({ inbetalningId, skal }) =>
      dataSource.makuleraInbetalning({ inbetalningId, skal }),
    onSuccess: (resultat, input) => {
      // Makulering ändrar summan precis som radering gör — samma väg, så de
      // två inte kan divergera.
      skrivHarledningTillOppna(queryClient, input.anmalanRecordId, resultat.harledning);
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}
