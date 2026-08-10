/**
 * [PROTOTYPE] S104 — DIVERGENS-PASS på segment-ytan. KASTBAR KOD.
 *
 * FRÅGAN (throwaway-kontraktets klausul i):
 *
 *   "Vad ÄR en segment-sida — och vilken handling är dess huvudsak?"
 *
 * TRE STRUKTURELLT OLIKA SVAR, nycklar `a`/`b`/`c` (ADR-074 beslut 1),
 * växlingsbara via `?variant=` på den RIKTIGA routen `/mer/segment`
 * (UI-underform A — riktig auth, riktig datahämtning, riktig täthet; ett
 * vakuum hade fått varje variant att se bra ut):
 *
 *   a — REGELVERKSTADEN   "formulera regeln"        Segmentet är en DEFINITION;
 *                                                    publiken är dess resultat.
 *                                                    Allt på en sida.
 *   b — PUBLIKEN FÖRST    "se och beskär publiken"  Du tittar på MÄNNISKOR;
 *                                                    filtret formar vilka.
 *                                                    Listan är sidan.
 *   c — SEGMENT SOM       "välj ett segment och     Segment är SAKER du äger
 *       ENTITET            agera på det"             och återanvänder, som event.
 *                                                    Bygga ≠ verkställa.
 *
 * Varianterna är oense om STRUKTUR — inte om färg. Formspråket är DELAT och
 * ÄRVT ur Event-familjen (Generation 2, facit-låst): alla tre ska se ut som
 * samma app. Det är arrangemanget som prövas.
 *
 * PREMISSUNDERLAG (bindande för alla tre):
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`
 *
 * Marcus väljer EN. Justeringar vid valet blir BYGGKRAV på kortet — prototypen
 * itereras aldrig i valfasen (L237); helhets-missnöje med det VALDA skelettet
 * öppnar i stället ett konvergens-pass.
 *
 * KASTBARHETENS GRÄNS (ADR-103): divergens-FÖRLORARNA är kastbara. Vinnaren
 * kastas INTE och skrivs INTE om — den går till konvergens, och konvergensens
 * godkända slutform PROMOVERAS till skarp yta. Det som rivs efter Marcus
 * godkännande är flaggor och växlar, aldrig formen.
 *
 * DEV-grindad via routens `import.meta.env.DEV`-gren (ADR-044-mekaniken).
 * Datavägen ÄRVS oförändrad (`useDataSource`, ADR-055/057) — varje variant
 * äger sin egen hämtning, ingen delad datamodell tvingas på dem.
 * READ-ONLY FÖRSTÄRKT: ingen variant kopplas till en verklig mutation. Spara,
 * skicka och testmail är no-op-stubbar — en prototyp skriver aldrig, varken
 * mot prod eller staging, och registrerar aldrig en operation i
 * write-allowlisten (prototype-skillen § Miljö).
 */
import { VariantA } from './prototyp/VariantA';
import { VariantB } from './prototyp/VariantB';
import { VariantC } from './prototyp/VariantC';

export type SegmentVariant = 'a' | 'b' | 'c';

export function SegmentPrototyp({ variant }: { variant: SegmentVariant }) {
  return (
    <>
      {variant === 'a' && <VariantA />}
      {variant === 'b' && <VariantB />}
      {variant === 'c' && <VariantC />}
    </>
  );
}
