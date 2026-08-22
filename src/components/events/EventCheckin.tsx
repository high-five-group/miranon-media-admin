/**
 * Dörrlistan — check-in-sidans skarpa yta. Skarp produktionskod.
 *
 * HÄRKOMST, eftersom den förklarar formen: detta ÄR S90/S103-konvergensens
 * prototyp (divergens-passet, S90, Marcus-beordrad 2026-07-26), PROMOVERAD
 * enligt `ADR-103` (B1 promoveringsformen, B2 steg 4 rivningen) och godkänd
 * av Marcus 2026-08-14 (kvitto: `tasks/sessions/bilagor/s103-checkin-
 * konvergens/facit.json` § godkand, satt via `ADR-104`:s kanalseparation).
 * "Det skarpa bygget" är avskaffat som begrepp — den godkända formen byggs
 * aldrig om, den flyttas hit. Filen bytte alltså namn FRÅN
 * `CheckinPrototyp.tsx`; git bär bytet som en rename, så historiken följer
 * formen och inte filnamnet (persondetalj-precedenten, commit `4aad0111`).
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  FRÅGAN (kontraktets klausul i — nedskriven högst upp):
 *
 *    "Hur ska check-in-sidan fungera när Lotta står vid dörren och
 *     deltagarna kommer in?"
 * ══════════════════════════════════════════════════════════════════════════
 *
 * TRE STRUKTURELLT OLIKA SVAR på den befintliga routen
 * `/event/$eventId/narvaro?variant=a|b|c` (prototyp-skillens underform A —
 * riktig route, riktig auth, riktig datahämtning via adaptern):
 *
 *   a — REGISTRET (efterhandsarbetet, INTE dörren). Person × session som
 *       rutnät i LMS-registerklassen (Blackboard/ClassDojo). Alla sex
 *       statusvärden per cell. Massmarkering hör HIT: "Markera alla
 *       närvarande" per session + task-48:s markera-läge med batch-bar.
 *       Research-fyndet: varje funnen massmarkering ligger i register-
 *       klassen, noll av fem event-check-in-produkter har den vid dörren.
 *   b — LISTA-FÖRST (dörren som lista man bläddrar i). Alla anmälda i en
 *       lång lista, EN gest per rad, binärt Ej avstämt ↔ Närvarande.
 *       Ångra bor PÅ POSTEN (tryck igen). Sök finns men är sekundärt.
 *       "Senast incheckade" i nederkanten som kvitto.
 *   c — SÖK-FÖRST (dörren som sökruta). Autofokuserat sökfält, typeahead,
 *       incheckning direkt ur träfflistan, sökningen nollställs efter
 *       incheckning ⇒ posten lämnar skärmen ⇒ ångra måste bo i den
 *       KVARSTÅENDE "Senast incheckade"-panelen (Luma Express-mönstret).
 *   d — DÖRRLISTAN (S105-OMTAGET, efter att Marcus underkänt a/b/c rakt av:
 *       "under all kritik"). Tät lista i appens EGEN kortgrammatik — den
 *       godkända personlistans tonala kortyta med `divide-y`, Hem-facitets
 *       primär-tintade kort för framstegen, en RIKTIG knapp per rad. Listan
 *       drivs av ANMÄLNINGARNA med deltagandet som statuslager (se
 *       `byggRaderD`), vilket är både den riktigare dörr-modellen och det
 *       enda sättet att över huvud taget se mer än EN rad på staging i dag.
 *
 * VARFÖR a/b/c FÖLL (Marcus mätning 2026-08-13 + orkestrerarens facit-
 * jämförelse): de talar inte appens designspråk. Naken text på vitt utan
 * kort, ren gråskala där huset bär guld/rost, den viktigaste kontrollen som
 * en högerställd textlänk, och — mätt av mig själv — EN datarad på en skärm
 * byggd för att visa många. D är svaret på båda: samma språk som de
 * stämplade sidorna, och en lista som faktiskt är full.
 *
 * READ-ONLY GÄLLDE A/B/C — VARIANT D SKRIVER SKARPT (TASK-214.2, 2026-08-14).
 * Variant D är promoverad till skarp skrivväg och muterar basen via
 * `useSetAttendanceStatus` (`src/data/mutations/attendance.ts`) — de två
 * operationerna `set-attendance-status` och `create-attendance` finns sedan
 * TASK-214.1 i `field-allowlists.ts`. Skrivningen går EXAKT när
 * kvittensfönstret löpt ut; ångra inom fönstret ger noll anrop. Formen är
 * oförändrad — se `facit.json` ytan "check-in (dörrlistan, variant D)".
 *
 * A/B/C RIVNA (TASK-214.4, 2026-08-15, ADR-103 B2 steg 1 — persondetalj-
 * precedenten `dc0eb4ec`). Route-villkoret `variant === 'd'` är borta: D är
 * nu den OVILLKORLIGA formen på `/event/$eventId/narvaro`. `VariantA`,
 * `VariantB`, `VariantC`, `useDorrLage`, `Raknare`, `Framsteg`,
 * `TillbakaLank`, `SessionsRad`, `DorrRad`, `SenastListan`, `AvbokadeNot`
 * och `statusKort` dog med dem — samtliga utpekade av kompilatorn, aldrig
 * gissade. Beskrivningen av a/b/c i frågeavsnittet OVAN är HISTORISK: den
 * förklarar varför D vann, inte kod som finns kvar.
 *
 * RIVNINGEN SLUTFÖRD (TASK-214.7, 2026-08-15, ADR-102 B3). Marcus godkände
 * den promoverade ytan (214.6) — förkravet B3:s spärr kräver innan något
 * rivs. Rail-monteringen (`PrototypeSwitcher`) och `CHECKIN_PROTO_VARIANTS`-
 * registret är rivna ur `narvaro.tsx` (villkor och växlar — ALDRIG form).
 * `EventAttendance` (den gamla skarpa läslistan, ersatt sedan flippen) är
 * riven i samma landning — den renderades inte härifrån sedan TASK-214.4.
 *
 * DATAT (underlaget från förarbetet):
 *   · `get-attendance` bär write-nyckeln (Deltaganden-record-ID) + sessionen
 *     men saknar e-post och vet inte om anmälan är AVBOKAD.
 *   · `get-registrations` bär e-post/medföljande/bor över/avbokad men har
 *     ingen väg till Deltaganden-raden.
 *   ⇒ D JOINAR klientside på `Deltagande.anmalanId → Registration.id`. Båda
 *     anropen cachas redan under befintliga query-nycklar.
 *
 * SESSIONS-DIMENSIONEN (den skarpaste öppna designfrågan): Deltaganden är
 * EN rad per Anmälan × Session — en dörr-lista som inte är sessions-scopad
 * visar varje person två gånger på ett tvådagars-event. D HÄRLEDER en
 * default ur eventets datum (`useSessionsval`), visar den ALLTID explicit
 * och gör den överstyrbar (A visade tidigare sessionerna som KOLUMNER i
 * stället — HISTORISK, se git-historiken för formen). Basen har inget fält
 * som binder Session till datum — härledningen är en kvalificerad gissning
 * och får därför aldrig vara tyst.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BedDouble, Check, ChevronDown, ChevronLeft, RotateCcw, X } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Checkbox,
  SearchField,
} from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName } from '@/components/registrations/registration-display';
import { useSetAttendanceStatus } from '@/data/mutations/attendance';
import { useDataSource } from '@/data/useDataSource';
import type { Attendance } from '@/domain/models/Attendance';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import {
  AttendanceSession,
  type AttendanceSessionValue,
  AttendanceStatus,
  type AttendanceStatusValue,
  RegistrationSource,
  RegistrationStatus,
} from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Sessionernas visnings-ordning — single source, aldrig hårdkodade strängar. */
const SESSION_ORDNING = [
  AttendanceSession.DAG_1,
  AttendanceSession.DAG_2,
  AttendanceSession.FORELASNING,
] as const;

