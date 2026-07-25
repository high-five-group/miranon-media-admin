/**
 * [PROTOTYPE] Check-in vid dörren — DIVERGENS-passet (S90, Marcus-beordrad
 * 2026-07-26). Kastbar kod per throwaway-kontraktet; absorberas ALDRIG.
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
 *
 * READ-ONLY (kontraktets miljöregel + prototyp-skillens förstärkning):
 * INGEN mutation kopplas in. Statusändringar lever i minnet (`useDorrLage`)
 * och försvinner vid omladdning. Ingen operationKey registreras, varken mot
 * staging eller prod — närvaro-WRITE finns inte i `field-allowlists.ts`
 * (noll av 13 operationer rör `Deltaganden`) och ska inte finnas förrän
 * skivan byggs skarpt.
 *
 * DATAT (underlaget från förarbetet):
 *   · `get-attendance` bär write-nyckeln (Deltaganden-record-ID) + sessionen
 *     men saknar e-post och vet inte om anmälan är AVBOKAD.
 *   · `get-registrations` bär e-post/medföljande/bor över/avbokad men har
 *     ingen väg till Deltaganden-raden.
 *   ⇒ prototypen JOINAR klientside på `Deltagande.anmalanId → Registration.id`.
 *     Båda anropen cachas redan under befintliga query-nycklar.
 *
 * SESSIONS-DIMENSIONEN (den skarpaste öppna designfrågan): Deltaganden är
 * EN rad per Anmälan × Session — en dörr-lista som inte är sessions-scopad
 * visar varje person två gånger på ett tvådagars-event. Varianterna svarar
 * olika: A visar sessionerna som KOLUMNER (ingen scoping behövs), B och C
 * HÄRLEDER en default ur eventets datum, visar den ALLTID explicit och gör
 * den överstyrbar. Basen har inget fält som binder Session till datum —
 * härledningen är en kvalificerad gissning och får därför aldrig vara tyst.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BedDouble, Check, CheckCheck, Circle, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Checkbox,
  SearchField,
} from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Select, SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName } from '@/components/registrations/registration-display';
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

export type CheckinProtoVariant = 'a' | 'b' | 'c';

/** Sessionernas visnings-ordning — single source, aldrig hårdkodade strängar. */
const SESSION_ORDNING = [
  AttendanceSession.DAG_1,
  AttendanceSession.DAG_2,
  AttendanceSession.FORELASNING,
] as const;

/** Registrets sex statusvärden (basens singleSelect, live-verifierad S90). */
const ALLA_STATUSAR = [
  AttendanceStatus.EJ_AVSTAMT,
  AttendanceStatus.NARVARANDE,
  AttendanceStatus.FRANVARANDE,
  AttendanceStatus.FORSENAD,
  AttendanceStatus.AVBROT,
  AttendanceStatus.DELTOG_ONLINE,
] as const;

