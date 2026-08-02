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
  const tonKlass =
    ton === 'error'
      ? 'font-medium text-error'
      : ton === 'warning'
        ? 'font-medium text-warning'
        : '';
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
        <span className={`text-right text-body tabular-nums ${tonKlass}`}>{children}</span>
      </button>
    </div>
  );
}

export type HallplatsCounts = {
  'vantar-bekraftelse': number;
  'vantar-betalning': number;
  klar: number;
};

const STEG_ORDNING: (keyof HallplatsCounts)[] = ['vantar-bekraftelse', 'vantar-betalning', 'klar'];

/** VARIANT A — tre rader, exakt SummeringsRad-grammatiken. */
export function HallplatsToppA({
  counts,
  filter,
  onFilterClick,
}: {
  counts: HallplatsCounts;
  filter: HallplatsSteg | null;
  onFilterClick: (steg: keyof HallplatsCounts) => void;
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
        term={HALLPLATS_LABEL['vantar-betalning']}
        aktiv={filter === 'vantar-betalning'}
        onClick={() => onFilterClick('vantar-betalning')}
        ton={counts['vantar-betalning'] > 0 ? 'warning' : 'neutral'}
      >
        {counts['vantar-betalning']}
      </HallplatsRad>
      <HallplatsRad term="Klara" aktiv={filter === 'klar'} onClick={() => onFilterClick('klar')}>
        {counts.klar}
      </HallplatsRad>
    </div>
  );
}

/**
 * VARIANT B — STATIONS-RAILEN. Horisontell rail, tre stationer numrerade
 * 1·2·3 i Marcus ordning. "Tyngdpunkten" (första station med count > 0)
 * bär den tydligaste markeringen — det ÄR svaret på "vad gör jag härnäst":
 * ögat ska landa där utan att läsa siffrorna först.
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
    <fieldset data-testid="hallplats-rail" className="flex items-stretch gap-2 border-none py-2">
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
            className={`flex flex-1 flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left motion-safe:transition-colors ${
              aktiv
                ? 'border-primary bg-primary-tint'
                : arTyngdpunkt
                  ? 'border-(--mm-navcard-border) bg-bg-emphasized contrast-more:border-border-strong'
                  : 'border-transparent bg-bg-muted contrast-more:border-border-strong'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-text font-semibold text-[10px] text-text-inverse">
                {i + 1}
              </span>
              <span className="text-caption text-text-muted">
                {steg === 'klar' ? 'Klara' : HALLPLATS_LABEL[steg]}
              </span>
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
