import { Link } from '@tanstack/react-router';
import { Skeleton } from '@/components/primitives';
import { verbCopy } from '@/data/activityLog/verbCopy';
import { useLatestActivity } from '@/data/queries/useActivityLog';
import { HEM_SENASTE_AKTIVITET_ANTAL } from '@/queries/keys';
import { relativTid } from './relativ-tid';

/**
 * xAPI Language Map → sv-SE-strängen. Samma form som kärnvyns
 * `AktivitetsHistorik.tsx` `sprakText` — MEDVETET EJ delad (en fyra-raders
 * ren funktion utan eget beteende är billigare att ha i två filer än att
 * binda ihop två vyer via en gemensam modul, samma val den retirerade
 * `SenasteAktivitet.tsx` redan gjorde).
 */
function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/** Radens klasser — avdelare mellan raderna, aldrig ovanför den första. */
function radKlass(index: number): string {
  return index > 0
    ? 'flex flex-col gap-1 border-border-light border-t py-3 contrast-more:border-border-strong'
    : 'flex flex-col gap-1 py-3';
}

/**
 * "Senaste aktivitet" — Morgonkollens sjätte och sista block (TASK-243.1,
 * promoverad ur `dev/hem-prototyp/ui.tsx` SenasteAktivitetKompakt, facit
 * "hem-vyn V1 Lugna morgonen"). AVVIKELSE mot den retirerade
 * `SenasteAktivitet.tsx`, ÖPPET bokförd: alla bredder (inte `hidden …
 * xl:flex`) — PRD-beslutet (task-243) kräver explicit "alla bredder", och
 * spalten är inte längre en positionerad sidokolumn utan ett normalt block
 * sist i flödet. `useLatestActivity` + `HEM_SENASTE_AKTIVITET_ANTAL` +
 * `relativTid` + den DELADE verb-copy-modulen (`verbCopy`) är ORÖRDA — bara
 * presentationen är ny.
 */
export function SenasteAktivitetKompakt() {
  const { data, isPending, isError } = useLatestActivity(HEM_SENASTE_AKTIVITET_ANTAL);
  const nuMs = Date.now();

  return (
    <section aria-labelledby="hem-senaste-aktivitet" className="flex min-w-0 flex-col gap-3">
      <h2 id="hem-senaste-aktivitet" className="font-semibold text-2xl">
        Senaste aktivitet
      </h2>
      {isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-0">
          <span className="sr-only">Laddar senaste aktivitet…</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={radKlass(i)}>
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
        <ol className="my-0 flex list-none flex-col gap-0 p-0">
          {data.statements.map((post, i) => {
            const t = Date.parse(post.timestamp);
            return (
              <li key={post.id} className={radKlass(i)}>
                <span className="text-caption text-text-muted">
                  {Number.isNaN(t) ? '' : relativTid(t, nuMs)}
                </span>
                <span className="text-body">
                  <span className="font-medium">{post.actor.name}</span> {verbCopy(post.verb)}
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
