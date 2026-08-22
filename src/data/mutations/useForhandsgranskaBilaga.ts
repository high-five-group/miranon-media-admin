import { useMutation } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "förhandsgranska en bilaga som RIKTIG PDF i en ny flik"
 * (S108 MARCUS-SEKVENS punkt 3, `ADR-119`).
 *
 * VAD SOM ÄNDRADES OCH VARFÖR: bilage-prototypen skrev tidigare sin
 * renderade HTML rakt in i den nya fliken med `document.write`. Det visade
 * en WEBBSIDA, inte dokumentet — och research-passet
 * (`docs/research/forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md`
 * § Rekommendation 1) mätte upp att glappet mellan "det man granskar" och
 * "det som faktiskt levereras" är precis den brist Google Docs och Canva
 * bär och som deras användare klagar på. Förhandsgranskningen går därför
 * genom SAMMA renderingsväg som den slutgiltiga genereringen ska göra.
 *
 * POPUP-BLOCKERAR-SÄKERT MÖNSTER, ärvt oförändrat från
 * `useForhandsvisaDokument` — anroparen MÅSTE anropa
 * `window.open('', '_blank')` SYNKRONT i klick-handlern (före `mutate()`,
 * alltså före någon `await`) och skicka in handtaget. Adressen sätts
 * EFTERÅT. `noopener` är medvetet uteslutet av samma skäl som där:
 * verifierat att flaggan får `window.open` att returnera `null`, och
 * "navigera handtaget senare" är då omöjligt.
 *
 * VÄNTELÄGET ÄR INTE DEKORATION. Kedjan tar ~3 s (DocRaptor-minimaltestets
 * mätning, `docs/research/docraptor-minimaltest-2026-08-22.md`) plus
 * uppladdningen av en ~4 MB självbärande HTML. En flik som står tom i fyra
 * sekunder läses som att ingenting hände — därför skrivs ett ärligt
 * vänteläge i fliken direkt, och det byts mot PDF:en när den finns.
 *
 * Fel lämnar aldrig fliken tyst tom (Gunilla-principen): felet skrivs i den
 * flik användaren redan tittar på, i klartext, i stället för att bara
 * bubbla upp till en yta hen inte har framför sig.
 */

/** HTML:en byggs av anroparen — se `mutationFn` § ORDNINGEN för varför. */
type Byggd = { html: string; saknade: string[] };

type Argument = {
  /**
   * Bygger den självbärande HTML:en. En CALLBACK och inte en färdig sträng,
   * eftersom bygget är asynkront (det hämtar mall, stil, typsnitt och
   * bilder) och MÅSTE ske EFTER att fliken redan öppnats — annars har
   * `await` hunnit köra före `window.open` och webbläsaren blockerar
   * popupen. Att låta mutationen äga anropet är det som gör den ordningen
   * strukturellt omöjlig att råka bryta i en anropande komponent.
   */
  byggHtml: () => Promise<Byggd>;
  /** Dokumentnamnet renderaren stämplar jobbet med, t.ex. "Bekräftelsebilaga". */
  namn: string;
  /** Fönstret som redan öppnats synkront i klicket. */
  handle: Window | null;
};

const SIDSTIL =
  'font-family: system-ui, -apple-system, sans-serif; padding: 2rem; ' +
  'max-width: 34rem; line-height: 1.6; color: #1b2b34;';

function skrivIFliken(handle: Window, rubrik: string, brodtext: string): void {
  if (handle.closed) return;
  handle.document.open();
  handle.document.write(
    `<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8">` +
      `<title>${rubrik}</title></head><body style="${SIDSTIL}">` +
      `<h1 style="font-size: 1.25rem; margin: 0 0 0.75rem;">${rubrik}</h1>` +
      `<p style="margin: 0;">${brodtext}</p></body></html>`,
  );
  handle.document.close();
}

export function useForhandsgranskaBilaga() {
  const dataSource = useDataSource();

  return useMutation<Byggd, Error, Argument>({
    mutationKey: ['forhandsgranska-bilaga'],
    mutationFn: async ({ byggHtml, namn, handle }) => {
      if (!handle) {
        throw new Error(
          'Webbläsaren blockerade den nya fliken. Tillåt popup-fönster för den här sidan och försök igen.',
        );
      }

      skrivIFliken(
        handle,
        `Skapar ${namn.toLowerCase()} …`,
        'Dokumentet renderas till PDF. Det tar några sekunder — den här fliken byts ut när det är klart.',
      );

      try {
        /* ORDNINGEN: bygg HTML → rendera → visa. Alla tre stegen ligger
           INNANFÖR mutationFn, efter att fliken redan öppnats synkront av
           anroparen. */
        const byggd = await byggHtml();
        const pdf = await dataSource.renderPdfFranHtml(byggd.html, namn);

        /* Blob-URL:en revokeras MEDVETET ALDRIG — samma avvägning som
           `dokumentKalla.ts` § `blobUrlFranBase64`: Chromes PDF-visare gör
           byte-range-anrop mot en flersidig PDF vid scroll, och en tidigt
           revokerad URL bryter dem. Kostnaden är några MB kvarhållen minne
           per öppnad granskning under sidans livstid. */
        handle.location.href = URL.createObjectURL(pdf);
        return byggd;
      } catch (err) {
        skrivIFliken(
          handle,
          'Dokumentet kunde inte skapas',
          err instanceof Error
            ? err.message
            : 'Ett okänt fel uppstod. Stäng fliken och försök igen.',
        );
        throw err;
      }
    },
  });
}
