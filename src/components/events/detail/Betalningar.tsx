import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bell, Check, ChevronDown, Clock, Mail, MailCheck } from 'lucide-react';
// [PROTOTYPE] [S93] hållplats-pass — kastbar wiring (throwaway-kontraktet):
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName } from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { Tidslinje, type TidslinjeHandelse } from '@/components/registrations/Tidslinje';
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
  betalningsSplit,
  harPaminnelse,
  isHallplatsVariant,
  kategoriPillText,
  PROTO_MOTTAGEN_DATUM,
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

/** [PROTOTYPE] [S93] ITERATIONSVÅG 11 — utskicksloggens tidsstämpel: dag,
    månad OCH klockslag. Se `utskickslogg` i BetalningsPersonRad för varför
    klockslaget bär här men inte i registret. */
const LOGGTID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

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
    (disclosure-branschformen — skild från navigationsradernas höger-chevron).
    EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): återanvänds av
    `Deltagare.tsx`s DEV-gren för den INFLYTTADE arbetsytan (samma K27-form,
    inte en kopia — se `Deltagare.tsx`s `ArbetsKo` för montering). */
export function DetaljRad({
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
  lugn = false,
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
  /** [PROTOTYPE] [S93] ITERATIONSVÅG 10 — etiketten dämpad i stället för röd.
      Se `BetalningsLasRad` för skälet (rött på varje rad upprepar bara flikens
      egen utsaga och tömmer färgen på betydelse). Skarpa vyn rörs inte. */
  lugn?: boolean;
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
      <span
        className={
          lugn ? 'text-text-muted' : vald ? 'text-text-secondary' : 'font-medium text-error'
        }
      >
        {text}
      </span>
    </Checkbox>
  );
}

/**
 * [PROTOTYPE] [S93] ITERATIONSVÅG 10 — betalningen som ETIKETT-VÄRDE-RAD
 * (Marcus 2026-08-06: "designmässigt är det skit … vi får hämta inspiration
 * från detalj-sidan för anmälan").
 *
 * Formen är `EtikettVardeRad`:s (DetaljGrupp.tsx): etiketten dämpad till
 * vänster, VÄRDET primärt till höger, 48 px radhöjd (py-3 + 24 px). Krysset
 * bor i etikett-slotten — avprickningen stannar på ytan (Del 3 beslut 1:
 * "Lotta lämnar inte sidan för avprickning"), men den slutar skrika.
 *
 * TRE RIVNINGAR mot föregående form, var och en med sitt skäl:
 *
 * (a) `<Input>`-fältet är BORTA. Ytan är för ÖVERBLICK — editering görs på
 *     åtgärds-sidan (Marcus 2026-08-06). Nio personer × två fält var arton
 *     tomma rutor som bar noll information och ändå dominerade ytan.
 *     Noteringen finns kvar som LÄSVÄRDE; den är det enda värdet som säger
 *     något Lotta inte redan vet.
 *
 * (b) RÖTT lämnar etiketten. Skälet på `BetalKryss` var att "vilka betalningar
 *     folk inte gjort syns direkt" — men fliken heter redan
 *     "Saknar betalning (9)": ALLA i listan saknar per definition något, så
 *     rött per rad upprepar bara flikens utsaga. Arton röda ord tömde färgen
 *     på betydelse och konkurrerade med `Obekräftad`-badgen, som bär en
 *     genuint avvikande sak. Vilken av de två som saknas bär krysset.
 *
 * (c) Värde-slotten är ALDRIG tom (`AnmalanDetail`-disciplinen "—"/"Ingen
 *     notering"): finns notering ÄR den värdet, annars statusordet dämpat.
 */
