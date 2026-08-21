import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Attendance } from '@/domain/models/Attendance';
import type { Event } from '@/domain/models/Event';
import { AttendanceSession, AttendanceStatus, EventStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp } from './DetaljGrupp';

/**
 * Närvaro-registret (task-18.9; S73-facit K60). Genomförda event visar närvaron
 * som ett LMS-register (rader = deltagare, kolumner = sessioner, symbol per cell,
 * Total närvaro i procent — Blackboard/Canvas/Brightspace-mönstret); kommande event
 * visar ett lugnt ej-genomfört-läge. REN LÄSNING — närvaro-WRITE hör till
 * check-in-sidan (eget framtida pass), inte hit.
 *
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas aldrig).
 */

// Sessions-kolumnernas visnings-ordning (Deltaganden är EN rad per Anmälan ×
// Session). Single source: AttendanceSession (Status.ts), aldrig hårdkodade
// strängar. Registret renderar bara kolumner som HAR rader (en föreläsning har
// bara Föreläsning; ett tvådagars-event Dag 1 + Dag 2).
const SESSION_ORDER = [
  AttendanceSession.DAG_1,
  AttendanceSession.DAG_2,
  AttendanceSession.FORELASNING,
] as const;

// Status-mängden som ger Närvaropoäng = 1 (basens formel-mängd). ENDAST
// deploy-gap-FALLBACK: när den deployade EF:en ännu inte bär `narvaropoang`
// (prod/staging-deploy är separat Marcus-auktoriserad, DoD #7) härleds poängen
// ur status i stället — IDENTISK mängd som basformeln, så registret aldrig
// räknar närvaro annorlunda än rollup-kedjan.
const NARVARANDE_STATUSAR: ReadonlySet<string> = new Set([
  AttendanceStatus.NARVARANDE,
  AttendanceStatus.DELTOG_ONLINE,
]);

/**
 * Poängen för en närvaro-rad (0 | 1). Basens `narvaropoang` när den finns (rå ur
 * rollup-kedjan — enda tillförlitliga sanningen); annars härledd ur status
 * (deploy-gap-fallback, identisk mängd). `!= null` skiljer 0 (giltig poäng) från
 * saknad (undefined/null → fallback).
 */
function narPoang(row: Attendance): 0 | 1 {
  if (row.narvaropoang != null) return row.narvaropoang === 1 ? 1 : 0;
  return row.status != null && NARVARANDE_STATUSAR.has(row.status) ? 1 : 0;
}

/** Läsbart namn — aldrig ett record-ID, aldrig tomt (Gunilla-princip). */
function personNamn(row: Attendance): string {
  return row.personNamn ?? 'Namn saknas';
}

type RegisterRad = { key: string; namn: string; poangPerSession: Map<string, 0 | 1> };
type Register = { sessioner: string[]; rader: RegisterRad[]; procent: number };

/**
 * Bygger registret ur närvaro-raderna (ren funktion — "person × session +
 * poäng-mappning"): rader = personer (först-sedd ordning; nyckel personId, fallback
 * namn/rad-id), kolumner = sessioner MED rader i fast ordning, cell = poängen.
 * Total närvaro % = summa poäng / (personer × sessioner), avrundat.
 */
function buildRegister(rows: Attendance[]): Register {
  const sessioner = SESSION_ORDER.filter((s) => rows.some((r) => r.session === s));
  const rader: RegisterRad[] = [];
  const byKey = new Map<string, RegisterRad>();
  for (const r of rows) {
    const key = r.personId ?? r.personNamn ?? r.id;
    let rad = byKey.get(key);
    if (!rad) {
      rad = { key, namn: personNamn(r), poangPerSession: new Map() };
      byKey.set(key, rad);
      rader.push(rad);
    }
    if (r.session != null && sessioner.includes(r.session)) {
      rad.poangPerSession.set(r.session, narPoang(r));
    }
  }
  const slots = rader.length * sessioner.length;
  const poang = rader.reduce(
    (sum, rad) => sum + sessioner.reduce((s, sess) => s + (rad.poangPerSession.get(sess) ?? 0), 0),
    0,
  );
  const procent = slots === 0 ? 0 : Math.round((100 * poang) / slots);
  return { sessioner, rader, procent };
}

