/**
 * [PROTOTYPE] [S100] DOKUMENT-YTAN — Mer-ytan där bilagor förvaltas (`T131`).
 *
 * FRÅGAN SOM BESVARAS (throwaway-kontraktet klausul i):
 *   "Vilken form ska Dokument-ytan ha — den yta som förvaltar det
 *    bilageväljaren på åtgärds-sidan visar?"
 *
 * VARFÖR DEN BYGGS I SAMMA SESSION SOM ÅTGÄRDS-SIDAN (underlaget § 9,
 * Marcus-beslut 2026-08-07): bilageväljaren visar det den här ytan förvaltar.
 *
 * [TASK-147.6, SKÄRPT MOT VERKLIGT FUNDAMENT, VARV 1] Ursprungsformen
 * (S100/T131) hade tre klass-grupper fyllda med PÅHITTADE stubbar och läste
 * ingen data. Fundamentet (TASK-146.4 adapter + TASK-146.5 klass B-
 * generering) finns nu — denna version läser VERKLIG data och laddar
 * VERKLIGT upp, men avtäckte samtidigt att prototypens tre premisser inte
 * håller mot det byggda fundamentet. De tre fynden nedan är kortets
 * GRANSKNINGSUNDERLAG (AC #2) — inte gissningar, varje rad är verifierad
 * mot koden som refereras.
 *
 * FYND 1 — KLASS A/B ÄR STRUKTURELLT ODELBARA I DATAN, INTE BARA I UI:t.
 * Bilagor-tabellen (TASK-146.2) bär inget dokumentklass-fält
 * (`supabase/functions/get-event-attachments/index.ts` § filhuvud,
 * `Attachment.ts` § docblock). `fetchEventAttachments(eventId)` returnerar
 * DÄRFÖR alla rader länkade till eventet oavsett hur de uppstod — uppladdad
 * (klass A) och event-mallat genererad (klass B) är omöjliga att skilja åt
 * i den data adaptern faktiskt ger. Denna yta gissar därför INTE en klass
 * ur filnamnsmönster (`generate-event-attachment/index.ts` bygger
 * `Namn = "Deltagarinformation – {eventlabel}.pdf"`, ett tekniskt sett
 * matchbart mönster) — en sådan heuristik hade sett ut som riktig
 * klassificering utan att vara det, och en Lotta-fil som råkar heta likadant
 * hade klassats fel. DATAGRUNDEN för en riktig klass-etikett landar via
 * TASK-147.12 (dokumentklass-fältet); den här ytans filterrad (nedan) är
 * byggd så den tar emot fältet UTAN ombyggnad den dagen det finns.
 *
 * [RÄTTAD, TASK-147.12] Fynd 1 var sant vid S100/147.6-byggtillfället — det
 * är HISTORIA nu, inte längre tillstånd. Marcus-GO 2026-08-16 (ADR-063,
 * "defekten löses I BASEN"): Bilagor-tabellen bär numera `Dokumentklass`
 * (additivt fält, staging), och `Attachment.dokumentklass` bär den VERKLIGA
 * klassen — ingen filnamns-heuristik, en riktig kolumn. Varje rad nedan visar
 * därför sin faktiska klass (eller "Okänd" — ärligt, inte gissat — för de
 * fåtal historiska rader som inte gick att härleda vid backfillen, se
 * scripts/backfill-bilagor-dokumentklass.mjs). Gruppnamnet "Bilagor för valt
 * event" är MEDVETET oförändrat: alla klasser hör fortfarande hemma i samma
 * lista, bara nu med en synlig etikett per rad i stället för att vara en
 * odelbar massa.
 *
 * FYND 2 — BILAGE-FUNDAMENTET ÄR EVENT-SCOPAT, INTE ETT GLOBALT BIBLIOTEK.
 * `uploadAttachment` kräver `eventId` (obligatoriskt fält,
 * `UploadAttachmentInput`), och `fetchEventAttachments` läser EN händelses
 * omvända länk — adaptern har ingen "alla bilagor oavsett event"-metod.
 * Ytan bär därför en eventväljare (samma `EventValjare`-komponent som
 * Åtgärds-sidan och manuell anmälan) — ett REELLT formbeslut som följer av
 * fundamentet, inte ett estetiskt val.
 *
 * FYND 3 — "ANVÄNDS I N EVENT" ÄR INTE BYGGBART. Domänmodellen
 * (`Attachment.eventId`) läser bara FÖRSTA länkade eventet
 * (`mapAttachmentRecord`, `_shared/attachments.ts`) även om Airtable-fältet
 * tekniskt är `multipleRecordLinks` — och ingen adapter-metod lägger någonsin
 * till fler länkar på en befintlig rad. Prototypens `anvandsI`-räknare är
 * därför borttagen snarare än fejkad.
 *
 * "ERSÄTT" (AC #1) — byggd UTAN ny backend-yta, ÄN. Adaptern saknar ett
 * delete/replace-primitiv (`DataSourceAdapter.ts` bär bara `uploadAttachment`
 * + `fetchEventAttachments`, `grep -n delete` = 0 träffar) — en ny
 * uppladdning med SAMMA `Namn` grupperas därför klient-sidigt som en nyare
 * version av samma rad (`grupperaPerNamn` nedan); den gamla raden finns kvar
 * i Airtable (additivt, ADR-063) men visas bara som en daterad "Ersatte en
 * tidigare version"-notis under den nya. HEURISTIK, ÖPPET BOKFÖRD: gruppering
 * sker på exakt filnamns-match, inte ett riktigt `ersätter`-fält. Djupet är
 * EN nivå (prototypens exakta `ersatte?: string`-fält, aldrig en kedja) — se
 * `grupperaPerNamn`s egen kommentar. Den ÄKTA server-sidiga ersätt/radera-
 * ytan (EF + adapter-metod, ingen skräprad kvar i Airtable) landar via
 * TASK-147.11 — denna fils klient-gruppering rörs inte av det kortet, den
 * FASAS UT först när 147.11 kopplar in sin egen mutation här.
 *
 * KLASS B/C (mallar/generatorer): FORTFARANDE stubbar, MEDVETET — de är
 * kod-nivå-KATALOGER (vilken mall/generator som FINNS), inte instans-listor.
 * Att lista VERKLIGA genererade instanser hade krävt samma klass-gissning
 * Fynd 1 avvisar. Uppdragets AC #1 begränsar "uppladdning + ersättning" till
 * klass A uttryckligen — mallar/generatorer rörs inte här.
 *
 * READ-ONLY FÖR KLASS B/C: ingen handling där skriver något (oförändrat
 * sedan S100).
 *
 * VERKLIG FÖRDELNING (live, staging, fixturhändelsen recIFrxHZw165ycXk, mätt
 * 2026-08-16 via get-event-attachments-EF:n direkt): 12 riktiga Bilagor-rader
 * — 9 unika "ZZ-attachment-test-*.pdf" (klass A-liknande, TASK-146.4:s egna
 * staging-sentineler) + 3 st "Deltagarinformation – ZZ-belaggning-fixtur..."
 * (klass B, TASK-146.5:s genererings-sentineler, alla identiskt namn). INGEN
 * äkta Lotta-skapad bilaga finns ännu i staging — hela den mätta fördelningen
 * är testsviternas egna sentineler.
 *
 * [TASK-147.6, SKÄRPNINGSVARV 2 — HUSETS FORM, 2026-08-16] Marcus underkände
 * varv 1 (uppdragstexten, 2026-08-16: "prototypen måste byggas EXAKT som det
 * kommer se ut i prod-appen — SNYGGT, PROFFSIGT, ENKELT") på fyra punkter,
 * alla åtgärdade i detta varv:
 *
 *  1. SIDKROM SAKNADES HELT (ingen chevron, ingen sidgrund). Stulet verbatim
 *     ur `AktivitetsHistorik.tsx`s krom
 *     (`components/aktivitetshistorik/AktivitetsHistorik.tsx` § `kromKnapp`,
 *     S106-omdesignen, Marcus-godkänd 2026-08-15,
 *     `tasks/sessions/bilagor/s106-aktivitetslogg/facit.json`) — SAMMA
 *     nav-djup som denna yta (`/mer`-leaf), senaste husfacit: rund
 *     `size-11 bg-bg-muted`-chevron (`ChevronLeft 26`) tillbaka till `/mer`,
 *     `<header className="flex flex-col gap-1">` med `h1 font-semibold
 *     text-3xl`, ingen undertext. `AtgardsSida.tsx`s `Sidhuvud`
 *     (§ Sidhuvud, `border-b` + `mx-4`-chevron, Åtgärds-sidan, den ANDRA
 *     mönsterkällan) vägdes som andra kandidat men förkastades HÄR: den bär
 *     en extra `px-4`/`mx-4`-nivå ovanpå `AppShell`s egen `main`-padding
 *     (`px-4 py-4`, `AppShell.tsx`), vilket hade dubblat sidmarginalen —
 *     samma dubbleringsfel `MailLog.tsx`/`Intresserade.tsx` bär (den ÄLDRE
 *     `<section className="… p-4">`-konventionen, oförändrad sedan före
 *     S106 och exakt formen denna fil själv bar till och med varv 1).
 *     `AktivitetsHistorik`s krom har INGEN egen sidopadding — rätt mot
 *     `AppShell`, och den formen ärvs här verbatim.
 *
 *  2. PROTOTYP-/META-TEXT I UI:T (fynd-rutan "Om datan i denna prototyp" +
 *     slutraden "Prototyp. Bilagor + uppladdning är verkliga …") ÄR RIVNA ur
 *     den renderade ytan. Fynden 1–3 ovan och ersätt-heuristikens gräns
 *     finns KVAR — i DENNA docblock och i kortets Implementation Notes
 *     (task-147.6, backlog-CLI:t) — Lotta ser dem aldrig. Ytan visar bara
 *     det hon ska se: filnamn, storlek, datum, en Ersätt-knapp.
 *
 *  3. FORMEN VAR TVÅ, ÄR NU LÅST TILL EN. Marcus-GO (uppdraget, 2026-08-16,
 *     på orkestrerarens rekommendation): "listan är formen." `?form=grupper`/
 *     `?form=lista`-växeln och `DokumentGrupper`-funktionen (tre klass-
 *     grupper) är RIVNA (git bevarar historiken,
 *     `git log -p -- src/components/dokument/DokumentYta.tsx`) — bara den
 *     tidigare "lista"-formens flata, filtrerbara lista kvarstår, aldrig
 *     bakom en växel.
 *
 *  4. OLIKA BREDA KONTROLLER. Typ-filtret (`ListaTyp`, `LISTA_FILTER`) bär
 *     nu `spread` (`ToggleButtonGroup`-primitivens likbredds-läge, ADR-044)
 *     + `min-h-11` per pill — samma touch-target-golv som
 *     `AktivitetsHistorik`s tidsperiod-toggel bär (den filens egen kommentar:
 *     "`size='sm'` ensamt gav 37 px, under 44 px-golvet"). Med
 *     Visningsform-växeln riven (punkt 3) finns bara EN `ToggleButtonGroup`
 *     kvar på ytan — den tidigare bredd-sågtanden mellan två olika breda
 *     växlare på samma yta är därmed strukturellt omöjlig, inte bara fixad.
 *     Button-raderna (`Ersätt`/`Visa`) bar redan enhetlig `ghost`/`sm` sedan
 *     varv 1, oförändrat.
 *
 * DEV-GRINDEN (`mer/index.tsx` § `visaDokumentPrototyp`) och `[PROTOTYPE]`-
 * märkningen ovan RÖRS INTE av detta varv — facit-låset (AC #3, task-147.6,
 * stämpel via !-kanalen ADR-104) är Marcus egen morgonhandling, skild från
 * detta skärpningsvarv.
 *
 * KASTBAR: koden absorberas ALDRIG (klausul iv).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, FileText, Sparkles, Upload, UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { FileTrigger } from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { formatMB } from '@/data/adapters/attachmentUpload';
import { useUploadAttachment } from '@/data/mutations/useUploadAttachment';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { queryKeys } from '@/queries/keys';

/* ------------------------------------------------------------------ *
 * KLASS B/C — KOD-NIVÅ-KATALOGER, INTE INSTANS-LISTOR (se Fynd 1 ovan).
 * Oförändrade sedan S100: mall-editorn är uttryckligen senare (PRD task-146
 * § Utanför omfattningen) och kvittogenereringen (klass C) hör till
 * TASK-147.7, obyggd.
 * ------------------------------------------------------------------ */

