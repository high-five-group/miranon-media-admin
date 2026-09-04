import { useMutation } from '@tanstack/react-query';
import type { MallId } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "gör en bilaga till PDF, förhandsgranska den" (S108
 * MARCUS-SEKVENS punkt 3, `ADR-119`; leveransvägen UTBYGGD TASK-302.1, PRD
 * `TASK-302`, `ADR-124`; RIVEN OM MOT RIKTIG DATA, TASK-309.6, ADR-125 § 6).
 *
 * DENNA MUTATION ÖPPNAR INGENTING — den renderar och returnerar bara en URL.
 * VEM som öppnar ett fönster och NÄR är anroparens (`GenereringsVy.tsx`)
 * beslut, inte hookens.
 *
 * [HISTORIK, delvis KORRIGERAD TASK-309.26] Första bygget öppnade en flik
 * synkront i klicket och lät den stå tom med ett vänteläge medan
 * renderingen pågick. Marcus dom på DEN specifika utformningen (2026-08-22):
 * *"då öppnas ett nytt fönster helt abrupt, men en text uppe i högra hörnet
 * om att bilagan genereras… Va? Seriöst?"* — varpå anroparen byggdes om att
 * öppna fönstret EFTER att mutationen löst ut i stället, på antagandet
 * (mätt samma dag) att "Chrome tillåter `window.open` även efter flera
 * sekunders väntan". Det antagandet var FALSKT: Marcus eget prod-röktest
 * 2026-08-26 fick fönstret blockerat när DocRaptor-renderingen tog några
 * sekunder ("Skarpt så måste ju ett chromefönster öppnas direkt").
 *
 * NUVARANDE FORM (TASK-309.26): anroparen öppnar ett TOMT fönster SYNKRONT
 * i klicket (`window.open('', '_blank')`, samma popup-blockerar-säkra
 * mönster som `DokumentYta.tsx` § IKONPAR / `useForhandsvisaDokument.ts`)
 * och sätter dess adress när DENNA mutation löser ut. Marcus ursprungliga
 * krav — *"Lotta ska inte skickas till pdf:en automatiskt utan välja att gå
 * dit"* — är fortsatt uppfyllt: fönstret är blankt tills HON redan klickat,
 * ingen navigering sker förrän hennes egen handling startade den. Se
 * `GenereringsVy.tsx`s `skapaDokument`-docblock för hela resonemanget.
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
  /** Signerad URL till den färdiga PDF:en — ytan sätter den i det fönster
   *  Lotta redan öppnade med sitt klick (TASK-309.26). */
  url: string;
  /** URL:ens ISO-utgångstid (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`). */
  utgar: string;
  /**
   * [TILLÄGG, TASK-340.2, PRD `TASK-340` § Implementationsbeslut A]
   * Underlagets `Källhash` ur EF:ens preview-svar. Genereringsvyn HÅLLER den
   * i sitt state och skickar tillbaka den vid Skapa — då kopieras utkastets
   * EXAKTA bytes i stället för att dokumentet renderas om.
   *
   * VARFÖR HASHEN ÖVER HUVUD TAGET: DocRaptor slumpar PDF:ens `/ID`-par per
   * anrop och det går inte att styra (research
   * `forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md` § 2.3), så
   * en omrendering ger BEVISLIGEN andra bytes än den fil Lotta granskade.
   * Utan hashen kan appen inte hålla löftet "det du sparar är det du såg".
   *
   * `undefined` när EF:en inte bar fältet — den deployade EF:en gör det inte
   * förrän `TASK-340.1` landat, och en klient som inte har någon hash att
   * skicka får exakt dagens beteende (omrendering, tyst).
   */
  kallhash?: string;
};

export function useForhandsgranskaBilaga() {
  const dataSource = useDataSource();

  return useMutation<Forhandsgranskning, Error, ForhandsgranskaBilagaInput>({
    mutationKey: ['forhandsgranska-bilaga'],
    mutationFn: async ({ eventId, mall }) => {
      const { url, utgar, kallhash } = await dataSource.previewEventTemplate(eventId, mall);
      return { url, utgar, kallhash };
    },
  });
}
