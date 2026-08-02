import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Check, ChevronDown, Clock, Mail, MailCheck } from 'lucide-react';
// [PROTOTYPE] [S93] hållplats-pass — kastbar wiring (throwaway-kontraktet):
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName } from '@/components/registrations/registration-display';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import {
  BETALNING_LABEL,
  type Betalning,
  useLogPaymentReminder,
  useSetPaymentStatus,
  useUpdatePaymentNote,
} from '@/data/mutations/registrationPayments';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp, EtikettVardeRad } from './DetaljGrupp';
import { DAGMANAD } from './datumSpann';
// [PROTOTYPE] [S93] hållplats-pass — se Deltagare.tsx:s motsvarande gren +
// DeltagareHallplatsPrototyp.tsx (frågan, huvudprototypfilen).
import {
  HALLPLATS_PROTO_FIXTURES,
  harPaminnelse,
  isHallplatsVariant,
  kategoriPillText,
} from './hallplats-steg-prototyp';

/**
 * Betalningar-gruppen med inline-ARBETSYTAN (task-18.8; S73-facit K27–K34).
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas
 * aldrig); K-referenserna pekar på den låsta konvergens-trailen.
 *
 * Formen (uppifrån och ned): två räknerader med RÖDA saknas-deltan
 * (minustecknet bär — text, rött förstärker; aldrig färg ensam) →
 * "Öppna detaljer"-disclosure (K27: Marcus "stanna på samma sida" — ersatte
 * navigationen till betalnings-vyn) → arbetsytan: flikar i familje-kapseln
 * (K30; Stripe-klassens statusfilter) + deadline som STATUS-BADGE →
 * EN LINJE PER BETALNING (K31) med eget kryss, egen notering och
 * Påminn-mailikon per obetald linje (K32–K33) + tyst påminnelsehistorik
 * under personen (K34).
 *
 * ALLT härleds LIVE ur anmälnings-cachen (kortets deltan, flik-räknarna,
 * grupperingen) — kryssens optimistiska mutationer räknar ner deltat direkt
 * (Omedelbarhet; PRD task-18 beslut 20).
 *
 * A11y (11/10): disclosure med aria-expanded/aria-controls; flikarna är
 * ToggleButtonGroup (radiogroup-semantik); kryssen är RAC Checkbox med
 * per-person-etikett; Påminn-länken bär fullt namn; historiken är en lista;
 * mutationsutfall annonseras via aria-live (hookarna); fel via MessageBox
 * (role=alert) med requestId.
 */

/** Aktiv anmälan (basens 'Är aktiv'-formel): endast Avbokad/Ombokad räknas bort. */
function arAktiv(r: Registration): boolean {
  return r.status !== RegistrationStatus.AVBOKAD;
}

/** Avgiften klar = Mottagen (null/Ej mottagen = saknas). */
function avgiftKlar(r: Registration): boolean {
  return r.anmalningsavgift === PaymentStatus.MOTTAGEN;
}

/** Slutbetalningen kräver inget mer: Mottagen ELLER Ej relevant (föreläsning). */
function slutKlar(r: Registration): boolean {
  return (
    r.slutbetalning === PaymentStatus.MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_RELEVANT
  );
}

/** Slutbetalning SAKNAS (deltat): varken mottagen eller irrelevant. */
function slutSaknas(r: Registration): boolean {
  return !slutKlar(r);
}

/**
 * Deadline som STATUS-DATA (K30; LÅST REGEL, Marcus 2026-07-21): slutbetalningen
 * förfaller 14 dagar före eventets startdatum — härleds ur startdatum, inget
 * bas-fält (basens formel 'Deadline slutbetalning' bär samma regel). Färgen
 * följer läget: lugnt → neutral · imorgon/idag → warning · passerad → error.
 * Aldrig rå negativ siffra (Gunilla).
 */
export function deadlineStatus(startdatum: string | null): { text: string; cls: string } | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 14);
  deadline.setHours(0, 0, 0, 0);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  const diff = Math.round((deadline.getTime() - idag.getTime()) / 86_400_000);
  const datum = DAGMANAD.format(deadline);
  if (diff > 1) return { text: `Deadline ${datum} · om ${diff} dagar`, cls: 'text-text-secondary' };
  if (diff === 1) return { text: `Deadline ${datum} · imorgon`, cls: 'font-medium text-warning' };
  if (diff === 0) return { text: 'Deadline idag', cls: 'font-medium text-warning' };
  return { text: `Deadline passerad · ${datum}`, cls: 'font-medium text-error' };
}