const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });
const DATUM_LANG = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// ═══════════════════════════════════════════════════════════════════════════
//  DATA — läsning + klient-join
// ═══════════════════════════════════════════════════════════════════════════

/** En dörr-rad: ETT deltagande (Anmälan × Session) berikat ur anmälan. */
type Dorrad = {
  /** Deltaganden-record-ID — write-nyckeln en skarp skiva skulle PATCH:a. */
  id: string;
  namn: string;
  email: string | null;
  session: AttendanceSessionValue;
  /** Status som den står i basen. Fältet matas av `byggRader`/`useDorrData`
   *  men läses inte av D — D:s egen statusöverlagring bor i `useDorrLageD`,
   *  över `DorradD[]`, inte över denna delade `Dorrad[]`-typ (`useDorrLage`,
   *  A/B/C:s motsvarighet, är riven med dem, TASK-214.4). */
  basStatus: AttendanceStatusValue;
  /** Basens `Avstämt` — A8 äger fältet; appen skriver det ALDRIG. */
  avstamt: string | null;
  /** Ur joinen: anmälan är Avbokad/Ombokad. Ingen automation raderar
   *  deltagandet vid avbokning ⇒ utan joinen visar dörren avbokade som
   *  incheckningsbara. Det är en defekt, inte en detalj. */
  avbokad: boolean;
  medfoljande: boolean;
  borOver: boolean;
};

function byggRader(attendance: Attendance[], registrations: Registration[]): Dorrad[] {
  const perAnmalan = new Map(registrations.map((r) => [r.id, r]));
  return attendance
    .filter((a): a is Attendance & { session: AttendanceSessionValue } => a.session != null)
    .map((a) => {
      const reg = a.anmalanId ? perAnmalan.get(a.anmalanId) : undefined;
      return {
        id: a.id,
        namn: a.personNamn ?? (reg ? displayName(reg) : 'Namn saknas'),
        email: reg?.email ?? null,
        session: a.session,
        basStatus: a.status ?? AttendanceStatus.EJ_AVSTAMT,
        avstamt: a.avstamt,
        avbokad: reg?.status === RegistrationStatus.AVBOKAD,
        medfoljande: reg?.kalla === RegistrationSource.MEDFOLJANDE,
        borOver: reg?.borOver === true,
      };
    })
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv-SE'));
}

