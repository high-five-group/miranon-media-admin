import type { Attachment, UploadAttachmentInput } from '../../domain/models/Attachment';
import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { CreateEventNoteInput, EventNote } from '../../domain/models/EventNote';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import type {
  ConfirmRegistrationsInput,
  ConfirmRegistrationsResult,
  CreatedEvent,
  CreateEventInput,
  EventFormat,
  Intresserad,
  PersonDetail,
  RegistrationDetail,
  SavedSegment,
  SaveSegmentInput,
  SegmentResult,
  SegmentRule,
  SendActionEmailInput,
  SendActionEmailResult,
  SendActionTestEmailInput,
  SendActionTestEmailResult,
  UpdateEventInput,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ListParams, PersonsPage } from '../../domain/types/Pagination';

export interface DataSourceAdapter {
  // === Befintliga (oförändrade) ===
  fetchEvents(): Promise<Event[]>;
  fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]>;

  /**
   * Cursor-paginerad personlista (ADR-056). Migrations-stabil port: Supabase-
   * adaptern (Fas E) implementerar identisk shape. `cursor`/`nextCursor` är opaka.
   */
  listPersons(params?: ListParams): Promise<PersonsPage>;

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
   * Uppdatera en deltagandes status. Pre-M4 thin wrapper — kräver att
   * caller specificerar operation (t.ex. 'attendance.set-status'). Idag
   * throws eftersom operations-listan är tom i M4.
   */
  updateAttendance(operationKey: string, id: string, status: string): Promise<void>;

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

  /** Beräkna segment-medlemskap från källan (Deltaganden, strikt Närvaropoäng=1) givet en regel */
  computeSegment(rule: SegmentRule): Promise<SegmentResult>;

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
   */
  uploadAttachment(input: UploadAttachmentInput): Promise<Attachment>;
}
