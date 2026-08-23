import { useMutation } from '@tanstack/react-query';
import type { MallId } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "gör en bilaga till PDF, förhandsgranska den" (S108
 * MARCUS-SEKVENS punkt 3, `ADR-119`; leveransvägen UTBYGGD TASK-302.1, PRD
 * `TASK-302`, `ADR-124`; RIVEN OM MOT RIKTIG DATA, TASK-309.6, ADR-125 § 6).
 *
 * DEN ÖPPNAR INGENTING — och det är hela poängen. Första bygget öppnade en
 * flik synkront i klicket och lät den stå tom med ett vänteläge medan
 * renderingen pågick, enligt `DokumentYta` § IKONPAR-mönstret. Marcus dom på
 * det (2026-08-22): *"då öppnas ett nytt fönster helt abrupt, men en text
 * uppe i högra hörnet om att bilagan genereras… Va? Seriöst?"* — och
 * beslutet: *"den öppnas i ett nytt fönster. Lotta ska inte skickas till
 * pdf:en automatiskt utan välja att gå dit."*
 *
 * Så: mutationen renderar och returnerar en URL. Laddningen visas i appen,
 * där användaren redan tittar. Ytan presenterar sedan dokumentet som ett
 * VAL — och eftersom `window.open` då sker i ett eget, direkt klick finns
 * ingen popup-blockerare att smita förbi, vilket var hela skälet till den
 * synkrona öppningen från början. Kravet försvann med mönstret.
 *
 * [RIVEN OM, TASK-309.6] Mutationen byggde tidigare den självbärande HTML:en
 * KLIENT-SIDIGT (`byggHtml`-callbacken, `sjalvbarande.ts`) och postade den
 * till `test-docraptor-render`. Servern gör NU hela jobbet (ADR-125 § 5):
 * mutationen skickar bara `{ eventId, mall }` — ingen HTML, ingen
 * mallhämtning, ingen escaping-logik i klienten (AC #6, `ADR-057` klausul
 * a). `renderPdfTillUtkast`/`sjalvbarande.ts` rör denna vägen inte längre.
 *
 * URL:EN ÄR INTE `blob:` (TASK-302.1, oförändrat sedan dess). MÄTT, INTE
 * ANTAGET (`TASK-302` § "Problemet"): en `blob:`-URL laggar i Chromes
 * PDF-visare vid scroll — sex mätta armar, headed Chrome 151. Mutationen
 * skriver i stället ett transient utkast i Storage
 * (`generate-event-attachment` med `preview: true`) och returnerar en kort
 * SIGNERAD URL, serverad av nätverkstjänsten — cross-origin mot appens eget
 * origin, så `src/sw.ts`s Service Worker rör den aldrig.
 */
export interface ForhandsgranskaBilagaInput {
  /** Eventet bilagan hör till. */
  eventId: string;
  /** Vilken av de två mallarna (ADR-125 § 2). */
  mall: MallId;
}

export type Forhandsgranskning = {
  /** Signerad URL till den färdiga PDF:en — ytan öppnar den på användarens begäran. */
  url: string;
  /** URL:ens ISO-utgångstid (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`). */
  utgar: string;
};

export function useForhandsgranskaBilaga() {
  const dataSource = useDataSource();

  return useMutation<Forhandsgranskning, Error, ForhandsgranskaBilagaInput>({
    mutationKey: ['forhandsgranska-bilaga'],
    mutationFn: async ({ eventId, mall }) => {
      const { url, utgar } = await dataSource.previewEventTemplate(eventId, mall);
      return { url, utgar };
    },
  });
}
