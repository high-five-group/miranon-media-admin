import { useMutation } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "gör en bilaga till PDF" (S108 MARCUS-SEKVENS punkt 3, `ADR-119`).
 *
 * DEN ÖPPNAR INGENTING — och det är hela poängen. Första bygget öppnade en
 * flik synkront i klicket och lät den stå tom med ett vänteläge medan
 * renderingen pågick, enligt `DokumentYta` § IKONPAR-mönstret. Marcus dom på
 * det (2026-08-22): *"då öppnas ett nytt fönster helt abrupt, men en text
 * uppe i högra hörnet om att bilagan genereras… Va? Seriöst?"* — och
 * beslutet: *"den öppnas i ett nytt fönster. Lotta ska inte skickas till
 * pdf:en automatiskt utan välja att gå dit."*
 *
 * Så: mutationen renderar och returnerar en `blob:`-URL. Laddningen visas i
 * appen, där användaren redan tittar. Ytan presenterar sedan dokumentet som
 * ett VAL — och eftersom `window.open` då sker i ett eget, direkt klick
 * finns ingen popup-blockerare att smita förbi, vilket var hela skälet till
 * den synkrona öppningen från början. Kravet försvann med mönstret.
 *
 * Att `DokumentYta` behåller sitt eget mönster är riktigt: den öppnar ett
 * FÄRDIGT dokument, där ingen väntan finns att visa. Skillnaden är inte
 * inkonsekvens utan två olika situationer — granska ett utkast mitt i en
 * redigering, kontra öppna en fil som redan ligger där.
 */

/** HTML:en byggs av anroparen — se `mutationFn` § ORDNINGEN. */
type Byggd = { html: string; saknade: string[] };

type Argument = {
  /**
   * Bygger den självbärande HTML:en. En callback och inte en färdig sträng,
   * eftersom bygget är asynkront (hämtar mall, stil, typsnitt och bilder)
   * och inget av det ska ske innan användaren faktiskt begärt dokumentet.
   */
  byggHtml: () => Promise<Byggd>;
  /** Dokumentnamnet renderaren stämplar jobbet med, t.ex. "Bekräftelsebilaga". */
  namn: string;
};

export type Forhandsgranskning = {
  /** `blob:`-URL till den färdiga PDF:en — ytan öppnar den på användarens begäran. */
  url: string;
  /** CSS-referenser som inte kunde bäddas in (se `sjalvbarande.ts` § FAIL-SAFE). */
  saknade: string[];
};

export function useForhandsgranskaBilaga() {
  const dataSource = useDataSource();

  return useMutation<Forhandsgranskning, Error, Argument>({
    mutationKey: ['forhandsgranska-bilaga'],
    mutationFn: async ({ byggHtml, namn }) => {
      const { html, saknade } = await byggHtml();
      const pdf = await dataSource.renderPdfFranHtml(html, namn);

      /* Blob-URL:en revokeras MEDVETET ALDRIG — samma avvägning som
         `dokumentKalla.ts` § `blobUrlFranBase64`: Chromes PDF-visare gör
         byte-range-anrop mot en flersidig PDF vid scroll, och en tidigt
         revokerad URL bryter dem. Kostnaden är några hundra kB kvarhållet
         minne per skapad förhandsgranskning under sidans livstid. */
      return { url: URL.createObjectURL(pdf), saknade };
    },
  });
}