type Mall = {
  id: string;
  namn: string;
  /** Vilka eventfält mallen fyller i — det som gör den till en MALL. */
  fyllerI: string[];
};

const MALLAR: Mall[] = [
  {
    id: 'b1',
    namn: 'Deltagarinformation',
    fyllerI: ['Eventnamn', 'Datum', 'Ort', 'Lokal', 'Starttid'],
  },
];

type Generator = {
  id: string;
  namn: string;
  /** Vilka uppgifter filen byggs ur — per person. */
  byggsUr: string[];
};

const GENERATORER: Generator[] = [
  {
    id: 'c1',
    namn: 'Betalningskvitto',
    byggsUr: ['Namn', 'E-post', 'Betalt belopp', 'Betaldatum', 'Eventnamn'],
  },
];

/** Full precision, Gunilla-läsbart — samma format som Anteckningar.tsx § ANTECKNING_TID. */
const DATUM_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * En rad i listan — den verkliga, senaste versionen av en fil, plus (om en
 * tidigare version med SAMMA `Namn` fanns) datumet den ersatte. Se filhuvudets
 * "ERSÄTT"-stycke för heuristikens gräns.
 */
type BilageRad = { current: Attachment; ersatte?: Attachment };

/**
 * Grupperar VERKLIGA `fetchEventAttachments`-rader per filnamn. Listan
 * kommer redan sorterad nyast-först från servern (`get-event-attachments`
 * § kommentar "Nyast först") — första träffen per namn är därför garanterat
 * den senaste, ingen omsortering behövs inom gruppen.
 */
