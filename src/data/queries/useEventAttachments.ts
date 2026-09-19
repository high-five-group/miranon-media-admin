import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { queryKeys } from '@/queries/keys';

/**
 * Eventets bilagor (`get-event-attachments`, TASK-147.5) — EN hemvist för
 * frågan, delad av `DokumentYta.tsx` (listan) och `GenereringsVy.tsx`
 * (knappetiketten "Skapa om …").
 *
 * VARFÖR HOOKEN FÖDDES HÄR (TASK-340.2, PRD `TASK-340` § E): genereringsvyn
 * måste veta OM en Event-mallad rad redan finns för (event × mall), annars
 * kan knappen inte säga "Skapa om <dokumentnamnet>" när Lotta är på väg att
 * skriva över den befintliga bilagan. Frågan var redan ställd — inline i
 * `DokumentYta.tsx` — och genereringsvyn nås ALLTID därifrån, så svaret
 * ligger redan i React Query-cachen under SAMMA nyckel
 * (`queryKeys.attachments.byEvent`). Att skriva en andra inline-`useQuery`
 * med samma nyckel hade fungerat men gett två ställen att hålla i synk;
 * att hämta via en ny nyckel hade betalat ett extra nätverksanrop för data
 * appen redan har.
 *
 * NYCKELN ÄR DELAD MED INVALIDERINGEN, och det är hela poängen:
 * `useGenereraEventBilaga`/`useSkapaOmEventBilaga`/`useUploadAttachment`
 * invaliderar `attachments.byEvent(eventId)` när de lyckas, så BÅDA ytorna
 * uppdateras av samma skrivning utan att någon av dem känner till den
 * andra.
 *
 * `eventId: null` (räckviddsläget i `DokumentYta`, ADR-118 beslut 5) håller
 * frågan avstängd — `enabled: false` — i stället för att skicka en tom
 * sträng till EF:en. `queryKey` bär ändå `''` i det läget: nyckeln måste
 * vara serialiserbar och stabil, och en avstängd query hämtar aldrig något
 * att förväxla.
 */
export function useEventAttachments(eventId: string | null) {
  const dataSource = useDataSource();

  return useQuery<Attachment[]>({
    queryKey: queryKeys.attachments.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchEventAttachments(eventId ?? ''),
    enabled: eventId != null,
  });
}

/**
 * DEN DELADE PREFETCH-KÄRNAN (TASK-455-ITERATION, S127) — samma
 * `queryClient.prefetchQuery`-anrop, samma nyckel, samma `staleTime: 30_000`
 * som `useForberedAtgardsBilagor` (nedan) redan använde INLINE innan denna
 * extraktion. Bruten ut hit så en ANDRA konsument (svepets sekventiella
 * förvärmning, `useForberedSvepBilagor` längre ner) kan återanvända EXAKT
 * samma form utan att kopiera den — annars hade `useForberedAtgardsBilagor`s
 * eget docblock ("husets form, IDENTISK med `useForberedEventDetalj`/
 * `varmPersonregister`") blivit osant i det ögonblick en systerfunktion
 * tappade synk med den. Modulnivå, inte en hook — ingen egen `useCallback`-
 * identitet behövs, den byggs av ANROPARENS hook.
 */
function forberedEventBilagor(
  dataSource: DataSourceAdapter,
  queryClient: QueryClient,
  eventId: string,
): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.attachments.byEvent(eventId),
    queryFn: () => dataSource.fetchEventAttachments(eventId),
    staleTime: 30_000,
  });
}

/**
 * PREFETCH PÅ AVSIKT (ADR-078 beslut 3) för eventets bilagor — husets form,
 * identisk med `useForberedEventDetalj` (`EventCard.tsx`) och
 * `varmPersonregister` (`TabBar.tsx`): en stabil callback via `useCallback`
 * (konsumeras som `onMouseEnter`/`onFocus`/`onHoverStart`-handler), samma
 * nyckel som `useEventAttachments` OVAN och `AtgardsSida.tsx`s egen
 * `attachments`-`useQuery` — React Query dedupar, så en redan varm eller
 * pågående hämtning kostar inget extra anrop.
 *
 * `staleTime: 30_000` är den LOKALA prefetch-avvägningen (samma tal som
 * `EventCard.tsx`): den globala 5-minuters-defaulten (`router.ts`) styr
 * fortfarande hur färsk datan räknas för `ArbetsYta`s/`DokumentYta`s egna
 * `useQuery`-anrop när de väl monterar och läser cachen — detta värde
 * påverkar ENDAST om just DENNA prefetch-anrops bedömer cachen så pass
 * färsk att den kan hoppa över nätverksanropet. Utan överskuggning hade
 * upprepad hover över flera minuter aldrig triggat en ny bakgrundshämtning
 * ens när Lotta genuint kommer tillbaka efter en paus.
 *
 * TASK-416.11 (rapport E, S123): bilagorna hämtades annars först när
 * `ArbetsYta` monterade (åtgärdsraden fälldes ut) — ingen förvärmning på
 * avsikt fanns för de två ingångarna till Åtgärds-sidan
 * (`AtgarderKort`/`Atgarder.tsx`, `MarkeringsBatchBar`/`Deltagare.tsx`).
 */
