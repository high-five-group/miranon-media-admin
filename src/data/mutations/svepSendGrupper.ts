import { type Utfall, verkligtUtfallTillUtfall } from '@/components/events/atgarder/atgardsutfall';
import type { SvepEventGrupp, SvepTyp } from '@/components/svep/types';
import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';

/**
 * [TASK-241.3/TASK-455] Svepets rena sändloop — UTBRUTEN UR `svepSend.ts`
 * (TASK-455) för att göra den PRÖVBAR UTAN en monterad React-hook.
 *
 * VARFÖR EN EGEN FIL, INTE BARA EN EXPORTERAD FUNKTION I `svepSend.ts`: ett
 * ES-modulimport kör HELA modulens toppnivå, inte bara den enskilda
 * exporten man plockar. `svepSend.ts` importerar `useAuth`
 * (`@/auth/useAuth` → `AuthProvider.tsx` → `../data/config/supabase-client`)
 * för `useSendSvep`s aktivitetslogg-anrop, och den kedjan läser
 * `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` vid MODUL-EVALUERING
 * (`src/env.ts`s `createEnv`, körs ovillkorat så fort modulen laddas — inte
 * bara när en komponent monterar). `tests/api/*.test.ts` (api-pure) kör
 * UTAN Vite-klientens env (`.env.test` bär avsiktligt inte dessa två
 * nycklar, samma gräns `personregister-invalidering.test.ts`s docblock
 * beskriver för sin egen fil: "Repot har ingen React-renderare i
 * test-stacken ... en useMutation-hook kan inte monteras här"). Ett test som
 * importerar `sendSvepGrupper` FRÅN `svepSend.ts` hade alltså kraschat på
 * `createEnv` innan en enda rad av testet hann köra — mätt (se
 * `tests/api/svep-send-attachments.test.ts`s docblock för den konkreta
 * felsignaturen). DENNA fil importerar ENDAST typer plus
 * `atgardsutfall.ts` (ren logik, inga runtime-sidoeffekter vid import,
 * samma "ren flytt"-status den filens eget docblock redan bär) — noll
 * beroenden som rör auth, Supabase-klienten eller `src/env.ts`.
 *
 * `svepSend.ts` re-exporterar allt härifrån, så `SvepOverlay.tsx` och andra
 * konsumenter ser INGEN skillnad — samma importväg, samma namn.
 *
 * [TASK-241.3 AC #1/#2] STOPP-VILLKORET prövade Åtgärds-sidans befintliga
 * sändkontrakt (`dataSource.sendActionEmail`, TASK-147.1/147.2) och fann att
 * det räckte — ingen ny EF byggdes. Sändytan är cross-event (ADR-114
 * beslut 2), så denna funktion gör SJÄLVA loopen: ETT
 * `dataSource.sendActionEmail`-anrop PER event-grupp (ADR-114 beslut 3),
 * parallellt (`Promise.all`), mappat genom EXAKT samma
 * `verkligtUtfallTillUtfall` (`atgardsutfall.ts`) som Åtgärds-sidan redan
 * använder.
 *
 * EN GRUPPS NÄTVERKSFEL FÄLLER ALDRIG HELA SVEPET (ADR-114 beslut 3): ett
 * kastat fel för EN grupp fångas lokalt och mappas till samma `'failed'`-form
 * som ett server-rapporterat totalt misslyckande för just den gruppen — de
 * ÖVRIGA gruppernas resultat renderas ändå.
 *
 * [TASK-455] BILAGOR PER EVENT-GRUPP: `attachmentIds` är en funktion av
 * grupp, SAMMA form som `amne`/`mailtext` — valet är scopat per event-grupp,
 * aldrig en global lista (kortets AC #1/#2; `resolveAttachments` server-side
 * kräver ändå exakt event-match, se `docs/research/utskicksytan-karta-och-
 * historik-2026-09-18.md` § A2). En grupp vars funktion returnerar en tom
 * lista skickas exakt som i dag — `dataSource.sendActionEmail` gör
 * `attachmentIds` VALFRI/default-tom (`SendActionEmail.schema.ts`), och
 * EF:en (`runActionSend`) väljer den bilage-fria batchgrenen automatiskt när
 * listan är tom (ADR-067 D9, oförändrad). Ingen ny gren byggd här — bara det
 * fält som redan fanns i kontraktet men aldrig fördes fram.
 */

export type SvepGruppUtfall = Utfall & { eventId: string };

export interface SvepSendInput {
  svepTyp: SvepTyp;
  eventGrupper: SvepEventGrupp[];
  amne: (grupp: SvepEventGrupp) => string;
  mailtext: (grupp: SvepEventGrupp) => string;
  /** [TASK-455] Valda Bilagor-record-ID:n för DEN gruppen — tom lista (aldrig
      `undefined`) när Lotta inte valt något, se filens docblock ovan. */
  attachmentIds: (grupp: SvepEventGrupp) => string[];
}

/** `dataSource` tar bara den slitsen av `DataSourceAdapter` funktionen
    faktiskt använder (`Pick<…, 'sendActionEmail'>`), så ett test kan mata in
    en minimal fejk utan att implementera hela adaptern. */
export async function sendSvepGrupper(
  dataSource: Pick<DataSourceAdapter, 'sendActionEmail'>,
  { svepTyp, eventGrupper, amne, mailtext, attachmentIds }: SvepSendInput,
): Promise<SvepGruppUtfall[]> {
  return Promise.all(
    eventGrupper.map(async (grupp): Promise<SvepGruppUtfall> => {
      try {
        const result = await dataSource.sendActionEmail({
          actionType: svepTyp,
          eventId: grupp.event.id,
          registrationIds: grupp.mottagare.map((r) => r.id),
          amne: amne(grupp),
          mailtext: mailtext(grupp),
          idempotencyKey: crypto.randomUUID(),
          attachmentIds: attachmentIds(grupp),
        });
        return {
          eventId: grupp.event.id,
          ...verkligtUtfallTillUtfall(result, grupp.mottagare),
        };
      } catch (error) {
        return {
          eventId: grupp.event.id,
          status: 'failed',
          lyckade: [],
          fallna: grupp.mottagare.map((reg) => ({
            reg,
            skal: error instanceof Error ? error.message : 'Inget felmeddelande angavs.',
          })),
        };
      }
    }),
  );
}