function grupperaPerNamn(attachments: readonly Attachment[]): BilageRad[] {
  const perNamn = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const lista = perNamn.get(a.namn);
    if (lista) lista.push(a);
    else perNamn.set(a.namn, [a]);
  }
  const rader: BilageRad[] = [];
  for (const lista of perNamn.values()) {
    rader.push({ current: lista[0], ersatte: lista[1] });
  }
  // Nyast övergripande överst (sekundär sort — grupperingen kan ha blandat
  // ordningen mellan olika namn).
  rader.sort((a, b) => (a.current.skapad < b.current.skapad ? 1 : -1));
  return rader;
}

export function DokumentYta() {
  const dataSource = useDataSource();
  const [eventId, setEventId] = useQueryState('event');

  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const valtEvent = eventsQuery.data?.find((e) => e.id === eventId);

  const attachmentsQuery = useQuery({
    queryKey: queryKeys.attachments.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchEventAttachments(eventId ?? ''),
    enabled: eventId != null,
  });

  const uploadMutation = useUploadAttachment(eventId ?? '');

  const rader = useMemo(
    () => grupperaPerNamn(attachmentsQuery.data ?? []),
    [attachmentsQuery.data],
  );

  const handleUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="dokument-yta">
      {/* HUSETS SIDKROM — stulet verbatim ur AktivitetsHistorik.tsx § kromKnapp
          (S106-facitet). Se filhuvudets skärpningsvarv 2, punkt 1, för varför
          AtgardsSida.tsx § Sidhuvud (den andra mönsterkällan) INTE ärvs här. */}
      <Link
        to="/mer"
        aria-label="Tillbaka till Mer"
        className="flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Dokument</h1>
      </header>

      {/* Eventväljaren (Fynd 2): fundamentet är event-scopat, så ytan
          behöver ett valt event innan verklig data kan hämtas. Samma
          delade komponent som Åtgärds-sidan/manuell anmälan (kontextrad-
          formen). Tomt läge tills Marcus/Lotta väljer — ingen fixtur
          default-vald här. */}
      <EventValjare
        valtEventId={eventId ?? undefined}
        valtEvent={valtEvent}
        onByte={(id) => void setEventId(id)}
      />

      {eventId == null ? (
        <p className="text-small text-text-muted">Välj ett event för att se dess bilagor.</p>
      ) : attachmentsQuery.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Laddar bilagor…</span>
          <Skeleton variant="listRow" />
          <Skeleton variant="listRow" />
        </div>
      ) : attachmentsQuery.isError ? (
        <MessageBox intent="error" title="Kunde inte hämta bilagor">
          {attachmentsQuery.error instanceof Error ? attachmentsQuery.error.message : 'Okänt fel.'}
        </MessageBox>
      ) : (
        <DokumentLista rader={rader} onUpload={handleUpload} uploadMutation={uploadMutation} />
      )}
    </div>
  );
}

