/**
 * [PROTOTYPE] [S93] — HUVUDPROTOTYPFILEN. KASTBAR KOD (throwaway-kontraktet).
 *
 * FRÅGAN (verbatim ur uppdraget):
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
 * TRE VARIANTER på befintliga eventdetalj-routen (?variant=a|b|c, underform A,
 * S86-mekaniken): alla tre ersätter ENDAST toppens fem summeringsrader.
 * Registret därunder (Obekräftade-kön + Bekräftade-registret + kryss-läget)
 * är OFÖRÄNDRAT — det är samma `DeltagarListan`/`useMarkeringsLage`-mekanik
 * som produktionskoden, inte en kopia (task-48 byggkrav 4 orört; se
 * Deltagare.tsx:s DEV-grindade gren för wiringen).
 *
 *   a — RADBYTET: tre steg-räknar-rader i exakt SummeringsRad-grammatiken
 *       (`HallplatsRad` nedan är en kastbar kopia av samma klasser/struktur).
 *   b — STATIONS-RAILEN: samma tre räknare som en horisontell rail med
 *       nummer 1·2·3 och tyngdpunkt-markering (första station med count > 0).
 *   c — NÄSTA STEG-PANELEN: samma tre rader som (a) PLUS en Härnäst-panel
 *       som pekar ut nästa handling i klartext.
 *
 * KASTBAR: rivs med `git rm` på denna fil + `hallplats-steg-prototyp.ts` +
 * återställ prototyp-grenarna i Deltagare.tsx/Betalningar.tsx/EventDetail.tsx.
 */
import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/primitives/Button';
import { displayName } from '@/components/registrations/registration-display';
import type { Registration } from '@/domain/models/Registration';
import { HALLPLATS_LABEL, type HallplatsSteg } from './hallplats-steg-prototyp';

/**
 * Steg-märket (GEMENSAMT-kravet): litet, diskret, i kortets METAYTA (inte
 * pill-slotten uppe till höger — se KortInnehall:s nya `hallplatsMarke`-prop
 * i Deltagare.tsx). Färgen speglar hur brådskande steget är, texten bär
 * alltid (WCAG 1.4.1 — samma disciplin som resten av blocket).
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
 * ÖPPET BOKFÖRT RESTFYND (S96 slutrapport): en separat ~1 px
 * `getBoundingClientRect()`-skillnad kvarstår mellan sista raden i en
 * `divide-y`-stack och raderna ovanför — men den är POSITIONS-bunden, inte
 * innehålls- eller klass-bunden (mätt: flyttar man vilken rad som helst till
 * sista platsen får DEN 1px mindre i stället) och finns IDENTISKT i den
 * redan skarpa, oberörda `Betalningar.tsx`s egen `EtikettVardeRad`-lista. En
 * app-bred, förbefintlig sub-pixel-renderingsartefakt — inte en
 * hållplats-prototyp-bugg, och inte åtgärdad här (hade krävt antingen en
 * `min-height`-gissning, som byggkravet uttryckligen förbjuder, eller att
 * röra `Betalningar.tsx`, utanför detta pass mandat). Se bilage-READMEs
 * § Byggkravs-våg punkt 4 för mätningarna.
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
 * Byggkrav 2:s split-data (S96, variant A ENDAST) — "Väntar på betalning"
 * ersätts av två räknerader i Betalningar-blockets EGNA grammatik
 * ("Anmälningsavgifter — x av y mottagna −n" / "Slutbetalningar — x mottagna
 * −n"). Siffrorna är Deltagare.tsx:s ansvar (härledda ur samma
 * `avgiftKlar`/`slutKlar` som Betalningar.tsx använder, se
 * hallplats-steg-prototyp.ts) — denna komponent lägger bara ut dem i
 * radgrammatiken.
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

const STEG_ORDNING: (keyof HallplatsCounts)[] = ['vantar-bekraftelse', 'vantar-betalning', 'klar'];

/**
 * VARIANT A — tre rader, exakt SummeringsRad-grammatiken.
 *
 * `betalning` (byggkrav 2, S96, VARIANT A ENDAST): när satt ERSÄTTS den
 * mittersta "Väntar på betalning"-raden av TVÅ rader (Anmälningsavgifter/
 * Slutbetalningar) i Betalningar-blockets egen grammatik. Propen är OPTIONAL
 * och variant C:s anrop (`ArbetsKo` i Deltagare.tsx) utelämnar den helt —
 * den grenen får därför EXAKT samma tre rader som innan denna byggkravs-våg.
 * Variant B/C rörs inte (mission-scope); ENDAST variant A:s eget anrop
 * skickar `betalning`.
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
  betalning?: HallplatsBetalningsSplit;
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
      {betalning ? (
        <>
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
        </>
      ) : (
        <HallplatsRad
          term={HALLPLATS_LABEL['vantar-betalning']}
          aktiv={filter === 'vantar-betalning'}
          onClick={() => onFilterClick('vantar-betalning')}
          ton={counts['vantar-betalning'] > 0 ? 'warning' : 'neutral'}
        >
          {counts['vantar-betalning']}
        </HallplatsRad>
      )}
      <HallplatsRad term="Klara" aktiv={filter === 'klar'} onClick={() => onFilterClick('klar')}>
        {counts.klar}
      </HallplatsRad>
    </div>
  );
}

/**
 * Variant B:s KORTA stationsetiketter (review-fix-våg 2, defekt 4). Railen
 * är smal (tre lika breda stationer på mobilbredd, appens primära yta) — de
 * fulla `HALLPLATS_LABEL`-orden ("Väntar på bekräftelse") radbröt inuti
 * stationen. Uppdragets egna facit-ord ("Bekräftelse"/"Betalning"/"Klara")
 * ersätter dem HÄR ENDAST; `HALLPLATS_LABEL` (kortens steg-märke, variant A)
 * rörs inte.
 */
