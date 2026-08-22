import type {
  Attachment,
  AttachmentDownloadUrl,
  DocumentPreview,
  UploadAttachmentInput,
} from '../../domain/models/Attachment';
import type {
  Attendance,
  CreateAttendanceInput,
  CreatedAttendance,
} from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { CreateEventNoteInput, EventNote } from '../../domain/models/EventNote';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { Person } from '../../domain/models/Person';
import type { CreatePersonNoteInput, PersonNote } from '../../domain/models/PersonNote';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import type {
  ActivityStatement,
  ConfirmRegistrationsInput,
  ConfirmRegistrationsResult,
  CreatedEvent,
  CreateEventInput,
  EventFormat,
  Intresserad,
  PersonDetail,
  RecordActivityResult,
  RegistrationDetail,
  SavedSegment,
  SaveSegmentInput,
  SegmentResult,
  SegmentRuleDnf,
  SendActionEmailInput,
  SendActionEmailResult,
  SendActionTestEmailInput,
  SendActionTestEmailResult,
  SendReceiptInput,
  SendReceiptResult,
  UpdateEventInput,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ActivityLogPage, ActivityLogParams } from '../../domain/types/Pagination';

export interface DataSourceAdapter {
  // === Befintliga (oförändrade) ===
  fetchEvents(): Promise<Event[]>;
  fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]>;

  /**
   * Hämta HELA personregistret (ADR-123 beslut 1, TASK-286.1) —
   * PARAMETERLÖST: inga sök-/cursor-/pageSize-argument. Returnerar samtliga
   * personer som uppfyller EF:ens BASFILTER (minst en anmälan,
   * `get-persons/index.ts` § BAS_FILTER), med exakt de fält listan redan
   * visar.
   *
   * [ENDA PERSONLIST-PORTEN, TASK-286.3] `listPersons(params?: ListParams):
   * Promise<PersonsPage>` — den cursor-paginerade sök-porten (ADR-056) —
   * stod här tills sista konsumenten försvann med TASK-286.2 och är nu riven
   * i BÅDA implementationerna, tillsammans med sina typer. ADR-123 § Beslut 1
   * föreskrev just den ordningen: aldrig en big-bang-rivning i samma andetag
   * som källbytet. Formen finns i git (`git log -p -- src/data/adapters/`).
   *
   * Sök, bokstavsindex, räknarrad och svensk sortering är KLIENT-sidan efter
   * denna hämtning (ADR-123 beslut 2–4); adaptern levererar bara den råa,
   * osorterade, ofiltrerade mängden.
   */
  fetchPersonsRegister(): Promise<Person[]>;

  /**
   * Operations-baserad write-API (M4).
   * operationKey matchas mot allowlist i Edge Function — okänd operation
   * eller fält utanför operationens allowedFields → 400. Allowlisten är
   * tom idag (Discovery 2026-05-04). Operations läggs till när Fas 5.5+
   * produktionsslicen anropar dem från UI.
   */
  updateRecord(
    operationKey: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void>;

  // === Nya ===

  /** Hämta ett enskilt event via ID */
  fetchEvent(id: string): Promise<Event>;

  /** Hämta en enskild person via ID */
  fetchPerson(id: string): Promise<PersonDetail>;

  /**
   * Uppdatera en anmälan. Pre-M4 thin wrapper — kräver att caller
   * specificerar vilken operation som körs (t.ex. 'registration.set-status').
   * Idag throws eftersom operations-listan är tom i M4.
   */
  updateRegistration(
    operationKey: string,
    id: string,
    fields: Partial<Registration>,
  ): Promise<void>;

  /**
   * Skapa ny manuell anmälan. Tar write-shapen `CreateRegistrationInput`
   * (ej läs-shapen `Omit<Registration, 'id'>`) — EF:en härleder resten
   * server-side. Returnerar den skapade anmälan i domän-shape (Fas 6c).
   */
  createRegistration(input: CreateRegistrationInput): Promise<Registration>;

  /**
   * Hämta en enskild anmälan i detalj-shape (task-18.17). get-registration-EF:en
   * återanvänder get-registrations läs-kärna (samma mappning + person-berikning)
   * och utökar med detaljfälten: autonummer-ID, formulär + options-ID, villkor,
   * event-lookups, deadline-formlerna och medföljande-relationen åt BÅDA håll.
   * 404 (okänt ID) propagerar som `EdgeFunctionError` med `status: 404`.
   */
  fetchRegistration(id: string): Promise<RegistrationDetail>;

  /** Hämta deltaganden (närvaro) för ett event */
  fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]>;

  /**
   * Uppdatera en deltagandes status. Thin wrapper över `updateRecord` — caller
   * specificerar operationen explicit. Enda giltiga nyckeln i dag är
   * `'set-attendance-status'` (TASK-214.1: tabellen Deltaganden, EXAKT fältet
   * `Status`). Allowlisten gatar FÄLTET, inte värdet, så samma operation bär
   * hela toggeln Ej avstämt ⇄ Närvarande.
   *
   * `Avstämt` skrivs ALDRIG härifrån — automationen A8 triggar på ändring av
   * just `Status` och äger tidsstämpeln (två skribenter på samma fält vore en
   * kapplöpning appen inte kan vinna).
   */
  updateAttendance(operationKey: string, id: string, status: string): Promise<void>;

  /**
   * Skapa en Deltaganden-rad för en anmälan × session (TASK-214.2, PRD
   * task-214). BACKUP-vägen för dörr-ögonblicket: dörrlistan drivs av
   * ANMÄLNINGARNA, så en anmäld utan förskapad deltaganderad ska kunna checkas
   * in ändå — rotorsaken läks i basen (task-213.12), aldrig här.
   *
   * `Status` sätts server-side till 'Närvarande' atomärt; klienten kan inte
   * välja värde. Idempotent av design — finns raden redan returneras den med
   * `created: false` i stället för en dubblett.
   */
  createAttendance(input: CreateAttendanceInput): Promise<CreatedAttendance>;

  /** Hämta väntelistan */
  fetchWaitlist(filters?: WaitlistFilters): Promise<WaitlistEntry[]>;

  /** Hämta Intresserade (leads = personer som hämtat något men aldrig anmält sig) */
  fetchIntresserade(): Promise<Intresserad[]>;

  /** Hämta engagemang, valfritt filtrerat per person */
  fetchEngagements(personId?: string): Promise<Engagement[]>;

  /** Skicka mailutskick (bulk på segment) — returnerar serverns sänd-utfall (ADR-067 D3) */
  sendEmail(payload: MailPayload): Promise<MailSendResult>;

  /** Hämta mailloggen (GLOBAL lista — hela utskicksloggen, ingen filter-gren) */
  fetchMailLog(): Promise<MailLogEntry[]>;

  /** Beräkna segment-medlemskap från källan (Deltaganden, strikt Närvaropoäng=1) givet en regel.
   *  `SegmentRuleDnf` (TASK-249.5, ADR-115): DNF-formen (Par | Konjunkt)[] — en vanlig
   *  platt `SegmentRule` är alltid en giltig `SegmentRuleDnf` (Par[] ⊂ MedVillkor[]). */
  computeSegment(rule: SegmentRuleDnf): Promise<SegmentResult>;

  /** Spara en namngiven segment-regel som en rad i Segment-tabellen (Fas 6g L3, ADR-065) */
  saveSegment(input: SaveSegmentInput): Promise<SavedSegment>;

  /**
   * Lista app-sparade segment (Fas 6g L3). Legacy Make-rader utan App-segmentregel
   * exkluderas server-side (get-segments) — varje SavedSegment bär en typad regel.
   */
  listSegments(): Promise<SavedSegment[]>;

  /** Lista Eventformat-poster (record-ID + namn) för create-event:s Eventtyp-dropdown (Fas 6f) */
  getEventFormats(): Promise<EventFormat[]>;

  /**
   * Skapa ett nytt event (Fas 6f, ADR-066). Tar write-shapen `CreateEventInput`
   * (typade fält + idempotensnyckel); EF:en bygger Airtable-fälten server-side, härleder
   * Månad/år ur Startdatum, sätter Eventtyp-länken och kör en idempotent upsert. Svaret
   * (`CreatedEvent`) bär de system-genererade EventKey/Event-nr.
   */
  createEvent(input: CreateEventInput): Promise<CreatedEvent>;

  /**
   * Uppdatera ett befintligt event (task-18.1, PRD task-18 beslut 2–3). Tar
   * write-shapen `UpdateEventInput` (typade optionella fält + eventId); EF:en
   * bygger Airtable-fälten server-side, omhärleder Månad/år när Startdatum
   * ändras och PATCH:ar raden. Svaret är den BERIKADE läs-shapen (`Event`) —
   * samma form som fetchEvent, så cachen kan sättas direkt.
   */
  updateEvent(input: UpdateEventInput): Promise<Event>;

  /**
   * Bekräfta en eller flera anmälningar (task-18.6, PRD task-18 beslut 7): SERVERN
   * skickar bekräftelsemailet OCH flippar Status i samma operation (ORDLISTA:
   * Bekräftad ⟺ bekräftelsen skickad). Klienten skickar ENDAST record-ID:n —
   * mottagaren löses server-side. Samma operation bär enskild bekräftelse (ett ID)
   * och Bekräfta alla (N ID:n); svaret är aldrig binärt.
   */
  confirmRegistrations(input: ConfirmRegistrationsInput): Promise<ConfirmRegistrationsResult>;

  /**
   * Skicka ett åtgärdsutskick (TASK-147.2, ADR-067-revisionen): SERVERN skickar
   * mailet OCH skriver åtgärdens stämpel-fält (per typ — `_shared/send-action-
   * email.ts` § `stampFieldsFor`) i samma operation, den bilage-fria batchgrenen
   * (TASK-147.1). Klienten skickar ENDAST åtgärdstyp + eventId + record-ID:n +
   * den redigerade ämnesraden/brödtexten — mottagaren löses server-side, precis
   * som `confirmRegistrations`. Svaret är aldrig binärt: `completed`/`skipped`/
   * `failed` per mottagare, aldrig en aggregerad framgång/misslyckande.
   */
  sendActionEmail(input: SendActionEmailInput): Promise<SendActionEmailResult>;

  /**
   * "Skicka test till mig" (TASK-147.10, ADR-067 D10/T53 väg C). SAMMA EF
   * (`send-action-email`) med `testSend: true` — servern löser upp den FÖRSTA
   * (och enda) mottagaren i `registrationIds` ENDAST för platshållar-data;
   * mailet går alltid till den inloggade användarens egen adress
   * (server-side, `requireUser`), aldrig till registrationens. Ingen anmälan
   * i urvalet berörs — inget fält skrivs, oavsett utfall.
   */
  sendActionTestEmail(input: SendActionTestEmailInput): Promise<SendActionTestEmailResult>;

  /**
   * Skicka ETT kvitto (TASK-147.7, ADR-109) — klass C-bilagan, genererad
   * PER MOTTAGARE vid sändtillfället (skild från klass A/B:s förberedda
   * Bilagor-rader, se AtgardsSida.tsx § BILAGEVÄLJAREN-docblock). Servern
   * allokerar kvittonumret (samtidighetssäkert, server-side), bygger PDF:en
   * och sänder — klienten skickar ENDAST registration-/event-ID + belopp/
   * betalsätt (basen saknar ett prisfält, `send-receipt-email/index.ts`
   * filhuvud) + en idempotensnyckel. EN mottagare, EN betalning per anrop
   * (strukturellt annorlunda än `sendActionEmail`s bulk-urval).
   */
  sendReceipt(input: SendReceiptInput): Promise<SendReceiptResult>;

  /**
   * Aktivitetsloggens skrivväg (TASK-201.3, ADR-110/ADR-111). POST mot
   * `log-activity`-EF:en, som validerar statementet med SAMMA Zod-schema
   * server-side och skriver via `service_role` till Supabase `activity_log`
   * — HELT UTANFÖR Airtable, oavsett vilken `DataSourceAdapter` som är live
   * (aktivitetsloggen migrerade aldrig UR Airtable, den har ALDRIG legat
   * där). Därför implementerar BÅDA `AirtableAdapter` och `SupabaseAdapter`
   * denna metod identiskt — till skillnad från adapterns övriga metoder är
   * den inte en del av Fas E-migrationens swap-yta.
   *
   * FIRE-AND-FORGET ÄGS AV ANROPAREN (`recordActivity`, `src/data/
   * activityLog/recordActivity.ts`) — denna metod själv kastar vid fel
   * (samma disciplin som `sendReceipt`/`sendActionEmail`); det är
   * `recordActivity`s try/catch som gör hela kedjan fire-and-forget.
   */
  recordActivity(statement: ActivityStatement): Promise<RecordActivityResult>;

  /**
   * Hämta eventets anteckningar (task-18.11, ADR-075). Läsning via get-event-notes:
   * eventets omvända `Anteckningar`-länk → batch-hämtade Anteckningar-rader,
   * mappade till domän-shape och sorterade nyast först (server-side). Ren läsning.
   */
  fetchEventNotes(eventId: string): Promise<EventNote[]>;

  /**
   * Skapa en anteckning på ett event (task-18.11, ADR-075). Tar write-shapen
   * `CreateEventNoteInput` (eventId + text); FÖRFATTAREN sätts server-side ur den
   * inloggade användarens verifierade identitet (aldrig klient-buren), och
   * `tidpunkt` ur Airtables createdTime. Returnerar den skapade anteckningen i
   * domän-shape.
   */
  createEventNote(input: CreateEventNoteInput): Promise<EventNote>;

  /**
   * Hämta personens anteckningar (S103, T97-bygg-spåret). Läsning via
   * get-person-notes: personens omvända länk (`Anteckningar 2` — se
   * AirtableAdapter för namn-kollisions-noten) → batch-hämtade Anteckningar-
   * rader, mappade till domän-shape och sorterade nyast först (server-side).
   * Speglar `fetchEventNotes` exakt (samma additiva tabell, ADR-075). Ren läsning.
   */
  fetchPersonNotes(personId: string): Promise<PersonNote[]>;

  /**
   * Skapa en anteckning på en person (S103, T97-bygg-spåret). Tar write-shapen
   * `CreatePersonNoteInput` (personId + text); FÖRFATTAREN sätts server-side ur
   * den inloggade användarens verifierade identitet (aldrig klient-buren,
   * ADR-075), och `tidpunkt` ur Airtables createdTime. Returnerar den skapade
   * anteckningen i domän-shape. Speglar `createEventNote` exakt.
   */
  createPersonNote(input: CreatePersonNoteInput): Promise<PersonNote>;

  /**
   * Ladda upp en bilaga (TASK-146.4, PRD task-146 "Bilage-fundamentet",
   * ADR-057 klausul a+c). UI-lagret anropar ENDAST denna metod — aldrig
   * lagrings-SDK:t eller lagrings-API:t direkt (mekaniskt fällt, se
   * tests/api/attachment-layer-independence.test.ts). Adaptern väljer SJÄLV
   * mönster:
   *
   *   - Mönster 1 (SMÅ filer): bytesen skickas till upload-attachment-EF:en,
   *     som skriver dem med förhöjd behörighet plus en Bilagor-metadatarad
   *     i samma operation (AC #3).
   *   - Mönster 2 (STORA filer): create-attachment-upload-ticket-EF:en
   *     utfärdar ett tidsbegränsat, path-scopat uppladdningstillstånd;
   *     adaptern laddar upp direkt mot lagringen och slutför via
   *     finalize-attachment-upload-EF:en — bytesen passerar aldrig en
   *     EF (AC #4).
   *
   * Auktorisationsbeslutet (vem får ladda upp vad, till vilken path) fattas
   * SERVER-SIDE i BÅDA mönstren (AC #5) — klienten får bara ett scopat
   * tillstånd, aldrig en genväg runt adaptern. En misslyckad uppladdning
   * kastar med ett fel på Lottas språk, inte i byte (AC #6).
   *
   * [UTBYGGD, TASK-275.2, ADR-118] `input.rackvidd`/`kursfamilj`/`kursniva`
   * (valfria — se `UploadAttachmentInput`) trär igenom till BÅDA mönstren
   * oförändrat; `eventId` FÖRBLIR obligatoriskt oavsett räckvidd (se
   * modellens docblock för det medvetna skälet).
   */
  uploadAttachment(input: UploadAttachmentInput): Promise<Attachment>;

  /**
   * Hämta eventets bilagor (TASK-147.5, bilageväljarens verkliga fundament).
   * Läsning via get-event-attachments: eventets omvända `Bilagor`-länk →
   * batch-hämtade Bilagor-rader, mappade till domän-shape och sorterade
   * nyast först (server-side). Ren läsning — speglar `fetchEventNotes` exakt.
   *
   * Listar BÅDA klass A (uppladdad, TASK-146.4) och klass B (event-mallad,
   * TASK-146.5) — ingen server-side klassfiltrering. [RÄTTAD, TASK-147.12]
   * Bilagor-tabellen bär numera `Dokumentklass` (additivt fält), så varje
   * `Attachment` i svaret bär sin verkliga klass (`dokumentklass`, `null` för
   * icke-härledda förfälts-rader) i stället för att vara odelbar från de
   * andra. Klass C (kvitto, TASK-147.7) har fortfarande ingen Bilagor-rad
   * och är alltså strukturellt frånvarande här, inte filtrerad bort.
   *
   * [UTBYGGD, TASK-275.2, ADR-118 beslut 2] Svaret är NU unionen av eventets
   * EGNA + KURSTYP-matchande + ALLA-EVENT-bilagor (server-side, `get-event-
   * attachments`) — gemensamma bilagor syns automatiskt, märkta med sin
   * `rackvidd` (se `Attachment`-modellens docblock för badge-underlaget).
   */
  fetchEventAttachments(eventId: string): Promise<Attachment[]>;

  /**
   * Hämta ALLA gemensamma bilagor (TASK-275.3, ADR-118 beslut 5) — bakom
   * Dokument-ytans RÄCKVIDDSLÄGE (läget utan valt event, ORDLISTA.md §
   * Gemensam bilaga). GET mot get-event-attachments-EF:en UTAN `eventId`
   * (den nya, valfria query-param-formen) — SAMMA endpoint som
   * `fetchEventAttachments`, en annan gren server-side (ingen eventunion,
   * bara `Räckvidd IN (Kurstyp, Alla event)`, se get-event-attachments/
   * index.ts § filhuvudet). EGEN adapter-metod i stället för att göra
   * `fetchEventAttachments`s `eventId`-parameter valfri: två genuint olika
   * frågor (ett events dokument vs. ALLA gemensamma dokument) förtjänar
   * varsitt namn — "håll adapter-API:t smalt och välnamnat" gäller åt båda
   * hållen, inte bara mot att lägga till metoder.
   */
  fetchGemensammaBilagor(): Promise<Attachment[]>;

  /**
   * Radera en bilage-post (TASK-147.11, "äkta" radering — task-147.6:s fynd
   * 3 flaggade att adaptern saknade denna primitiv helt, `grep -n delete
   * DataSourceAdapter.ts` gav 0 träffar; Dokument-ytans "Ersätt" byggde
   * därför en klientsidig `grupperaPerNamn`-attrapp i stället). POST mot
   * delete-attachment-EF:en, som verifierar SERVER-SIDE att bilagan
   * FAKTISKT hör till `eventId` (ägarskaps-guard, 403 annars) innan den
   * raderas — både Storage-bytesen (best-effort) och Bilagor-metadataraden
   * (hårt krav). EN post per anrop, ALDRIG bulk (SECURITY-SPEC §6.10).
   *
   * "Ersätt" (Dokument-ytan) komponerar denna metoden EFTER en lyckad
   * `uploadAttachment` — ladda upp nya FÖRST, radera gamla EFTER lyckad
   * uppladdning, aldrig tvärtom (`useReplaceAttachment`). Denna metoden vet
   * ingenting om "ersätt"-semantiken — den bara raderar EN namngiven post,
   * precis som `createEventNote` inte vet något om vilken UI-flow som
   * anropade den.
   *
   * [UTBYGGD, TASK-275.2, ADR-118 beslut 3] `eventId` är NU `string | null`
   * — `null` signalerar "räckviddsläge" (Dokument-ytans läge utan valt
   * event). För en GEMENSAM bilaga (räckvidd Kurstyp/Alla event) NEKAS
   * raderingen (403) om `eventId` anges (ur eventkontext, olycksskyddet)
   * och TILLÅTS om `eventId` är `null` (räckviddsläge). För en
   * Event-räckviddig bilaga är beteendet OFÖRÄNDRAT: `eventId` krävs,
   * ägarskaps-guarden gäller som förut. Se delete-attachment/index.ts §
   * filhuvudet för den fulla auktorisationslogiken.
   */
  deleteAttachment(eventId: string | null, attachmentId: string): Promise<void>;

  /**
   * Hämta en TIDSBEGRÄNSAD signerad nedladdnings-/förhandsvisnings-URL för
   * EN bilaga (TASK-245, "Signerad nedladdnings-EF för bilagor —
   * Visa-overlayens saknade fil-URL"). Bucketen `bilagor` är PRIVAT — ingen
   * klient-`createSignedUrl` är möjlig (RLS stänger den vägen), och ingen
   * nedladdnings-signatur fanns i `supabase/functions/` före detta kort
   * (bara en UPPLADDNINGS-motsvarighet, `create-attachment-upload-ticket`).
   *
   * GET mot get-attachment-download-url-EF:en, som verifierar SERVER-SIDE
   * att bilagan FAKTISKT hör till `eventId` (ägarskaps-guard, 403 annars —
   * SAMMA mönster som `deleteAttachment`) innan en URL signeras. TTL:en
   * (300s, se `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS)
   * bärs i svaret, inte hårdkodad klient-side.
   *
   * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] `eventId` är NU `string | null` —
   * speglar `deleteAttachment`s form. För en GEMENSAM bilaga (räckvidd
   * Kurstyp/Alla event) läser EF:en INGET ägarskaps-guard alls (varje
   * event/räckviddsläge får öppna den, se get-attachment-download-url/
   * index.ts § filhuvudet) — `eventId` skickas ändå med om den råkar finnas
   * (kalla-kontextens eget event), men bara som spårbarhet i loggen, inte
   * som en behörighetskälla. `null` är GILTIGT för en gemensam bilaga öppnad
   * från räckviddsläget. För en Event-räckviddig bilaga är kontraktet
   * OFÖRÄNDRAT: `eventId` krävs, guarden gäller som förut.
   *
   * Dokument-ytans ikonpar (`DokumentAtgardsKnappar`, `DokumentYta.tsx`)
   * anropar denna LAZY — bara vid klick, aldrig i förväg för hela listan.
   */
  getAttachmentDownloadUrl(
    eventId: string | null,
    attachmentId: string,
  ): Promise<AttachmentDownloadUrl>;

  /**
   * Sidoeffektsfri förhandsvisning av klass B:s systemmall ("Deltagar-
   * information", TASK-146.5) — TASK-246, Marcus-ordern 2026-08-16 ("en
   * riktigt genererad PDF på alla mallar"). POST mot generate-event-
   * attachment MED `preview: true` — SAMMA EF, SAMMA `byggPdf`-anrop
   * (identisk PDF-kvalitet ur eventets verkliga data) som den persisterande
   * vägen, men en gren som ALDRIG når Bilagor-radskapelsen (AC #3 — ingen
   * kvarliggande Airtable-artefakt).
   *
   * [ÄNDRAD, ADR-124, TASK-302.2] Returnerar `{ url, utgar }` — en signerad
   * URL till ett TRANSIENT Storage-utkast (`laggUtkast`), inte längre
   * bytesen direkt. Bytes-till-klienten-premissen föll mot en mätning (sex
   * klientleveransarmar, headed Chrome 151, `ADR-124` § Kontext): bara en
   * URL serverad av nätverkstjänsten scrollar jämnt i Chromes PDF-visare.
   * Dokument-ytans Visa-dialog för mallar anropar denna LAZY (samma
   * `enabled: isOpen`-mönster som `getAttachmentDownloadUrl`).
   */
  previewEventTemplate(eventId: string): Promise<DocumentPreview>;

  /**
   * Sidoeffektsfri förhandsvisning av klass C:s kvitto-generator
   * ("Betalningskvitto", TASK-147.7) — TASK-246. POST mot preview-receipt,
   * en NY, DEDIKERAD EF (INTE en gren på send-receipt-email): den ordinarie
   * sändvägen (`_shared/send-receipt.ts` § sendReceipt) allokerar alltid ett
   * riktigt kvittonummer (Airtable-skrivning, sker FÖRE sändningsförsöket)
   * och skickar ett riktigt mail vid lyckad körning — båda är förbjudna
   * sidoeffekter för en förhandsvisning (AC #3), och kan inte grenas bort
   * inuti den sammansatta orkestratorn utan att riskera den riktiga vägen.
   * Persondata är TYPEXEMPEL (bokfört beslut, kortets notes AC #2) —
   * eventets namn är verkligt (samma eventId som Dokument-ytans valda
   * event). Kvittonumret är ALDRIG ett allokerat nummer ("FÖRHANDSVISNING",
   * en ärlig platshållare — se preview-receipt/index.ts § filhuvud).
   *
   * [ÄNDRAD, ADR-124, TASK-302.2] Returnerar `{ url, utgar }` — samma
   * leveransväg-ändring som `previewEventTemplate` ovan (se dess docblock
   * för mätningen). Kvittonummer-/mail-sidoeffektsfriheten är OFÖRÄNDRAD.
   */
  previewReceipt(eventId: string): Promise<DocumentPreview>;

  /**
   * Hämta en cursor-paginerad sida av Aktivitetsloggen (TASK-201.5, PRD
   * TASK-201). Läsning via get-activity-log: DIREKT ur Postgres-tabellen
   * `activity_log` (ADR-110) — ingen Airtable-interaktion, till skillnad
   * mot övriga metoder på denna adapter. Keyset-paginerad (`occurred_at
   * DESC, id DESC`), inte offset — speglar `listPersons`s cursor-kontrakt
   * (ADR-056) men med filterparametrarna (kategori/eventId/tidsintervall,
   * AC #1) inlinead i `ActivityLogParams` i stället för separata argument.
   * `statements` är exakt `ActivityStatement[]` — ingen parallell "flat"-typ
   * (se get-activity-log-EF:ens filhuvud för den fulla motiveringen).
   */
  fetchActivityLog(params?: ActivityLogParams): Promise<ActivityLogPage>;

  /**
   * Rendera en färdig, SJÄLVBÄRANDE HTML-sträng till PDF och returnera
   * bytesen som `Blob` (S108 MARCUS-SEKVENS punkt 3, `ADR-119`).
   *
   * PROVISORISK ADRESS, PERMANENT FÖRMÅGA — läs skillnaden noga. Metoden
   * uttrycker en förmåga datalagret ska ha: "gör PDF av denna HTML". VILKEN
   * renderare som svarar är adapterns ensak, och i dag är svaret
   * `test-docraptor-render` — en staging-only testharness-EF som är
   * MEDVETET utelämnad ur `.prod-functions-allowlist.conf` och alltså
   * saknas i produktion. Anropas metoden mot ett prod-projekt blir svaret
   * 404, med avsikt: prototypvägen som använder den är dev-gatead
   * (`src/routes/_authenticated/mer/dokument.tsx` § `protoAktiv`) och når
   * aldrig en prod-byggd app. Vid promoveringen (`ADR-103`) byter adaptern
   * adress till den skarpa renderings-EF:en — interfacet är då oförändrat.
   *
   * VARFÖR METODEN ÖVER HUVUD TAGET FINNS, i stället för ett `fetch` i
   * komponenten: `ADR-057` klausul (a) förbjuder UI-lagret att importera
   * EF-klienten. Prototypkod är inte undantagen från lager-invarianten —
   * den granskas av samma fitness-audit som resten.
   *
   * `html` MÅSTE vara självbärande (stil, typsnitt och bilder som
   * `data:`-URI:er) — renderaren kör i sitt eget nät och når ingenting
   * relativt. Se `src/components/dokument/prototyp/sjalvbarande.ts`.
   * `namn` är dokumentnamnet renderaren stämplar jobbet med.
   */
  renderPdfFranHtml(html: string, namn: string): Promise<Blob>;

  /**
   * Rendera självbärande HTML till PDF och lagra resultatet som ett
   * TRANSIENT utkast i Storage — returnerar en KORT signerad URL i stället
   * för bytes (TASK-302.1, PRD `TASK-302`, `ADR-124`).
   *
   * VARFÖR EN EGEN METOD, INTE ETT PARAMETER-TILLÄGG PÅ `renderPdfFranHtml`:
   * de två metoderna svarar olika FORMER (`Blob` kontra `{ url, utgar }`) —
   * ett gemensamt returtyp-union hade tvingat VARJE anropare att gissa
   * vilken form som kom tillbaka. `renderPdfFranHtml` BEHÅLLS OFÖRÄNDRAD
   * (riv inte) — den är fortfarande skiva 2:s (`TASK-302.2`) startpunkt för
   * de skarpa preview-EF:erna, som byter LEVERANSVÄG men inte metodform.
   *
   * MÄTT, INTE ANTAGET (`TASK-302` § "Problemet"): Chromes PDF-visare
   * scrollar bara jämnt på en PDF SERVERAD AV NÄTVERKSTJÄNSTEN. En
   * `blob:`-URL (denna adapters ANDRA metod ovan), och likaså en URL fångad
   * av appens egen Service Worker, laggar vid scroll — sex mätta armar,
   * headed Chrome 151. Den URL denna metod returnerar är Supabase Storages
   * SIGNERADE URL (`supabase.co`, cross-origin mot appens eget origin) —
   * `src/sw.ts`s `NavigationRoute` rör den därför aldrig.
   *
   * PROVISORISK ADRESS, PERMANENT FÖRMÅGA — samma resonemang som
   * `renderPdfFranHtml`: i dag svarar `test-docraptor-render` med
   * `leverans: 'utkast'` (staging-only, `.prod-functions-allowlist.conf`-
   * exkluderad); vid promoveringen (`ADR-103`) byter adaptern adress till
   * de skarpa preview-EF:erna (`TASK-302.2`), interfacet är då oförändrat.
   *
   * `eventId`/`typ` blir Storage-sökvägen `utkast/<eventId>/<typ>.pdf`
   * (`upsert` — högst en fil per event och typ). `utgar` är URL:ens
   * ISO-utgångstid.
   */
  renderPdfTillUtkast(
    html: string,
    namn: string,
    params: { eventId: string; typ: UtkastTyp },
  ): Promise<{ url: string; utgar: string }>;
}

/**
 * `typ`-diskriminatorn för TASK-302:s utkast-väg (`ADR-124`) — bilaga (denna
 * skivas prototyp-väg, TASK-302.1), kvitto och deltagarinformation (skiva
 * 2:s skarpa EF:er, TASK-302.2). SAMMA tre värden som backend-enumen
 * `UTKAST_TYPER` i `supabase/functions/_shared/utkast.ts` — dubblerad
 * MEDVETET (Deno-EF:erna delar ingen build-kedja med Vite-bygget, samma
 * duplicerings-mönster `_shared/attachments.ts`s filhuvud redan etablerar
 * för `AttachmentClass`/`AttachmentScope`).
 */
export type UtkastTyp = 'bilaga' | 'kvitto' | 'deltagarinformation';
