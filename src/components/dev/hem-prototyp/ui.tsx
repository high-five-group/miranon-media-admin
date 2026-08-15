import { Link } from '@tanstack/react-router';
import { ListChecks, UserPlus } from 'lucide-react';
import { relativTid } from '@/components/hem/relativ-tid';
import {
  Button,
  type ButtonProps,
  NavCard,
  type NavCardIcon,
  Skeleton,
} from '@/components/primitives';
import { useLatestActivity } from '@/data/queries/useActivityLog';
import { initialer, sprakText } from './data';

/**
 * [PROTOTYPE-UI, TASK-226] Delade byggstenar för hem-vyns divergens-prototyp
 * — de bitar som är INNEHÅLLSMÄSSIGT identiska i alla tre varianter (samma
 * data, samma destination, samma a11y-kontrakt) och där en tredubblering
 * bara hade dolt en kopieringsbugg, inte köpt visuell frihet. Rent visuella
 * skillnader (kort-chrome, rytm, typografi) styrs av `visual`-propen per
 * komponent — INTE tre kopior av datalogiken.
 *
 * Throwaway-kontraktet gäller filen som helhet (ADR-102/103): rivs med
 * förlorarna, absorberas inte rakt av.
 */

/** Avatar-cirkeln (PersonsList.tsx k13-facit) — initial-lista-radernas ankare. */
export function InitialAvatar({ namn, className }: { namn: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        className ??
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary'
      }
    >
      {initialer(namn)}
    </span>
  );
}

/**
 * Döda svep-knappen (task-226 UTANFÖR-scope: "sveparnas egna ytor … döda
 * ingångar"). Markeringen sker via en SYNLIG caption UNDER knappen, aldrig
 * en hover-only-tooltip (Gunilla-principen — en pekskärms- eller
 * tangentbordsanvändare ser aldrig en `title`-attributs tooltip, och
 * `ButtonProps` exponerar för övrigt inte `title` alls). `isDisabled`
 * spärrar faktiskt klicket (Button-primitivens kontrakt) — ingen `onPress`
 * finns att spärra bort.
 */
export function DodIngang({
  label,
  icon: Icon,
  intent = 'primary',
  size = 'md',
  emphasis,
  className,
  captionClassName,
  skarp = false,
}: {
  label: string;
  icon?: NavCardIcon;
  intent?: ButtonProps['intent'];
  size?: ButtonProps['size'];
  emphasis?: ButtonProps['emphasis'];
  className?: string;
  captionClassName?: string;
  /**
   * [TASK-226 konvergensvarv 1, punkt 3 "SKARP KNAPPFORM"] Opt-in, default
   * `false` — V2/V3:s ORÖRDA form: `isDisabled` (urblekt) + synlig
   * caption-varning under knappen. `true` (V1 only): knappen renderar sin
   * fulla, AKTIVA `intent`-färg utan `isDisabled`-urblekning och utan
   * caption, så Marcus kan bedöma den skarpa visuella formen. Klicket
   * skickar fortfarande INGENTING — ingen `onPress` kopplas, ett medvetet
   * no-op, inte en glömd handler. Sändflödet (bekräfta-/påminn-svepen)
   * byggs i svep-PRD:n, precis som innan.
   */
  skarp?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Button type="button" intent={intent} size={size} emphasis={emphasis} isDisabled={!skarp}>
        {Icon ? <Icon aria-hidden={true} size={18} className="shrink-0" /> : null}
        {label}
      </Button>
      {skarp ? null : (
        <p className={captionClassName ?? 'text-caption text-text-muted'}>
          Död ingång i prototypen, byggs i svep-PRD:n.
        </p>
      )}
    </div>
  );
}

/** Genvägarnas visuella containerklass per variant — INNEHÅLLET (två länkar,
    samma destinationer) är identiskt; bara rytm/kolumner skiljer. */
const GENVAGAR_LISTA_KLASS = {
  ro: 'flex flex-col gap-3',
  kontroll: 'grid grid-cols-2 gap-2',
  bento: 'grid grid-cols-2 gap-3',
} as const;

/**
 * Genvägar — manuell anmälan + Åtgärds-sidan (task-226 blocket). BÅDA är
 * REDAN skarpa, byggda routes (`/anmalan/ny`, `/atgarder`, task-18.18/171.5)
 * vars "tomt läge" ÄR eventväljar-steget — task-226 kräver just detta
 * ("knappar som öppnar eventväljar-steget … bygg inte nya flöden"), så
 * genvägarna är RIKTIGA länkar, inte döda ingångar (till skillnad från
 * sveparna ovan, som saknar en byggd yta att länka till).
 */