function useDorrData(eventId: string) {
  const dataSource = useDataSource();
  const event = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
  });
  const attendance = useQuery({
    queryKey: queryKeys.events.attendance(eventId),
    queryFn: () => dataSource.fetchAttendance({ eventId }),
  });
  const registrations = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
  });

  const rader = useMemo(
    () =>
      attendance.data && registrations.data ? byggRader(attendance.data, registrations.data) : [],
    [attendance.data, registrations.data],
  );

  return {
    event: event.data,
    rader,
    isPending: event.isPending || attendance.isPending || registrations.isPending,
    isError: event.isError || attendance.isError || registrations.isError,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT D — DÖRRLISTAN (S105, efter att A/B/C underkänts)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * En dörr-rad i variant D: objektet är ANMÄLAN, inte deltagandet.
 *
 * SKILLNADEN MOT A/B/C, och varför den är riktigare: A/B/C bygger listan ur
 * `Deltaganden` och blir därmed osynliga för varje anmäld som saknar
 * deltaganderad. Vid dörren checkar Lotta in ANMÄLDA PERSONER — att en
 * `Deltaganden`-rad ännu inte hunnit skapas av A3 är ett basfaktum, inte ett
 * skäl att dölja personen. Mätt på staging-eventet `recDUMxyXI8hFHOg3`
 * 2026-08-13 via EF-svaren: `get-registrations` = 17 poster,
 * `get-attendance` = 1. En deltagande-driven dörr visar alltså EN av
 * sjutton anmälda — resten är osynliga för den som står i dörren.
 */
type DorradD = {
  /** Anmälnings-record-ID — radens identitet i variant D. */
  anmalanId: string;
  /** Sessionen raden gäller. Ingår i tillståndsnyckeln — se `nyckel`. */
  session: AttendanceSessionValue;
  /** Deltaganden-record-ID för vald session, om raden finns. Write-nyckeln. */
  deltagandeId: string | null;
  namn: string;
  email: string | null;
  basStatus: AttendanceStatusValue;
  avstamt: string | null;
  medfoljande: boolean;
  borOver: boolean;
};

/**
 * Bygger dörr-raderna ur ANMÄLNINGARNA, med deltagandet som statuslager.
 *
 * Avbokade/ombokade anmälningar utesluts (de ska inte kunna checkas in) och
 * räknas separat så bortfallet kan visas explicit — aldrig tyst.
 */
function byggRaderD(
  registrations: Registration[],
  attendance: Attendance[],
  session: AttendanceSessionValue,
): { rader: DorradD[]; avbokade: number; utanDeltagande: number } {
  const perAnmalanOchSession = new Map<string, Attendance>();
  for (const a of attendance) {
    if (a.anmalanId && a.session === session) perAnmalanOchSession.set(a.anmalanId, a);
  }

  let avbokade = 0;
  let utanDeltagande = 0;
  const rader: DorradD[] = [];

  for (const reg of registrations) {
    if (reg.status === RegistrationStatus.AVBOKAD) {
      avbokade += 1;
      continue;
    }
    const deltagande = perAnmalanOchSession.get(reg.id);
    if (!deltagande) utanDeltagande += 1;
    rader.push({
      anmalanId: reg.id,
      session,
      deltagandeId: deltagande?.id ?? null,
      namn: displayName(reg),
      email: reg.email ?? null,
      basStatus: deltagande?.status ?? AttendanceStatus.EJ_AVSTAMT,
      avstamt: deltagande?.avstamt ?? null,
      medfoljande: reg.kalla === RegistrationSource.MEDFOLJANDE,
      borOver: reg.borOver === true,
    });
  }

  rader.sort((a, b) => a.namn.localeCompare(b.namn, 'sv-SE'));
  return { rader, avbokade, utanDeltagande };
}

/**
 * Tillståndsnyckeln — ANMÄLAN × SESSION, aldrig anmälan ensam.
 *
 * DETTA ÄR SESSIONS-DIMENSIONEN, och den var fel i mitt första utkast:
 * nyckeln var bara `anmalanId`, vilket gjorde att en person incheckad på
 * Dag 1 visades incheckad även på Dag 2. Fångat mot granskningsfixturen
 * `reckgn7arcyW367qT` (16 personer × 2 sessioner = 32 deltaganden), som är
 * hela skälet till att ett tvådagars-underlag behövdes: mot ett endags-event
 * hade buggen varit osynlig. `Deltaganden` är EN rad per Anmälan × Session,
 * så tillståndet måste bära samma dimension som datat.
 */
function lageNyckel(rad: DorradD): string {
  return `${rad.anmalanId}::${rad.session}`;
}

/**
 * Dörrens tillstånd i variant D — nycklat på ANMÄLAN × SESSION (se
 * `lageNyckel`), inte på deltagandet, eftersom deltagandet kan saknas.
 *
 * SKARP SEDAN TASK-214.2, och överlägget är nu det OPTIMISTISKA LAGRET, inte
 * en prototyp-stub: flippen sker vid trycket, skrivningen 1,2 s senare när
 * kvittensfönstret löpt ut. Den frikopplingen är hela skälet till att
 * optimistiken inte kan bo i query-cachens `onMutate` som i husets övriga
 * kryss-mutationer — se `src/data/mutations/attendance.ts` § VARFÖR
 * OPTIMISTIKEN INTE BOR HÄR. Rollbacken (`aterstall`) är ADR-016:s komponent D,
 * flyttad hit av samma skäl.
 */
function useDorrLageD() {
  const [overlag, setOverlag] = useState<ReadonlyMap<string, AttendanceStatusValue>>(new Map());
  const [tider, setTider] = useState<ReadonlyMap<string, number>>(new Map());
  const [historik, setHistorik] = useState<readonly string[]>([]);
  /**
   * Skriv-nycklar som CREATE-backupen gett oss (lägesnyckel → Deltaganden-ID).
   *
   * REF, INTE STATE, och det är avsiktligt: värdet läses inuti kvittens-
   * timerns callback, som stänger över den render den skapades i. En
   * `useState` hade gett timern en FRUSEN karta; en efterföljande urbockning
   * hade då trott att raden fortfarande saknas och skickat en ny CREATE.
   */
  const skapadeIdn = useRef(new Map<string, string>());

  const satt = (rad: DorradD, status: AttendanceStatusValue) => {
    const nyckel = lageNyckel(rad);
    setOverlag((nu) => new Map(nu).set(nyckel, status));
    setTider((nu) => new Map(nu).set(nyckel, Date.now()));
    setHistorik((nu) => {
      const utan = nu.filter((k) => k !== nyckel);
      return status === AttendanceStatus.NARVARANDE ? [nyckel, ...utan] : utan;
    });
  };

  /**
   * Rulla tillbaka en rad till det tillstånd som gällde FÖRE flippen — anropas
   * när skrivningen misslyckats. En misslyckad INCHECKNING återför raden till
   * arbetslistan (kravet: ingen incheckning försvinner tyst); en misslyckad
   * URBOCKNING lämnar raden incheckad, eftersom det är vad basen faktiskt bär.
   */
  const aterstall = (rad: DorradD, tidigare: AttendanceStatusValue) => {
    const nyckel = lageNyckel(rad);
    setOverlag((nu) => {
      const nasta = new Map(nu);
      // Sammanfaller det tidigare tillståndet med basens är överlägget
      // överflödigt — raderas det kan en senare refetch inte överskuggas av
      // ett inaktuellt lokalt värde.
      if (tidigare === rad.basStatus) nasta.delete(nyckel);
      else nasta.set(nyckel, tidigare);
      return nasta;
    });
    setTider((nu) => {
      // Var raden incheckad före flippen står klockslaget kvar — det är samma
      // incheckning, inte en ny.
      if (tidigare === AttendanceStatus.NARVARANDE) return nu;
      const nasta = new Map(nu);
      nasta.delete(nyckel);
      return nasta;
    });
    setHistorik((nu) => {
      const utan = nu.filter((k) => k !== nyckel);
      return tidigare === AttendanceStatus.NARVARANDE ? [nyckel, ...utan] : utan;
    });
  };

  /** Minns CREATE-vägens nya record-ID så nästa skrivning uppdaterar rätt rad. */
  const kommIhagId = (rad: DorradD, id: string) => {
    skapadeIdn.current.set(lageNyckel(rad), id);
  };

  /**
   * Radens skriv-nyckel. Den lokalt skapade vinner över basens: `rad` kommer
   * från renderets cache-läge och kan sakna ett ID vi själva just skapat.
   */
  const skrivNyckel = (rad: DorradD): string | null =>
    skapadeIdn.current.get(lageNyckel(rad)) ?? rad.deltagandeId;

  const status = (rad: DorradD): AttendanceStatusValue =>
    overlag.get(lageNyckel(rad)) ?? rad.basStatus;

  const tid = (rad: DorradD): string | null => {
    const lokal = tider.get(lageNyckel(rad));
    if (lokal != null) return KLOCKSLAG.format(new Date(lokal));
    if (rad.avstamt == null) return null;
    const d = new Date(rad.avstamt);
    return Number.isNaN(d.getTime()) ? null : KLOCKSLAG.format(d);
  };

  return { satt, aterstall, kommIhagId, skrivNyckel, status, tid, historik };
}

/**
 * FRAMSTEGSKORTET — dörrens navigationsinstrument OCH dess kvitto.
 *
 * Formen är Hem-facitets primär-tintade kort (`DashboardCard tone="primary"`,
 * `k10-facit-desktop.png`): `bg-primary-tint`, vit pill uppe till höger
 * (`NastaEventCard.tsx:131-134`), `bg-surface`-spår med `bg-primary-muted`
 * fyllnad längst ned (`NastaEventCard.tsx:166-171`).
 *
 * VARV 1 (S105 iterering) rättade TRE mätta avvikelser mot den formen:
 *
 * 1. RUBRIKEN BÄR DET ÅTERSTÅENDE, inte det gjorda. Kortet sade
 *    "0 av 16 incheckade" med pillen "16 kvar" — samma faktum två gånger,
 *    och det som lästes störst var arbetet som redan var gjort. Vid en dörr
 *    är den intressanta siffran den som räknar ned. Hem-facitets båda kort
 *    gör samma sak: `NastaEventCard` leder med "70 dagar kvar", inte med
 *    "70 dagar har gått".
 * 2. PILLEN BÄR NU ANNAN INFORMATION än rubriken (facitets pill "70 dagar
 *    kvar" kompletterar titeln "Nästa event"; den upprepar den inte).
 * 3. KVITTOT BOR HÄR, inte i en panel. Se `VariantD` § KVITTOT.
 *
 * Räknaren behåller A/B/C:s BREDDLÅS (osynlig platshållare i maxform +
 * `tabular-nums`) så siffran aldrig flyttar sig under fingret.
 */
function FramstegskortD({
  klara,
  totalt,
  kvitto,
  klass,
}: {
  klara: number;
  totalt: number;
  kvitto: React.ReactNode;
  /** Yttre luft — sätts av anroparen, se `VariantD` § LUFTEN. */
  klass?: string;
}) {
  const kvar = Math.max(0, totalt - klara);
  const andel = totalt === 0 ? 0 : Math.round((100 * klara) / totalt);
  return (
    <section
      aria-label="Framsteg"
      className={`flex flex-col gap-2 rounded-2xl border border-transparent bg-primary-tint p-4 contrast-more:border-border-strong print:border-border-strong ${klass ?? ''}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        {/* Breddlåset: osynlig maxform i samma grid-cell som det verkliga talet. */}
        <span className="grid font-semibold text-xl">
          <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
            99 kvar att checka in
          </span>
          <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
            {kvar === 0 ? 'Alla är incheckade' : `${kvar} kvar att checka in`}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption tabular-nums">
          {`${klara} av ${totalt}`}
        </span>
      </div>
      <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary-muted motion-safe:transition-[width]"
          style={{ width: `${andel}%` }}
        />
      </div>
      {/* HÖJDLÅSET (S103-konvergensvarvet, Marcus punkt 4): kortet får ALDRIG
          växa. Kvitto-raden renderas ALLTID i sin slutgeometri och står tom
          tills första incheckningen - samma regel som personlistans
          e-postrad (`DorrRadD` § HÖJDLÅSET). Tidigare växte kortet ~40 px
          vid första incheckningen. */}
      <div className="-mb-1 flex min-h-9 items-center gap-2 pt-1">{kvitto}</div>
    </section>
  );
}

/**
 * DÖRR-RADEN i variant D — personlistans anatomi plus EN kryssruta.
 *
 * KRYSSRUTAN ERSATTE KNAPPEN (S103-konvergensvarvet, Marcus punkt 6). Två
 * skäl konvergerade: (1) docblockens egen öppna fråga - sjutton kantade
 * "Checka in"-knappar var sidans tyngsta grafik, och varje nedskalning av en
 * KNAPP rev antingen etiketten (ikonknapp, Carry 12) eller domen mot A/B/C
 * ("naken textlänk"); (2) Marcus ville se en grön bock och en grön rad INNAN
 * personen lämnar listan - en kryssruta ÄR det tillståndet: ikryssad =
 * närvarande, urkryssad = ångrad, samma kontroll i båda listorna, ingen
 * separat Ångra-knapp på raden. Formen är Deltagares markerbara korts
 * stämplade grammatik (rå RAC Checkbox + `--mm-success`-kant/-platta,
 * geometri som aldrig hoppar). `success` som TILLSTÅNDSfärg följer den
 * markerings-precedenten; §19 dimension 1:s förbud gäller knapp-INTENTS,
 * och kryssrutan är ingen knapp.
 *
 * KONTROLLEN ÄR RUTAN, INTE RADEN: en hel rad som klickyta bjuder in till
 * råkad incheckning av fel person vid rullning (samma skäl som knapp-eran).
 * Träffytan är `min-h-11` på kontrollen själv (WCAG 2.5.5), och namnet bär
 * personens namn (`Närvarande: Anna Ek`) så sjutton kryssrutor förblir
 * skiljbara i en skärmläsares elementlista. Etiketten "Närvarande" är
 * synlig (WCAG 2.5.3: namnet innehåller den synliga texten).
 *
 * INGEN CHEVRON — medvetet, och det är en avvikelse värd att motivera:
 * chevronen i personlistan betyder "raden leder någonstans"
 * (`PersonsList.tsx:646-650`). Dörr-raden leder ingenstans; den bär en
 * handling. Husets egen regel är redan skriven: `Gruppdynamik.tsx` utelämnar
 * chevron just för att DET kortet inte leder vidare (citerat i
 * `PersonsList.tsx:486-492`). En chevron här vore en osann affordans.
 */
function DorrRadD({
  rad,
  incheckad,
  tid,
  onToggle,
}: {
  rad: DorradD;
  incheckad: boolean;
  tid: string | null;
  onToggle: () => void;
}) {
  return (
    // Success-tinten bär "nyss klar"-kvittensen (och klarlistans rader).
    // `-mx-4 px-4` i BÅDA lägena: tinten når kortets kanter utan att
    // innehållets geometri någonsin flyttar sig.
    <li
      data-dorr-rad
      className={`-mx-4 flex min-h-16 items-center gap-3 px-4 py-2.5 ${
        incheckad ? 'bg-(--mm-success-bg)' : ''
      }`}
    >
      {/* Identitetsmarkören byter GLYF med tillståndet, inte FÄRG: initialer
          när personen återstår, bock när hen är inne. Formen är personlistans
          `size-9`-cirkel i `bg-bg-emphasized` (`PersonsList.tsx:518-523`).

          VARV 1 (S105) TOG BORT GULDET, och det är den enskilt viktigaste
          färgrättelsen i passet. Bocken var `bg-primary-muted` (= `gold-400`,
          `semantic.css:7`) — husets UPPMÄRKSAMHETSfärg. Mätt i eget skott
          (v0-efter5-mobil-veck.png): fem fyllda guldcirklar var det starkaste
          på hela skärmen, och de satt på rader Lotta var KLAR med. I de
          stämplade ytorna betyder guld motsatsen: `Aktiv anmälan`-pillen i
          personlistan och `Nästa event`-kortets tint pekar på det som KRÄVER
          något. D lät alltså husets "titta hit" betyda "sluta titta här" —
          en semantisk invertering av designsystemets eget färgspråk.
          Tillståndet bärs nu av glyfen plus underradens "Incheckad HH:MM",
          aldrig av färg ensam (WCAG 1.4.1) — samma golv som förut. */}
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
      >
        {incheckad ? <Check size={18} /> : initialerD(rad.namn)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-body">{rad.namn}</span>
          {rad.borOver && (
            <BedDouble aria-hidden="true" size={13} className="shrink-0 text-text-secondary" />
          )}
          {rad.medfoljande && (
            <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-caption text-text-secondary">
              +1
            </span>
          )}
        </div>
        {/* HÖJDLÅSET (personlistans regel): raden renderas ALLTID, med ' ' när
            e-posten saknas — annars blir radhöjden en funktion av datan.
            STATUSEN BOR HÄR, inte i en egen kolumn: en reserverad pill-kolumn
            (personlistans k14) kostade ~85 px som på 390 px åt upp namnet —
            mätt i eget skott, varv 1: "Astri…", "Beng…", "Cecili…". Där bär
            chevronen 18 px; här bär knappen ~115 px, så det fasta högerblocket
            blir mer än dubbelt så brett och reservationen får inte plats.
            Knappen är redan radens fixpunkt för ögat, så kolumnen behövs inte
            för att fixera blicken. Formen är variant B:s beprövade
            (`Incheckad 09:58`) och kostar noll bredd. */}
        <span
          className={`truncate text-caption ${
            incheckad ? 'font-medium text-text-secondary' : 'text-text-muted'
          }`}
        >
          {incheckad ? `Incheckad${tid ? ` ${tid}` : ''}` : (rad.email ?? ' ')}
        </span>
      </div>

      {/* Knapp-erans mätserie (emphasis-varven, storleksvarven, "sidans
          tyngsta grafik"-frågan) är avslutad i och med kryssrutan - se
          docblocken ovan. Carry 12 (ikonknapp-växlingen) föll bort med den:
          etiketten "Närvarande" är synlig OCH kontrollen är lätt. */}
      <Checkbox
        isSelected={incheckad}
        onChange={onToggle}
        aria-label={`Närvarande: ${rad.namn}`}
        className="group flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded px-1 data-[focus-visible]:outline-(--mm-focus-ring) data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2"
      >
        {/* Ingen synlig etikett (varv 2, Marcus): rutan är självförklarande i
            sitt sammanhang. Namnet bärs helt av `aria-label`. */}
        {/* Boxen: kant + platta i Deltagare-precedentens success-form; bocken
            är mörk (text-text) på den ljusa plattan så glyf-kontrasten håller
            oavsett vad `--mm-success` löser till. Kanten är 1.4.1-bäraren. */}
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded border-2 border-border-strong bg-surface group-data-[selected]:border-(--mm-success) group-data-[selected]:bg-(--mm-success-bg)"
        >
          <Check size={16} className="text-text opacity-0 group-data-[selected]:opacity-100" />
        </span>
      </Checkbox>
    </li>
  );
}

/**
 * SESSIONSVALET I VARIANT D — samma krav, en tredjedel av höjden.
 *
 * Kravet är att härledningen ALDRIG är tyst (basen har inget fält som binder
 * Session till datum, och fel session ger fel `Närvaropoäng`-historik utan
 * att någon ser det). Kravet säger däremot ingenting om att den ska ta tre
 * block. D bar den som "Checkar in"-rad + datum-rad + toggle + en egen
 * två-radersnot: fyra element, ~100 px på 390 px, ovanför varje människa i
 * listan. Mätt i eget skott (v0): topp-materialet sköt första ÅTGÄRDBARA
 * raden till 427 px, 50,6 % av en 844 px-skärm.
 *
 * "HÄRLEDD ..."-CAPTIONEN ÄR RIVEN (S103-konvergensvarvet, Marcus punkt 5:
 * texten var obegriplig för sin läsare). Den förklarade systemets osäkerhet
 * i stället för att bära den. Kravet "aldrig tyst" står kvar och bärs nu
 * HELT av den synliga, överstyrbara toggeln: finns flera sessioner är valet
 * en kontroll mitt på sidan som inte går att missa; finns bara EN session
 * finns inget val att göra och ingenting renderas (datumet står redan i
 * sidhuvudet). Felvals-risken hanteras av kontrollens synlighet, inte av en
 * uppmaning i caption-grad.
 */
function SessionsRadD({
  sessioner,
  vald,
  onValj,
}: {
  sessioner: readonly AttendanceSessionValue[];
  vald: AttendanceSessionValue;
  onValj: (s: AttendanceSessionValue) => void;
}) {
  if (sessioner.length <= 1) return null;
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <ToggleButtonGroup
        label="Vilken session checkar du in?"
        spread
        selectedKey={vald}
        onSelectionChange={(key: AttendanceSessionValue) => onValj(key)}
      >
        {/* `min-h-11` PÅ VARJE FLIK (varv 4, S105): `size="sm"` ensamt gav
            37 px, mätt i eget skott (a11y-passet), under 44 px-golvet. Fel
            dag vald är dessutom den dyraste felhandlingen på hela ytan -
            `Närvaropoäng` räknar Dag 1 och Föreläsning mot kurshistoriken men
            INTE Dag 2, så en feltryckning ger fel historik utan att någon ser
            det. Kontrollen ska vara svår att missa. */}
        {sessioner.map((s) => (
          <ToggleButton key={s} id={s} size="sm" className="min-h-11">
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

/** Initialer för identitetsmarkören (personlistans `initialer`, samma form). */
function initialerD(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * VARIANT D — DÖRRLISTAN.
 *
 * Svaret på frågan: dörren är EN TÄT LISTA över de anmälda, i appens egen
 * kortgrammatik, med sökning som genväg och en riktig knapp per rad.
 *
 * Formen är hämtad ur den GODKÄNDA personlistan
 * (`tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`, Marcus
 * 2026-08-10) och Hem-facitets kort: tonal kortyta med `divide-y`-avdelare,
 * låst radhöjd, status som egen kolumn med reserverad plats, primär-tintat
 * kort för det som ska läsas på ett ögonkast. Skälet är att D ska vara
 * omöjlig att skilja från appens övriga stämplade sidor.
 *
 * Sök-först kontra lista-först (researchens delfråga 2): alla fem undersökta
 * produkter lägger en uppslagningsyta OVANPÅ en lista, ingen levererar bara
 * en lista. D gör därför båda — listan är alltid synlig, sökfältet filtrerar
 * den. Sökningen NOLLSTÄLLS INTE efter incheckning (till skillnad från C):
 * posten står kvar och bär sin egen ångra-väg, vilket gör den kvarstående
 * panelen till ett kvitto i stället för den enda vägen tillbaka.
 *
 * INGEN AUTOFOKUS — medveten avvikelse från researchens §g, som rekommenderar
 * fokuserat sökfält vid dörren. Husets egen stämplade praxis väger tyngre:
 * personlistan slår fast att sidladdnings-autofokus är a11y-golv, inte stil
 * (`PersonsList.tsx:317-319`). På mobil öppnar autofokus dessutom tangent-
 * bordet direkt och täcker listan — precis den överblick dörren behöver.
 */
function VariantD({
  eventId,
  event,
  rader: alla,
}: {
  eventId: string;
  event: Event;
  rader: Dorrad[];
}) {
  const dataSource = useDataSource();
  const { sessioner, session, setSession, datumtext } = useSessionsval(event, alla);
  const lage = useDorrLageD();
  const skrivning = useSetAttendanceStatus(eventId);
  // TASK-299.1 DEV-VÄXEL (rivs igen efter Marcus mätning, TASK-299.2/299.6):
  // `?sidram=ny` bakom `import.meta.env.DEV` (ADR-074 amendering 7-formen) —
  // utan flaggan är ytan identisk med sitt facit (AC #4). Enda läspunkten i
  // denna fil.
  const [sidram] = useQueryState('sidram');
  const sidramNy = import.meta.env.DEV && sidram === 'ny';
  const [fraga, setFraga] = useState('');
  const [visaKlara, setVisaKlara] = useState(false);
  /** Rader vars skrivning misslyckats (lägesnyckel → namn). Se `skriv`. */
  const [misslyckade, setMisslyckade] = useState<ReadonlyMap<string, string>>(() => new Map());

  /**
   * KVITTENSFÖNSTRET (S103-konvergensvarvet, Marcus punkt 6): raden ska BLI
   * GRÖN innan den lämnar arbetslistan. Vid incheckning står raden kvar i
   * 1,2 s med ikryssad ruta och success-tint där fingret redan är, och
   * flyttar först därefter till klargruppen. Ångra inom fönstret avbryter
   * flytten direkt. Fönstret är en FÖRDRÖJNING, inte en rörelse - det
   * gäller därför oavsett `prefers-reduced-motion`.
   *
   * SEDAN TASK-214.2 ÄR FÖNSTRET OCKSÅ SKRIVNINGENS KLOCKA: timern bär både
   * flytten till klargruppen och anropet till basen. De två kan inte skiljas
   * åt — "ångra inom fönstret" betyder per definition att raden aldrig nådde
   * basen, och det är bara sant om samma timer äger båda.
   */
  const [nyssKlara, setNyssKlara] = useState<ReadonlySet<string>>(() => new Set());
  const kvittensTimers = useRef(new Map<string, number>());
  useEffect(() => {
    const timers = kvittensTimers.current;
    return () => {
      // Lämnar Lotta sidan inom fönstret rivs timern och ingen skrivning går.
      // Det är SAMMA utfall som ett ångra inom fönstret, inte en tyst förlust:
      // fönstret hann aldrig löpa ut, och kontraktet säger att skrivningen går
      // först då.
      for (const t of timers.values()) window.clearTimeout(t);
    };
  }, []);

  // Anmälningarna är variant D:s källa (se `byggRaderD`). De ligger redan i
  // cachen under samma nyckel som `useDorrData` använder — inget nytt anrop.
  const registrations = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
  });
  const attendance = useQuery({
    queryKey: queryKeys.events.attendance(eventId),
    queryFn: () => dataSource.fetchAttendance({ eventId }),
  });

  const { rader, avbokade, utanDeltagande } = useMemo(
    () => byggRaderD(registrations.data ?? [], attendance.data ?? [], session),
    [registrations.data, attendance.data, session],
  );

  const antalKlara = rader.filter((r) => lage.status(r) === AttendanceStatus.NARVARANDE).length;

  const traffar = useMemo(() => {
    const q = fraga.trim().toLowerCase();
    if (!q) return rader;
    return rader.filter(
      (r) => r.namn.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q),
    );
  }, [rader, fraga]);

  /**
   * VECKET — den defekt som fällde variant B, återinförd i annan form.
   *
   * MÄTT I EGET SKOTT (v0, 390x844, granskningsfixturen `reckgn7arcyW367qT`):
   * med noll incheckade låg första ÅTGÄRDBARA raden på 427 px. Efter fem
   * incheckningar låg den på 752 px med underkant 817 px, medan tabbaren
   * börjar på 768 px: raden var KLIPPT, 16 av sina 65 px synliga. Ju längre
   * kvällen gick, desto längre skrollade Lotta förbi färdiga rader.
   *
   * ORSAKEN VAR INTE DEN ANTAGNA. Uppdraget bokförde "incheckade sorteras
   * överst"; det gör de inte. `byggRaderD` sorterar rent alfabetiskt
   * (`namn.localeCompare`, en rad ovan) och ingenting flyttar sig alls.
   * Just DÄRFÖR uppstår defekten: Lotta arbetar uppifrån och ned, de klara
   * raderna ligger kvar exakt där de var, och nästa åtgärdbara rad vandrar
   * en radhöjd (65 px) nedåt per incheckning tills den passerar vecket.
   * En sortering hade åtminstone varit en mekanism; här fanns ingen.
   *
   * LÖSNINGEN: arbetslistan innehåller BARA det som återstår. Det klara
   * flyttas till en kollapsad grupp längst ned, utanför skrollvägen till
   * nästa människa. Följden är att första åtgärdbara raden inte längre är
   * en funktion av hur långt kvällen gått - den står still.
   *
   * VALET MOT ALTERNATIVEN. "5 incheckade ⌄" ÖVERST (uppdragets
   * rekommendation) löser drivandet men kostar ~50 px permanent ovanför
   * varje människa, i den yta som redan var defektens halva orsak. "Inga
   * klara rader alls" river ångra-vägen för allt utom den senaste. Klara
   * LÄNGST NED kostar noll ovanför vecket och behåller full ångra-väg -
   * priset är en skrollning för ett sällsynt fall, vilket är rätt växling
   * vid en dörr där nästa person är det frekventa fallet.
   *
   * Sökningen filtrerar BÅDA grupperna: en felincheckad person ska gå att
   * söka fram och ångra utan att först fälla ut gruppen.
   */
  // Rader i kvittensfönstret räknas som KLARA i framstegskortet (siffran
  // ska svara direkt) men står kvar i ARBETSLISTAN tills fönstret löpt ut.
  const attGora = traffar.filter(
    (r) => lage.status(r) !== AttendanceStatus.NARVARANDE || nyssKlara.has(lageNyckel(r)),
  );
  const klaraTraffar = traffar.filter(
    (r) => lage.status(r) === AttendanceStatus.NARVARANDE && !nyssKlara.has(lageNyckel(r)),
  );

  /**
   * KVITTOT — en rad i framstegskortet, inte en panel.
   *
   * Den ersätter BÅDA "Senast incheckade"-panelerna (desktop-marginalen och
   * mobilens sektion i nederkanten). Skälet är mätt, inte principiellt: på
   * desktop (v0-efter5-desktop.png) visade panelen Elin, David och Cecilia -
   * exakt de tre rader som samtidigt syntes ~100 px till vänster, var och en
   * med sin egen Ångra. Den duplicerade sin granne. Värre: panelens knappar
   * var `emphasis="subtle"` (fylld platta) medan radens egen Ångra var
   * `ghost`, så den SEKUNDÄRA vägen tillbaka vägde tyngre än den primära.
   * Och den fanns bara över 1280 px, alltså minst sannolikt där Lotta står.
   *
   * Nu bär raden det panelen faktiskt tillförde ("hann jag rätt person?") på
   * en rad som alltid ligger ovanför vecket, i samma kort som räknaren.
   * Djupare ångra-behov bärs av den kollapsade gruppen längst ned.
   *
   * Historiken bär ANMÄLAN×SESSION-nycklar (`lageNyckel`), så kvittot visar
   * bara det som checkats in i den session man står i - byter Lotta dag
   * följer kvittot med. Samma dimension som datat, hela vägen.
   */
  const senasteNyckel = lage.historik[0] ?? null;
  const senaste = senasteNyckel
    ? (rader.find((r) => lageNyckel(r) === senasteNyckel) ?? null)
    : null;

  /**
   * SKRIVNINGEN — den enda vägen till basen, alltid via mutations-hooken
   * (adapter-gränsen respekteras; ingen fetch, ingen operationKey här).
   *
   * `tidigare` är tillståndet FÖRE flippen och bärs in som rollback-värde:
   * mutationen startar först när kvittensfönstret löpt ut, så det finns inget
   * `onMutate`-ögonblick att ta snapshotten i.
   */
  const skriv = (rad: DorradD, status: AttendanceStatusValue, tidigare: AttendanceStatusValue) => {
    skrivning.mutate(
      {
        deltagandeId: lage.skrivNyckel(rad),
        anmalanId: rad.anmalanId,
        session: rad.session,
        status,
      },
      {
        onSuccess: ({ deltagandeId }) => {
          if (deltagandeId != null) lage.kommIhagId(rad, deltagandeId);
        },
        onError: () => {
          // ALDRIG TYST FÖRLUST: raden återgår till sitt tidigare läge (en
          // misslyckad incheckning hamnar alltså tillbaka i arbetslistan) och
          // felet syns — både visuellt och för skärmläsaren.
          lage.aterstall(rad, tidigare);
          setMisslyckade((forra) => new Map(forra).set(lageNyckel(rad), rad.namn));
          alertScreenReader(
            `${rad.namn} kunde inte sparas i basen. Personen står kvar i listan. Försök igen.`,
          );
        },
      },
    );
  };

  const vaxla = (rad: DorradD) => {
    const nyckel = lageNyckel(rad);
    const tidigare = lage.status(rad);
    const varInne = tidigare === AttendanceStatus.NARVARANDE;
    const nyStatus = varInne ? AttendanceStatus.EJ_AVSTAMT : AttendanceStatus.NARVARANDE;

    // Ett nytt försök rensar radens gamla fel — felytan ska spegla nuläget,
    // aldrig ett kvarhängande påstående om en rad som redan är åtgärdad.
    setMisslyckade((forra) => {
      if (!forra.has(nyckel)) return forra;
      const nasta = new Map(forra);
      nasta.delete(nyckel);
      return nasta;
    });

    lage.satt(rad, nyStatus);
    if (varInne) {
      const timer = kvittensTimers.current.get(nyckel);
      if (timer != null) {
        // ÅNGRA INOM KVITTENSFÖNSTRET: timern rivs innan den hunnit skriva, så
        // NOLL anrop går till basen. Ett feltryck lämnar inget spår alls —
        // det är hela skälet till att fönstret finns (S103 Del 15 F2).
        window.clearTimeout(timer);
        kvittensTimers.current.delete(nyckel);
      } else {
        // ÅNGRA EFTER FÖNSTRET (urbockning i klargruppen): raden är redan
        // skriven till basen, så vägen tillbaka är en vanlig statusskrivning.
        skriv(rad, nyStatus, tidigare);
      }
      setNyssKlara((forra) => {
        if (!forra.has(nyckel)) return forra;
        const nasta = new Set(forra);
        nasta.delete(nyckel);
        return nasta;
      });
    } else {
      setNyssKlara((forra) => new Set(forra).add(nyckel));
      kvittensTimers.current.set(
        nyckel,
        window.setTimeout(() => {
          kvittensTimers.current.delete(nyckel);
          setNyssKlara((forra) => {
            const nasta = new Set(forra);
            nasta.delete(nyckel);
            return nasta;
          });
          // SKRIV-ÖGONBLICKET: exakt när fönstret löpt ut, aldrig vid trycket.
          skriv(rad, nyStatus, tidigare);
        }, 1200),
      );
    }
    alertScreenReader(
      varInne
        ? `Incheckningen av ${rad.namn} är ångrad.`
        : `${rad.namn} är incheckad. ${antalKlara + 1} av ${rader.length} incheckade.`,
    );
  };

  return (
    // LUFTEN ÄR DIFFERENTIERAD, inte likformig (varv 2, S105). D bar `gap-3`
    // mellan ALLA sju topp-block, vilket gör att ingenting grupperar sig och
    // allt väger lika: rubrik, kort, sessionsval, sök och meta-rad lästes som
    // en enda hög. Personlistans facit har tre nivåer med tydligt olika luft
    // (rubrik → stort → sök → litet → meta → lista). Basen är därför `gap-2`
    // med `mt-1` bara där ett nytt stycke faktiskt börjar.
    //
    // data-testid="dorrlista-yta" (TASK-214.3): promoverings-grindens ankare,
    // samma minimala form som `personer-yta`/`aktivitetshistorik-yta` — ett
    // attribut, ingen ny DOM-nod, flippar ingen form.
    <section data-testid="dorrlista-yta" className="flex flex-col gap-2 pt-2 lg:pt-10">
      {/* SIDKROMEN ÄR HUSETS (S103-konvergensvarvet, Marcus punkt 1+2):
          44 px rund chevron + rubrik i text-3xl på EXAKT samma plats som
          EventDetail/PersonDetail (`sidRam`-formen, EventDetail.tsx:142-150).
          Prototypens textlänk och text-2xl var en avvikelse från appens
          grund. A/B/C:s egen `TillbakaLank` (textlänken) är riven med dem
          (TASK-214.4) — denna länk är D:s enda kvarvarande. */}
      {sidramNy ? (
        <SidRam to="/event/$eventId" params={{ eventId }} tillbakaEtikett="Tillbaka till eventet" />
      ) : (
        <Link
          to="/event/$eventId"
          params={{ eventId }}
          aria-label="Tillbaka till eventet"
          className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      )}

      {/* EVENTETS IDENTITET (punkt 3): body-grad med namnet i medium-vikt i
          stället för small/sekundär - det är sidans enda kontextbärare och
          ska kunna läsas på ett ögonkast vid dörren. Datumet förblir dämpat
          på samma rad (varv 2-beslutet står). */}
      <div className="mx-4 mt-4 flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Check-in</h1>
        <p className="text-body">
          <span className="font-medium">{event.eventNamn ?? event.eventlabel ?? 'Eventet'}</span>
          {datumtext && <span className="text-text-muted">{` · ${datumtext}`}</span>}
        </p>
      </div>

      <FramstegskortD
        klara={antalKlara}
        totalt={rader.length}
        klass="mt-1"
        kvitto={
          senaste && (
            <>
              <Check aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
              <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">
                <span className="font-medium text-text">{senaste.namn}</span>
                {(() => {
                  const t = lage.tid(senaste);
                  return t ? ` incheckad ${t}` : ' incheckad';
                })()}
              </span>
              {/* `min-h-11` OCH `size="sm"`: `sm` ensamt ger `min-h-8` = 32 px,
                  mätt i eget skott (a11y-passet) och under WCAG 2.5.5-golvet.
                  Tillgänglighet är alltid 11 i det här huset - kontrollen får
                  bära åtta pixel mer kort­höjd. */}
              <Button
                intent="ghost"
                size="sm"
                className="min-h-11 shrink-0"
                aria-label={`Ångra incheckningen av ${senaste.namn}`}
                onPress={() => vaxla(senaste)}
              >
                <RotateCcw aria-hidden="true" size={14} className="shrink-0" />
                Ångra
              </Button>
            </>
          )
        }
      />

      <SessionsRadD sessioner={sessioner} vald={session} onValj={setSession} />

      {/* Sökfältets form är personlistans (steg k08) — samma input-tokens,
          samma clear-knapp, ingen autofokus. */}
      <SearchField
        aria-label="Sök bland de anmälda"
        value={fraga}
        onChange={setFraga}
        className="group flex flex-col"
      >
        <div className="relative">
          <AriaInput
            placeholder="Sök på namn eller e-post"
            className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) mm-fokusring-vid-fokus min-h-11 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
          />
          <AriaButton
            aria-label="Rensa sökningen"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
          >
            <X aria-hidden="true" size={16} className="shrink-0" />
          </AriaButton>
        </div>
      </SearchField>

      {/* Meta-raden (S103-konvergensvarvet, Marcus punkt 7): "N av M
          återstår"-räknaren är RIVEN - den upprepade framstegskortets
          rubrik. Kvar är det raden ensam bär: sökutfallet och det explicita
          bortfallet (avbokade visas aldrig tyst borttagna). Ingen träff-
          textrad utan sökning = ingen rad alls. */}
      {(fraga || avbokade > 0) && (
        <p role="status" aria-live="polite" className="px-4 text-small text-text-muted">
          {[
            fraga ? `Visar ${traffar.length} av ${rader.length} anmälda för "${fraga}".` : null,
            avbokade > 0 ? `${avbokade} avbokade visas inte.` : null,
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
      )}

      {/* SKRIVFELET (TASK-214.2, AC #4) — står direkt ovanför arbetslistan,
          där raden hamnat tillbaka. `MessageBox intent="error"` renderar
          `role="alert"`, så felet annonseras assertivt; texten namnger
          personerna och säger var de finns, aldrig bara "något gick fel".
          Ytan finns BARA i felläget och rör därför inte den stämplade formen
          (facit.json § check-in (dörrlistan, variant D)). */}
      {misslyckade.size > 0 && (
        <MessageBox intent="error" title="Incheckningen kunde inte sparas">
          {`${[...misslyckade.values()].join(', ')} står kvar i listan att checka in. Kontrollera uppkopplingen och tryck igen.`}
        </MessageBox>
      )}

      {/* ARBETSLISTAN — bara det som återstår (se VECKET ovan). */}
      {attGora.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1 py-12 text-center"
        >
          <p className="font-medium text-body">
            {fraga
              ? 'Ingen kvar att checka in bland träffarna'
              : `Alla ${rader.length} är incheckade`}
          </p>
          <p className="text-small text-text-muted">
            {fraga
              ? `Ingen anmäld som matchar "${fraga}" väntar på incheckning.`
              : 'Ingen väntar på incheckning.'}
          </p>
        </div>
      ) : (
        <ul
          aria-label="Anmälda att checka in"
          className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
        >
          {attGora.map((rad) => (
            <DorrRadD
              key={rad.anmalanId}
              rad={rad}
              incheckad={lage.status(rad) === AttendanceStatus.NARVARANDE}
              tid={lage.tid(rad)}
              onToggle={() => vaxla(rad)}
            />
          ))}
        </ul>
      )}

      {/* DE KLARA — kollapsade längst ned, utanför skrollvägen till nästa
          människa. `aria-expanded` + ett stabilt `id` på listan gör
          fällningen läsbar för skärmläsare; knappen bär hela träffytan
          (`min-h-11`). Ingen `<details>`: den bär eget öppna/stäng-beteende
          som inte går att styra från tillståndet, och husets egna fällbara
          ytor är knapp + villkorad rendering. */}
      {klaraTraffar.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button
            data-klargrupp
            intent="ghost"
            size="sm"
            className="min-h-11 self-start"
            aria-expanded={visaKlara}
            aria-controls="checkin-klara-lista"
            onPress={() => setVisaKlara((v) => !v)}
          >
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={`shrink-0 motion-safe:transition-transform ${visaKlara ? 'rotate-180' : ''}`}
            />
            {`${klaraTraffar.length} incheckade`}
          </Button>
          {visaKlara && (
            <ul
              id="checkin-klara-lista"
              aria-label="Incheckade"
              className="divide-y divide-border overflow-hidden rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
            >
              {klaraTraffar.map((rad) => (
                <DorrRadD
                  key={rad.anmalanId}
                  rad={rad}
                  incheckad={true}
                  tid={lage.tid(rad)}
                  onToggle={() => vaxla(rad)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* DATA-FÖRBEHÅLLET står EFTER listan, inte före: det är ett faktum om
          basen som den skarpa skivan måste lösa, inte något Lotta handlar på
          vid dörren. Före listan kostade det topp-utrymme som första raden
          behövde bättre (se sessionsnoten ovan). Tyst får det aldrig vara. */}
      {utanDeltagande > 0 && (
        <p className="px-4 text-caption text-text-muted">
          {`${utanDeltagande} av ${rader.length} saknar deltaganderad för ${session} i basen. Dörren visar dem ändå: den skarpa skivan måste skapa raden vid incheckning, inte dölja personen.`}
        </p>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SESSIONSVALET — härledd default, alltid synlig, alltid överstyrbar
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Härleder dörrens session ur eventets datum. Basen har INGET fält som binder
 * `Session` till ett datum (sessionsstrukturen bor på `Eventformat.Format` och
 * finns inte i app-shapen) — heuristiken är därför: en session ⇒ den; annars
 * Dag 2 om dagens datum är eventets slutdatum, i övrigt Dag 1. Gissningen
 * visas ALLTID för Lotta och kan alltid styras om.
 */
function useSessionsval(event: Event, rader: Dorrad[]) {
  const sessioner = useMemo(
    () => SESSION_ORDNING.filter((s) => rader.some((r) => r.session === s)),
    [rader],
  );

  const harledd: AttendanceSessionValue = useMemo(() => {
    if (sessioner.length === 0) return AttendanceSession.DAG_1;
    if (sessioner.length === 1) return sessioner[0];
    const idag = new Date();
    idag.setHours(0, 0, 0, 0);
    const slut = event.slutdatum ? new Date(event.slutdatum) : null;
    if (slut && !Number.isNaN(slut.getTime())) {
      slut.setHours(0, 0, 0, 0);
      if (idag.getTime() === slut.getTime() && sessioner.includes(AttendanceSession.DAG_2)) {
        return AttendanceSession.DAG_2;
      }
    }
    return sessioner[0];
  }, [sessioner, event.slutdatum]);

  const [vald, setVald] = useState<AttendanceSessionValue | null>(null);
  const session = vald ?? harledd;

  /** Datumtexten för den valda sessionen — Dag 1 = start, Dag 2 = slut. */
  const datumtext = useMemo(() => {
    const iso =
      session === AttendanceSession.DAG_2 ? (event.slutdatum ?? null) : (event.startdatum ?? null);
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : DATUM_LANG.format(d);
  }, [session, event.startdatum, event.slutdatum]);

  return { sessioner, session, setSession: setVald, datumtext };
}

// ═══════════════════════════════════════════════════════════════════════════
//  KOMPONENTEN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dörrlistans yta. Laddar samma data som den gamla skarpa vyn (adapter-
 * gränsen respekteras — ingen egen adapter, ingen kringgången DI).
 *
 * `variant`-PROPEN ÄR BORTA (TASK-214.4, ADR-103 B2 steg 1). Den blev
 * bevisligen död när A/B/C revs — kompilatorn fällde den som oläst, samma
 * fynd som persondetalj-precedenten (`dc0eb4ec`) gjorde. D är den enda
 * formen som finns kvar; en prop vars enda möjliga värde är `'d'` bär ingen
 * information.
 */
export function EventCheckin({ eventId }: { eventId: string }) {
  const { event, rader, isPending, isError } = useDorrData(eventId);

  // Rulla alltid till toppen vid montering så jämförelsen sker från samma
  // utgångsläge (prototyp-ergonomi, kvar som produktbeteende).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (isPending) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-3 p-1">
        <span className="sr-only">Laddar check-in…</span>
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="listRow" className="h-16 rounded-xl" />
        <Skeleton variant="listRow" className="h-16 rounded-xl" />
        <Skeleton variant="listRow" className="h-16 rounded-xl" />
      </div>
    );
  }

  if (isError || event == null) {
    return (
      <MessageBox intent="error" title="Kunde inte hämta underlaget">
        Eventet, närvaron eller anmälningarna kunde inte hämtas.
      </MessageBox>
    );
  }

  return <VariantD eventId={eventId} event={event} rader={rader} />;
}