function BetalningsLasRad({
  registration,
  betalning,
  vald,
  notering,
  mutationer,
  protoDataMode = false,
}: {
  registration: Registration;
  betalning: Betalning;
  vald: boolean;
  notering: string | null;
  mutationer: ArbetsytansMutationer;
  protoDataMode?: boolean;
}) {
  const namn = displayName(registration);
  const label = BETALNING_LABEL[betalning];
  const egenNotering = notering?.trim();
  // [PROTOTYPE] [S93] våg 14 — se PROTO_MOTTAGEN_DATUM: datumet är
  // prototyp-lokalt tills basen får sina två additiva dateTime-fält.
  const protoDatumIso = vald
    ? PROTO_MOTTAGEN_DATUM[registration.id]?.[betalning === 'avgift' ? 'avgift' : 'slut']
    : undefined;
  const mottagenDatum =
    protoDatumIso && !Number.isNaN(Date.parse(protoDatumIso))
      ? DAGMANAD.format(new Date(protoDatumIso))
      : null;

  return (
    <div
      className="py-3"
      title={
        protoDataMode ? 'Förhandsvisning (proto) — krysset är inaktiverat, inget sparas' : undefined
      }
    >
      {/* HÖGER-SLOTTEN ÄR RIVEN (våg 13, Marcus 2026-08-06: "'Saknas' kan vi
          ta bort också. Det räcker det ej kryssade rutan, + att vi har togglen
          högst upp" · "Att bara ha 'Mottagen' … säger ju bara exakt samma sak
          som kryssrutan, eller hur?").

          Han har rätt på båda, och räkningen är värre än den låter: i fliken
          "Saknar betalning (9)" sa ytan SAMMA sak tre gånger — fliknamnet, det
          obockade krysset och ordet "Saknas". "Mottagen" sa den två gånger.
          Ingen av dem bar något krysset inte redan bär.

          MOTTAGEN-PILLEN (våg 14) är däremot INTE redundant och står kvar —
          den bär ett DATUM krysset omöjligt kan bära. Formen speglar
          deadline-pillen i samma vy ("ord · datum" i en rounded-full kapsel);
          `bg-bg-muted` i stället för deadline-pillens `bg-surface`, eftersom
          personkortet självt redan är `bg-surface` och pillen annars försvann.

          DATUMET ÄR PROTOTYP-LOKALT (PROTO_MOTTAGEN_DATUM i
          hallplats-steg-prototyp.ts) — basen bär inget mottagen-fält ännu, och
          det är EJ beslutat. Se den konstantens docblock för hela skälet.

          KVAR STÅR ÄVEN "Ej relevant (föreläsning)" — den enda utsagan på ytan
          som saknar kryss och därför inte kan vara redundant. */}
      <div className="flex items-center justify-between gap-4">
        <BetalKryss
          text={label}
          namn={namn}
          vald={vald}
          lugn
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
        {mottagenDatum && (
          <span className="shrink-0 rounded-full bg-bg-muted px-2.5 py-1 font-medium text-caption text-text-secondary">
            Mottagen {mottagenDatum}
          </span>
        )}
      </div>
      {/* NOTERINGEN PÅ EGEN RAD, FULL BREDD (Marcus 2026-08-06: "kommer det ju
          inte få plats några noteringar eller? Vart ska dem skrivas ut?").
          Föregående våg lade noteringen i höger-slotten, och den var för smal
          för hur Lotta faktiskt skriver — fixturens Sara Nilsson bär numera ett
          långt fall just för att bevisa radbrytningen här i stället för i prod.

          `pl-7` = kryssets 20 px + gap-2:s 8 px, så noteringen linjerar exakt
          under betalningsordet, inte under krysset. Dämpad (`text-small`,
          `text-text-secondary`): den kvalificerar raden ovanför, den tävlar
          inte med den.

          LUFTEN (våg 12, Marcus 2026-08-06: "det blir för mycket text som
          nästan står på varandra runt noteringstexten"). Tre mått, inte ett —
          det klistrade åt tre håll samtidigt och en enda justering hade bara
          flyttat trängseln:

          (i)   `pt-4` mot etikettraden ovanför — PADDING, inte margin, och det
                är hela poängen.

                Våg 12 satte `mt-3` och våg 14 först `mt-4`. BÅDA VAR
                VERKNINGSLÖSA: en global oskiktad `p { margin: 0px }` i
                stilmallen slår Tailwinds `.mt-*`, eftersom utilities ligger i
                `@layer utilities` och CSS-kaskaden ger OSKIKTADE regler högre
                prioritet än skiktade. DOM-mätt `marginTop: "0px"` med
                `class="mt-4 …"` på elementet.

                Det förklarar varför Marcus fortsatte se att noteringen
                klistrade uppåt efter våg 12: den vågens synliga förbättring
                kom helt från `leading-relaxed` och `pb-1`, aldrig från
                marginalen. Padding rörs inte av reset:en och verkar direkt.

                Måttet: luften NEDÅT är `pb-1` (4 px) + radens `py-3` (12 px) =
                16 px, så `pt-4` = 16 px gör paret symmetriskt — Marcus krav
                ordagrant ("lika mycket luft däremellan som det är mellan
                noteringstexten och avdelaren under").

                LÄXAN ÄR GENERELL: på denna kodbas är `mt-*`/`mb-*` på `<p>`
                tysta no-ops. Använd padding, eller `gap` på föräldern. Att
                `my-0`/`mb-0` står utskrivet på flera `<p>` i filen är därför
                också dekoration — reset:en hade redan nollat dem.
          (ii)  `leading-relaxed` INUTI noteringen — samma val som
                AnmalanDetail gör för sin fritext. En flerradig notering med
                tät radsättning är den enda texten på kortet som måste läsas
                som prosa, inte skannas som data.
          (iii) `pb-1` under: `py-3` räknade från styckets sista rad, vilket
                gav mindre luft ner till avdelaren än upp till statusraden.
                Asymmetrin syntes som att noteringen hängde i nederkanten. */}
      {egenNotering && (
        <p className="pt-4 pb-1 pl-7 text-small text-text-secondary leading-relaxed">
          {egenNotering}
        </p>
      )}
    </div>
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
  protoAktiv = false,
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
  /** [PROTOTYPE] [S93] ITERATIONSVÅG punkt 6 — variant-läget river Påminn-
      slotten helt (mailto-eran är stängd, Del 3 beslut 4). Se slotten nedan. */
  protoAktiv?: boolean;
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
          notisrutor exakt samma bredd, med eller utan ikon.

          PUNKT 6 (Marcus 2026-08-06): "Den lilla mail-ikonen kan vi ta bort,
          eftersom vi inte gör några åtgärder här längre." Påminn-vägen är en
          `mailto:`-genväg ur mailto-eran, och Del 3 beslut 4 stängde den eran:
          alla utskick blir riktiga server-utskick från åtgärds-sidan. Ikonen
          lovade en åtgärd som inte längre hör hemma på denna yta.

          SLOTTEN RIVS HELT i variant-läge, inte bara ikonen — en tom 32 px-slot
          hade lämnat ett hål i radens högerkant utan att bära något. K33:s
          likbredds-skäl gäller bara när slotten ibland är fylld. Skarpa vyn
          (`protoAktiv` false) behåller både slot och ikon OFÖRÄNDRADE. */}
      {!protoAktiv && (
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
      )}
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

  // [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus 2026-08-05, punkt 2): "Nej inte på
  // kortet. Vi måste få in utskickshistoriken under 'Öppna detaljer' på något
  // sätt" — och (sista punkten) "behålla samma tydlighet på anmälningsavgift/
  // slutbetalning och deras kommentarer som är just nu".
  //
  // HELA utskickshistoriken, inte bara betalningspåminnelserna: bekräftelse och
  // eventinfo satt förut på registrets KORT (`KortInnehall`s metayta) och är
  // rivna därifrån. Ordningen är Lottas utskicksordning (K42): bekräftelse →
  // påminnelser → eventinfo.
  const utskick = [
    registration.bekraftelseSkickad
      ? {
          key: 'bekr',
          text: `Bekräftelse ${DAGMANAD.format(new Date(registration.bekraftelseSkickad))}`,
        }
      : null,
    ...historik.map((rad) => ({ key: rad, text: rad })),
    registration.deltagarinfoSkickad
      ? {
          key: 'info',
          text: `Eventinfo ${DAGMANAD.format(new Date(registration.deltagarinfoSkickad))}`,
        }
      : null,
  ].filter((p): p is { key: string; text: string } => p !== null);

  // [PROTOTYPE] [S93] ITERATIONSVÅG 11 — UTSKICKEN BLIR EN RIKTIG LOGG
  // (Marcus 2026-08-06: "'skickat' som vi har längst ner på varje kort måste
  // bli och se ut mer som en utskickslogg").
  //
  // Formen är `Tidslinje` (registrations/Tidslinje.tsx) — samma komponent som
  // bär Händelser på anmälnings-sidan, alltså samma yta Marcus pekade ut som
  // förebild. Den är dokumenterad som "aktivitetslogg i branschledar-formen
  // (Shopify/Stripe activity)": genomgående linje, ikon-noder i cirklar,
  // texten bär och tiden mutad under. Ingen ny form mintas — och Tidslinje är
  // [BIBLIOTEKS-KANDIDAT] med promovering "vid andra konsumenten", precis som
  // StatusBadge; detta är den andra konsumenten även för den.
  //
  // ORDNINGEN ÄR OFÖRÄNDRAD: bekräftelse → påminnelser → eventinfo (K42,
  // Lottas utskicksordning). Tidslinje sorterar aldrig själv — callern äger
  // ordningen — så bytet av form ändrar inte vad Lotta ser i vilken följd.
  //
  // Tidsformatet bär KLOCKSLAG här men inte i registret: en logg som säger
  // "Påminnelse 24 juli" två rader under "Bekräftelse 24 juli" gör dem
  // oskiljbara, och ordningsföljden blir det enda som skiljer — vilket är
  // precis vad en logg ska belägga, inte förutsätta.
  const utskickslogg: TidslinjeHandelse[] = [
    { nar: registration.bekraftelseSkickad ?? null, text: 'Bekräftelse skickad', ikon: Mail },
    {
      nar: registration.paminnelseAnmalningsavgiftSkickad ?? null,
      text: 'Påminnelse om anmälningsavgift',
      ikon: Bell,
    },
    {
      nar: registration.paminnelseSlutbetalningSkickad ?? null,
      text: 'Påminnelse om slutbetalning',
      ikon: Bell,
    },
    { nar: registration.deltagarinfoSkickad ?? null, text: 'Eventinfo skickad', ikon: Mail },
  ].flatMap((p) =>
    p.nar != null && !Number.isNaN(Date.parse(p.nar))
      ? [
          {
            id: `${p.text}-${p.nar}`,
            text: p.text,
            tid: LOGGTID.format(new Date(p.nar)),
            ikon: p.ikon,
          },
        ]
      : [],
  );

  // [PROTOTYPE] [S93] ITERATIONSVÅG 10 — PERSONEN FÅR EN KROPP.
  //
  // Marcus 2026-08-06: "varje personblock har väl innehållet som det behöver
  // ha, men designmässigt är det skit … detalj-sidan för anmälan är SNYGG.
  // Vi får hämta inspiration därifrån."
  //
  // Föregående form var `<li>` i en `divide-y`-lista: personen hade ingen
  // kortyta alls, bara hårstreck emellan — och det ENDA som bar en
  // inneslutning var utskicks-lådan, alltså ytans minst viktiga innehåll.
  //
  // Formen här är `DetaljGrupp`s (DetaljGrupp.tsx:26-32), den som gör
  // anmälnings-sidan läsbar: RUBRIKEN UTANFÖR (namn + status, `px-4` in till
  // "där rundningen slutar"), KORTET under (`rounded-2xl bg-bg-muted px-4`)
  // med `divide-y` mellan raderna. Ingen ny form mintas — grammatiken finns
  // redan och är e2e-bevisad på anmälnings-sidan.
  //
  // Hierarkin får fyra nivåer i stället för två: namnet `text-lg
  // font-semibold` → etiketten `text-small text-text-muted` → värdet
  // `text-body`. Förut var namn och fältetikett nästan lika tunga.
  if (protoAktiv) {
    return (
      <li className="flex min-w-0 flex-col gap-2">
        {/* Namnraden står UTANFÖR kortet — DetaljGrupp:s h2-position. Den är
            medvetet INGEN rubrikelement: fjorton syskon-rubriker under en enda
            `<h2>` vore en semantisk lögn (samma skäl som rev sr-only-rubriken
            i CI-fångsten nedan), och listan är redan en `<ul>` med poster. */}
        <div className="flex items-center justify-between gap-3 px-4">
          {registration.personId ? (
            <Link
              to="/personer/$personId"
              params={{ personId: registration.personId }}
              className="min-w-0 font-semibold text-lg underline-offset-2 hover:underline"
            >
              {namn}
            </Link>
          ) : (
            <span className="min-w-0 font-semibold text-lg">{namn}</span>
          )}
          {/* `StatusBadge` ersätter den handrullade pillen: samma tillstånd
              hade förut TVÅ former i appen — `bg-error-bg`/`text-error` här
              mot `<StatusBadge ton="warning">` på anmälnings-sidan
              (AnmalanDetail.tsx:341). Ett ord, en färg, hela appen.
              StatusBadge är märkt [BIBLIOTEKS-KANDIDAT] med promovering till
              `primitives/` "vid andra konsumenten" — detta ÄR den andra. */}
          {(protoObekraftad || protoKategoriPill) && (
            <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {protoObekraftad && <StatusBadge ton="warning">Obekräftad</StatusBadge>}
              {/* KATEGORI-PILLEN FÅR KONTUR (våg 15, Marcus 2026-08-06: "vi
                  måste lösa pill-färgen på de som är gråa för de syns ju inte
                  alls just nu").

                  Han hade rätt, och mätningen gjorde det värre än "syns dåligt":
                  pillen bar `bg-bg-muted` OCH stod på namnraden, som ligger
                  UTANFÖR kortet på arbetsytans egen `bg-bg-muted`-botten. Båda
                  mättes till rgb(245,245,243) — KONTRAST 1.00, alltså
                  matematiskt osynlig. Bara texten syntes; kapseln fanns inte.
                  Exakt samma fel som personkortet hade i våg 10, samma orsak.

                  FYLLNING KAN INTE LÖSA DET. Palettens neutraler ligger för
                  tätt — mot muted botten ger `bg-surface` 1.09,
                  `bg-bg-emphasized` 1.07 och `bg-bg-subtle` 1.04. Ingen av dem
                  läses som en form. KANTEN är den enda som bär: `border-border`
                  1.18, `border-border-strong` 1.60.

                  Därför vit fyllning PLUS kontur — outline-chip-formen
                  (Material/Polaris-idiomet för neutrala metadata-chips). Den
                  skiljer sig medvetet från `StatusBadge` bredvid, som klarar
                  sig utan kant eftersom dess TONADE bakgrund bär formen själv.
                  Två olika behov, inte två godtyckliga former.

                  Texten bär fortfarande ensam informationen (kontrast 7.25 mot
                  fyllningen) — konturen är formförstärkning, aldrig bärare, så
                  WCAG 1.4.11 gäller inte kapseln. `contrast-more` går till
                  `border-strong` + textfärg för dem som begärt högre kontrast. */}
              {protoKategoriPill && (
                <span className="rounded-full border border-border-strong bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-text-secondary contrast-more:text-text">
                  {protoKategoriPill}
                </span>
              )}
            </span>
          )}
        </div>
        {/* `bg-surface`, INTE `bg-bg-muted` som DetaljGrupp använder: arbetsytan
            är monterad INUTI en DetaljGrupp (Deltagare.tsx:s ArbetsKo), så
            underlaget är redan muted — ett muted kort på muted botten är
            osynligt (mätt i browsern 2026-08-06: första formen försvann helt).
            Samma val som AnmalanDetail:s noterings-ruta gör inuti sin grupp. */}
        <div className="divide-y divide-border rounded-2xl border border-transparent bg-surface px-4 contrast-more:border-border-strong">
          <BetalningsLasRad
            registration={registration}
            betalning="avgift"
            vald={avgiftKlar(registration)}
            notering={registration.noteringAnmalningsavgift ?? null}
            mutationer={mutationer}
            protoDataMode={protoDataMode}
          />
          {registration.slutbetalning === PaymentStatus.EJ_RELEVANT ? (
            // Ej relevant får radens form men ALDRIG ett kryss — en av-bock
            // hade skrivit 'Ej mottagen' och rivit basens semantik (befintligt
            // öppet skiv-beslut, oförändrat).
            //
            // Våg 13: raden följer med när höger-slotten rivs. Den var det
            // enda som stod kvar högerställt när alla andra rader blev
            // vänsterställda, och en ensam höger-kolumn läser som att något
            // fattas i de andra. `pl-7` = kryssets 20 px + gap-2:s 8 px, så
            // ordet "Slutbetalning" står på exakt samma vänsterlinje som
            // grannradernas etiketter trots att kryssrutan saknas.
            <p className="my-0 py-3 pl-7 text-small text-text-muted">
              Slutbetalning · Ej relevant (föreläsning)
            </p>
          ) : (
            <BetalningsLasRad
              registration={registration}
              betalning="slut"
              vald={registration.slutbetalning === PaymentStatus.MOTTAGEN}
              notering={registration.noteringSlutbetalning ?? null}
              mutationer={mutationer}
              protoDataMode={protoDataMode}
            />
          )}
          {/* UTSKICKSLOGGEN (våg 11). Vägen hit i två steg, båda värda att
              minnas: punkt 7 sa att historiken "hängde i luften" och fick en
              `md:w-60`-LÅDA bredvid personen; våg 10 rev lådan och gjorde den
              till en etikett-värde-rad i kortet. Raden löste svävandet men
              gjorde historiken till ett VÄRDE — och en logg är ingen
              värde-slot: fyra utskick högerställda i en `dd` blir en klump
              utan tidsaxel, vilket är exakt vad Marcus såg när han sa att den
              "måste bli och se ut mer som en utskickslogg".

              RUBRIKEN ÄR RIVEN (våg 12, Marcus 2026-08-06: "'Utskick' kan vi
              ta bort, det sabbar designen och jag tror man fattar ändå. Men
              behåll … tom yta liksom så vi behåller luft där").

              Han har rätt i att den var överflödig: varje nod säger redan
              "Bekräftelse skickad" / "Påminnelse om slutbetalning", så ordet
              Utskick upprepade bara vad de fyra raderna under den redan sa —
              och det gjorde det med en fjärde textvikt (`font-medium
              text-caption`) i ett kort som redan bar tre.

              LUFTEN ÄR KVAR, exakt som beställt: `pt-8` ersätter rubrikens
              forna höjd (`pt-3` + ~18 px radhöjd ≈ 30 px, mot 32 px nu), så
              avståndet från avdelaren ner till första noden är oförändrat.
              Tomrummet är alltså inte en glömd rubrik — det är rubrikens
              plats, medvetet lämnad tom.

              A11y: INGEN ersättnings-etikett alls, och det är ett medvetet
              val efter två avvisade försök. En sr-only-rubrik är utesluten —
              den som stod på denna yta rev två CI-grindar samtidigt (axe
              `heading-order` + Playwrights strict mode, se kommentaren längre
              upp i filen). Ett `role="group"` + `aria-label` avvisades av
              `lint/a11y/useSemanticElements`, som kräver `<fieldset>` — och
              fieldset kräver `<legend>`, alltså en synlig rubrik igen: exakt
              det Marcus rev.

              Men etiketten behövs faktiskt inte. `Tidslinje` renderar en
              `<ol>` där varje nod läses "Bekräftelse skickad, 20 juni kl.
              11:00" — orden bär sitt eget sammanhang, och listan sitter redan
              inuti personens `<li>`. Marcus "man fattar ändå" gäller
              skärmläsaren lika mycket som ögat. Att lägga på en etikett här
              hade varit samma garderings-reflex som gav sr-only-rubriken. */}
          {utskickslogg.length > 0 ? (
            <div className="flex flex-col pt-8">
              <Tidslinje handelser={utskickslogg} />
            </div>
          ) : (
            // Tom logg: frånvaron måste sägas rakt ut (annars läses tomrummet
            // som ett renderingsfel) — men UTAN etikett, samma rivning som
            // ovan. Etikett-värde-formen som stod här gav ett högerställt
            // "Inget skickat ännu" mot ett vänsterställt "Utskick", alltså
            // exakt de två ord Marcus rev.
            //
            // `pt-8` = samma luft som logg-grenen. `pl-11` = Tidslinjes
            // ikon-cirkel (32 px) + dess `gap-3` (12 px), så texten står
            // precis där en nodtext hade stått — de två grenarna läser som
            // samma yta i två tillstånd, inte som två olika layouter.
            // Texten säger vad rutan ÄR, inte bara att den är tom (Marcus våg
            // 14). "Inget skickat ännu" ensamt förutsatte att läsaren redan
            // visste vad ytan under betalningarna var till för — och rubriken
            // som hade sagt det revs i våg 12. Meningen bär nu båda: vad som
            // kommer stå här, och att inget gör det ännu.
            <div className="pt-8 pb-3">
              <p className="my-0 pl-11 text-small text-text-muted">
                Utskickslogg visas här — inget skickat ännu till denna person
              </p>
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-3">
        {registration.personId ? (
          <Link
            to="/personer/$personId"
            params={{ personId: registration.personId }}
            className="min-w-0 font-medium text-body underline-offset-2 hover:underline"
          >
            {namn}
          </Link>
        ) : (
          <span className="min-w-0 font-medium text-body">{namn}</span>
        )}
        {/* [PROTOTYPE] [S93] fråga 7 — bekräftelseläge + kategori, samma
          pill-form som Anmälda deltagares kort (KATEGORI_PILL-formen).

          PUNKT 5 (Marcus 2026-08-06): "pillen behöver flyttas ut och sitta på
          samma rad som namnet fast till höger." Pillarna låg förut på en EGEN
          rad under namnet (`li`:ns flex-col staplade dem), vilket kostade en
          radhöjd per person och lämnade högerkanten tom. Namnraden är nu en
          egen flex-rad: namn till vänster, pillar högerställda. Samma
          namn-till-vänster/status-till-höger-form som registrets kort. */}
        {(protoObekraftad || protoKategoriPill) && (
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
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
      </div>
      {/* [PROTOTYPE] [S93] ITERATIONSVÅG — TVÅ ZONER, inte en staplad kolumn.
          ARBETE till vänster (kryss · notering · påminn — OFÖRÄNDRADE, Marcus
          krav på bevarad tydlighet) och SKICKAT till höger.

          Skälet är att de två svarar på olika frågor och konkurrerar när de
          staplas: betalningslinjerna är HANDLING, historiken är LÄSNING. När
          Lotta jagar en obetald vill hon se "har jag redan skickat något till
          Anna?" utan att tappa kryssrutan ur blick — staplat hamnar svaret
          under fingret, i sidled står det bredvid. Med 16 personer i listan är
          skillnaden hela ytans läsbarhet.

          `md:` — på smala skärmar faller höger zon under vänster, oförändrad
          ordning. Zonerna bär INGA rubrikelement — se kommentarerna nedan för
          vad som stod här och varför två CI-grindar rev det. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
        {/* CI-FÅNGST (körning 31084229170, larm #821/#824/#825 — rapporterad
            via S96): den sr-only-rubrik som stod här RÖK TVÅ GRINDAR samtidigt
            och är därför borttagen, inte nedgraderad.

            (a) `axe` heading-order: den var en `<h4>` direkt under
                `DetaljGrupp`s `<h2>` — nivåhopp, "Heading levels should only
                increase by one".
            (b) Playwrights strict mode: dess text bar PERSONENS NAMN, så
                `getByText('Eva Lindqvist')` inom Betalningar-sektionen matchade
                tre element i stället för ett och fällde mark-paid-testet.

            Rubriken tillförde inget som inte redan fanns: varje betalningslinje
            bär sin egen etikett via kryssets `aria-label` ("Anmälningsavgift
            för <namn>"), så zonen var aldrig onavigerbar utan den. Den var min
            gardering, och den kostade två grindar. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <BetalningsLinje
            registration={registration}
            betalning="avgift"
            eventNamn={eventNamn}
            vald={avgiftKlar(registration)}
            notering={registration.noteringAnmalningsavgift ?? null}
            mutationer={mutationer}
            protoDataMode={protoDataMode}
            protoAktiv={protoAktiv}
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
              protoAktiv={protoAktiv}
            />
          )}
        </div>
        {/* PUNKT 7 (Marcus 2026-08-06): "Utskickshistoriken behöver ju få en
            egen ruta liksom, nu hänger de liksom i luften bara."

            Zonen bar bara text på arbetsytans egen botten — utan avgränsning
            läser den som löst svävande rader bredvid kryssen, inte som ett eget
            innehållsstycke. Den får nu kortets etablerade tonala form
            (`rounded-xl` + `bg-bg-muted` + inset), samma grammatik som
            filterpanelen och åtgärds-korten på sidan; ingen ny form mintas.

            Rubriken är INTE längre sr-only: när zonen är en egen ruta behöver
            den en synlig rubrik för att rutan ska betyda något — annars är det
            bara en grå låda med datum i. */}
        <div className="flex shrink-0 flex-col gap-1.5 rounded-xl bg-bg-muted p-3 md:w-60">
          {/* Samma CI-fångst: detta var också en `<h4>` under `<h2>`. Den är
              nu en vanlig `<p>`, INTE en `<h3>` — en rubrik per person hade
              gett fjorton syskon-rubriker under en enda h2 utan att personen
              själv är en rubriknivå, vilket är en semantisk lögn även när axe
              råkar vara nöjd. Rutan bär sin egen avgränsning visuellt, och
              listan under är en riktig `<ul>` med sina egna poster. */}
          <p className="font-medium text-caption text-text-secondary">Skickat</p>
          {utskick.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {utskick.map((post) => (
                <li
                  key={post.key}
                  className="flex items-center gap-1.5 text-caption text-text-muted"
                >
                  <MailCheck aria-hidden="true" size={12} className="shrink-0" />
                  {post.text}
                </li>
              ))}
            </ul>
          ) : (
            // Frånvaron är informationen (K42-andan) — men i en RESERVERAD ruta
            // måste den sägas, annars läses tomrummet som ett renderingsfel.
            <p className="text-caption text-text-muted">Inget skickat ännu</p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Arbetsytan (K29–K30): flikar i familje-kapseln (Saknar betalning / Klara —
 * räknarna följer kryssen live) + deadline-STATUS-BADGEN (listkortens
 * status-slot-form: bg-surface-pill + statusfärgad text) + person-listan.
 * Kryssen flyttar personen mellan flikarna direkt (optimistisk cache).
 *
 * EXPORTERAD sedan konvergens-passet (S93 Del 3 beslut 1): Betalningar som
 * TOPPNIVÅ-block försvinner i variant-läge — denna arbetsyta (oförändrad;
 * "Återanvänd befintliga komponenter — flytta montering, skriv inte om")
 * monteras i stället inuti Anmälda deltagare (`Deltagare.tsx`s `ArbetsKo`),
 * fällbar under registret, bakom samma `DetaljRad`. Deadline-badgen ovan
 * följer därmed automatiskt med — den renderas HÄR, oberoende av vem som
 * monterar komponenten.
 */
export function BetalningsDetaljer({
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
        // [PROTOTYPE] [S93] ITERATIONSVÅG 10 — korten separeras av LUFT, inte
        // av hårstreck: när varje person bär en egen kortyta blir en avdelare
        // emellan en andra gräns runt samma sak (DetaljGrupp-formen på
        // anmälnings-sidan har samma gap-4 mellan grupperna).
        <ul className={protoAktiv ? 'flex flex-col gap-4' : 'divide-y divide-border'}>
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
  // [PROTOTYPE] [S93] S96 review-fix — aggregatet kommer nu ur den DELADE
  // `betalningsSplit` (hallplats-steg-prototyp.ts), samma funktion
  // `Deltagare.tsx`:s hållplats-topp anropar. Se funktionens docblock för
  // rotorsaken till varför `slutMottagna` tidigare kunde divergera härifrån.
  const {
    avgifterMottagna,
    avgifterSaknas,
    slutMottagna,
    slutSaknas: slutSaknasAntal,
  } = betalningsSplit(aktiva);
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
  const protoAktiv = import.meta.env.DEV && isHallplatsVariant(variantParam);

  // [PROTOTYPE] [S93] konvergens-pass (Del 3 beslut 1): Betalningar FÖRSVINNER
  // som eget toppnivå-block i variant-läge — dess arbetsyta (`BetalningsDetaljer`,
  // oförändrad) monteras i stället INUTI Anmälda deltagare, se
  // `Deltagare.tsx`s `ArbetsKo` ("Öppna detaljer", fällbar under registret).
  // Skarpa vyn (`protoAktiv` alltid false här) är helt opåverkad av detta —
  // returnen träffar bara variant-läget.
  if (protoAktiv) return null;

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
        <BetalningsInnehall event={event} registreringar={data} />
      )}
    </DetaljGrupp>
  );
}
