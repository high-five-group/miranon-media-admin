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
 *
 * [TASK-451.7] KÄND, ÖPPET BOKFÖRD LUCKA: RADEN NEDAN BÄR INGEN `truncate`.
 * Diagnoskartan (§ 3) namnger `{namn} {verb} · {objekt}`-raden nedan som en
 * text som kan radbryta förbi skelettets `Skeleton variant="text"` (exakt 1
 * line-box). Fixen är INTE att lägga till `truncate` här: raden är en del av
 * `dev/hem-prototyp/ui.tsx`s promoverade, Marcus-godkända facit-form
 * (`s102-hem-konvergens/facit.json`, "godkand" satt 2026-08-17), och att
 * klippa aktivitetstexten hade ändrat den LADDADE vyns utseende på en
 * stämplad yta — förbjudet utan ny Marcus-stämpel (ADR-102), och uppdraget
 * för denna skiva förbjuder det uttryckligen.
 *
 * Skelettet är medvetet INTE breddat till 2 rader heller: det skulle
 * reservera för värsta fall men skapa en shrink i det vanliga, icke-
 * radbrytande fallet varje enda laddning — sämre än den nuvarande, mer
 * sällsynta asymmetrin (samma "reservera där det oftast finns, kollapsa
 * mjukt där det oftast saknas"-avvägning som motiverar de andra blockens
 * val i denna skiva).
 *
 * Varför det ändå håller CLS-tröskeln (mätt, inte antaget): blocket är det
 * SISTA innehållet i sidträdet, och pending→laddat-övergången byter HELA
 * subträdet (`role="status"`-`<div>` → `<ol>`, radnoden `<div>` → `<li>`) —
 * samma "en helt annan nod monteras i stället för den unmonterade"-mönster
 * `laddning-cls.acceptance.test.ts`s filhuvud redan dokumenterar för
 * Check-in/Aktivitetshistorik/Anmälningar (webbläsarens Layout
 * Instability-API räknar aldrig en shift för en nod som unmonteras och en
 * helt annan som monteras i dess ställe). Den mätta CLS-siffran för detta
 * scenario (fixtur med radbrytande aktivitetsrader) står i slutrapporten
 * för TASK-451.7.
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
              <Skeleton variant="text" className="text-body" />
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