const STATION_LABEL: Record<keyof HallplatsCounts, string> = {
  'vantar-bekraftelse': 'Bekräftelse',
  'vantar-betalning': 'Betalning',
  klar: 'Klara',
};

/**
 * VARIANT B — STATIONS-RAILEN (review-fix-våg 2, defekt 4: den förra
 * versionen var tre halvstylade chips utan sammanbindande form — ingen
 * linje band ihop dem, och de fulla etiketterna radbröt). Byggd om till en
 * RIKTIG stepper: en horisontell linje löper genom de tre lika breda
 * stationerna (nummer-i-cirkel + kort namn + count), sammanhängande i
 * stället för tre fristående lådor.
 *
 * Linje-segmenten (vänster/höger om varje cirkel) ligger i SAMMA flex-rad
 * som cirkeln (`items-center`) — de centreras därför alltid mot cirkelns
 * mitt oavsett radhöjd, i stället för att absolut-positioneras mot en gissad
 * pixel-offset. Yttersta segmenten (före station 1, efter station 3) är
 * `invisible` (upptar sin plats, syns aldrig) så alla tre stationer förblir
 * EXAKT lika breda (`flex-1`) — en synlig halv-linje i kanten hade gjort
 * ytterstationerna smalare än den mellersta.
 *
 * "Tyngdpunkten" (första station med count > 0, Marcus ordning) får den
 * FYLLDA cirkeln (`bg-primary`/`text-inverse` — appens gulddragna accent-
 * token, samma familj som fokusringen) i stället för den neutrala
 * kontur-cirkeln — det ÄR svaret på "vad gör jag härnäst": ögat ska landa
 * där utan att läsa någon siffra först. Linjen SELV är medvetet neutral
 * (`bg-border`) hela vägen — en färgad "hittills"-sträcka hade antytt att
 * detta är EN persons sekventiella resa genom stegen, vilket det inte är
 * (tre oberoende populations-räknare, inte en enda persons färdväg).
 *
 * Hela stationen (cirkel-rad + etikett + count) är EN knapp — samma
 * `aria-pressed`-filter-klick som förut; linjerna är `aria-hidden` (rent
 * dekorativa, texten/cirkeln bär semantiken).
 */