/**
 * Register-innehållet för ett GENOMFÖRT event. Fetchar närvaron via
 * `fetchAttendance` (get-attendance-EF, ADR-055) — monteras ENDAST för genomförda
 * event (se Narvaro), så kommande event aldrig anropar EF:en (noll e2e-rippel på
 * planerade-event-sviterna).
 *
 * A11y (11/10): registret är en riktig `<table>` — kolumnrubriker (scope="col";
 * namn-kolumnen sr-only), radrubrik per deltagare (scope="row" = namnet), och
 * varje cell bär sr-only TEXT ("Närvarande"/"Ej närvarande") så bocken/strecket
 * aldrig är enda bäraren (färg/symbol kompletteras alltid av text).
 */
function NarvaroRegister({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();

  const {
    data: attendance,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.attendance(eventId),
    queryFn: () => dataSource.fetchAttendance({ eventId }),
    // 4xx är klient-fel → meningslöst att retrya (speglar EventAttendance/EventDetail).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // registrets SLUTGEOMETRI (summeringsrad + tre tabellradsplatshållare,
    // Roselli-anatomin, speglar Gruppdynamik/Deltagare) i stället för en naken
    // "Laddar…"-textrad.
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2 py-3">
        <span className="sr-only">Laddar närvaro…</span>
        <Skeleton variant="text" className="w-2/5" />
        <Skeleton variant="listRow" className="h-10 rounded-lg" />
        <Skeleton variant="listRow" className="h-10 rounded-lg" />
        <Skeleton variant="listRow" className="h-10 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4">
        <MessageBox intent="error" title="Kunde inte hämta närvaron">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </div>
    );
  }

  const { sessioner, rader, procent } = buildRegister(attendance);

  if (rader.length === 0 || sessioner.length === 0) {
    return (
      <p className="py-8 text-center text-small text-text-secondary">
        Inga deltaganden registrerade för det här eventet än.
      </p>
    );
  }

  return (
    <>
      {/* Total närvaro — härledd LIVE ur poängen (aldrig ett eget lagrat räknefält). */}
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="text-small text-text-muted">Total närvaro</span>
        <span className="font-semibold text-body">{procent} %</span>
      </div>
      <div className="py-3">
        <table className="w-full">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Deltagare
              </th>
              {sessioner.map((s) => (
                <th
                  key={s}
                  scope="col"
                  className="w-20 pb-2 text-right font-medium text-caption text-text-muted"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rader.map((rad) => (
              <tr key={rad.key}>
                <th scope="row" className="py-2.5 text-left font-normal text-body">
                  {rad.namn}
                </th>
                {sessioner.map((s) => {
                  const narvarande = (rad.poangPerSession.get(s) ?? 0) === 1;
                  return (
                    <td key={s} className="w-20 py-2.5 text-right">
                      {narvarande ? (
                        <>
                          <Check aria-hidden="true" size={16} className="inline text-success" />
                          <span className="sr-only">Närvarande</span>
                        </>
                      ) : (
                        <span className="text-text-muted">
                          -<span className="sr-only">Ej närvarande</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Närvaro-gruppen på eventsidan (task-18.9). GENOMFÖRT event → registret (fetchar
 * närvaron); annars (Planerat/Inställt/Flyttat) → lugnt ej-genomfört-läge UTAN
 * fetch (registret monteras inte, EF:en anropas aldrig). Grupp-skalet (rubrik
 * "Närvaro" utanför tonala kortet) delas med sidans övriga grupper (DetaljGrupp).
 */
export function Narvaro({ event }: { event: Event }) {
  return (
    <DetaljGrupp id="grupp-narvaro" rubrik="Närvaro">
      {event.status === EventStatus.GENOMFORT ? (
        <NarvaroRegister eventId={event.id} />
      ) : (
        // Review-våg 2 (2026-07-23): kortad centrerad muted-text + samma
        // min-h som Gruppdynamiks tomläge — tomma kort ser lika stora ut.
        <p className="flex min-h-28 items-center justify-center text-center text-small text-text-muted">
          Eventet är inte genomfört ännu
        </p>
      )}
    </DetaljGrupp>
  );
}