/** Rött saknas-delta (K27): minustecknet är bäraren, rött förstärker; endast vid avvikelse. */
function SaknasDelta({ antal, testid }: { antal: number; testid: string }) {
  if (antal <= 0) return null;
  return (
    <span data-testid={testid} className="ml-2 font-medium text-error tabular-nums">
      −{antal}
    </span>
  );
}

/** K27-disclosure: "Öppna/Stäng detaljer" centrerad rad; chevron-down roterar
    (disclosure-branschformen — skild från navigationsradernas höger-chevron). */
function DetaljRad({
  oppen,
  kontrollerarId,
  onToggle,
}: {
  oppen: boolean;
  kontrollerarId: string;
  onToggle: () => void;
}) {
  return (
    <div className="py-3">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-2 font-medium text-body"
      >
        {oppen ? 'Stäng detaljer' : 'Öppna detaljer'}
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

/** K29-krysset: RAC Checkbox i bibliotekets fält-grammatik (rå-RAC —
    Checkbox-primitiv saknas, prototypens precedent). Obockad etikett i RÖTT
    fetstil ("vilka betalningar folk inte gjort" syns direkt — texten + tomma
    rutan bär, rött förstärker); ibockad = mörk ruta + check, dämpad etikett. */
function BetalKryss({
  text,
  namn,
  vald,
  onChange,
  disabled = false,
}: {
  /** Synlig etikett (betalningsordet — facit-formen). */
  text: string;
  /** Personens namn — accessible name blir "<text> för <namn>" (WCAG 2.5.3-säkert). */
  namn: string;
  vald: boolean;
  onChange: (v: boolean) => void;
  /** [PROTOTYPE] [S93] review-fix — `?data=proto`: kontrollen görs read-only
      (native disabled-semantik), ingen mutation avfyras (se BetalningsLinje). */
  disabled?: boolean;
}) {
  return (
    <Checkbox
      isSelected={vald}
      isDisabled={disabled}
      onChange={onChange}
      aria-label={`${text} för ${namn}`}
      className="group flex cursor-pointer items-center gap-2 text-small data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span className={vald ? 'text-text-secondary' : 'font-medium text-error'}>{text}</span>
    </Checkbox>
  );
}

/**
 * EN LINJE PER BETALNING (K31: "en notisruta håller inte") — kryss + etikett i
 * fast kolumn (w-40, likbredds-läxan K13) + betalningens EGEN notering på samma
 * linje (Stripe-klassen: per-betalnings-memo; commit-punkt = fältets blur) +
 * PÅMINN-mailikonen (K32) höger om notisraden: mailto med betalningen i
 * ämnesraden (basens etablerade påminnelse-väg — formelfältet 'Skicka
 * betalningspåminnelse'); klicket antecknar tidsstämpeln i betalningens
 * additiva fält (historiken). Ikonen visas ENDAST på obetalda linjer
 * (påminnelse om ibockad betalning är meningslös); SLOTTEN är alltid
 * renderad (K33 — alla notisrutor exakt samma bredd).
 */
/** Arbetsytans delade mutations-instanser — EN per operation, skapade i
    BetalningsDetaljer och delade av alla linjer. Motiv: den optimistiska
    flytten mellan flikarna AVMONTERAR radens komponent — per-rad-hooks hade
    tappat felläget vid rollback (felytan måste överleva raden). */
interface ArbetsytansMutationer {
  status: ReturnType<typeof useSetPaymentStatus>;
  notering: ReturnType<typeof useUpdatePaymentNote>;
  paminnelse: ReturnType<typeof useLogPaymentReminder>;
}

function BetalningsLinje({
  registration,
  betalning,
  eventNamn,
  vald,
  notering,
  mutationer,
  protoDataMode = false,
}: {
  registration: Registration;
  betalning: Betalning;
  eventNamn: string;
  vald: boolean;
  notering: string | null;
  mutationer: ArbetsytansMutationer;
  /** [PROTOTYPE] [S93] review-fix — `?data=proto`: raden read-only-förstärkt
      (uppdraget § FYND 1). Kryss, notering och Påminn stubbas — INGEN mutation
      avfyras; `title` på raden + kort text i arbetsytan förklarar varför
      (se BetalningsDetaljer). */
  protoDataMode?: boolean;
}) {
  const namn = displayName(registration);
  const label = BETALNING_LABEL[betalning];
  // Lokalt utkast medan Lotta skriver; null = inget utkast (visa cache-värdet).
  const [utkast, setUtkast] = useState<string | null>(null);

  const sparaNotering = () => {
    if (protoDataMode) return;
    if (utkast === null) return;
    const trimmat = utkast.trim();
    setUtkast(null);
    if (trimmat === (notering ?? '')) return;
    mutationer.notering.mutate({ registration, betalning, notering: trimmat });
  };

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
      title={
        protoDataMode
          ? 'Förhandsvisning (proto) — kryss, notering och påminn är inaktiverade, inget sparas'
          : undefined
      }
    >
      <div className="w-40 shrink-0">
        <BetalKryss
          text={label}
          namn={namn}
          vald={vald}
          disabled={protoDataMode}
          onChange={(v) => {
            if (protoDataMode) return;
            mutationer.status.mutate({
              registration,
              betalning,
              value: v ? PaymentStatus.MOTTAGEN : PaymentStatus.EJ_MOTTAGEN,
            });
          }}
        />
      </div>
      <Input
        size="sm"
        label={`Notering ${label.toLowerCase()} för ${namn}`}
        hideLabel
        isDisabled={protoDataMode}
        className="min-w-44 flex-1"
        value={utkast ?? notering ?? ''}
        onChange={setUtkast}
        onBlur={sparaNotering}
      />
      {/* K33: ikon-SLOTTEN alltid renderad (likbredds-läxan) — alla
          notisrutor exakt samma bredd, med eller utan ikon. */}
      <div className="size-8 shrink-0">
        {!vald &&
          (protoDataMode ? (
            // [PROTOTYPE] [S93] review-fix — `<span>`, inte `<a>`: ingen
            // `mailto:`-navigation, ingen onClick, ingen mutation. Samma
            // yta/ikon (K33), visuellt dämpad (data-disabled-mönstret ovan).
            <span
              aria-disabled="true"
              className="flex size-8 items-center justify-center rounded-full text-text-muted opacity-60"
            >
              <Mail aria-hidden="true" size={16} />
            </span>
          ) : (
            <a
              href={`mailto:${registration.email ?? ''}?subject=${encodeURIComponent(`Påminnelse: ${label.toLowerCase()} för ${eventNamn}`)}`}
              aria-label={`Påminn ${namn} om ${label.toLowerCase()} via mail`}
              onClick={() =>
                mutationer.paminnelse.mutate({
                  registration,
                  betalning,
                  tidpunkt: new Date().toISOString(),
                })
              }
              className="flex size-8 items-center justify-center rounded-full text-text-secondary hover:text-text"
            >
              <Mail aria-hidden="true" size={16} />
            </a>
          ))}
      </div>
    </div>
  );
}

/** K34-historikpost: "Påminnelse om X skickad 16 juli" (DAGMANAD, aldrig rå ISO). */
function paminnelseText(betalning: Betalning, skickad: string): string | null {
  const t = Date.parse(skickad);
  if (Number.isNaN(t)) return null;
  const vad = betalning === 'avgift' ? 'anmälningsavgift' : 'slutbetalning';
  return `Påminnelse om ${vad} skickad ${DAGMANAD.format(new Date(t))}`;
}

/**
 * Person-raden i arbetsytan (K29): namnet länkar till person-detaljvyn när
 * anmälan bär person-länken (annars stilla text — länk utan mål ljuger);
 * två betalnings-linjer (K31) + tyst påminnelsehistorik (K34: senaste
 * påminnelsen per betalning ur de additiva fälten — Stripe activity-klassen,
 * MailCheck-ikonen dekorativ). Slutbetalning 'Ej relevant (för föreläsningar)'
 * renderas som stilla textrad UTAN kryss/notering/påminn — ett kryss vore en
 * lögn (av-bock hade skrivit 'Ej mottagen' och rivit basens semantik);
 * öppet bokfört skiv-beslut (facit-demon saknade fallet).
 */
function BetalningsPersonRad({
  registration,
  eventNamn,
  mutationer,
  protoAktiv = false,
  protoDataMode = false,
}: {
  registration: Registration;
  eventNamn: string;
  mutationer: ArbetsytansMutationer;
  /** [PROTOTYPE] [S93] fråga 7 — bekräftelseläge- + kategori-pill. Prövas
      ja/nej i ALLA varianter (a/b/c), inte som ett variantval i sig. */
  protoAktiv?: boolean;
  /** [PROTOTYPE] [S93] review-fix — se BetalningsLinje. */
  protoDataMode?: boolean;
}) {
  const namn = displayName(registration);
  // [PROTOTYPE] [S93] fråga 7 (research-doken Del 1.5, fynd 1+2): Betalningar
  // visar idag varken bekräftelseläge eller kategori. Två pillar räcker.
  const protoKategoriPill = protoAktiv ? kategoriPillText(registration) : null;
  const protoObekraftad = protoAktiv && registration.status === RegistrationStatus.OBEKRAFTAD;
  const historik = [
    registration.paminnelseAnmalningsavgiftSkickad
      ? paminnelseText('avgift', registration.paminnelseAnmalningsavgiftSkickad)
      : null,
    registration.paminnelseSlutbetalningSkickad
      ? paminnelseText('slut', registration.paminnelseSlutbetalningSkickad)
      : null,
  ].filter((rad): rad is string => rad !== null);

  return (
    <li className="flex flex-col gap-2 py-3">
      {registration.personId ? (
        <Link
          to="/personer/$personId"
          params={{ personId: registration.personId }}
          className="self-start font-medium text-body underline-offset-2 hover:underline"
        >
          {namn}
        </Link>
      ) : (
        <span className="self-start font-medium text-body">{namn}</span>
      )}
      {/* [PROTOTYPE] [S93] fråga 7 — bekräftelseläge + kategori, samma
          pill-form som Anmälda deltagares kort (KATEGORI_PILL-formen). */}
      {(protoObekraftad || protoKategoriPill) && (
        <span className="flex flex-wrap items-center gap-1.5">
          {protoObekraftad && (
            <span className="rounded-full bg-error-bg px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {protoKategoriPill && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
              {protoKategoriPill}
            </span>
          )}
        </span>
      )}
      <BetalningsLinje
        registration={registration}
        betalning="avgift"
        eventNamn={eventNamn}
        vald={avgiftKlar(registration)}
        notering={registration.noteringAnmalningsavgift ?? null}
        mutationer={mutationer}
        protoDataMode={protoDataMode}
      />
      {registration.slutbetalning === PaymentStatus.EJ_RELEVANT ? (
        <p className="text-small text-text-muted">Slutbetalning · Ej relevant (föreläsning)</p>
      ) : (
        <BetalningsLinje
          registration={registration}
          betalning="slut"
          eventNamn={eventNamn}
          vald={registration.slutbetalning === PaymentStatus.MOTTAGEN}
          notering={registration.noteringSlutbetalning ?? null}
          mutationer={mutationer}
          protoDataMode={protoDataMode}
        />
      )}
      {historik.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {historik.map((rad) => (
            <li key={rad} className="flex items-center gap-1.5 text-caption text-text-muted">
              <MailCheck aria-hidden="true" size={12} className="shrink-0" />
              {rad}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Arbetsytan (K29–K30): flikar i familje-kapseln (Saknar betalning / Klara —
 * räknarna följer kryssen live) + deadline-STATUS-BADGEN (listkortens
 * status-slot-form: bg-surface-pill + statusfärgad text) + person-listan.
 * Kryssen flyttar personen mellan flikarna direkt (optimistisk cache).
 */
function BetalningsDetaljer({
  event,
  registreringar,
  protoAktiv = false,
  protoDataMode = false,
}: {
  event: Event;
  registreringar: Registration[];
  /** [PROTOTYPE] [S93] — se BetalningsPersonRad. */
  protoAktiv?: boolean;
  /** [PROTOTYPE] [S93] review-fix — `?data=proto`: arbetsytans skrivvägar
      (kryss/notering/påminn) stubbas hela vägen ned till BetalningsLinje. */
  protoDataMode?: boolean;
}) {
  const [flik, setFlik] = useState<'saknar' | 'klara'>('saknar');
  const deadline = deadlineStatus(event.startdatum);
  const saknar = registreringar.filter((r) => !avgiftKlar(r) || slutSaknas(r));
  const klara = registreringar.filter((r) => avgiftKlar(r) && slutKlar(r));
  const lista = flik === 'saknar' ? saknar : klara;
  const eventNamn = event.eventNamn ?? event.eventlabel ?? 'eventet';

  // Delade mutations-instanser (se ArbetsytansMutationer): felytan renderas
  // HÄR — den överlever att raden flyttar mellan flikarna vid rollback.
  const mutationer: ArbetsytansMutationer = {
    status: useSetPaymentStatus(event.id),
    notering: useUpdatePaymentNote(event.id),
    paminnelse: useLogPaymentReminder(event.id),
  };

  const felId = (error: unknown) =>
    error instanceof EdgeFunctionError ? error.requestId : undefined;
  const felNamn = (vars: { registration: Registration } | undefined) =>
    vars ? ` för ${displayName(vars.registration)}` : '';
  const fel = mutationer.status.isError
    ? {
        rubrik: `Kunde inte uppdatera ${
          mutationer.status.variables
            ? `${BETALNING_LABEL[mutationer.status.variables.betalning].toLowerCase()}en`
            : 'betalningen'
        }${felNamn(mutationer.status.variables)}`,
        id: felId(mutationer.status.error),
        reset: () => mutationer.status.reset(),
      }
    : mutationer.notering.isError
      ? {
          rubrik: `Kunde inte spara noteringen${felNamn(mutationer.notering.variables)}`,
          id: felId(mutationer.notering.error),
          reset: () => mutationer.notering.reset(),
        }
      : mutationer.paminnelse.isError
        ? {
            rubrik: `Kunde inte anteckna påminnelsen${felNamn(mutationer.paminnelse.variables)}`,
            id: felId(mutationer.paminnelse.error),
            reset: () => mutationer.paminnelse.reset(),
          }
        : null;

  return (
    <div className="flex flex-col gap-3 py-3">
      <ToggleButtonGroup
        label="Visa betalningar"
        spread
        className="bg-bg-emphasized"
        selectedKey={flik}
        onSelectionChange={(key) => setFlik(key as 'saknar' | 'klara')}
      >
        <ToggleButton id="saknar" size="sm">
          {`Saknar betalning (${saknar.length})`}
        </ToggleButton>
        <ToggleButton id="klara" size="sm">
          {`Klara (${klara.length})`}
        </ToggleButton>
      </ToggleButtonGroup>
      {deadline && (
        <p
          data-testid="betalning-deadline"
          className={`inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 text-small ${deadline.cls}`}
        >
          <Clock aria-hidden="true" size={14} />
          {deadline.text}
        </p>
      )}
      {fel && (
        <MessageBox intent="error" title={fel.rubrik} onDismiss={fel.reset}>
          Försök igen.{fel.id ? ` Fel-ID: ${fel.id}.` : ''}
        </MessageBox>
      )}
      {/* [PROTOTYPE] [S93] review-fix — EN delad förklaringstext för hela
          arbetsytan (uppdraget § FYND 1): "liten text"-delen av
          disabled-mönstret; per-rad `title` (BetalningsLinje) bär hover-formen. */}
      {protoDataMode && (
        <p className="text-caption text-text-muted">
          Förhandsvisning (proto) — kryss, notering och påminn är inaktiverade nedan, inget sparas.
        </p>
      )}
      {lista.length > 0 ? (
        <ul className="divide-y divide-border">
          {lista.map((r) => (
            <BetalningsPersonRad
              key={r.id}
              registration={r}
              eventNamn={eventNamn}
              mutationer={mutationer}
              protoAktiv={protoAktiv}
              protoDataMode={protoDataMode}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-small text-text-secondary">
          {flik === 'saknar'
            ? 'Alla anmälda har betalat.'
            : 'Ingen är klar med båda betalningarna ännu.'}
        </p>
      )}
    </div>
  );
}

/**
 * Betalningar-gruppen (kortet): räknerader med röda saknas-deltan härledda
 * LIVE ur anmälnings-cachen (K29: Lottas kryss räknar ner deltat direkt —
 * ej event-aggregaten, som uppdateras först vid rollup-refetch) +
 * K27-disclosuren till inline-arbetsytan. Avgiftsraden "X av N mottagna"
 * (N = aktiva anmälningar); slutbetalningsraden "Y mottagna" (facit-formen —
 * inget "av": Ej relevant-fall gör taket olika per anmälan).
 */
function BetalningsInnehall({
  event,
  registreringar,
  protoAktiv = false,
  protoDataMode = false,
}: {
  event: Event;
  registreringar: Registration[];
  /** [PROTOTYPE] [S93] — se BetalningsPersonRad + A′-räkneraden nedan. */
  protoAktiv?: boolean;
  /** [PROTOTYPE] [S93] review-fix — se BetalningsDetaljer. */
  protoDataMode?: boolean;
}) {
  const [oppen, setOppen] = useState(false);
  const aktiva = registreringar.filter(arAktiv);
  const avgifterMottagna = aktiva.filter(avgiftKlar).length;
  const avgifterSaknas = aktiva.length - avgifterMottagna;
  const slutMottagna = aktiva.filter((r) => r.slutbetalning === PaymentStatus.MOTTAGEN).length;
  const slutSaknasAntal = aktiva.filter(slutSaknas).length;
  // [PROTOTYPE] [S93] A′ inbakat (research-doken Del 6, alternativ A′):
  // "Betalningspåminnelse skickad" flyttar hit från Anmälda deltagare —
  // räknaren hamnar hos påminnelse-HANDLINGEN och -HISTORIKEN (Del 1.5 fynd 3).
  const pamindaTotalt = protoAktiv ? aktiva.filter(harPaminnelse).length : 0;

  return (
    <>
      <dl className="divide-y divide-border">
        <EtikettVardeRad term="Anmälningsavgifter">
          {`${avgifterMottagna} av ${aktiva.length} mottagna`}
          <SaknasDelta antal={avgifterSaknas} testid="delta-avgifter" />
        </EtikettVardeRad>
        <EtikettVardeRad term="Slutbetalningar">
          {`${slutMottagna} mottagna`}
          <SaknasDelta antal={slutSaknasAntal} testid="delta-slutbetalningar" />
        </EtikettVardeRad>
        {protoAktiv && (
          <EtikettVardeRad term="Betalningspåminnelse skickad">
            <span data-testid="proto-hallplats-paminda" className="tabular-nums">
              {pamindaTotalt}
            </span>
          </EtikettVardeRad>
        )}
      </dl>
      {aktiva.length > 0 && (
        /* K28: toggeln + regionen i EN wrapper — detaljerna hör till toggeln
           och ska inte få kortets divide-y-avdelare mellan sig. */
        <div>
          <DetaljRad
            oppen={oppen}
            kontrollerarId="betalningsdetaljer"
            onToggle={() => setOppen((v) => !v)}
          />
          <div id="betalningsdetaljer" hidden={!oppen}>
            <BetalningsDetaljer
              event={event}
              registreringar={aktiva}
              protoAktiv={protoAktiv}
              protoDataMode={protoDataMode}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function Betalningar({ event }: { event: Event }) {
  const dataSource = useDataSource();
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.registrations.byEvent(event.id),
    queryFn: () => dataSource.fetchRegistrations({ eventId: event.id }),
  });
  // [PROTOTYPE] [S93] hållplats-pass — samma DEV-grindade läsning som
  // Deltagare.tsx (oberoende `useQueryState`, samma URL-nyckel — nuqs
  // synkar de två). Utan ?variant renderas EXAKT dagens träd.
  const [variantParam] = useQueryState('variant');
  const [dataParam] = useQueryState('data');
  const protoAktiv = import.meta.env.DEV && isHallplatsVariant(variantParam);
  const protoDataMode = protoAktiv && dataParam === 'proto';

  if (protoDataMode) {
    return (
      <DetaljGrupp id="grupp-betalningar" rubrik="Betalningar">
        <BetalningsInnehall
          event={event}
          registreringar={HALLPLATS_PROTO_FIXTURES}
          protoAktiv
          protoDataMode
        />
      </DetaljGrupp>
    );
  }

  return (
    <DetaljGrupp id="grupp-betalningar" rubrik="Betalningar">
      {isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2 py-3">
          <span className="sr-only">Laddar betalningar…</span>
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      ) : isError ? (
        <div className="py-3">
          <MessageBox intent="error" title="Kunde inte hämta betalningarna">
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      ) : (
        <BetalningsInnehall event={event} registreringar={data} protoAktiv={protoAktiv} />
      )}
    </DetaljGrupp>
  );
}
