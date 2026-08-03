/**
 * [PROTOTYPE] [S93] — HUVUDPROTOTYPFILEN. KASTBAR KOD (throwaway-kontraktet).
 *
 * DIVERGENS-FRÅGAN (verbatim ur uppdraget, besvarad — se § Konvergens nedan):
 *
 * "Hur ska alternativ C — hållplatsen som ETIKETT — bäras på eventsidans
 * Anmälda deltagare-block: vilken av tre strukturella utföranden (a
 * Radbytet, b Stations-railen, c Nästa steg-panelen) gör 'vad gör jag
 * härnäst' och 'hitta Anna utan förkunskap' självklara för Lotta, och vilka
 * delval låser Marcus?"
 *
 * Underlag: docs/research/hallplats-modellen-eventsidan-2026-07-26.md
 * (Del 6, alternativ C; Del 3, sex undantagsfall; Del 8, åtta öppna frågor).
 *
 * § KONVERGENS (S93 Del 3, 2026-08-03, 8/8 Marcus-kvitterade beslut):
 * variant A — RADBYTET — vann divergensen. B (Stations-railen) och C
 * (Nästa steg-panelen) är FÖRKASTADE och RIVNA ur denna fil i
 * konvergens-passet (`HallplatsToppB`/`HallplatsToppC`-motsvarigheten
 * `HallplatsHarnastPanel`/den gamla `<details>`-formen `AvbokadeRad` —
 * samtliga borta). Kvar: `HallplatsToppA` (nu byggd ut mot HELA den grillade
 * strukturen i `Deltagare.tsx`s DEV-gren) + de delade byggstenarna
 * (`HallplatsMarke`, `HallplatsRad`, `HallplatsSaknasDelta`).
 *
 * Registret därunder (nu EN enad, steg-sorterad lista — se
 * `hallplats-steg-prototyp.ts`s `registerOrdning`) är fortfarande SAMMA
 * `DeltagarListan`/`useMarkeringsLage`-mekanik som produktionskoden, inte en
 * kopia (task-48 byggkrav 4 orört; se Deltagare.tsx:s DEV-grindade gren för
 * wiringen).
 *
 * KASTBAR: rivs med `git rm` på denna fil + `hallplats-steg-prototyp.ts` +
 * återställ prototyp-grenarna i Deltagare.tsx/Betalningar.tsx/EventDetail.tsx.
 */
import { HALLPLATS_LABEL, type HallplatsSteg } from './hallplats-steg-prototyp';

/**
 * Steg-märket (GEMENSAMT-kravet): litet, diskret, i kortets METAYTA (inte
 * pill-slotten uppe till höger — se KortInnehall:s nya `hallplatsMarke`-prop
 * i Deltagare.tsx). Färgen speglar hur brådskande steget är, texten bär
 * alltid (WCAG 1.4.1 — samma disciplin som resten av blocket).
 *
 * KONVERGENS-PASSET (Del 3 beslut 3): "Steg-märkena (befintliga) är
 * grupperingen" — sedan registrets sektionsrubriker ("Obekräftade"/
 * "Bekräftade") revs är detta märke den ENDA visuella grupperings-signalen
 * per kort.
 */