export function useForberedAtgardsBilagor(): (eventId: string) => void {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  return useCallback(
    (eventId: string) => {
      void forberedEventBilagor(dataSource, queryClient, eventId);
    },
    [dataSource, queryClient],
  );
}

/**
 * [TASK-455-ITERATION, S127] Svepets SEKVENTIELLA förvärmning av SAMTLIGA
 * event-gruppers bilagor, EN i taget, i den ordning `eventIds` ges.
 *
 * Marcus 2026-09-19 (efter stämplingspasset): "jag gillar inte att bilagorna
 * laddar när jag växlar mellan eventgrupp" — `Forhandsvisning.tsx` frågade
 * (`useEventAttachments`) bara den BLÄDDRADE gruppens event-ID, så en
 * kall cache visade `BilageValjare`s skeleton VARJE gång Lotta bytte grupp.
 * Denna hook värmer alla gruppers cache-poster i förväg (anropad från
 * `SvepOverlay`, se dess docblock för VARFÖR just den nivån äger anropet),
 * så att `Forhandsvisning`s egen `useEventAttachments`-läsning för den
 * bläddrade gruppen normalt redan träffar en varm cache-post.
 *
 * VARFÖR SEKVENTIELLT, INTE `Promise.all`: `get-event-attachments` gör
 * flera Airtable-anrop per event (egen `withConcurrencyLimit`,
 * `supabase/functions/get-event-attachments/index.ts`), och Airtables
 * rate-tak är 5 anrop/SEKUND PER BAS, delat mellan ALLA samtidiga klienter
 * (`docs/reference/airtable-constraints.md` § P4). En 429 kostar minst 30 s
 * lockout för ALLA klienter, inte bara den här sessionen
 * (`supabase/functions/_shared/airtable-retry.ts`). En människa hinner gott
 * om sekunder per grupp när hon bläddrar, så en sekventiell kedja hinner
 * alltid ikapp innan hon når nästa grupp — en burst av N parallella
 * hämtningar riskerar taket redan vid en handfull grupper, för en vinst
 * (några hundra ms) som inte är värd den kostnaden.
 *
 * VARFÖR INTE BREDDA `useForberedAtgardsBilagor` TILL EN LISTA: den hookens
 * kontrakt är EN stabil callback för EN eventId, triggad av hover/fokus —
 * att ändra dess signatur hade brutit dess befintliga konsumenter
 * (`Atgarder.tsx`, `Deltagare.tsx`) och gjort dess docblock osant. Den
 * DELADE KÄRNAN (`forberedEventBilagor` ovan) är återanvänd rakt av i
 * stället.
 *
 * FELHANTERING: `queryClient.prefetchQuery` KASTAR ALDRIG — TanStack Query
 * 5.102.2s egen implementation sväljer varje fel internt
 * (`fetchQuery(...).then(noop).catch(noop)`,
 * `@tanstack/query-core/build/modern/queryClient.js`, verifierat mot den
 * installerade versionen). Ett misslyckat länk i kedjan stoppar därför
 * ALDRIG resten, och ger inget synligt fel HÄR — gruppen faller tillbaka på
 * sin egen `useEventAttachments`-hämtning (skeleton + ev. felruta,
 * `BilageValjare.tsx`s `fel`-gren) när den FAKTISKT visas, exakt dagens
 * beteende.
 *
 * AVBRYTS NÄR ÖVERLÄGGET STÄNGS: `SvepOverlay` unmountas HELT vid stängning
 * (`Hem.tsx`: `aktivtSvep && <SvepOverlay/>`), vilket kör denna effekts
 * cleanup — en `avbruten`-flagga stoppar kedjan FÖRE nästa länk hinner
 * starta. Ingen `AbortController`: `dataSource.fetchEventAttachments` har
 * ingen abort-signal-parameter, och en redan avfyrad hämtning får landa i
 * cachen som vanligt (samma "inget avbryts, bara inget NYTT startas"-princip
 * som `startvarmningen.ts`s hårda timeout).
 *
 * `eventIds` MÅSTE vara referensstabil mellan renders (anroparen memoiserar
 * den, t.ex. `useMemo(() => eventGrupper.map((g) => g.event.id),
 * [eventGrupper])`) — annars startar effekten om kedjan på varje render i
 * stället för en gång per faktisk gruppmängd.
 */
export function useForberedSvepBilagor(eventIds: string[]): void {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  useEffect(() => {
    let avbruten = false;

    async function korKedjan() {
      for (const eventId of eventIds) {
        if (avbruten) return;
        await forberedEventBilagor(dataSource, queryClient, eventId);
      }
    }
    void korKedjan();

    return () => {
      avbruten = true;
    };
  }, [eventIds, dataSource, queryClient]);
}