export function HallplatsToppB({
  counts,
  filter,
  onFilterClick,
}: {
  counts: HallplatsCounts;
  filter: HallplatsSteg | null;
  onFilterClick: (steg: keyof HallplatsCounts) => void;
}) {
  const tyngdpunkt = STEG_ORDNING.find((steg) => counts[steg] > 0) ?? null;
  return (
    <fieldset data-testid="hallplats-rail" className="flex items-stretch border-none py-2">
      <legend className="sr-only">Hållplatser</legend>
      {STEG_ORDNING.map((steg, i) => {
        const arTyngdpunkt = steg === tyngdpunkt;
        const aktiv = filter === steg;
        return (
          <button
            key={steg}
            type="button"
            aria-pressed={aktiv}
            onClick={() => onFilterClick(steg)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 motion-safe:transition-colors ${
              aktiv ? 'bg-bg-emphasized' : 'hover:bg-bg-emphasized'
            }`}
          >
            {/* Cirkel-raden BÄR linjen — se docblocket ovan för varför
                linje-segmenten sitter i samma flex-rad som cirkeln. */}
            <span className="flex w-full items-center" aria-hidden="true">
              <span className={`h-0.5 flex-1 bg-border ${i === 0 ? 'invisible' : ''}`} />
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full font-semibold text-[11px] motion-safe:transition-colors ${
                  arTyngdpunkt
                    ? 'bg-primary text-text-inverse'
                    : 'border border-border-strong bg-surface text-text-secondary contrast-more:border-2'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`h-0.5 flex-1 bg-border ${i === STEG_ORDNING.length - 1 ? 'invisible' : ''}`}
              />
            </span>
            <span className="whitespace-nowrap text-caption text-text-muted">
              {STATION_LABEL[steg]}
            </span>
            <span
              className={`text-lg tabular-nums ${arTyngdpunkt ? 'font-semibold text-text' : 'text-text-secondary'}`}
            >
              {counts[steg]}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}

/**
 * VARIANT C:s "Härnäst"-panel. Pekar ut EN handling i klartext — den första
 * stationen (Marcus ordning) med count > 0. Genvägen (öppna+förmarkera
 * markera-läget) finns ENDAST för 'vantar-bekraftelse' (den enda stationen
 * med en färdig, orörd mekanik i denna kodbas — `useMarkeringsLage`); för
 * 'vantar-betalning' pekar panelen mot Betalningar-blocket i TEXT, utan
 * knapp — den mekaniken hör till TASK-18.20 och byggs inte i detta pass
 * (öppet bokförd genväg-begränsning, se slutrapporten).
 */
export function HallplatsHarnastPanel({
  counts,
  onOppnaOchMarkera,
}: {
  counts: HallplatsCounts;
  onOppnaOchMarkera: () => void;
}) {
  const nasta = STEG_ORDNING.find((steg) => counts[steg] > 0) ?? null;

  if (nasta == null) {
    return (
      <div className="rounded-xl bg-success-bg px-4 py-3 text-small text-text">
        Allt klart — alla är bekräftade och betalda.
      </div>
    );
  }

  if (nasta === 'vantar-bekraftelse') {
    const n = counts['vantar-bekraftelse'];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error-bg px-4 py-3">
        <p className="text-small text-text">
          <span className="font-semibold">{n}</span>{' '}
          {n === 1 ? 'väntar på bekräftelse' : 'väntar på bekräftelse'}
        </p>
        <Button intent="primary" size="sm" onPress={onOppnaOchMarkera}>
          Öppna och markera
        </Button>
      </div>
    );
  }

  if (nasta === 'vantar-betalning') {
    const n = counts['vantar-betalning'];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-bg px-4 py-3">
        <p className="text-small text-text">
          <span className="font-semibold">{n}</span> väntar på betalning
        </p>
        <p className="text-caption text-text-secondary">Se Betalningar-blocket nedan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-success-bg px-4 py-3 text-small text-text">
      Alla bekräftade är betalda — {counts.klar} klara.
    </div>
  );
}

/**
 * GEMENSAMT — diskret rad längst ned i registret (fråga 6, Del 3 fall C):
 * avbokade försvinner idag TYST ur `aktiva`. Namnen bor bakom en native
 * `<details>` (minsta a11y-säkra utfällbara form — ingen egen JS-mekanik
 * behövs, tangentbord/skärmläsare får den gratis).
 */
export function AvbokadeRad({ avbokade }: { avbokade: Registration[] }) {
  const id = useId();
  if (avbokade.length === 0) return null;
  return (
    <details className="group py-2 text-small text-text-muted" data-testid="hallplats-avbokade">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="shrink-0 group-open:rotate-180 motion-safe:transition-transform"
        />
        {avbokade.length === 1 ? '1 har avbokat' : `${avbokade.length} har avbokat`}
      </summary>
      <ul className="mt-1 flex flex-col gap-0.5 pl-5" id={id}>
        {avbokade.map((r) => (
          <li key={r.id}>{displayName(r)}</li>
        ))}
      </ul>
    </details>
  );
}
