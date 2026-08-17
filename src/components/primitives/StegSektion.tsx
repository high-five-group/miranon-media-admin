import type { ReactNode } from 'react';
import { useId } from 'react';

/**
 * ═══ STEGSEKTIONEN — EN KÄLLA FÖR HUSETS STEGVISA FLÖDEN ═══
 *
 * Formen föddes i segment-byggarens `VariantD` (S104 varv 3, Marcus
 * 2026-08-16: "gör den SNYGG, PROFFSIG, ENKEL, TYDLIG") och bodde där som en
 * fil-lokal komponent. Den lyfts hit vid S107 QA-vandringen (Marcus, steg 5:
 * "kanske det behöver struktureras lite som segmentsidan gör, lite wizard
 * liksom"), eftersom Dokument-ytans uppladdningsflöde ska bära exakt samma
 * form — och en delad FORM måste delas som KOD.
 *
 * Det är samma lärdom `HandlingsRad` bär i sitt eget huvud, och den är dyrt
 * betald: så länge formen bor på två ställen kan de glida isär, och nästa
 * gång upptäcks det av den dyraste mekanismen vi har — Marcus öga.
 *
 * ── YTAN ÄR PANELGRAMMATIKEN, INTE LISTKORTS-GRAMMATIKEN ──
 *
 * Appen bär två kortformer och de betyder olika saker:
 *
 *   LISTPOSTEN  fylld och kantlös   `bg-bg-muted border-transparent`
 *   BEHÅLLAREN  vit med ritad kant  `bg-surface border-border`
 *
 * Ett steg är en behållare för kontroller, inte en post i en lista. Valet är
 * dessutom påtvingat nedåt: ett steg vars innehåll självt är listposter
 * (`bg-bg-muted`) hade gjort dem osynliga mot en `bg-bg-muted`-yta.
 * Nästlingen avgör, inte smaken.
 *
 * ── NUMRET ÄR EN RUNDEL FÖR ÖGAT OCH TEXT FÖR ÖRAT ──
 *
 * Rundeln ärver publikradens initial-grammatik (`PersonRad`) i mindre steg —
 * `size-7` mot radens `size-9`, för ett steg-nummer är ett tecken och en
 * rubrikmarkör, inte två initialer i en scanlista. Den är `aria-hidden`;
 * rubrikens tillgängliga namn får numret ur ett `sr-only`-prefix i stället.
 *
 * `sr-only` FRAMFÖR `aria-label` på rubriken, och skälet är hållbarhet: ett
 * `aria-label` ERSÄTTER rubrikens textinnehåll för skärmläsaren, så den
 * synliga och den upplästa rubriken blir två strängar som kan glida isär vid
 * nästa textputs. Ett `sr-only`-prefix ADDERAR i stället till den synliga
 * texten — en källa, inte två.
 *
 * ── VILANDE STEG SYNS, OCH DET ÄR HELA POÄNGEN ──
 *
 * Ett steg som ännu inte är åtkomligt renderar sin rubrik och en ledtext som
 * säger vad som saknas, aldrig ingenting: hela vägen ska synas från första
 * sekunden. Ledtexten ERSÄTTER innehållet i stället för att gråtona det — en
 * `opacity`-dämpad kontroll är fortfarande fokuserbar och läses fortfarande
 * upp, medan en ledtext säger sanningen ("gör steget före först") för alla.
 *
 * ── DÄMPNINGEN ÄR EN TEXTFÄRG, ALDRIG `opacity` ──
 *
 * Ett vilande steg tonar rubrik och rundel till `text-text-muted` — MÄTT till
 * 5,33:1 mot `bg-surface` (#6b6b6b mot #ffffff) och 4,88:1 mot `bg-bg-muted`,
 * alltså AA i båda lägena. `opacity` på hela kortet hade multiplicerat NER
 * varje kontrast inklusive kantens och därmed sänkt golvet; en kontrast man
 * kan räkna på i förväg kan `opacity` per definition inte ge.
 */
export function StegSektion({
  nummer,
  rubrik,
  vilar,
  dampad,
  children,
}: {
  nummer: number;
  rubrik: string;
  /** Satt när steget ännu inte är åtkomligt — ledtexten ersätter `children`. */
  vilar?: string;
  /**
   * Dämpar rubrik+rundel UTAN att ersätta `children` — för steg vars innehåll
   * självt bär sin vilande ledtext i en monterad live-region: `vilar` hade
   * avmonterat regionen och återinfört monterings-annonseringsfelet (Marcus
   * fynd 2026-08-16: stegrubriken stod omutad när steget vilade).
   */
  dampad?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const aktiv = vilar === undefined && !dampad;
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <h2 id={id} className="flex items-start gap-2.5 font-semibold text-lg">
        <span
          aria-hidden="true"
          className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small ${
            aktiv ? 'text-text-secondary' : 'text-text-muted'
          }`}
        >
          {nummer}
        </span>
        <span className="sr-only">Steg {nummer}: </span>
        <span className={`min-w-0 ${aktiv ? '' : 'text-text-muted'}`}>{rubrik}</span>
      </h2>
      {vilar === undefined ? children : <p className="text-small text-text-muted">{vilar}</p>}
    </section>
  );
}
