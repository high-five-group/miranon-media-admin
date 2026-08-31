import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type {
  KoaKvittonInput,
  KoaKvittonResult,
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

export function useRegistreraInbetalning() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<RegistreraInbetalningResult, Error, RegistreraInbetalningInput>({
    mutationFn: (input) => dataSource.registreraInbetalning(input),
    onSuccess: () => {
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