export function HallplatsMarke({ steg }: { steg: HallplatsSteg }) {
  const ton: Record<HallplatsSteg, string> = {
    'vantar-bekraftelse': 'bg-error-bg text-error',
    'vantar-betalning': 'bg-warning-bg text-warning',
    klar: 'bg-success-bg text-success',
    avbokad: 'bg-bg-muted text-text-muted',
    installt: 'bg-bg-muted text-text-muted',
    'till-vantelista': 'bg-bg-muted text-text-muted',
  };
  return (
    <span
      data-testid="hallplats-marke"
      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 font-medium text-caption ${ton[steg]}`}
    >
      {HALLPLATS_LABEL[steg]}
    </span>
  );
}

/**
 * VARIANT A:s byggsten — kastbar kopia av `Deltagare.tsx`:s `SummeringsRad`
 * (samma klasser/struktur, L303-disciplinen: raden är EN knapp, ingen
 * interaktivt-i-interaktivt). Duplicerad hellre än exporterad ur skarpa
 * filen (S86-precedenten: egna märkta prototypfiler där det går).
 *
 * BYGGKRAV 4 (S96, Marcus 2026-08-03) — RADHÖJDS-FYND: `font-medium` sattes
 * tidigare ENDAST via `tonKlass` (error/warning) — "Klara"-radens värde-span
 * (`ton` default `'neutral'` ⇒ tom klass) fick därför font-weight 400 medan
 * de brådskande raderna fick 500, en genuin, ORIENTAD strukturell
 * inkonsekvens i komponentens EGEN klasslogik (inte innehållet). FIXAT:
 * `font-medium` är nu OVILLKORLIG på värde-spannet; `tonKlass` bär ENDAST
 * färgen. Alla värde-siffror i rad-familjen — nuvarande OCH byggkrav 2:s
 * avgifter/slutbetalning nedan — har därmed samma font-vikt, oavsett ton.
 *
 * ÖPPET BOKFÖRT RESTFYND (S96 slutrapport, gäller fortfarande): en separat
 * ~1 px `getBoundingClientRect()`-skillnad kvarstår mellan sista raden i en
 * `divide-y`-stack och raderna ovanför — men den är POSITIONS-bunden, inte
 * innehålls- eller klass-bunden, och finns IDENTISKT i den redan skarpa,
 * oberörda `Betalningar.tsx`s egen `EtikettVardeRad`-lista. En app-bred,
 * förbefintlig sub-pixel-renderingsartefakt — inte en
 * hållplats-prototyp-bugg, och inte åtgärdad här.
 */
export function HallplatsRad({
  term,
  aktiv,
  onClick,
  ton = 'neutral',
  children,
}: {
  term: string;
  aktiv: boolean;
  onClick: () => void;
  /** Färgtonen på värdet när det är > 0 (brådska-signalen). */
  ton?: 'error' | 'warning' | 'neutral';
  children: React.ReactNode;
}) {
  const tonKlass = ton === 'error' ? 'text-error' : ton === 'warning' ? 'text-warning' : '';
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <button
        type="button"
        aria-pressed={aktiv}
        onClick={onClick}
        className={`-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors ${
          aktiv ? 'bg-bg-emphasized' : ''
        }`}
      >
        <span className="flex items-center gap-1.5 text-small text-text-muted">{term}</span>
        <span className={`text-right font-medium text-body tabular-nums ${tonKlass}`}>
          {children}
        </span>
      </button>
    </div>
  );
}

/**
 * Röd saknas-delta i EXAKT Betalningar-blockets grammatik (`SaknasDelta`-
 * kopia, kastbar — samma tvärimport-skäl som `betalKlar`/`harPaminnelse` i
 * hallplats-steg-prototyp.ts: Betalningar.tsx är en ANNAN skarp fil och rörs
 * inte av detta pass). Byggkrav 2 (S96).
 */
function HallplatsSaknasDelta({ antal }: { antal: number }) {
  if (antal <= 0) return null;
  return <span className="ml-2 font-medium text-error tabular-nums">{`−${antal}`}</span>;
}

/**
 * Byggkrav 2:s split-data (S96) — "Väntar på betalning" ersätts av två
 * räknerader i Betalningar-blockets EGNA grammatik ("Anmälningsavgifter — x
 * av y mottagna −n" / "Slutbetalningar — x mottagna −n"). Siffrorna är
 * Deltagare.tsx:s ansvar, härledda ur `betalningsSplit()`
 * (hallplats-steg-prototyp.ts) — SAMMA funktion `Betalningar.tsx`s eget block
 * anropar för sina motsvarande rader (S96 review-fix, se funktionens
 * docblock för rotorsaksfyndet: en tidigare egen inline-uträkning i
 * `Betalningar.tsx` divergerade tyst från denna sidas tal). Denna komponent
 * lägger bara ut dem i radgrammatiken.
 */
export type HallplatsBetalningsSplit = {
  avgifterMottagna: number;
  avgifterTotalt: number;
  avgifterSaknas: number;
  slutMottagna: number;
  slutSaknas: number;
  aktivFilter: 'avgift' | 'slut' | null;
  onFilterClick: (typ: 'avgift' | 'slut') => void;
};

export type HallplatsCounts = {
  'vantar-bekraftelse': number;
  'vantar-betalning': number;
  klar: number;
};

/**
 * VARIANT A — tre rader, exakt SummeringsRad-grammatiken.
 *
 * `betalning` (byggkrav 2, S96 — sedan konvergens-passet OVILLKORLIG: enda
 * kvarvarande variant, se § Konvergens i filens toppkommentar): ersätter
 * mittraden ("Väntar på betalning") med TVÅ rader (Anmälningsavgifter/
 * Slutbetalningar) i Betalningar-blockets egen grammatik. Var tidigare
 * optional (variant B/C:s samma komponent-anrop utelämnade propen) — de
 * varianterna är rivna, så det finns bara EN anropare kvar och den skickar
 * alltid propen.
 */
export function HallplatsToppA({
  counts,
  filter,
  onFilterClick,
  betalning,
}: {
  counts: HallplatsCounts;
  filter: HallplatsSteg | null;
  onFilterClick: (steg: keyof HallplatsCounts) => void;
  betalning: HallplatsBetalningsSplit;
}) {
  return (
    <div className="divide-y divide-border">
      <HallplatsRad
        term={HALLPLATS_LABEL['vantar-bekraftelse']}
        aktiv={filter === 'vantar-bekraftelse'}
        onClick={() => onFilterClick('vantar-bekraftelse')}
        ton={counts['vantar-bekraftelse'] > 0 ? 'error' : 'neutral'}
      >
        {counts['vantar-bekraftelse']}
      </HallplatsRad>
      <HallplatsRad
        term="Anmälningsavgifter"
        aktiv={betalning.aktivFilter === 'avgift'}
        onClick={() => betalning.onFilterClick('avgift')}
      >
        {`${betalning.avgifterMottagna} av ${betalning.avgifterTotalt} mottagna`}
        <HallplatsSaknasDelta antal={betalning.avgifterSaknas} />
      </HallplatsRad>
      <HallplatsRad
        term="Slutbetalningar"
        aktiv={betalning.aktivFilter === 'slut'}
        onClick={() => betalning.onFilterClick('slut')}
      >
        {`${betalning.slutMottagna} mottagna`}
        <HallplatsSaknasDelta antal={betalning.slutSaknas} />
      </HallplatsRad>
      <HallplatsRad term="Klara" aktiv={filter === 'klar'} onClick={() => onFilterClick('klar')}>
        {counts.klar}
      </HallplatsRad>
    </div>
  );
}