export function Genvagar({
  visual,
  headingId,
  headingClassName,
}: {
  visual: keyof typeof GENVAGAR_LISTA_KLASS;
  headingId: string;
  headingClassName: string;
}) {
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h2 id={headingId} className={headingClassName}>
        Genvägar
      </h2>
      <nav aria-label="Genvägar">
        <ul className={GENVAGAR_LISTA_KLASS[visual]}>
          <li>
            <NavCard to="/anmalan/ny" icon={UserPlus} label="Lägg till manuell anmälan" />
          </li>
          <li>
            <NavCard to="/atgarder" icon={ListChecks} label="Öppna Åtgärds-sidan" />
          </li>
        </ul>
      </nav>
    </section>
  );
}

/** Antal rader spalten visar — samma tal som facitets `SenasteAktivitet.tsx`. */
const ANTAL_AKTIVITETSRADER = 4;

type AktivitetVisual = 'ro' | 'kontroll' | 'bento';

const AKTIVITET_KLASS: Record<
  AktivitetVisual,
  { wrap: string; rad: (forsta: boolean) => string; tid: string; text: string }
> = {
  ro: {
    wrap: 'flex flex-col gap-0',
    rad: (forsta) =>
      forsta
        ? 'flex flex-col gap-1 py-3'
        : 'flex flex-col gap-1 border-border-light border-t py-3 contrast-more:border-border-strong',
    tid: 'text-caption text-text-muted',
    text: 'text-body',
  },
  kontroll: {
    wrap: 'flex flex-col gap-0 rounded-2xl border border-transparent bg-bg-muted px-3 contrast-more:border-border-strong print:border-border-strong',
    rad: (forsta) =>
      forsta
        ? 'flex items-baseline gap-2 py-1.5'
        : 'flex items-baseline gap-2 border-border-light border-t py-1.5 contrast-more:border-border-strong',
    tid: 'shrink-0 text-caption text-text-muted tabular-nums',
    text: 'min-w-0 truncate text-small',
  },
  bento: {
    wrap: 'flex flex-col gap-0 rounded-2xl border border-transparent bg-(--p-neutral-2) p-4 contrast-more:border-border-strong print:border-border-strong',
    rad: (forsta) =>
      forsta
        ? 'flex flex-col gap-0.5 py-2'
        : 'flex flex-col gap-0.5 border-border-light border-t py-2 contrast-more:border-border-strong',
    tid: 'text-caption text-text-muted',
    text: 'text-small',
  },
};

/**
 * Senaste aktivitet — KOMPAKT, ALLA BREDDER (task-226 blocket; medveten
 * avvikelse från facitets `SenasteAktivitet.tsx`, som är `hidden … xl:flex`
 * ENDAST ≥xl — task-226 kräver explicit "alla bredder"). Datalagret
 * (`useLatestActivity`) och tidsformateraren (`relativTid`) är delade
 * ORÖRDA ur facitet; presentationen är omskriven för att bära tre visuella
 * identiteter via `visual`-propen i stället för en fast spalt-form.
 */
export function SenasteAktivitetKompakt({
  visual,
  headingId,
  headingClassName,
}: {
  visual: AktivitetVisual;
  headingId: string;
  headingClassName: string;
}) {
  const { data, isPending, isError } = useLatestActivity(ANTAL_AKTIVITETSRADER);
  const k = AKTIVITET_KLASS[visual];
  const nuMs = Date.now();

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h2 id={headingId} className={headingClassName}>
        Senaste aktivitet
      </h2>
      {isPending ? (
        <div role="status" aria-busy="true" className={k.wrap}>
          <span className="sr-only">Laddar senaste aktivitet…</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={k.rad(i === 0)}>
              <Skeleton variant="text" className="w-20 text-caption" />
              <Skeleton variant="text" className="text-caption" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-caption text-text-muted">Kunde inte hämta senaste aktiviteten.</p>
      ) : data.statements.length === 0 ? (
        <p className="text-caption text-text-muted">Ingen aktivitet ännu.</p>
      ) : (
        <ol className={`${k.wrap} my-0 list-none p-0`}>
          {data.statements.map((post, i) => {
            const t = Date.parse(post.timestamp);
            return (
              <li key={post.id} className={k.rad(i === 0)}>
                <span className={k.tid}>{Number.isNaN(t) ? '' : relativTid(t, nuMs)}</span>
                <span className={k.text}>
                  <span className="font-medium">{post.actor.name}</span>{' '}
                  {sprakText(post.verb.display)}
                  {' · '}
                  {sprakText(post.object.definition.name)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <Link
        to="/mer/aktivitetshistorik"
        className="self-start font-medium text-caption underline-offset-2 hover:underline"
      >
        Se all aktivitetshistorik <span aria-hidden="true">›</span>
      </Link>
    </section>
  );
}
