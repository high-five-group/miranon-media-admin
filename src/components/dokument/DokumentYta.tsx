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
 * "ERSÄTT" (AC #1) — [ÄKTA SEDAN TASK-147.11] Detta stycket beskrev
 * ursprungligen (TASK-147.6) en klientsidig attrapp: adaptern saknade ett
 * delete/replace-primitiv, så en ny uppladdning med SAMMA `Namn` grupperades
 * bara klient-sidigt som en "nyare version" av samma rad — den gamla raden
 * blev liggande kvar i Airtable OCH Storage som skräp, synligt bara som en
 * "Ersatte en tidigare version"-notis, och en TREDJE uppladdning gjorde den
 * ÄLDSTA av tre osynlig i listan (varken egen rad eller notis). TASK-147.11
 * byggde den saknade primitiven (`delete-attachment`-EF:en +
 * `DataSourceAdapter.deleteAttachment`) och kopplade "Ersätt"
 * (`useReplaceAttachment`) till den: en lyckad ersättning laddar upp den nya
 * filen FÖRST och raderar sedan den gamla posten FAKTISKT — både Storage-
 * bytesen och Bilagor-raden. Ingen ny uppladdning kan därför längre skapa en
 * dubblett via "Ersätt". `grupperaPerNamn` (nedan) är DEGRADERAD till en ren
 * visningshjälp för KVARVARANDE dubbletter (t.ex. flera identiska klass
 * B-genereringar via `generate-event-attachment` — helt orört av denna
 * ändring) — den påstår inte längre NÅGOT om att en dubblett är en
 * "ersättning". (Formväxeln `?form=grupper`/`?form=lista` som tidigare stod
 * nämnd här är riven — se skärpningsvarv 2, punkt 3, nedan; listan är nu
 * ytans enda form.)
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
 * [TASK-147.6, SKÄRPNINGSVARV 3, 2026-08-16] Marcus FEM kvitterade punkter
 * (sessionsdok `tasks/sessions/2026-08-10-session-102.md` rad 1043–1052,
 * MARCUS-SEKVENS punkt 1), alla åtgärdade i detta varv:
 *
 *  1. IKONERNA FRAMFÖR MALLAR/GENERATORER (`Sparkles`/`UserRound`) ÄR TAGNA
 *     BORT — bilagornas egen `FileText`-ikon (`BilageRadRow`) rörs INTE, bara
 *     mall-/generator-raderna nämndes i punkten.
 *
 *  2–3. VISA-KNAPPEN BÄR NU `intent="primary" emphasis="subtle"` (tonad
 *     bakgrund, ej `ghost`) I STÄLLET FÖR den gamla `ghost`-formen. Detta
 *     löser BÅDA punkterna i SAMMA byte: `ghost`s hover-token
 *     (`--mm-button-ghost-bg-hover` = `var(--mm-bg-muted)`) råkar vara
 *     IDENTISK med radgruppens egen bakgrund (`bg-bg-muted` på
 *     `grupp-kort` nedan) — en verklig `data-[hovered]`-hover FANNS redan i
 *     CVA:n (Button.tsx), men var osynlig mot en identisk bakgrundsfärg.
 *     `subtle`s 10/16/22-procents färgmix (`components.css`, samma par som
 *     `Deltagare.tsx`s `MarkeraKnapp`) är en helt annan yta och löser
 *     synligheten OCH hover-kontrasten utan en enda ny token.
 *
 *  4. VISA-KNAPPEN ÄR VERTIKALT CENTRERAD (`self-center` på knappen/dess
 *     grupperingsspann) — radens egen `items-start` rörs INTE (ikonen ska
 *     fortfarande hänga mot textens första rad, det var aldrig punkten).
 *
 *  5. VISA-BETEENDET (Marcus kvitterade rekommendation): `VisaKnapp` nedan
 *     öppnar husets `Dialog`-primitiv (`DialogTrigger`/`Modal`/`Dialog`,
 *     ADR-044, samma mönster som `AtgardsSida.tsx`s `SkickaKvittoKnapp`) i
 *     stället för att vara en död knapp. Mallar/generatorer visar ett
 *     ÄRLIGT "producerat exempel" (`ProduceratExempel`) byggt UR
 *     `Mall.fyllerI`/`Generator.byggsUr` — samma katalogdata som redan stod
 *     i radens metatext, aldrig en hittepå-instans (samma "gissa aldrig"-
 *     disciplin som Fynd 1/3 ovan).
 *
 *     BILAGOR (klass A) — GENUIN GRÄNS, FLAGGAD, INTE TYST KRINGGÅD (HISTORIA,
 *     se [RÄTTAD, TASK-245] nedan): den kvitterade rekommendationen
 *     ("overlay-förhandsvisning för bilagor … ladda ner-fallback när
 *     förhandsvisning inte går") FÖRUTSATTE en URL till filens bytes. INGEN
 *     sådan fanns i kontraktet vid detta varvs byggtillfälle — verifierat:
 *     `Attachment` (denna fils import) bar `id`/`namn`/`storlekBytes`/
 *     `skapad`/`eventId`/`dokumentklass`, ingen URL; `mapAttachmentRecord`
 *     (`supabase/functions/_shared/attachments.ts`) mappade ALDRIG en URL;
 *     `get-event-attachments/index.ts` läste bara `ATTACHMENT_FIELDS =
 *     ['Namn', 'Storlek (bytes)', 'Skapad', 'Event', 'Dokumentklass']`;
 *     bucketen `bilagor` är PRIVAT (`scripts/provision-attachments-
 *     bucket.mjs`, `public: false`, ingen `storage.objects`-policy funnen i
 *     `supabase/`) så en direkt klient-`createSignedUrl` är stängd av RLS;
 *     och EN signerad NEDLADDNINGS-URL existerade ingenstans i
 *     `supabase/functions/` — bara en UPPLADDNINGS-signatur
 *     (`create-attachment-upload-ticket`). `VisaKnapp` för bilagor öppnade
 *     därför dialogen med ett ÄRLIGT, Gunilla-läsbart `MessageBox
 *     intent="info"` — "går inte att öppna här ännu" — i stället för
 *     antingen en fejkad förhandsvisning eller en trasig nedladdningslänk.
 *
 * [RÄTTAD, TASK-245, 2026-08-16] Gapet ovan är STÄNGT. `get-attachment-
 *     download-url`-EF:en (samma ägarskaps-guard-mönster som
 *     `delete-attachment`, TASK-147.11) ger en tidsbegränsad signerad URL
 *     (`DataSourceAdapter.getAttachmentDownloadUrl`, 300s TTL — se
 *     `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS för
 *     TTL-motiveringen). `BilagaVisaKnapp` (nedan) ERSÄTTER den ärliga
 *     info-dialogen för bilage-raden med RIKTIG förhandsvisning (PDF via
 *     `<iframe>`, bild via `<img>`) plus en "Ladda ner"-länk — och en
 *     tredje, ÄRLIG gräns för format som varken är PDF eller bild (samma
 *     "gissa aldrig"-disciplin: en `MessageBox intent="info"` i stället för
 *     ett trasigt försök att rendera en filtyp webbläsaren inte kan visa).
 *     `VisaKnapp` (den generiska primitiven) rörs INTE — Mallar/Generatorer
 *     fortsätter använda den oförändrat, de har inget URL-behov.
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
import { ChevronLeft, Download, FileText, Upload } from 'lucide-react';
import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { formatMB } from '@/data/adapters/attachmentUpload';
import { useReplaceAttachment } from '@/data/mutations/useReplaceAttachment';
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
 * En rad i listan — den verkliga, senaste versionen av en fil, plus (om
 * ytterligare rader med SAMMA `Namn` finns) antalet äldre dubbletter som
 * döljs. Se filhuvudets "ERSÄTT"-stycke: `dolda` bär INGEN claim om VARFÖR
 * en dubblett finns (Ersätt skapar inte längre några — se `grupperaPerNamn`
 * nedan för vad som kan).
 */
type BilageRad = { current: Attachment; dolda: number };

/**
 * [TASK-147.11, DEGRADERAD TILL REN VISNINGSHJÄLP] Grupperar VERKLIGA
 * `fetchEventAttachments`-rader per filnamn — kollapsar dubbletter till EN
 * rad (den nyaste; listan kommer redan sorterad nyast-först från servern,
 * `get-event-attachments` § kommentar "Nyast först", så första träffen per
 * namn är garanterat den senaste) plus en räkning av hur många äldre
 * dubbletter som döljs. Bär INTE längre någon "ersatte en tidigare
 * version"-CLAIM (TASK-147.6:s ursprungliga form, se filhuvudet): "Ersätt"
 * raderar nu FAKTISKT den gamla posten (`useReplaceAttachment`), så en
 * framtida ersättning kan aldrig skapa en dubblett att gruppera här.
 * Kvarvarande dubbletter (t.ex. flera identiska klass B-genereringar via
 * `generate-event-attachment`) är INTE ersättningar — funktionen gissar
 * inget om hur de uppstod, den kollapsar dem bara för listläsbarhet.
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
    rader.push({ current: lista[0], dolda: lista.length - 1 });
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
  // "Ersätt" (TASK-147.11) — SKILD hook/mutation från uppladdningsknappen
  // längst ner: samma FileTrigger-mönster, men bär vilken befintlig post
  // som ska bort (`oldAttachmentId`) och komponerar upload+delete i rätt
  // ordning (se useReplaceAttachment.ts för kontraktet).
  const replaceMutation = useReplaceAttachment(eventId ?? '');

  const rader = useMemo(
    () => grupperaPerNamn(attachmentsQuery.data ?? []),
    [attachmentsQuery.data],
  );

  const handleUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleReplace = (files: FileList | null, oldAttachmentId: string) => {
    const file = files?.[0];
    if (file) replaceMutation.mutate({ file, oldAttachmentId });
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
        <DokumentLista
          eventId={eventId}
          rader={rader}
          onUpload={handleUpload}
          uploadMutation={uploadMutation}
          onReplace={handleReplace}
          replaceMutation={replaceMutation}
        />
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

/**
 * VISA-KNAPPEN (skärpningsvarv 3, punkt b–e i filhuvudet) — husets
 * `Dialog`-primitiv (ADR-044: `DialogTrigger`/`Modal`/`Dialog`, samma mönster
 * som `AtgardsSida.tsx`s `SkickaKvittoKnapp`) i stället för en död knapp.
 * `intent="primary" emphasis="subtle"` ger BÅDE den tonade bakgrunden
 * (punkt d) och en verklig hover-kontrast (punkt b) — se filhuvudet för
 * varför `ghost`s hover var osynlig. `buttonClassName` låter anroparen sätta
 * `self-center` (punkt e) DIREKT på knappen (`DialogTrigger` renderar ingen
 * egen DOM-nod — `Button`/`Modal` blir alltså riktiga syskon i anroparens
 * flex-rad) utan att röra radens egen `items-start`.
 */
function VisaKnapp({
  title,
  children,
  buttonClassName,
}: {
  title: string;
  children: ReactNode;
  buttonClassName?: string;
}) {
  return (
    <DialogTrigger>
      <Button intent="primary" emphasis="subtle" size="sm" className={buttonClassName}>
        Visa
      </Button>
      <Modal isDismissable>
        <Dialog title={title}>{children}</Dialog>
      </Modal>
    </DialogTrigger>
  );
}

/**
 * "PRODUCERAT EXEMPEL" (Marcus kvitterade rekommendation, filhuvudet punkt 5)
 * — en ÄRLIG illustration av vilka fält dokumentet fylls i med, byggd UR
 * `Mall.fyllerI`/`Generator.byggsUr` (samma katalogdata som redan står i
 * radens egen metatext). Varje värde är bokstavligen ordet "Exempelvärde" —
 * ALDRIG ett hittepå-namn/datum som kunde förväxlas med en riktig rad, samma
 * "gissa aldrig"-disciplin som Fynd 1/3 i filhuvudet.
 */
function ProduceratExempel({ falt }: { falt: readonly string[] }) {
  return (
    <dl className="flex flex-col divide-y divide-border text-small">
      {falt.map((f) => (
        <div key={f} className="flex items-baseline justify-between gap-3 py-1.5">
          <dt className="text-text-secondary">{f}</dt>
          <dd className="text-text-muted italic">Exempelvärde</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * FÖRHANDSVISNINGS-FORMATET, härlett ur filnamnets ändelse (TASK-245) —
 * SAMMA "gissa aldrig ur mönster"-disciplin som filhuvudets Fynd 1: ingen
 * server-buren `contentType` finns på `Attachment` (`Attachment.schema.ts`),
 * så ändelsen är den enda signal klienten faktiskt HAR. Bucketen `bilagor`
 * tillåter i dag ENDAST `application/pdf`
 * (`scripts/provision-attachments-bucket.mjs` § MIME-FILTER) — `bild`-grenen
 * är alltså medvetet FRAMÅTRIKTAD (AC #2 nämner uttryckligen "bild/PDF") och
 * overifierad mot verklig data i dag, men kostar noll extra rader att hålla
 * generisk i stället för PDF-bara.
 */
const BILD_ANDELSER = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

type ForhandsvisningsFormat = 'pdf' | 'bild' | 'okant';

function forhandsvisningsFormat(namn: string): ForhandsvisningsFormat {
  const match = /\.([a-z0-9]+)$/i.exec(namn);
  const andelse = match ? match[1].toLowerCase() : '';
  if (andelse === 'pdf') return 'pdf';
  if (BILD_ANDELSER.has(andelse)) return 'bild';
  return 'okant';
}

/**
 * BILAGORNAS VISA-KNAPP (TASK-245, ersätter den ärliga info-dialogen — se
 * filhuvudets [RÄTTAD, TASK-245]-stycke). SKILD komponent från den generiska
 * `VisaKnapp` ovan: bilagor behöver en LAZY, dialog-scopad datahämtning
 * (signerad URL, TTL 300s) som Mallar/Generatorer (statisk katalogdata,
 * `ProduceratExempel`) aldrig behöver — att trycka in fetch-logik i den
 * delade primitiven hade tvingat två orelaterade call sites att bära samma
 * komplexitet.
 *
 * LAZY PER KONSTRUKTION: `isOpen` styr BÅDE `DialogTrigger` (kontrollerad,
 * till skillnad mot `VisaKnapp`s okontrollerade form) OCH queryns `enabled`
 * — URL:en hämtas FÖRST när dialogen faktiskt öppnas, aldrig i förväg för
 * varje rad i listan. TanStack Querys default `staleTime` (0) gör att en
 * stängd-och-återöppnad dialog refetchar automatiskt i stället för att
 * återanvända en potentiellt utgången URL — ingen egen invalidation-logik
 * behövs (se `queryKeys.attachments.downloadUrl`).
 */
function BilagaVisaKnapp({ eventId, attachment }: { eventId: string; attachment: Attachment }) {
  const dataSource = useDataSource();
  const [isOpen, setIsOpen] = useState(false);
  const format = forhandsvisningsFormat(attachment.namn);

  const downloadQuery = useQuery({
    queryKey: queryKeys.attachments.downloadUrl(eventId, attachment.id),
    queryFn: () => dataSource.getAttachmentDownloadUrl(eventId, attachment.id),
    enabled: isOpen,
  });

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button intent="primary" emphasis="subtle" size="sm" className="self-center">
        Visa
      </Button>
      <Modal isDismissable>
        <Dialog title={attachment.namn} size="lg">
          {downloadQuery.isPending ? (
            <div role="status" aria-busy="true" className="flex flex-col gap-2">
              <span className="sr-only">Förbereder förhandsvisning…</span>
              <Skeleton variant="listRow" className="h-[60vh]" />
            </div>
          ) : downloadQuery.isError ? (
            <MessageBox intent="error" title="Kunde inte öppna filen">
              {downloadQuery.error instanceof Error ? downloadQuery.error.message : 'Okänt fel.'}
            </MessageBox>
          ) : (
            <div className="flex flex-col gap-3">
              {format === 'pdf' && (
                <iframe
                  src={downloadQuery.data.url}
                  title={`Förhandsvisning av ${attachment.namn}`}
                  className="h-[60vh] w-full rounded border border-border bg-bg"
                />
              )}
              {format === 'bild' && (
                <img
                  src={downloadQuery.data.url}
                  alt={attachment.namn}
                  className="max-h-[60vh] w-full rounded border border-border object-contain"
                />
              )}
              {format === 'okant' && (
                <MessageBox intent="info" title="Kan inte förhandsvisas här">
                  Den här filtypen kan inte förhandsvisas i den här vyn. Ladda ner den för att öppna
                  den.
                </MessageBox>
              )}
              <a
                href={downloadQuery.data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start font-medium text-body underline underline-offset-2 hover:text-text"
              >
                <Download aria-hidden="true" size={16} />
                Ladda ner {attachment.namn}
              </a>
            </div>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;
type ReplaceMutation = ReturnType<typeof useReplaceAttachment>;

function BilageRadRow({
  eventId,
  rad,
  onReplace,
  replaceMutation,
}: {
  eventId: string;
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string) => void;
  replaceMutation: ReplaceMutation;
}) {
  const { current, dolda } = rad;
  // Bara DENNA rads knapp visar "Ersätter…"/blir avstängd — inte hela
  // listan (till skillnad mot uppladdningsknappen längst ner, som stänger
  // av sig själv via sin egen `uploadMutation.isPending`). `variables`
  // finns bara medan mutationen faktiskt pågår (TanStack Query), så
  // jämförelsen är säker även innan första anropet.
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
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
        {dolda > 0 && (
          <span className="text-caption text-text-secondary">
            +{dolda} {dolda === 1 ? 'äldre fil' : 'äldre filer'} med samma namn (visas inte)
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2 self-center">
        <BilagaVisaKnapp eventId={eventId} attachment={current} />
        <FileTrigger
          acceptedFileTypes={['application/pdf']}
          onSelect={(files) => onReplace(files, current.id)}
        >
          <Button intent="ghost" size="sm" isDisabled={ersatterDennaRaden}>
            {ersatterDennaRaden ? 'Ersätter…' : 'Ersätt'}
          </Button>
        </FileTrigger>
      </span>
    </div>
  );
}

function MallRad({ mall }: { mall: Mall }) {
  return (
    <div data-testid="dokument-mall" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{mall.namn}</span>
        <MetaRad delar={[`Fyller i ${mall.fyllerI.join(', ').toLowerCase()}`]} />
      </span>
      <VisaKnapp title={mall.namn} buttonClassName="self-center">
        <ProduceratExempel falt={mall.fyllerI} />
      </VisaKnapp>
    </div>
  );
}

function GeneratorRad({ gen }: { gen: Generator }) {
  return (
    <div data-testid="dokument-generator" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{gen.namn}</span>
        <MetaRad delar={[`Byggs ur ${gen.byggsUr.join(', ').toLowerCase()}`]} />
      </span>
      <VisaKnapp title={gen.namn} buttonClassName="self-center">
        <ProduceratExempel falt={gen.byggsUr} />
      </VisaKnapp>
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

/** Speglar `UppladdningsFel` — egen felruta för "Ersätt" (TASK-147.11), eget
 * felmeddelande (kan skilja på "vilket steg som föll", se
 * `useReplaceAttachment.ts`). */
function ErsattningsFel({ replaceMutation }: { replaceMutation: ReplaceMutation }) {
  if (!replaceMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ersätta filen">
      {replaceMutation.error instanceof Error ? replaceMutation.error.message : 'Okänt fel.'}
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
  eventId,
  rader,
  onUpload,
  uploadMutation,
  onReplace,
  replaceMutation,
}: {
  eventId: string;
  rader: BilageRad[];
  onUpload: (files: FileList | null) => void;
  uploadMutation: UploadMutation;
  onReplace: (files: FileList | null, oldAttachmentId: string) => void;
  replaceMutation: ReplaceMutation;
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
              eventId={eventId}
              rad={r}
              onReplace={onReplace}
              replaceMutation={replaceMutation}
            />
          ))}
        {visaMallar && MALLAR.map((m) => <MallRad key={m.id} mall={m} />)}
        {visaGeneratorer && GENERATORER.map((g) => <GeneratorRad key={g.id} gen={g} />)}
        {visaBilagor && rader.length === 0 && !visaMallar && !visaGeneratorer && (
          <p className="py-3 text-small text-text-muted">Inga bilagor för det här eventet än.</p>
        )}
      </div>

      <UppladdningsFel uploadMutation={uploadMutation} />
      <ErsattningsFel replaceMutation={replaceMutation} />
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