const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });
const DATUM_LANG = new Intl.DateTimeFormat('sv-SE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// ═══════════════════════════════════════════════════════════════════════════
//  DATA — läsning + klient-join (identisk i alla tre varianterna)
// ═══════════════════════════════════════════════════════════════════════════

/** En dörr-rad: ETT deltagande (Anmälan × Session) berikat ur anmälan. */
type Dorrad = {
  /** Deltaganden-record-ID — write-nyckeln en skarp skiva skulle PATCH:a. */
  id: string;
  namn: string;
  email: string | null;
  session: AttendanceSessionValue;
  /** Status som den står i basen (prototypens överlagring bor i useDorrLage). */
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

/**
 * DÖRRENS TILLSTÅND — enbart i minnet (read-only-regeln).
 *
 * `overlag` är prototypens motsvarighet till en optimistisk write: raden
 * växlar omedelbart, ingen väntan på basen. En skarp skiva skulle här ha en
 * `useMutation` med `onMutate`/rollback — latensbudgeten vid dörren är
 * sub-sekund (Cvent), och `get-attendance` gör i dag ~150 sekventiella
 * Airtable-anrop för MK-eventets 218 rader. Dörren kan aldrig vänta på basen.
 */
function useDorrLage() {
  const [overlag, setOverlag] = useState<ReadonlyMap<string, AttendanceStatusValue>>(new Map());
  const [tider, setTider] = useState<ReadonlyMap<string, number>>(new Map());
  /** Senast först — kvittot och (i variant c) enda ångra-vägen. */
  const [historik, setHistorik] = useState<readonly string[]>([]);

  const satt = (rad: Dorrad, status: AttendanceStatusValue) => {
    // [PROTOTYPE] STUB — här skulle den skarpa mutationen ligga. Ingen
    // operationKey finns mot Deltaganden och ingen ska registreras här.
    setOverlag((nu) => new Map(nu).set(rad.id, status));
    setTider((nu) => new Map(nu).set(rad.id, Date.now()));
    setHistorik((nu) => {
      const utan = nu.filter((id) => id !== rad.id);
      return status === AttendanceStatus.NARVARANDE ? [rad.id, ...utan] : utan;
    });
  };

  const status = (rad: Dorrad): AttendanceStatusValue => overlag.get(rad.id) ?? rad.basStatus;
  const tid = (rad: Dorrad): string | null => {
    const lokal = tider.get(rad.id);
    if (lokal != null) return KLOCKSLAG.format(new Date(lokal));
    if (rad.avstamt == null) return null;
    const d = new Date(rad.avstamt);
    return Number.isNaN(d.getTime()) ? null : KLOCKSLAG.format(d);
  };

  return { satt, status, tid, historik };
}

// ═══════════════════════════════════════════════════════════════════════════
//  DELADE BYGGSTENAR (task-48:s byggstenar generaliserar; grammatiken inte)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Räknaren "X av Y incheckade" med BREDDLÅS — osynlig platshållare i
 * tvåsiffrig maxform + `tabular-nums` i samma grid-cell, så siffran aldrig
 * flyttar sig vid varje incheckning (task-48:s teknik, generell).
 */
function Raknare({ klara, totalt, stor }: { klara: number; totalt: number; stor?: boolean }) {
  return (
    <span className={`grid ${stor ? 'font-semibold text-xl' : 'text-small'}`}>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
        99 av 99 incheckade
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
        {`${klara} av ${totalt} incheckade`}
      </span>
    </span>
  );
}

/** Framstegs-stapeln — ren dekor (räknaren ovan bär sanningen). */
function Framsteg({ klara, totalt }: { klara: number; totalt: number }) {
  const andel = totalt === 0 ? 0 : Math.round((100 * klara) / totalt);
  return (
    <span aria-hidden="true" className="block h-1.5 w-full rounded-full bg-bg-muted">
      <span
        className="block h-1.5 rounded-full bg-success motion-safe:transition-[width]"
        style={{ width: `${andel}%` }}
      />
    </span>
  );
}

/** Sidhuvudets tillbaka-länk — samma form som den skarpa närvaro-vyn. */
function TillbakaLank({ eventId }: { eventId: string }) {
  return (
    <Link to="/event/$eventId" params={{ eventId }} className="text-small underline">
      ← Tillbaka till eventet
    </Link>
  );
}

/**
 * SESSIONSVÄLJAREN (variant b + c). Sessionen visas ALLTID explicit; med
 * flera sessioner är den överstyrbar. Att härleda tyst vore en tyst
 * felkälla — `Närvaropoäng` räknar Dag 1 och Föreläsning mot kurshistoriken
 * men INTE Dag 2, så fel session ger fel historik utan att någon ser det.
 */
function SessionsRad({
  sessioner,
  vald,
  onValj,
  datumtext,
}: {
  sessioner: readonly AttendanceSessionValue[];
  vald: AttendanceSessionValue;
  onValj: (s: AttendanceSessionValue) => void;
  datumtext: string | null;
}) {
  if (sessioner.length <= 1) {
    return (
      <p className="text-small text-text-secondary">
        {`Checkar in: ${vald}`}
        {datumtext && <span className="text-text-muted">{` · ${datumtext}`}</span>}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-small text-text-secondary">Checkar in</span>
        {datumtext && <span className="text-caption text-text-muted">{datumtext}</span>}
      </div>
      <ToggleButtonGroup
        label="Vilken session checkar du in?"
        spread
        selectedKey={vald}
        onSelectionChange={(key: AttendanceSessionValue) => onValj(key)}
      >
        {sessioner.map((s) => (
          <ToggleButton key={s} id={s} size="sm">
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

/**
 * DÖRR-RADEN (variant b + c) — hela raden ÄR kontrollen.
 *
 * `aria-pressed`-toggle, INTE `aria-selected`: dörr-handlingen är en
 * tillståndsändring i datat, inte ett urval (research §g). Inga inbäddade
 * länkar eller knappar — L303 (interaktivt bor aldrig i interaktivt) hålls
 * genom att raden är ETT element. Kanten finns i BÅDA lägena så geometrin
 * aldrig hoppar; incheckad bärs av glyf + TEXT, aldrig av grönt ensamt
 * (WCAG 1.4.1).
 */
function DorrRad({
  rad,
  incheckad,
  tid,
  luftig,
  onToggle,
}: {
  rad: Dorrad;
  incheckad: boolean;
  tid: string | null;
  /** Variant c: större träffyta (sök-först, en tumme, under tidspress). */
  luftig?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={incheckad}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 text-left motion-safe:transition-colors ${
        luftig ? 'min-h-16 py-3' : 'min-h-14 py-2.5'
      } ${
        incheckad
          ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
          : 'border-(--mm-navcard-border) bg-surface hover:bg-bg-subtle contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          incheckad ? 'bg-success text-text-inverse' : 'border border-border-strong text-text-muted'
        }`}
      >
        {incheckad ? <CheckCheck size={18} /> : <Circle size={12} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-body">{rad.namn}</span>
          {rad.borOver && <BedDouble aria-hidden="true" size={13} className="shrink-0" />}
          {rad.medfoljande && (
            <span className="shrink-0 rounded-full bg-bg-muted px-1.5 py-0.5 text-caption text-text-secondary">
              +1
            </span>
          )}
        </span>
        <span className="truncate text-caption text-text-muted">
          {incheckad
            ? `Incheckad${tid ? ` ${tid}` : ''} · tryck för att ångra`
            : (rad.email ?? 'E-post saknas')}
        </span>
      </span>
      {!incheckad && (
        <span className="shrink-0 font-medium text-small text-text-secondary">Checka in</span>
      )}
    </button>
  );
}

/**
 * "SENAST INCHECKADE" — kvarstående kvitto OCH ångra-väg (Luma Express).
 * ALDRIG en toast: appen har inget toast-lager (T96), och branschens tre
 * ångra-former är alla kvarstående (posten, historiken, omvänt läge).
 */
function SenastListan({
  poster,
  onAngra,
  kompakt,
}: {
  poster: readonly { rad: Dorrad; tid: string | null }[];
  onAngra: (rad: Dorrad) => void;
  /** Variant c: sticky panel i tumzonen; variant b: sektion i nederkanten. */
  kompakt?: boolean;
}) {
  if (poster.length === 0) return null;
  return (
    <section
      aria-label="Senast incheckade"
      className={`flex flex-col gap-1.5 rounded-xl border border-border p-3 ${
        kompakt ? 'bg-surface shadow-lg' : 'bg-bg-subtle'
      }`}
    >
      <h2 className="font-semibold text-caption text-text-secondary uppercase tracking-wide">
        Senast incheckade
      </h2>
      <ul className="flex flex-col gap-1">
        {poster.map(({ rad, tid }) => (
          <li key={rad.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-small">
              {rad.namn}
              {tid && <span className="text-text-muted">{` ${tid}`}</span>}
            </span>
            <Button
              intent="ghost"
              size="sm"
              aria-label={`Ångra incheckningen av ${rad.namn}`}
              onPress={() => onAngra(rad)}
            >
              <RotateCcw aria-hidden="true" size={14} className="shrink-0" />
              Ångra
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Avbokade-noten — joinens synliga värde (utan den vore de incheckningsbara). */
function AvbokadeNot({ antal }: { antal: number }) {
  if (antal === 0) return null;
  return (
    <p className="text-caption text-text-muted">
      {antal === 1
        ? '1 avbokad anmälan visas inte i listan.'
        : `${antal} avbokade anmälningar visas inte i listan.`}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT A — REGISTRET (efterhandsarbetet, inte dörren)
// ═══════════════════════════════════════════════════════════════════════════

/** Cell-status som kort läsbar text — registret är tätt, orden måste vara korta. */
function statusKort(status: AttendanceStatusValue): string {
  return status === AttendanceStatus.EJ_AVSTAMT ? 'Ej avstämt' : status;
}

/**
 * VARIANT A — närvaroREGISTRET. Rader = personer, kolumner = sessioner,
 * cell = statusväljare med ALLA SEX värdena (Blackboards fyra viktade
 * tillstånd är strukturellt samma sak). Massmarkeringen bor här och
 * ingen annanstans; task-48:s markera-läge är det som faktiskt
 * generaliserar hit — MOJ:s villkor ("EN åtgärd på 2+ objekt i en TABELL")
 * beskriver registret exakt och dörren inte alls.
 */
function VariantA({ eventId, event, rader }: { eventId: string; event: Event; rader: Dorrad[] }) {
  const lage = useDorrLage();
  const [markering, setMarkering] = useState<ReadonlySet<string> | null>(null);
  const [batchStatus, setBatchStatus] = useState<AttendanceStatusValue>(
    AttendanceStatus.NARVARANDE,
  );

  const sessioner = useMemo(
    () => SESSION_ORDNING.filter((s) => rader.some((r) => r.session === s)),
    [rader],
  );

  /** Personrader: en rad per person, en cell per session. */
  const personer = useMemo(() => {
    const per = new Map<string, { namn: string; avbokad: boolean; celler: Map<string, Dorrad> }>();
    for (const r of rader) {
      let post = per.get(r.namn);
      if (!post) {
        post = { namn: r.namn, avbokad: r.avbokad, celler: new Map() };
        per.set(r.namn, post);
      }
      post.celler.set(r.session, r);
    }
    return [...per.values()];
  }, [rader]);

  const narvarande = rader.filter(
    (r) =>
      lage.status(r) === AttendanceStatus.NARVARANDE ||
      lage.status(r) === AttendanceStatus.DELTOG_ONLINE,
  ).length;
  const incheckade = rader.filter((r) => lage.status(r) === AttendanceStatus.NARVARANDE).length;
  const procent = rader.length === 0 ? 0 : Math.round((100 * narvarande) / rader.length);

  const markeringAktiv = markering != null;
  const antalMarkerade = markering?.size ?? 0;

  const vaxlaMarkering = (namn: string, vald: boolean) =>
    setMarkering((nu) => {
      const next = new Set(nu ?? []);
      if (vald) next.add(namn);
      else next.delete(namn);
      return next;
    });

  const sattAllaISession = (session: AttendanceSessionValue) => {
    for (const r of rader) {
      if (r.session === session && !r.avbokad) lage.satt(r, AttendanceStatus.NARVARANDE);
    }
  };

  const sattMarkerade = () => {
    if (markering == null) return;
    for (const r of rader) {
      if (markering.has(r.namn)) lage.satt(r, batchStatus);
    }
    setMarkering(null);
  };

  return (
    <section className="flex flex-col gap-4">
      <TillbakaLank eventId={eventId} />
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Närvaroregister</h1>
        <p className="text-small text-text-secondary">
          {event.eventNamn ?? event.eventlabel ?? 'Eventet'} — efter eventet: markera alla
          närvarande och rätta sedan avvikelserna.
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-subtle px-4 py-3">
        <Raknare klara={incheckade} totalt={rader.length} />
        <span className="text-small text-text-secondary">
          Total närvaro <span className="font-semibold text-text tabular-nums">{procent} %</span>
        </span>
      </div>

      {/* Blackboards arbetsordning, steg 1: sätt hela kolumnen. Kontrollfrågan
          står kvar på massmutationen (task-48:s grind) — det är N poster i ett
          drag, inte en rutinhandling vid dörren. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-small text-text-secondary">Markera alla närvarande i</span>
        {sessioner.map((s) => (
          <DialogTrigger key={s}>
            <Button intent="primary" emphasis="subtle" size="sm">
              {s}
            </Button>
            <Modal isDismissable>
              <Dialog
                title="Markera alla närvarande?"
                actions={({ close }) => (
                  <>
                    <Button intent="ghost" onPress={close}>
                      Avbryt
                    </Button>
                    <Button
                      intent="primary"
                      onPress={() => {
                        sattAllaISession(s);
                        close();
                      }}
                    >
                      Markera alla
                    </Button>
                  </>
                )}
              >
                {`Alla ${rader.filter((r) => r.session === s && !r.avbokad).length} deltagare i ${s} får status Närvarande. Enskilda avvikelser rättar du därefter i tabellen.`}
              </Dialog>
            </Modal>
          </DialogTrigger>
        ))}
      </div>

      {/* Steg 2: markera-läget (task-48-grammatiken) för avvikelser i klump. */}
      <div className="flex flex-wrap items-center gap-2 border-border border-t pt-3">
        {markeringAktiv ? (
          <>
            <span className="w-full text-small text-text-secondary">
              Markera deltagare och sätt en gemensam status:
            </span>
            <Select
              label="Status att sätta"
              hideLabel
              size="sm"
              className="w-44"
              selectedKey={batchStatus}
              onSelectionChange={(key) => setBatchStatus(key as AttendanceStatusValue)}
            >
              {ALLA_STATUSAR.map((s) => (
                <SelectItem key={s} id={s}>
                  {statusKort(s)}
                </SelectItem>
              ))}
            </Select>
            <Button
              intent="primary"
              size="sm"
              isDisabled={antalMarkerade === 0}
              onPress={sattMarkerade}
            >
              <span className="grid">
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 whitespace-nowrap"
                >
                  Sätt för 99 deltagare
                </span>
                <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
                  {`Sätt för ${antalMarkerade} deltagare`}
                </span>
              </span>
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onPress={() => setMarkering(new Set(personer.map((p) => p.namn)))}
            >
              Markera alla
            </Button>
            <Button intent="ghost" size="sm" onPress={() => setMarkering(null)}>
              <X aria-hidden="true" size={14} className="shrink-0" />
              Avbryt
            </Button>
            <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {`${antalMarkerade} av ${personer.length} markerade`}
            </span>
          </>
        ) : (
          <Button
            intent="primary"
            emphasis="subtle"
            size="sm"
            onPress={() => setMarkering(new Set())}
          >
            Markera flera
          </Button>
        )}
      </div>

      {/* Registret som RUTNÄT: `table-fixed` ger sessionerna fast bredd och
          namnkolumnen resten — alla sessioner syns alltid (en bortrullad
          kolumn läses som en bugg). Priset är att långa namn kapas på 430 px:
          registrets ärliga mobilkostnad, och ett av argumenten för att det
          inte är dörrens form. */}
      <section aria-label="Närvaroregister">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              <th scope="col" className="pb-2 text-left font-medium text-caption text-text-muted">
                Deltagare
              </th>
              {sessioner.map((s) => (
                <th
                  key={s}
                  scope="col"
                  className="w-[9rem] pb-2 text-left font-medium text-caption text-text-muted"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {personer.map((p) => (
              <tr key={p.namn}>
                <th scope="row" className="py-2 pr-3 text-left font-normal text-small">
                  <span className="flex items-center gap-2">
                    {markeringAktiv && (
                      <Checkbox
                        aria-label={`Markera ${p.namn}`}
                        isSelected={markering?.has(p.namn) ?? false}
                        onChange={(v) => vaxlaMarkering(p.namn, v)}
                        className="group flex shrink-0 cursor-pointer items-center"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
                          <Check
                            aria-hidden="true"
                            size={14}
                            className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
                          />
                        </span>
                      </Checkbox>
                    )}
                    <span className="min-w-0 truncate" title={p.namn}>
                      {p.namn}
                    </span>
                    {p.avbokad && (
                      <span className="shrink-0 rounded-full bg-(--mm-error-bg) px-1.5 py-0.5 text-caption text-error">
                        Avbokad
                      </span>
                    )}
                  </span>
                </th>
                {sessioner.map((s) => {
                  const cell = p.celler.get(s);
                  return (
                    <td key={s} className="py-2 pr-2">
                      {cell ? (
                        <Select
                          label={`Status för ${p.namn}, ${s}`}
                          hideLabel
                          size="sm"
                          selectedKey={lage.status(cell)}
                          onSelectionChange={(key) => lage.satt(cell, key as AttendanceStatusValue)}
                        >
                          {ALLA_STATUSAR.map((st) => (
                            <SelectItem key={st} id={st}>
                              {statusKort(st)}
                            </SelectItem>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-caption text-text-muted">
                          –<span className="sr-only">Ingen session</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT B — LISTA-FÖRST (dörren som lista man bläddrar i)
// ═══════════════════════════════════════════════════════════════════════════

function VariantB({ eventId, event, rader }: { eventId: string; event: Event; rader: Dorrad[] }) {
  const lage = useDorrLage();
  const { sessioner, session, setSession, datumtext } = useSessionsval(event, rader);
  const [sok, setSok] = useState('');

  const iSession = useMemo(() => rader.filter((r) => r.session === session), [rader, session]);
  const oppna = useMemo(() => iSession.filter((r) => !r.avbokad), [iSession]);
  const avbokade = iSession.length - oppna.length;

  const traffar = useMemo(() => {
    const q = sok.trim().toLowerCase();
    if (q === '') return oppna;
    return oppna.filter(
      (r) => r.namn.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q),
    );
  }, [oppna, sok]);

  const incheckade = oppna.filter((r) => lage.status(r) === AttendanceStatus.NARVARANDE).length;

  const senaste = lage.historik
    .map((id) => oppna.find((r) => r.id === id))
    .filter((r): r is Dorrad => r != null)
    .slice(0, 5)
    .map((rad) => ({ rad, tid: lage.tid(rad) }));

  const vaxla = (rad: Dorrad) =>
    lage.satt(
      rad,
      lage.status(rad) === AttendanceStatus.NARVARANDE
        ? AttendanceStatus.EJ_AVSTAMT
        : AttendanceStatus.NARVARANDE,
    );

  return (
    <section className="flex flex-col gap-4">
      <TillbakaLank eventId={eventId} />
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Check-in</h1>
        <p className="text-small text-text-secondary">
          {event.eventNamn ?? event.eventlabel ?? 'Eventet'}
        </p>
      </header>

      <SessionsRad sessioner={sessioner} vald={session} onValj={setSession} datumtext={datumtext} />

      {/* Räknaren är listans NAVIGATIONS-instrument: den säger hur långt man
          kommit i en lista man bläddrar igenom. Därav framstegs-stapeln. */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-subtle px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <Raknare klara={incheckade} totalt={oppna.length} stor />
          <span className="text-caption text-text-muted">{`${oppna.length - incheckade} kvar`}</span>
        </div>
        <Framsteg klara={incheckade} totalt={oppna.length} />
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {`${incheckade} av ${oppna.length} incheckade`}
        </span>
      </div>

      {/* SEKUNDÄRT sökfält: nåbart, men inte startpunkten (ingen autofokus,
          kompakt form, under räknaren i stället för överst). */}
      <SearchField
        aria-label="Sök deltagare i listan"
        value={sok}
        onChange={setSok}
        className="flex w-full items-center gap-2 rounded-lg border border-(--mm-input-border) bg-(--mm-input-bg) px-3"
      >
        <Search aria-hidden="true" size={16} className="shrink-0 text-text-muted" />
        <AriaInput
          placeholder="Sök i listan"
          className="placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full bg-transparent text-small outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {sok !== '' && (
          <AriaButton className="shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-muted">
            <X aria-hidden="true" size={16} />
          </AriaButton>
        )}
      </SearchField>

      <AvbokadeNot antal={avbokade} />

      <ul className="flex flex-col gap-2">
        {traffar.map((rad) => (
          <li key={rad.id}>
            <DorrRad
              rad={rad}
              incheckad={lage.status(rad) === AttendanceStatus.NARVARANDE}
              tid={lage.tid(rad)}
              onToggle={() => vaxla(rad)}
            />
          </li>
        ))}
      </ul>
      {traffar.length === 0 && (
        <p className="py-4 text-center text-small text-text-secondary">
          {`Ingen deltagare matchar "${sok}".`}
        </p>
      )}

      {/* Kvittot i nederkanten. I b är ångra-vägen PRIMÄRT posten själv
          (raden står kvar i listan och tryck-igen ångrar) — listan här är
          bekräftelsen på att arbetet blev gjort. */}
      <SenastListan
        poster={senaste}
        onAngra={(rad) => lage.satt(rad, AttendanceStatus.EJ_AVSTAMT)}
      />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VARIANT C — SÖK-FÖRST (dörren som sökruta)
// ═══════════════════════════════════════════════════════════════════════════

function VariantC({ eventId, event, rader }: { eventId: string; event: Event; rader: Dorrad[] }) {
  const lage = useDorrLage();
  const { sessioner, session, setSession, datumtext } = useSessionsval(event, rader);
  const [sok, setSok] = useState('');
  const sokRef = useRef<HTMLInputElement>(null);

  const iSession = useMemo(() => rader.filter((r) => r.session === session), [rader, session]);
  const oppna = useMemo(() => iSession.filter((r) => !r.avbokad), [iSession]);
  const avbokade = iSession.length - oppna.length;

  const q = sok.trim().toLowerCase();
  const traffar = useMemo(
    () =>
      q === ''
        ? oppna
        : oppna.filter(
            (r) => r.namn.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q),
          ),
    [oppna, q],
  );

  const incheckade = oppna.filter((r) => lage.status(r) === AttendanceStatus.NARVARANDE).length;

  const senaste = lage.historik
    .map((id) => oppna.find((r) => r.id === id))
    .filter((r): r is Dorrad => r != null)
    .slice(0, 3)
    .map((rad) => ({ rad, tid: lage.tid(rad) }));

  const checkaIn = (rad: Dorrad) => {
    const nu = lage.status(rad) === AttendanceStatus.NARVARANDE;
    const nyStatus = nu ? AttendanceStatus.EJ_AVSTAMT : AttendanceStatus.NARVARANDE;
    lage.satt(rad, nyStatus);
    // Sökningen nollställs efter en incheckning: nästa person i kön ska kunna
    // skrivas direkt. KONSEKVENSEN är strukturell — posten lämnar skärmen, så
    // ångra MÅSTE bo i den kvarstående panelen (Lumas Express-mönster).
    if (!nu && q !== '') setSok('');
    sokRef.current?.focus();
    alertScreenReader(
      `${rad.namn} ${nu ? 'ej avstämd' : 'incheckad'}. ${nu ? incheckade - 1 : incheckade + 1} av ${oppna.length} incheckade.`,
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <TillbakaLank eventId={eventId} />
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Check-in</h1>
        <p className="text-small text-text-secondary">
          {event.eventNamn ?? event.eventlabel ?? 'Eventet'}
        </p>
      </header>

      <SessionsRad sessioner={sessioner} vald={session} onValj={setSession} datumtext={datumtext} />

      {/* SÖKFÄLTET ÄR SIDAN. Stort (48 px), autofokuserat, klistrat i toppen
          så det aldrig rullar bort; Escape rensar (SearchField-semantiken).
          Räknaren sitter i samma block — den ska aldrig behöva letas upp. */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-bg px-4 pt-1 pb-3">
        <SearchField
          aria-label="Sök deltagare att checka in"
          value={sok}
          onChange={setSok}
          className="flex w-full items-center gap-2 rounded-xl border border-(--mm-input-border) bg-(--mm-input-bg) px-3"
        >
          <Search aria-hidden="true" size={20} className="shrink-0 text-text-muted" />
          {/* AUTOFOKUS: dörrens primärhandling ÄR uppslagningen — sökfältet
              bär fokus vid inladdning (research §g, tangentbordsflödet). */}
          <AriaInput
            ref={sokRef}
            autoFocus
            placeholder="Sök på namn eller e-post"
            className="placeholder:text-(color:--mm-input-text-placeholder) min-h-12 w-full bg-transparent text-body outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {sok !== '' && (
            <AriaButton
              aria-label="Rensa sökningen"
              className="shrink-0 rounded-full p-1.5 text-text-muted hover:bg-bg-muted"
            >
              <X aria-hidden="true" size={18} />
            </AriaButton>
          )}
        </SearchField>
        <div className="flex items-center justify-between gap-3">
          <Raknare klara={incheckade} totalt={oppna.length} />
          <span className="text-caption text-text-muted">
            {q === ''
              ? `${oppna.length} deltagare`
              : `${traffar.length} ${traffar.length === 1 ? 'träff' : 'träffar'}`}
          </span>
        </div>
      </div>

      <AvbokadeNot antal={avbokade} />

      {q !== '' && traffar.length === 0 ? (
        <MessageBox intent="info" title="Ingen träff">
          {`Ingen deltagare matchar "${sok}". Kontrollera stavningen — eller lägg till personen som anmäld först.`}
        </MessageBox>
      ) : (
        <>
          {q === '' && (
            <h2 className="text-caption text-text-muted uppercase tracking-wide">Alla deltagare</h2>
          )}
          <ul className="flex flex-col gap-2">
            {traffar.map((rad) => (
              <li key={rad.id}>
                <DorrRad
                  rad={rad}
                  luftig
                  incheckad={lage.status(rad) === AttendanceStatus.NARVARANDE}
                  tid={lage.tid(rad)}
                  onToggle={() => checkaIn(rad)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Ångra-vägen i tumzonen — klistrad ovanför tab-baren, alltid synlig
          utan att man behöver rulla. Här är den inte ett kvitto utan den
          ENDA vägen tillbaka: posten är borta ur träfflistan. */}
      {senaste.length > 0 && (
        <div className="sticky bottom-[5.5rem] z-10 -mx-1 mt-2 px-1">
          <SenastListan
            kompakt
            poster={senaste}
            onAngra={(rad) => {
              lage.satt(rad, AttendanceStatus.EJ_AVSTAMT);
              alertScreenReader(`Incheckningen av ${rad.namn} är ångrad.`);
            }}
          />
        </div>
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
//  VÄXELN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prototyp-ytan. Laddar samma data som den skarpa vyn (adapter-gränsen
 * respekteras — ingen egen adapter, ingen kringgången DI) och renderar
 * vald variant.
 */
export function CheckinPrototyp({
  eventId,
  variant,
}: {
  eventId: string;
  variant: CheckinProtoVariant;
}) {
  const { event, rader, isPending, isError } = useDorrData(eventId);

  // Rulla alltid till toppen vid variantbyte så jämförelsen sker från samma
  // utgångsläge (prototyp-ergonomi, inte produktbeteende).
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
        Prototypen behöver eventet, närvaron och anmälningarna. Något av anropen gick fel.
      </MessageBox>
    );
  }

  if (variant === 'a') return <VariantA eventId={eventId} event={event} rader={rader} />;
  if (variant === 'b') return <VariantB eventId={eventId} event={event} rader={rader} />;
  return <VariantC eventId={eventId} event={event} rader={rader} />;
}

/** Divergens-varianterna (ADR-074 beslut 1: stabila nycklar a/b/c). */
export const CHECKIN_PROTO_VARIANTS = [
  { key: 'a', label: 'A — Registret', steg: 1, stegLabel: 'Divergens' },
  { key: 'b', label: 'B — Lista-först', steg: 1, stegLabel: 'Divergens' },
  { key: 'c', label: 'C — Sök-först', steg: 1, stegLabel: 'Divergens' },
];