/** Metaraden under namnet — bara verkliga fält (storlek, uppladdad-datum). */
function MetaRad({ delar }: { delar: (string | null)[] }) {
  const text = delar.filter(Boolean).join(' · ');
  if (!text) return null;
  return <span className="text-caption text-text-muted">{text}</span>;
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;

function BilageRadRow({
  rad,
  onUpload,
  uploadMutation,
}: {
  rad: BilageRad;
  onUpload: (files: FileList | null) => void;
  uploadMutation: UploadMutation;
}) {
  const { current, ersatte } = rad;
  return (
    <div data-testid="dokument-fil" className="flex items-start gap-3 py-3">
      <FileText aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{current.namn}</span>
        <MetaRad
          delar={[
            // [TASK-147.12] Verklig klass — se filens docblock (Fynd 1,
            // RÄTTAD). "Okänd" är en ÄRLIG etikett (Gunilla-principen), inte
            // en gissning: den betyder "backfillen kunde inte härleda den
            // här raden", aldrig "vi vet men visar det inte".
            `Klass: ${current.dokumentklass ?? 'Okänd'}`,
            formatMB(current.storlekBytes),
            `Uppladdad ${DATUM_TID.format(new Date(current.skapad))}`,
          ]}
        />
        {ersatte && (
          <span className="text-caption text-text-secondary">
            Ersatte en tidigare version från {DATUM_TID.format(new Date(ersatte.skapad))}
          </span>
        )}
      </span>
      <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={onUpload}>
        <Button intent="ghost" size="sm" isDisabled={uploadMutation.isPending}>
          Ersätt
        </Button>
      </FileTrigger>
    </div>
  );
}

function MallRad({ mall }: { mall: Mall }) {
  return (
    <div data-testid="dokument-mall" className="flex items-start gap-3 py-3">
      <Sparkles aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{mall.namn}</span>
        <MetaRad delar={[`Fyller i ${mall.fyllerI.join(', ').toLowerCase()}`]} />
      </span>
      <Button intent="ghost" size="sm">
        Visa
      </Button>
    </div>
  );
}

function GeneratorRad({ gen }: { gen: Generator }) {
  return (
    <div data-testid="dokument-generator" className="flex items-start gap-3 py-3">
      <UserRound aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{gen.namn}</span>
        <MetaRad delar={[`Byggs ur ${gen.byggsUr.join(', ').toLowerCase()}`]} />
      </span>
      <Button intent="ghost" size="sm">
        Visa
      </Button>
    </div>
  );
}

function UppladdningsFel({ uploadMutation }: { uploadMutation: UploadMutation }) {
  if (!uploadMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ladda upp filen">
      {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Okänt fel.'}
    </MessageBox>
  );
}

type ListaTyp = 'alla' | 'bilaga' | 'mall' | 'generator';

const LISTA_FILTER: { key: ListaTyp; label: string }[] = [
  { key: 'alla', label: 'Alla' },
  { key: 'bilaga', label: 'Bilagor' },
  { key: 'mall', label: 'Mallar' },
  { key: 'generator', label: 'Generatorer' },
];

/**
 * DOKUMENT-LISTAN — sedan skärpningsvarv 2 den ENDA formen (Marcus-GO,
 * filhuvudets punkt 3), inte längre en av två växlingsbara varianter. En
 * flat, filtrerbar lista: typ-chipsen filtrerar klient-sidigt över samma
 * `rader`/mallar/generatorer som tidigare — ingen ny data.
 *
 * FILTERRADEN (uppdraget: "husets uppdelade filterrad, historik-sidans
 * mönster") — `ToggleButtonGroup` med `spread` (likbredds-läge, ADR-044) på
 * EGEN rad ovanför listan, samma disciplin som `AktivitetsHistorik.tsx`
 * § `FilterRad`s tidsperiod-toggel: `min-h-11` per pill håller 44 px-
 * touch-target-golvet (samma filens kommentar: "`size='sm'` ensamt gav
 * 37 px, under golvet").
 *
 * TYPFILTRETS DATAGRUND: `ListaTyp`/`LISTA_FILTER` filtrerar i dag bara på
 * VILKEN LISTA en rad kommer från (bilagor/mallar/generatorer) — inom
 * "Bilagor" finns ingen verklig klass-uppdelning ännu (Fynd 1, filhuvudet).
 * TASK-147.12 kopplar in den verkliga klassen; denna filterrad ändras inte
 * strukturellt den dagen, bara vad "Bilagor" i praktiken innehåller.
 */
function DokumentLista({
  rader,
  onUpload,
  uploadMutation,
}: {
  rader: BilageRad[];
  onUpload: (files: FileList | null) => void;
  uploadMutation: UploadMutation;
}) {
  const [filter, setFilter] = useQueryState('typ');
  const aktivtFilter: ListaTyp =
    filter === 'bilaga' || filter === 'mall' || filter === 'generator' ? filter : 'alla';

  const visaBilagor = aktivtFilter === 'alla' || aktivtFilter === 'bilaga';
  const visaMallar = aktivtFilter === 'alla' || aktivtFilter === 'mall';
  const visaGeneratorer = aktivtFilter === 'alla' || aktivtFilter === 'generator';

  return (
    <div className="flex flex-col gap-3">
      <ToggleButtonGroup
        label="Filtrera på typ"
        spread
        selectedKey={aktivtFilter}
        onSelectionChange={(key) => void setFilter(key === 'alla' ? null : key)}
      >
        {LISTA_FILTER.map((f) => (
          <ToggleButton key={f.key} id={f.key} size="sm" className="min-h-11">
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div
        data-testid="grupp-kort"
        className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
      >
        {visaBilagor &&
          rader.map((r) => (
            <BilageRadRow
              key={r.current.id}
              rad={r}
              onUpload={onUpload}
              uploadMutation={uploadMutation}
            />
          ))}
        {visaMallar && MALLAR.map((m) => <MallRad key={m.id} mall={m} />)}
        {visaGeneratorer && GENERATORER.map((g) => <GeneratorRad key={g.id} gen={g} />)}
        {visaBilagor && rader.length === 0 && !visaMallar && !visaGeneratorer && (
          <p className="py-3 text-small text-text-muted">Inga bilagor för det här eventet än.</p>
        )}
      </div>

      <UppladdningsFel uploadMutation={uploadMutation} />
      <div>
        <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={onUpload}>
          <Button intent="secondary" isDisabled={uploadMutation.isPending}>
            <Upload aria-hidden="true" size={16} className="shrink-0" />
            {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp en fil'}
          </Button>
        </FileTrigger>
      </div>
    </div>
  );
}
