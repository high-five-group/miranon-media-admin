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
 * [TASK-147.6, SKÄRPT MOT VERKLIGT FUNDAMENT] Ursprungsformen (S100/T131)
 * hade tre klass-grupper fyllda med PÅHITTADE stubbar och läste ingen data.
 * Fundamentet (TASK-146.4 adapter + TASK-146.5 klass B-generering) finns nu
 * — denna version läser VERKLIG data och laddar VERKLIGT upp, men avtäckte
 * samtidigt att prototypens tre premisser inte håller mot det byggda
 * fundamentet. De tre fynden nedan är kortets GRANSKNINGSUNDERLAG
 * (AC #2) — inte gissningar, varje rad är verifierad mot koden som
 * refereras.
 *
 * FYND 1 — KLASS A/B ÄR STRUKTURELLT ODELBARA I DATAN, INTE BARA I UI:t.
 * Bilagor-tabellen (TASK-146.2) bär inget dokumentklass-fält
 * (`supabase/functions/get-event-attachments/index.ts` § filhuvud,
 * `Attachment.ts` § docblock). `fetchEventAttachments(eventId)` returnerar
 * DÄRFÖR alla rader länkade till eventet oavsett hur de uppstod — uppladdad
 * (klass A) och event-mallat genererad (klass B) är omöjliga att skilja åt
 * i den data adaptern faktiskt ger. Det gäller BÅDA kandidatformerna lika:
 * varken tre klass-grupper eller "en lista med klass-filter" kan filtrera
 * på en klass som inte finns i datan. Denna yta gissar därför INTE en klass
 * ur filnamnsmönster (`generate-event-attachment/index.ts` bygger
 * `Namn = "Deltagarinformation – {eventlabel}.pdf"`, ett tekniskt sett
 * matchbart mönster) — en sådan heuristik hade sett ut som riktig
 * klassificering utan att vara det, och en Lotta-fil som råkar heta likadant
 * hade klassats fel. Gruppen nedan heter därför "Bilagor för valt event",
 * inte "Uppladdade filer": den senare hade varit en osann etikett på rader
 * som kan vara genererade.
 *
 * FYND 2 — BILAGE-FUNDAMENTET ÄR EVENT-SCOPAT, INTE ETT GLOBALT BIBLIOTEK.
 * `uploadAttachment` kräver `eventId` (obligatoriskt fält,
 * `UploadAttachmentInput`), och `fetchEventAttachments` läser EN händelses
 * omvända länk — adaptern har ingen "alla bilagor oavsett event"-metod.
 * Prototypens ursprungsform (en ospecificerad global lista, "Uppladdade
 * filer" utan eventkontext) matchar alltså inte hur fundamentet faktiskt är
 * byggt. Ytan bär därför en eventväljare (samma `EventValjare`-komponent
 * som Åtgärds-sidan och manuell anmälan) — ett REELLT formbeslut som följer
 * av fundamentet, inte ett estetiskt val.
 *
 * FYND 3 — "ANVÄNDS I N EVENT" ÄR INTE BYGGBART. Domänmodellen
 * (`Attachment.eventId`) läser bara FÖRSTA länkade eventet
 * (`mapAttachmentRecord`, `_shared/attachments.ts`) även om Airtable-fältet
 * tekniskt är `multipleRecordLinks` — och ingen adapter-metod lägger någonsin
 * till fler länkar på en befintlig rad. Prototypens `anvandsI`-räknare är
 * därför borttagen snarare än fejkad.
 *
 * "ERSÄTT" (AC #1) — byggd UTAN ny backend-yta. Adaptern saknar ett
 * delete/replace-primitiv (`DataSourceAdapter.ts` bär bara `uploadAttachment`
 * + `fetchEventAttachments`, `grep -n delete` = 0 träffar) — att lägga till
 * ett sådant är ett nytt fält + ny EF-logik, alltså backend-arkitektur
 * utanför detta korts scope ("adapter-ytan från 146.4 ... finns SOM
 * FUNDAMENT", uppdraget). I stället: en ny uppladdning med SAMMA `Namn`
 * grupperas klient-sidigt som en nyare version av samma rad (`grupperaPerNamn`
 * nedan) — den gamla raden finns kvar i Airtable (additivt, ADR-063), men
 * visas bara som en daterad "Ersatte en tidigare version"-notis under den
 * nya. HEURISTIK, ÖPPET BOKFÖRD: gruppering sker på exakt filnamns-match,
 * inte ett riktigt `ersätter`-fält — två olika filer som råkar heta likadant
 * grupperas felaktigt ihop. Att stänga den luckan kräver ett nytt additivt
 * fält på Bilagor-tabellen, återigen backend-arkitektur utanför scope.
 * DJUPET ÄR EN NIVÅ (prototypens exakta `ersatte?: string`-fält, aldrig en
 * kedja): en TREDJE uppladdning med samma `Namn` gör den ÄLDSTA av de tre
 * osynlig i listan — den finns kvar i Airtable men varken som egen rad
 * (samma `namn` som en nyare rad) eller i "Ersatte …"-notisen (som bara
 * pekar på NÄST senaste). Live-verifierat 2026-08-16: "Deltagarinformation
 * – ZZ-belaggning-fixtur …" existerar i tre exemplar för fixturhändelsen
 * (andra kort i sviten har genererat den flera gånger) — exakt det scenariot.
 *
 * FORMVÄXELN (AC #2, "om det är praktiskt inom scope"): samma verkliga data
 * renderas i BÅDA kandidatformerna — `?form=grupper` (default, tre grupper,
 * prototypens ursprungsform) och `?form=lista` (en flat lista med
 * typ-filter, den avvisade formen ur prototypens eget docblock). DEV-gränsen
 * ärvs av routens befintliga gate (mer/index.tsx `visaDokumentPrototyp`) —
 * ingen ny build-time-spärr behövs, denna växel är samma ograndrade
 * prototyp-substrat som resten av ytan.
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
 * KASTBAR: koden absorberas ALDRIG (klausul iv).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { FileText, Sparkles, Upload, UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { FileTrigger } from 'react-aria-components';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
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
 * En rad i "Bilagor för valt event" — den verkliga, senaste versionen av en
 * fil, plus (om en tidigare version med SAMMA `Namn` fanns) datumet den
 * ersatte. Se filhuvudets "ERSÄTT"-stycke för heuristikens gräns.
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
  // Formväxeln (filhuvudets "FORMVÄXELN"): default = grupper (prototypens
  // ursprungsform, oförändrad utan query-param), `?form=lista` väljer den
  // avvisade alternativa formen. Egen `form`-axel, skild från `/mer`-index-
  // gatens `variant=dokument` (annan semantik, samma sida får inte läsa två
  // betydelser ur samma parameternamn).
  const [form, setForm] = useQueryState('form');
  const visaLista = form === 'lista';

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
    <section className="flex flex-col gap-4 p-4">
      <Link to="/mer" className="text-small underline">
        ← Tillbaka till Mer
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Dokument</h1>
        <p className="text-small text-text-muted">
          {MALLAR.length + GENERATORER.length} mallar/generatorer + bilagorna för valt event
        </p>
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

      {/* GRANSKNINGSUNDERLAGET (AC #2): verklig fördelning + de tre fynden
          synliga PÅ YTAN, inte bara i agentrapporten. */}
      <MessageBox intent="info" title="Om datan i denna prototyp">
        Bilagor-tabellen har inget dokumentklass-fält — klass A (uppladdad) och klass B
        (event-mallat genererad) syns identiska här och kan inte skiljas åt i UI:t heller (se filens
        docblock, Fynd 1). Listan nedan visar därför ALLA verkliga bilagor för valt event, oavsett
        hur de uppstod.
      </MessageBox>

      {/* Formväxeln — à la prototyp-konventionen (ADR-103-lagren), egen
          `form`-axel. `ToggleButtonGroup`-primitiven (ADR-044): exakt EN
          form vald alltid, radiogroup/radio-semantik, pilnavigering ingår
          gratis — samma verktyg som period-togglen. Den fulla
          PrototypeSwitcher-railen är byggd för flerdimensionell
          divergens/konvergens och vore överdimensionerad här. */}
      <ToggleButtonGroup
        label="Visningsform"
        selectedKey={visaLista ? 'lista' : 'grupper'}
        onSelectionChange={(key) => void setForm(key === 'lista' ? 'lista' : null)}
      >
        <ToggleButton id="grupper" size="sm">
          Grupper
        </ToggleButton>
        <ToggleButton id="lista" size="sm">
          Lista
        </ToggleButton>
      </ToggleButtonGroup>

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
      ) : visaLista ? (
        <DokumentLista rader={rader} onUpload={handleUpload} uploadMutation={uploadMutation} />
      ) : (
        <DokumentGrupper rader={rader} onUpload={handleUpload} uploadMutation={uploadMutation} />
      )}

      <p className="text-small text-text-muted">
        <strong className="font-medium">Prototyp.</strong> Bilagor + uppladdning är verkliga
        (TASK-146.4-fundamentet). Mallar/generatorer nedan är kod-nivå-kataloger, inte listade
        instanser (se filens docblock).
      </p>
    </section>
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

/** Förklaringsraden per grupp — Gunilla-principen: inget antas känt. */
function GruppText({ children }: { children: string }) {
  return <p className="py-3 text-small text-text-secondary">{children}</p>;
}

function UppladdningsFel({ uploadMutation }: { uploadMutation: UploadMutation }) {
  if (!uploadMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ladda upp filen">
      {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Okänt fel.'}
    </MessageBox>
  );
}

/**
 * FORM "GRUPPER" — prototypens ursprungsform (S100): tre grupper, en per
 * dokumentklass. Klass A-gruppen ("Bilagor för valt event", omdöpt ur
 * "Uppladdade filer" — se filhuvudets Fynd 1) bär nu VERKLIG data; B/C är
 * kod-nivå-kataloger (oförändrade).
 */
function DokumentGrupper({
  rader,
  onUpload,
  uploadMutation,
}: {
  rader: BilageRad[];
  onUpload: (files: FileList | null) => void;
  uploadMutation: UploadMutation;
}) {
  return (
    <div className="flex flex-col gap-6">
      <DetaljGrupp id="grupp-bilagor" rubrik="Bilagor för valt event">
        <GruppText>
          Alla verkliga bilagor för eventet — uppladdade och event-mallat genererade syns identiska
          (Fynd 1, filens docblock).
        </GruppText>
        {rader.length === 0 && (
          <p className="py-3 text-small text-text-muted">Inga bilagor för det här eventet än.</p>
        )}
        {rader.map((r) => (
          <BilageRadRow
            key={r.current.id}
            rad={r}
            onUpload={onUpload}
            uploadMutation={uploadMutation}
          />
        ))}
        <UppladdningsFel uploadMutation={uploadMutation} />
        <div className="py-3">
          <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={onUpload}>
            <Button intent="secondary" isDisabled={uploadMutation.isPending}>
              <Upload aria-hidden="true" size={16} className="shrink-0" />
              {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp en fil'}
            </Button>
          </FileTrigger>
        </div>
      </DetaljGrupp>

      <DetaljGrupp id="grupp-mallar" rubrik="Event-mallar">
        <GruppText>
          Brev där eventets egna uppgifter fylls i automatiskt. Alla på samma event får samma brev.
        </GruppText>
        {MALLAR.map((m) => (
          <MallRad key={m.id} mall={m} />
        ))}
      </DetaljGrupp>

      <DetaljGrupp id="grupp-genererade" rubrik="Skapas för varje person">
        <GruppText>
          Byggs på plats ur personens egna uppgifter. Skickar du till sex personer skapas sex olika
          filer - en åt var och en.
        </GruppText>
        {GENERATORER.map((g) => (
          <GeneratorRad key={g.id} gen={g} />
        ))}
      </DetaljGrupp>
    </div>
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
 * FORM "LISTA" — den avvisade alternativa formen ur prototypens eget
 * docblock ("en lista med klass-filter"), byggd här för att göra
 * formfrågan jämförbar med verklig data i BÅDA formerna (uppdragets
 * instruktion). Typ-chips filtrerar klient-sidigt; ingen ny data,
 * samma `rader`/mallar/generatorer som grupper-formen.
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
        selectedKey={aktivtFilter}
        onSelectionChange={(key) => void setFilter(key === 'alla' ? null : key)}
      >
        {LISTA_FILTER.map((f) => (
          <ToggleButton key={f.key} id={f.key} size="sm">
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
