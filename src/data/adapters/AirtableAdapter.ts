import { z } from 'zod';
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
import type { DocumentSources } from '../../domain/models/DocumentSources';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { CreateEventNoteInput, EventNote } from '../../domain/models/EventNote';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { Person } from '../../domain/models/Person';
import type { CreatePersonNoteInput, PersonNote } from '../../domain/models/PersonNote';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import {
  type ActivityStatement,
  ActivityStatementSchema,
  AttachmentDownloadUrlSchema,
  AttachmentUploadTicketSchema,
  AttendanceSchema,
  type ConfirmRegistrationsInput,
  type ConfirmRegistrationsResult,
  ConfirmRegistrationsResultSchema,
  CreatedAttendanceSchema,
  type CreatedEvent,
  CreatedEventSchema,
  type CreateEventInput,
  DocumentPreviewSchema,
  DocumentSourcesSchema,
  type EventFormat,
  EventFormatSchema,
  type EventinnehallListItem,
  EventinnehallListItemSchema,
  EventNoteSchema,
  EventSchema,
  type Intresserad,
  IntresseradSchema,
  MailLogEntrySchema,
  MailSendResultSchema,
  type PersonDetail,
  PersonDetailSchema,
  PersonNoteSchema,
  PersonSchema,
  type PlaceListItem,
  PlaceListItemSchema,
  parsaAttachment,
  parsaAttachments,
  type RecordActivityResult,
  RecordActivityResultSchema,
  type RegistrationDetail,
  RegistrationDetailSchema,
  RegistrationSchema,
  type SavedSegment,
  SavedSegmentSchema,
  type SaveEventContentInput,
  type SaveEventTextInput,
  type SavePlaceInput,
  type SavePlaceStandardInput,
  type SaveSegmentInput,
  type SegmentResult,
  SegmentResultSchema,
  type SegmentRuleDnf,
  type SendActionEmailInput,
  type SendActionEmailResult,
  SendActionEmailResultSchema,
  type SendActionTestEmailInput,
  type SendActionTestEmailResult,
  SendActionTestEmailResultSchema,
  type SendReceiptInput,
  type SendReceiptResult,
  SendReceiptResultSchema,
  type UpdateEventInput,
  WaitlistEntrySchema,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ActivityLogPage, ActivityLogParams } from '../../domain/types/Pagination';
import { AttachmentClass } from '../../domain/types/Status';
import { callEdgeFunction, postEdgeFunction, supabase } from '../config/supabase-client';
import {
  BILAGOR_BUCKET_ID,
  fileToBase64,
  formatMB,
  SMALL_UPLOAD_MAX_BYTES,
} from './attachmentUpload';
import type { DataSourceAdapter, MallId } from './DataSourceAdapter';
import { berakaAktuellKallhash, mallIdFranAirtableOption } from './mallKallhash';

// Airtable tabell-ID:n (från docs/schema_reference.md). Behålls som
// referens i kommentarer för framtida operations-definitioner i
// supabase/functions/_shared/field-allowlists.ts. Selva mappningen
// operation → tabell sker i Edge Function via getOperation(), inte
// längre i klient-koden (M4 K9-respekt: domännamn i klient, table-IDs
// i Edge Function-implementationen).

export class AirtableAdapter implements DataSourceAdapter {
  // === Befintliga metoder (oförändrade) ===

  async fetchEvents(): Promise<Event[]> {
    const data = await callEdgeFunction<{ events: unknown }>('get-events');
    return z.array(EventSchema).parse(data.events);
  }

  async fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]> {
    const params: Record<string, string> = {};
    if (filters?.eventId) params.eventId = filters.eventId;
    if (filters?.status) params.status = filters.status;
    if (filters?.flagga) params.flagga = filters.flagga;

    const data = await callEdgeFunction<{ registrations: unknown }>(
      'get-registrations',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return z.array(RegistrationSchema).parse(data.registrations);
  }

  /**
   * Hämta HELA personregistret (ADR-123 beslut 1, TASK-286.1) — se
   * `DataSourceAdapter.fetchPersonsRegister` för det fulla kontraktet.
   * `register: 'true'` är EF-ANROPETS EGEN signal (den skiljer denna gren
   * från EF:ens kvarvarande sök-/cursor-gren på SAMMA `get-persons`-endpoint)
   * — inget UI-argument passerar den vidare, metoden tar inga parametrar.
   *
   * [ENDA PERSONLIST-ANROPET, TASK-286.3] `listPersons` stod här och byggde
   * `?search=`/`?cursor=`/`?pageSize=` mot samma endpoint, plus en skew-säker
   * avläsning av EF:ens `total`-fält. Både metoden och `total`-fältet är rivna:
   * fältet finns inte längre i EF-svaret (dess full-walk är riven i samma
   * skiva), och klienten hade ingen konsument kvar efter TASK-286.2.
   */
  async fetchPersonsRegister(): Promise<Person[]> {
    const data = await callEdgeFunction<{ persons: unknown }>('get-persons', {
      register: 'true',
    });
    return z.array(PersonSchema).parse(data.persons);
  }

  async updateRecord(
    operationKey: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await postEdgeFunction('update-record', { operationKey, recordId, fields });
  }

  /**
   * Hämta enskilt event via ID (Fas 6b L2). Speglar get-events-mappningen för
   * EN rad via get-event-EF (single-get, ingen aggregering). `.parse()` validerar
   * vid datagränsen (ADR-026; single EventSchema, INTE z.array). 404 från EF:en
   * (okänt ID) propagerar som `EdgeFunctionError` med `status: 404` — info-vyn
   * skiljer ej-funnen från övriga fel på den (samma mönster som fetchPerson).
   */
  async fetchEvent(id: string): Promise<Event> {
    const data = await callEdgeFunction<{ event: unknown }>('get-event', { id });
    return EventSchema.parse(data.event);
  }

  // === Debt-klassade stub-metoder (Fas 2.5 klunga 4, A5-tabellen i
  // P1-sessionsdok Del 3). EF deployas per strangler-fig-sub-fas i Fas 6;
  // .parse()-aktivering sker vid deploy (ADR-026 beslut 5). ===

  /**
   * Hämta enskild person via ID — aggregerar full historik (Fas 6a L5a).
   *
   * get-person-EF:en hämtar person-raden (ett anrop) + batch-hämtar
   * kurshistorik ur Deltaganden (ett anrop) och returnerar PersonDetail-form.
   * `.parse()` validerar vid datagränsen (ADR-026; single, ej z.array). 404 från
   * EF:en (okänt ID) propagerar som `EdgeFunctionError` med `status: 404` —
   * UI:t skiljer ej-funnen från övriga fel på den.
   *
   * 4:e aktiva callsite för PersonDetailSchema/PersonSchema — under ADR-026:s
   * ≥5-tröskel för helper-extraktion, så inline `.parse()` består.
   */
  async fetchPerson(id: string): Promise<PersonDetail> {
    const data = await callEdgeFunction<{ person: unknown }>('get-person', { id });
    return PersonDetailSchema.parse(data.person);
  }

  /** Uppdatera anmälan — kräver explicit operationKey (M4). */
  async updateRegistration(
    operationKey: string,
    id: string,
    fields: Partial<Registration>,
  ): Promise<void> {
    await this.updateRecord(operationKey, id, fields as Record<string, unknown>);
  }

  /**
   * Skapa ny manuell anmälan (Fas 6c Leverabel 4). POST mot create-registration-EF,
   * som bygger write-shapen server-side (EventKey via Eventplanering-lookup,
   * Källa="Manuell"/Status="Obekräftad"/Inskickad som konstanter, Person-länk via A2),
   * idempotens-nyckel + 409-dubblett-grind. `idempotencyKey` skickas i body (EF:en
   * läser header ELLER body). EF-svaret bär `registration` (ren domän-shape) — `.parse()`
   * validerar vid datagränsen (ADR-026); det parallella råa `record`-fältet är skriv-bevis
   * för conformance och konsumeras inte här.
   */
  async createRegistration(input: CreateRegistrationInput): Promise<Registration> {
    const data = await postEdgeFunction<{ registration: unknown }>('create-registration', {
      fornamn: input.fornamn,
      efternamn: input.efternamn,
      email: input.email,
      telefon: input.telefon,
      eventId: input.eventId,
      idempotencyKey: input.idempotencyKey,
      // Facit-formens två fält (task-18.12): additivt-optional, skickas bara när
      // satta så modal-callern (som utelämnar dem) inte tvingar tomma nycklar.
      ...(input.antalPlatser !== undefined ? { antalPlatser: input.antalPlatser } : {}),
      ...(input.notering != null ? { notering: input.notering } : {}),
    });
    return RegistrationSchema.parse(data.registration);
  }

  /**
   * Hämta en enskild anmälan i detalj-shape (task-18.17). get-registration-EF:en
   * återanvänder get-registrations läs-kärna (`_shared/registration-read.ts` —
   * samma mappning + person-berikning, aldrig en parallell mapper) och utökar
   * med detaljfälten (autonummer-ID, formulär + options-ID, villkor,
   * event-lookups, deadline-formlerna, medföljande-relationen åt båda håll).
   * `.parse()` validerar vid datagränsen (ADR-026; single, ej z.array). 404
   * från EF:en (okänt ID) propagerar som `EdgeFunctionError` med `status: 404`
   * — vyn skiljer ej-funnen från övriga fel på den (get-person-mönstret).
   */
  async fetchRegistration(id: string): Promise<RegistrationDetail> {
    const data = await callEdgeFunction<{ registration: unknown }>('get-registration', { id });
    return RegistrationDetailSchema.parse(data.registration);
  }

  /**
   * Hämta deltaganden (närvaro) per event (Fas 6b L3). get-attendance-EF:en
   * filtrerar Deltaganden på eventId (ärver get-registrations länkfält-filter) och
   * BERIKAR varje rad med läsbart `personNamn` (batch-hämtat ur Personer.Namn —
   * Deltaganden bär bara record-ID:n). `.parse()` validerar vid datagränsen
   * (ADR-026; z.array — en LISTA, till skillnad från single get-event/get-person).
   *
   * Endast `eventId` skickas: EF:en filtrerar serverside på event, närvaro-vyn
   * grupperar per session klientside (samma list-hämtar-allt + filtrera-lokalt-
   * mönster som fetchEvents/EventsList; session/status i AttendanceFilters reserveras
   * för framtida serverside-filter, skickas ej idag).
   */
  async fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]> {
    const params: Record<string, string> = {};
    if (filters?.eventId) params.eventId = filters.eventId;

    const data = await callEdgeFunction<{ attendance: unknown }>(
      'get-attendance',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return z.array(AttendanceSchema).parse(data.attendance);
  }

  /** Uppdatera deltagandes status — kräver explicit operationKey (M4). */
  async updateAttendance(operationKey: string, id: string, status: string): Promise<void> {
    await this.updateRecord(operationKey, id, { Status: status });
  }

  /**
   * Skapa en Deltaganden-rad (TASK-214.2 — dörrens CREATE-backup). Skickar
   * ENDAST identiteten; `Status: 'Närvarande'` byggs server-side av EF:en och
   * kan inte överstyras härifrån (`create-attendance/index.ts` § Bygg write-fält
   * SERVER-SIDE). Samma POST-form som `createEventNote`/`createPersonNote`.
   *
   * `.parse()` validerar vid datagränsen (ADR-026) — ett single-objekt, inte en
   * lista, så inget `z.array`.
   */
  async createAttendance(input: CreateAttendanceInput): Promise<CreatedAttendance> {
    const data = await postEdgeFunction<unknown>('create-attendance', {
      anmalanId: input.anmalanId,
      eventId: input.eventId,
      session: input.session,
    });
    const svar = CreatedAttendanceSchema.parse(data);
    return { id: svar.record.id, created: svar.created };
  }

  /**
   * Hämta väntelistan (Fas 6c Leverabel 3). GLOBAL läs-lista: get-waitlist
   * filtrerar serverside på NOT({Flyttad till anmälan}) och sorterar createdTime
   * desc. Valfritt `event`-filter (by-name) skickas vidare om satt; vy-konsumenten
   * passar inga filters → global hämtning. `.parse()` validerar vid datagränsen
   * (ADR-026; z.array — en LISTA).
   */
  async fetchWaitlist(filters?: WaitlistFilters): Promise<WaitlistEntry[]> {
    const params: Record<string, string> = {};
    if (filters?.event) params.event = filters.event;

    const data = await callEdgeFunction<{ waitlist: unknown }>(
      'get-waitlist',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return z.array(WaitlistEntrySchema).parse(data.waitlist);
  }

  /**
   * Hämta Intresserade (Fas 6e L1). GLOBAL läs-lista: get-leads filtrerar
   * serverside på den strikta lead-formeln (hämtat något, noll Anmälningar
   * totalt — Läsning 2) och sorterar 'Senaste interaktion (datum)' desc.
   * `.parse()` validerar vid datagränsen (ADR-026; z.array — en LISTA).
   *
   * v1 visar FÖRSTA sidan (pageSize default 50 server-side). Lead-mängden är
   * liten; full cursor-paginering (nextCursor finns i svaret) deferreras till
   * en useInfiniteQuery-väg vid behov (jfr persons). Inga filters i v1.
   */
  async fetchIntresserade(): Promise<Intresserad[]> {
    const data = await callEdgeFunction<{ intresserade: unknown }>('get-leads');
    return z.array(IntresseradSchema).parse(data.intresserade);
  }

  /**
   * Hämta engagemang.
   *
   * @deferTo: post-Gate-4B (utanför Fas 6, post-Fas E-fönster) — A5 #7,
   * 06b-impact: STOR + osäker (Gate 4B fråga 4 öppen: interactions-tabell
   * vs separata). Svagaste deploy-kandidaten av alla 9 per A5.
   * @todo Apply Zod .parse() runtime validation when get-engagements Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchEngagements(_personId?: string): Promise<Engagement[]> {
    throw new Error('Not deployed yet - see Gate 4B-resolution (post-Fas E)');
  }

  /**
   * Skicka mailutskick.
   *
   * @deferTo: Fas-6e (Mer-fliken Mail eller per-anmälan actions) — A5 #8,
   * 06b-impact: ENORM (target är communication_outbox-arkitektur).
   * Direct-Resend-implementationen är medveten skuld per ADR-015
   * (send-email-direct-resend); migreras till outbox post-Fas E.
   */
  /**
   * Skicka ett bulk-mailutskick på ett (eller flera) sparade segment (Fas 6h L3,
   * ADR-067). POST mot send-email-EF via postEdgeFunction — kroppen är EF:ens
   * deny-by-default-kontrakt: `segmentIds` (sparade Segment-record-ID, upplöses
   * SERVER-SIDE till mottagare — aldrig en klient-byggd lista), `amne`, `mailtext`
   * och den stabila `idempotencyKey` (UUID v4, body-fallback för Idempotency-Key-
   * headern). `antalMottagare` skickas EJ — EF:en räknar server-side. Svaret
   * (`BulkSendStatus`) `.parse()`:as vid datagränsen (ADR-026); aldrig binärt utfall.
   */
  async sendEmail(payload: MailPayload): Promise<MailSendResult> {
    const data = await postEdgeFunction<unknown>('send-email', {
      amne: payload.amne,
      mailtext: payload.mailtext,
      segmentIds: payload.segmentIds,
      idempotencyKey: payload.idempotencyKey,
    });
    return MailSendResultSchema.parse(data);
  }

  /**
   * Hämta mailloggen (Utskickslogg) — GLOBAL läs-lista (Fas 6e L2). get-mail-log
   * hämtar HELA utskicksloggen (ingen filter/event-gren) och sorterar createdTime
   * desc serverside. `.parse()` validerar vid datagränsen (ADR-026; z.array — en LISTA).
   * Inga params → global hämtning. (Utskickslogg är de facto tom tills L3 send-email
   * skriver första raden; tom array parsar rent.)
   */
  async fetchMailLog(): Promise<MailLogEntry[]> {
    const data = await callEdgeFunction<{ maillog: unknown }>('get-mail-log');
    return z.array(MailLogEntrySchema).parse(data.maillog);
  }

  /**
   * Beräkna segment-medlemskap från KÄLLAN (Deltaganden, strikt Närvaropoäng=1)
   * givet en regel (Fas 6g L2). POST mot compute-segment-EF (regeln ryms ej i
   * query-params) via postEdgeFunction. `.parse()` validerar svaret vid
   * datagränsen (ADR-026). Consent (ejGodkandMail) bärs med, filtreras ej (L4).
   */
  async computeSegment(rule: SegmentRuleDnf): Promise<SegmentResult> {
    const data = await postEdgeFunction<unknown>('compute-segment', rule);
    return SegmentResultSchema.parse(data);
  }

  /**
   * Spara en namngiven segment-regel (Fas 6g L3, ADR-065). POST mot save-segment-EF,
   * som bygger write-shapen server-side (tre app-skrivbara Segment-fält) ur typad
   * input. EF-svaret bär `segment` (ren domän-shape) — `.parse()` validerar vid
   * datagränsen (ADR-026); det parallella råa `record`-fältet är skriv-bevis för
   * conformance och konsumeras inte här.
   */
  async saveSegment(input: SaveSegmentInput): Promise<SavedSegment> {
    const data = await postEdgeFunction<{ segment: unknown }>('save-segment', {
      namn: input.namn,
      rule: input.rule,
      definition: input.definition,
    });
    return SavedSegmentSchema.parse(data.segment);
  }

  /**
   * Lista app-sparade segment (Fas 6g L3). GLOBAL läs-lista (get-segments) — legacy
   * Make-rader utan App-segmentregel exkluderas server-side, så varje rad bär en
   * typad regel. `.parse()` validerar vid datagränsen (ADR-026; z.array — en LISTA).
   */
  async listSegments(): Promise<SavedSegment[]> {
    const data = await callEdgeFunction<{ segments: unknown }>('get-segments');
    return z.array(SavedSegmentSchema).parse(data.segments);
  }

  /**
   * Lista Eventformat-poster för create-event:s Eventtyp-dropdown (Fas 6f L2). GLOBAL
   * läs-lista (get-event-formats) — record-ID + visningsnamn. `.parse()` validerar vid
   * datagränsen (ADR-026; z.array — en LISTA).
   */
  async getEventFormats(): Promise<EventFormat[]> {
    const data = await callEdgeFunction<{ eventFormats: unknown }>('get-event-formats');
    return z.array(EventFormatSchema).parse(data.eventFormats);
  }

  /**
   * Bilagornas ifyllnadsunderlag för ETT event (TASK-309.2 AC #4, ADR-125
   * § 2). GET mot get-document-sources-EF:en — se
   * `DataSourceAdapter.getDocumentSources` för det fulla kontraktet
   * (standard/kopia-formen, varför fallback-regeln bor server-side).
   * `.parse()` validerar vid datagränsen (ADR-026).
   */
  async getDocumentSources(eventId: string): Promise<DocumentSources> {
    const data = await callEdgeFunction<unknown>('get-document-sources', { eventId });
    return DocumentSourcesSchema.parse(data);
  }

  /**
   * Spara eventets egna kopia av ett block (TASK-309.3 AC #1). POST mot
   * save-event-text-EF:en — se `DataSourceAdapter.saveEventText` för det
   * fulla kontraktet. Inget svar att parse:a (ingen domän-shape konsumeras
   * här ännu; refetch sker via `queryKeys.documentSources` -invalideringen
   * i mutations-hooken).
   */
  async saveEventText(input: SaveEventTextInput): Promise<void> {
    await postEdgeFunction('save-event-text', {
      eventId: input.eventId,
      falt: input.falt,
      agenda: input.agenda,
    });
  }

  /**
   * "Spara som platsens standard" (TASK-309.3 AC #2). POST mot
   * save-place-standard-EF:en — se `DataSourceAdapter.savePlaceStandard`
   * för det fulla kontraktet (find-or-create Platser + länk + kopia-
   * rensning, allt server-side).
   */
  async savePlaceStandard(input: SavePlaceStandardInput): Promise<void> {
    await postEdgeFunction('save-place-standard', {
      eventId: input.eventId,
      falt: input.falt,
    });
  }

  /**
   * Spara Eventinnehållets standardtexter/-agenda (TASK-309.3 AC #3). POST
   * mot save-event-content-EF:en — `Namn` skickas ALDRIG (EF:en härleder
   * den server-side ur radens Event/Typ, se
   * `DataSourceAdapter.saveEventContent`).
   */
  async saveEventContent(input: SaveEventContentInput): Promise<void> {
    await postEdgeFunction('save-event-content', {
      eventinnehallId: input.eventinnehallId,
      falt: input.falt,
      agenda: input.agenda,
    });
  }

  /**
   * Lista SAMTLIGA Eventinnehåll-rader (TASK-309.7 AC #2). GET mot
   * get-event-contents-EF:en — GLOBAL läs-lista, `.parse()` validerar vid
   * datagränsen (ADR-026; z.array — en LISTA).
   */
  async getEventContents(): Promise<EventinnehallListItem[]> {
    const data = await callEdgeFunction<{ eventinnehall: unknown }>('get-event-contents');
    return z.array(EventinnehallListItemSchema).parse(data.eventinnehall);
  }

  /**
   * Lista SAMTLIGA Platser-rader (TASK-309.7 AC #3). GET mot get-places-EF:en.
   */
  async getPlaces(): Promise<PlaceListItem[]> {
    const data = await callEdgeFunction<{ places: unknown }>('get-places');
    return z.array(PlaceListItemSchema).parse(data.places);
  }

  /**
   * REN plats-redigering UTAN event (TASK-309.7 AC #3). POST mot
   * save-place-standard-EF:en i dess event-lösa läge — se
   * `DataSourceAdapter.savePlace` för det fulla kontraktet.
   */
  async savePlace(input: SavePlaceInput): Promise<void> {
    await postEdgeFunction('save-place-standard', {
      platsId: input.platsId,
      namn: input.namn,
      falt: input.falt,
    });
  }

  /**
   * Skapa ett nytt event (Fas 6f, ADR-066). POST mot create-event-EF, som bygger write-
   * shapen server-side (Månad/år härlett ur Startdatum, Eventtyp-länk, system-genererade
   * EventKey/Event-nr orörda) och kör en idempotent upsert på Idempotensnyckel.
   * `idempotencyKey` skickas i body (EF:en läser header ELLER body — mirror av
   * createRegistration). BÅDE 201 (created) OCH 200 (idempotent replay) är framgång och
   * returnerar samma `event`-shape — adaptern skiljer dem INTE (en replay är inte ett fel).
   * `.parse()` validerar vid datagränsen (ADR-026); råa `record`-fältet konsumeras ej här.
   *
   * PUBLICERINGSFLAGGAN (task-19.4): `publicera` skickas ENDAST när handtaget är armerat.
   * En oarmerad flagga utelämnas ur payloaden hela vägen — EF:ens fields-map är tät, så
   * ett skickat `false` skulle SÄTTA Airtable-fältet i stället för att lämna det osatt.
   */
  async createEvent(input: CreateEventInput): Promise<CreatedEvent> {
    const data = await postEdgeFunction<{ event: unknown }>('create-event', {
      event: input.event,
      typ: input.typ,
      ort: input.ort,
      startdatum: input.startdatum,
      slutdatum: input.slutdatum,
      maxPlatser: input.maxPlatser,
      eventtyp: input.eventtyp,
      idempotencyKey: input.idempotencyKey,
      ...(input.publicera === true ? { publicera: true } : {}),
    });
    return CreatedEventSchema.parse(data.event);
  }

  /**
   * Uppdatera ett befintligt event (task-18.1). POST mot update-event-EF, som bygger
   * write-shapen server-side ur de typade optionella fälten (endast närvarande fält
   * skickas — frånvaro betyder "ändra inte"), omhärleder Månad/år när Startdatum
   * ändras (ADR-066 b6-arvet) och PATCH:ar raden. Svaret bär `event` i den BERIKADE
   * läs-shapen (samma mappning som get-event) — `.parse()` validerar vid datagränsen
   * (ADR-026); råa `record`-fältet är skriv-bevis för conformance och konsumeras ej här.
   * Ingen idempotensnyckel: PATCH med absoluta värden är naturligt idempotent.
   */
  async updateEvent(input: UpdateEventInput): Promise<Event> {
    const body: Record<string, unknown> = { eventId: input.eventId };
    if (input.typ !== undefined) body.typ = input.typ;
    if (input.ort !== undefined) body.ort = input.ort;
    if (input.startdatum !== undefined) body.startdatum = input.startdatum;
    if (input.slutdatum !== undefined) body.slutdatum = input.slutdatum;
    if (input.status !== undefined) body.status = input.status;
    if (input.maxPlatser !== undefined) body.maxPlatser = input.maxPlatser;
    // Beläggningens Ändra (task-18.2): K16-modellens två kategorifält —
    // EF:en mappar till basens 'Extra platser'/'Manuella platser' server-side.
    if (input.reserverade !== undefined) body.reserverade = input.reserverade;
    if (input.manuelltTillagda !== undefined) body.manuelltTillagda = input.manuelltTillagda;
    // Auto-utskicket (task-18.6): null MÅSTE gå igenom (rensar schemat server-side) —
    // därför `!== undefined`, aldrig en truthy-check.
    if (input.deltagarinfoSchemalagd !== undefined) {
      body.deltagarinfoSchemalagd = input.deltagarinfoSchemalagd;
    }
    if (input.deltagarinfoAutoAvstangt !== undefined) {
      body.deltagarinfoAutoAvstangt = input.deltagarinfoAutoAvstangt;
    }

    const data = await postEdgeFunction<{ event: unknown }>('update-event', body);
    return EventSchema.parse(data.event);
  }

  /**
   * Bekräfta en eller flera anmälningar (task-18.6). POST mot
   * send-registration-confirmation-EF:en, som läser upp anmälningarna SERVER-SIDE
   * (adress/namn/status kommer aldrig från klienten), skickar bekräftelsemailet och
   * flippar Status + 'Bekräftelse skickad' för dem vars mail accepterades. Samma
   * operation bär den enskilda bekräftelsen och Bekräfta alla — bara antalet ID:n
   * skiljer. `idempotencyKey` skickas i body (EF:en läser header ELLER body).
   * `.parse()` validerar vid datagränsen (ADR-026); svaret är aldrig binärt.
   */
  async confirmRegistrations(
    input: ConfirmRegistrationsInput,
  ): Promise<ConfirmRegistrationsResult> {
    const data = await postEdgeFunction<unknown>('send-registration-confirmation', {
      registrationIds: input.registrationIds,
      idempotencyKey: input.idempotencyKey,
    });
    return ConfirmRegistrationsResultSchema.parse(data);
  }

  /**
   * Skicka ett åtgärdsutskick (TASK-147.2). POST mot send-action-email-EF:en
   * (TASK-147.1), som löser mottagarna SERVER-SIDE (klienten skickar bara
   * record-ID:n + eventId), sänder via den bilage-fria batchgrenen och
   * skriver åtgärdens stämpel-fält för de accepterade. `idempotencyKey`
   * skickas i body (EF:en läser header ELLER body — confirmRegistrations-
   * mönstret). `.parse()` validerar vid datagränsen (ADR-026); svaret är
   * aldrig binärt.
   */
  async sendActionEmail(input: SendActionEmailInput): Promise<SendActionEmailResult> {
    const data = await postEdgeFunction<unknown>('send-action-email', {
      actionType: input.actionType,
      eventId: input.eventId,
      registrationIds: input.registrationIds,
      amne: input.amne,
      mailtext: input.mailtext,
      idempotencyKey: input.idempotencyKey,
      // [TASK-147.5] Alltid skickad, ÄVEN tom — servern grenar automatiskt
      // (AC #1): tom/frånvarande ⇒ bilage-fri batchgren, oförändrad.
      attachmentIds: input.attachmentIds ?? [],
    });
    return SendActionEmailResultSchema.parse(data);
  }

  /**
   * "Skicka test till mig" (TASK-147.2s EF, TASK-147.10s testgren). SAMMA
   * POST mot `send-action-email`, plus `testSend: true` — EF:en löser upp
   * ENDAST det ENA registrationId:t för platshållar-data och skriver ALLTID
   * över adressen med den inloggade användarens egen (server-side). `.parse()`
   * validerar vid datagränsen (ADR-026).
   */
  async sendActionTestEmail(input: SendActionTestEmailInput): Promise<SendActionTestEmailResult> {
    const data = await postEdgeFunction<unknown>('send-action-email', {
      actionType: input.actionType,
      eventId: input.eventId,
      registrationIds: input.registrationIds,
      amne: input.amne,
      mailtext: input.mailtext,
      idempotencyKey: input.idempotencyKey,
      testSend: true,
    });
    return SendActionTestEmailResultSchema.parse(data);
  }

  /**
   * Skicka ETT kvitto (TASK-147.7, ADR-109). POST mot send-receipt-email-EF:en,
   * som löser mottagaren SERVER-SIDE (klienten skickar bara registration-/
   * event-ID + belopp/betalsätt/betalning), allokerar kvittonumret,
   * genererar PDF:en och sänder — EN mottagare, EN betalning per anrop.
   * `.parse()` validerar vid datagränsen (ADR-026).
   */
  async sendReceipt(input: SendReceiptInput): Promise<SendReceiptResult> {
    const data = await postEdgeFunction<unknown>('send-receipt-email', {
      registrationId: input.registrationId,
      eventId: input.eventId,
      betalning: input.betalning,
      belopp: input.belopp,
      betalsatt: input.betalsatt,
      idempotencyKey: input.idempotencyKey,
    });
    return SendReceiptResultSchema.parse(data);
  }

  /**
   * Aktivitetsloggens skrivväg (TASK-201.3, ADR-110/ADR-111). POST mot
   * `log-activity`-EF:en med det HELA (redan klient-validerade) statementet
   * som body — EF:en validerar OM med samma Zod-schema server-side (AC #2)
   * och skriver via `service_role` till Supabase `activity_log`, helt
   * utanför Airtable (se `DataSourceAdapter.recordActivity` för varför
   * denna metod är identisk i `SupabaseAdapter`). `.parse()` validerar vid
   * datagränsen (ADR-026), som alla andra write-metoder i denna fil.
   */
  async recordActivity(statement: ActivityStatement): Promise<RecordActivityResult> {
    // Spread → fräsch objekt-literal: `ActivityStatement` bär inget index-
    // signatur, `postEdgeFunction` tar `Record<string, unknown>` (samma
    // spread-mönster som andra write-metoder i denna fil när hela
    // domän-objektet, inte utvalda fält, är bodyn).
    const data = await postEdgeFunction<unknown>('log-activity', { ...statement });
    return RecordActivityResultSchema.parse(data);
  }

  /**
   * Hämta eventets anteckningar (task-18.11, ADR-075). get-event-notes-EF:en läser
   * eventets omvända `Anteckningar`-länk och batch-hämtar Anteckningar-raderna
   * (samma record-ID-batch-form som get-attendance), mappar till domän-shape och
   * sorterar nyast först server-side. `.parse()` validerar vid datagränsen
   * (ADR-026; z.array — en LISTA). 404 (okänt eventId) propagerar som
   * `EdgeFunctionError` med `status: 404`.
   */
  async fetchEventNotes(eventId: string): Promise<EventNote[]> {
    const data = await callEdgeFunction<{ notes: unknown }>('get-event-notes', { eventId });
    return z.array(EventNoteSchema).parse(data.notes);
  }

  /**
   * Skapa en anteckning på ett event (task-18.11, ADR-075). POST mot
   * create-event-note-EF, som gatar auth (requireUser), sätter FÖRFATTAREN
   * server-side ur den verifierade JWT:ns `user_metadata.display_name` (aldrig
   * klient-buren — spoof-säker attribution) och länkar eventet. EF-svaret bär
   * `note` (ren domän-shape) — `.parse()` validerar vid datagränsen (ADR-026); det
   * parallella råa `record`-fältet är skriv-bevis för conformance och konsumeras ej här.
   */
  async createEventNote(input: CreateEventNoteInput): Promise<EventNote> {
    const data = await postEdgeFunction<{ note: unknown }>('create-event-note', {
      eventId: input.eventId,
      text: input.text,
    });
    return EventNoteSchema.parse(data.note);
  }

  /**
   * Hämta personens anteckningar (S103, T97-bygg-spåret). get-person-notes-EF:en
   * läser personens omvända länk (`Anteckningar 2` på Airtable-sidan — namn-
   * kollision med det gamla fritext-fältet `Anteckningar`, hanteras helt i EF:en)
   * och batch-hämtar Anteckningar-raderna (samma record-ID-batch-form som
   * `fetchEventNotes`), mappar till domän-shape och sorterar nyast först server-
   * side. `.parse()` validerar vid datagränsen (ADR-026; z.array — en LISTA).
   * 404 (okänt personId) propagerar som `EdgeFunctionError` med `status: 404`.
   */
  async fetchPersonNotes(personId: string): Promise<PersonNote[]> {
    const data = await callEdgeFunction<{ notes: unknown }>('get-person-notes', { personId });
    return z.array(PersonNoteSchema).parse(data.notes);
  }

  /**
   * Skapa en anteckning på en person (S103, T97-bygg-spåret). POST mot
   * create-person-note-EF, som gatar auth (requireUser), sätter FÖRFATTAREN
   * server-side ur den verifierade JWT:ns `user_metadata.display_name` (aldrig
   * klient-buren — spoof-säker attribution, ADR-075) och länkar personen.
   * EF-svaret bär `note` (ren domän-shape) — `.parse()` validerar vid datagränsen
   * (ADR-026); det parallella råa `record`-fältet är skriv-bevis för conformance
   * och konsumeras inte här. Speglar `createEventNote` exakt.
   */
  async createPersonNote(input: CreatePersonNoteInput): Promise<PersonNote> {
    const data = await postEdgeFunction<{ note: unknown }>('create-person-note', {
      personId: input.personId,
      text: input.text,
    });
    return PersonNoteSchema.parse(data.note);
  }

  /**
   * Ladda upp en bilaga (TASK-146.4). Väljer mönster ur `file.size` mot
   * `SMALL_UPLOAD_MAX_BYTES` — se `DataSourceAdapter.uploadAttachment` för
   * det fulla kontraktet och `attachmentUpload.ts` för gränsens motivering.
   */
  async uploadAttachment(input: UploadAttachmentInput): Promise<Attachment> {
    if (input.file.size <= SMALL_UPLOAD_MAX_BYTES) {
      return this.uploadAttachmentSmall(input);
    }
    // [TASK-275.3, ADR-118 beslut 5, MEDVETEN AVGRÄNSNING] Mönster 2
    // (create-attachment-upload-ticket + finalize-attachment-upload) STÖDER
    // INTE event-lösa uppladdningar — `eventId` är där fortfarande
    // obligatorisk (se upload-attachment/index.ts § filhuvudet för
    // avgränsningens fulla resonemang). Ett event-löst försök över
    // mönster-1-gränsen skulle annars nå EF:en och möta en generisk
    // "Ogiltigt event-id."-400 — den här kontrollen ger Lotta ett ärligt,
    // FÖRKLARANDE fel direkt i stället, INNAN nätverksanropet ens görs.
    if (input.eventId === null) {
      throw new Error(
        `"${input.file.name}" (${formatMB(input.file.size)}) är för stor för en gemensam ` +
          `uppladdning utan valt event (max ${formatMB(SMALL_UPLOAD_MAX_BYTES)}). ` +
          'Prova en mindre fil, eller ladda upp filen från ett events sida i stället.',
      );
    }
    return this.uploadAttachmentLarge(input);
  }

  /**
   * Mönster 1 (AC #3): bytesen base64-kodas och skickas i EF:ens request-body.
   * upload-attachment-EF:en skriver dem till lagringen med förhöjd behörighet
   * (service-role) OCH en Bilagor-metadatarad i SAMMA operation — klienten ser
   * aldrig en mellantillstånd där filen finns men metadatat inte gör det.
   */
  private async uploadAttachmentSmall(input: UploadAttachmentInput): Promise<Attachment> {
    const bytesBase64 = await fileToBase64(input.file);
    const data = await postEdgeFunction<{ attachment: unknown }>('upload-attachment', {
      // [TASK-275.3, ADR-118 beslut 5] `null` skickas EXPLICIT (aldrig
      // utelämnad) för en genuint event-lös gemensam uppladdning — samma
      // "explicit null, aldrig tyst utelämning"-disciplin som
      // `deleteAttachment` redan etablerar.
      eventId: input.eventId,
      filnamn: input.file.name,
      contentType: input.file.type || 'application/pdf',
      bytesBase64,
      // [TASK-275.2, ADR-118] Valfria — EF:en default:ar rackvidd till
      // 'Event' när utelämnad (oförändrat beteende).
      // [UTBYGGT, TASK-338.3, ADR-125 § 1] `plats` är den TREDJE axeln, ett
      // Platser-RECORD-ID. Skickas RAKT IGENOM: existenskontrollen mot
      // Platser-tabellen bor i EF:en (`platsFinns`, `_shared/attachments.ts`)
      // eftersom bara servern kan avgöra att raden finns — adaptern som
      // gissade hade antingen behövt en egen hämtning (en andra sanning) eller
      // släppt igenom ett ID som Airtable tyst sväljer som en TOM länk.
      rackvidd: input.rackvidd,
      kursfamilj: input.kursfamilj,
      kursniva: input.kursniva,
      plats: input.plats,
    });
    // Uppladdade rader är aldrig Event-mallade — 'inaktuell' är strukturellt
    // inte tillämplig (TASK-309.6, se domänmodellens docblock).
    return { ...parsaAttachment(data.attachment), inaktuell: null };
  }

  /**
   * Mönster 2 (AC #4/#5): tre steg, ALDRIG bytesen genom en EF.
   *
   *   1. create-attachment-upload-ticket-EF:en fattar AUKTORISATIONSBESLUTET
   *      server-side (eventet finns, storleken ryms i bucketens faktiska
   *      gräns) och utfärdar ett tidsbegränsat (2h, empiriskt verifierat —
   *      se AttachmentUploadTicketSchema), path-scopat tillstånd. Path och
   *      attachmentId är SERVER-DERIVERADE — klienten väljer ingetdera.
   *   2. Adaptern laddar upp bytesen DIREKT mot lagringen med det tillståndet
   *      (`uploadToSignedUrl`). Detta är den enda platsen i HELA UI-lagret
   *      (inkl. adaptern) som rör lagrings-SDK:t — mekaniskt fällt att den
   *      inte sker någon annanstans, se
   *      tests/api/attachment-layer-independence.test.ts. Den återanvänder
   *      `supabase`-singleton-klienten (samma instans som redan bär
   *      auth-sessionen, `../config/supabase-client.ts`) — ingen ny
   *      SDK-import.
   *   3. finalize-attachment-upload-EF:en verifierar SERVER-SIDE att objektet
   *      faktiskt landade på den path servern själv deriverade (klienten kan
   *      inte peka finalize mot ett annat events fil — path är aldrig
   *      klient-buren) och skriver Bilagor-metadataraden med den FAKTISKA
   *      storleken lagringen rapporterar, inte ett klient-påstått tal.
   */
  private async uploadAttachmentLarge(input: UploadAttachmentInput): Promise<Attachment> {
    const contentType = input.file.type || 'application/pdf';
    const ticketData = await postEdgeFunction<{ ticket: unknown }>(
      'create-attachment-upload-ticket',
      {
        eventId: input.eventId,
        filnamn: input.file.name,
        contentType,
        sizeBytes: input.file.size,
      },
    );
    const ticket = AttachmentUploadTicketSchema.parse(ticketData.ticket);

    const { error: uploadError } = await supabase.storage
      .from(BILAGOR_BUCKET_ID)
      .uploadToSignedUrl(ticket.path, ticket.token, input.file, { contentType });
    if (uploadError) {
      throw new Error(
        `Uppladdningen av "${input.file.name}" (${formatMB(input.file.size)}) misslyckades: ${uploadError.message}`,
      );
    }

    const data = await postEdgeFunction<{ attachment: unknown }>('finalize-attachment-upload', {
      eventId: input.eventId,
      attachmentId: ticket.attachmentId,
      filnamn: input.file.name,
      // [TASK-275.2, ADR-118 · TASK-338.3] Se uploadAttachmentSmall ovan —
      // samma valfria trädgren inklusive `plats`-axeln,
      // `create-attachment-upload-ticket` (steget ovan) rör dem aldrig
      // (skriver ingen Bilagor-rad).
      rackvidd: input.rackvidd,
      kursfamilj: input.kursfamilj,
      kursniva: input.kursniva,
      plats: input.plats,
    });
    // Se uploadAttachmentSmall ovan — samma "aldrig Event-mallad"-motivering.
    return { ...parsaAttachment(data.attachment), inaktuell: null };
  }

  /**
   * Hämta eventets bilagor (TASK-147.5). get-event-attachments-EF:en läser
   * eventets omvända `Bilagor`-länk och batch-hämtar Bilagor-raderna (SAMMA
   * record-ID-batch-form som `fetchEventNotes`), mappar till domän-shape
   * (Lagringsnyckel exkluderad — server-internt fält) och sorterar nyast
   * först server-side. `.parse()` validerar vid datagränsen (ADR-026).
   */
  async fetchEventAttachments(eventId: string): Promise<Attachment[]> {
    const data = await callEdgeFunction<{ attachments: unknown }>('get-event-attachments', {
      eventId,
    });
    const parsed = parsaAttachments(data.attachments);
    return this.berikaMedInaktuell(parsed);
  }

  /**
   * Hämta ALLA gemensamma bilagor (TASK-275.3, ADR-118 beslut 5). SAMMA
   * get-event-attachments-EF, anropad UTAN `eventId`-param — se
   * `DataSourceAdapter.fetchGemensammaBilagor` för det fulla kontraktet.
   */
  async fetchGemensammaBilagor(): Promise<Attachment[]> {
    const data = await callEdgeFunction<{ attachments: unknown }>('get-event-attachments');
    const parsed = parsaAttachments(data.attachments);
    // [TASK-309.6] Defensivt anropad (get-event-attachments/index.ts filtrerar
    // denna gren på `Räckvidd IN (Kurstyp, Alla event)` — generate-event-
    // attachment sätter ALDRIG `Räckvidd`, så en Event-mallad rad förekommer
    // strukturellt inte här i dag). `berikaMedInaktuell` kostar då bara den
    // tomma `eventMallade.length === 0`-kontrollen, ingen extra nätverksfråga.
    return this.berikaMedInaktuell(parsed);
  }

  /**
   * Härleder inaktualitet för Event-mallade bilagerader (TASK-309.6, ADR-125
   * § 3) — "vid listning beräknar adaptern dagens hash av samma data och
   * markerar raden inaktuell när de skiljer sig". Körs på VARJE listning
   * (`fetchEventAttachments`/`fetchGemensammaBilagor`), inte bara när ett
   * event faktiskt bär Event-mallade rader — den vanliga vägen (inga sådana
   * rader) kostar noll extra nätverksanrop.
   *
   * EN `getDocumentSources`-hämtning PER DISTINKT `eventId` (cachead i denna
   * körning, `sourcesCache`) — Event-mallade rader ur SAMMA
   * `fetchEventAttachments(eventId)`-anrop delar alltid samma eventId (se
   * `get-event-attachments/index.ts`s "egna"-gren: unionens övriga två
   * grenar, Kurstyp/Alla-event, kan strukturellt aldrig innehålla en
   * Event-mallad rad — se ovan), så kostnaden är EN extra hämtning per
   * listning i det vanliga fallet, inte en per rad.
   *
   * `inaktuell: null` (aldrig kastar) för allt som INTE kan bedömas: icke-
   * Event-mallade rader, okänt/saknat `mall`, saknat `kallhash` (legacy-
   * rader skapade före TASK-309.4), eller ett event vars underlag inte gick
   * att hämta (nätverksfel, eventet raderat sedan bilagan skapades) —
   * DEFENSIVT: en INAKTUELL-badge som inte kan verifieras ska aldrig
   * påstås, i endera riktningen.
   */
  private async berikaMedInaktuell(
    attachments: Omit<Attachment, 'inaktuell'>[],
  ): Promise<Attachment[]> {
    const bedombara = attachments.filter(
      (a) =>
        a.dokumentklass === AttachmentClass.EVENT_MALLAD &&
        a.eventId !== null &&
        a.mall !== null &&
        a.kallhash !== null,
    );
    if (bedombara.length === 0) {
      return attachments.map((a) => ({ ...a, inaktuell: null }));
    }

    const sourcesCache = new Map<string, DocumentSources | null>();
    const dagensHashById = new Map<string, string>();

    for (const a of bedombara) {
      const mallId: MallId | null = mallIdFranAirtableOption(a.mall);
      // eventId/mall är icke-null via filtret ovan (TypeScript ser inte det
      // genom `.filter`, därför de explicita guarderna).
      if (mallId === null || a.eventId === null) continue;

      let sources = sourcesCache.get(a.eventId);
      if (sources === undefined) {
        try {
          sources = await this.getDocumentSources(a.eventId);
        } catch {
          // Eventet kunde inte läsas (raderat, nätverk, 404) — bedöm inte,
          // se docblockets DEFENSIVT-stycke. `null` cachas så vi inte
          // försöker igen för varje rad på samma event.
          sources = null;
        }
        sourcesCache.set(a.eventId, sources);
      }
      if (sources === null) continue;

      dagensHashById.set(a.id, await berakaAktuellKallhash(mallId, sources));
    }

    return attachments.map((a) => {
      const dagensHash = dagensHashById.get(a.id);
      return {
        ...a,
        inaktuell: dagensHash === undefined ? null : dagensHash !== a.kallhash,
      };
    });
  }

  /**
   * Radera en bilage-post (TASK-147.11). POST mot delete-attachment-EF:en —
   * se `DataSourceAdapter.deleteAttachment` för det fulla kontraktet
   * (ägarskaps-guarden, Storage+Airtable-borttagningen, "Ersätt"-
   * kompositionen). Svaret bär bara `{ deleted: true }`; ingen domän-shape
   * att parsa (till skillnad mot `createEventNote`/`uploadAttachment` finns
   * ingen resurs kvar att returnera).
   */
  async deleteAttachment(eventId: string | null, attachmentId: string): Promise<void> {
    // [TASK-275.2, ADR-118 beslut 3] `eventId: null` (räckviddsläge) skickas
    // som JSON `null` (ALDRIG utelämnad nyckel) — delete-attachment-EF:en
    // tolkar båda formerna som "inget event angivet", men en explicit
    // `null` är öppen bokföring av avsikten, inte en tyst utelämning.
    await postEdgeFunction<{ deleted: boolean }>('delete-attachment', { eventId, attachmentId });
  }

  /**
   * Hämta en signerad nedladdnings-/förhandsvisnings-URL för en bilaga
   * (TASK-245). GET mot get-attachment-download-url-EF:en — se
   * `DataSourceAdapter.getAttachmentDownloadUrl` för det fulla kontraktet
   * (ägarskaps-guarden, TTL:en). `.parse()` validerar vid datagränsen
   * (ADR-026), speglar `fetchEventAttachments`.
   */
  async getAttachmentDownloadUrl(
    eventId: string | null,
    attachmentId: string,
  ): Promise<AttachmentDownloadUrl> {
    // [TASK-275.3, ADR-118 beslut 5] `eventId` UTELÄMNAS helt ur query-strängen
    // när `null` (till skillnad mot POST-kropparnas explicita `null` — GET-
    // params är alltid strängar, `callEdgeFunction`s `Record<string, string>`-
    // form har ingen plats för `null`) — get-attachment-download-url/index.ts
    // läser `URLSearchParams.get('eventId')`, som redan ger `null` för en
    // UTELÄMNAD nyckel, exakt samma tolkning.
    const data = await callEdgeFunction<unknown>('get-attachment-download-url', {
      ...(eventId !== null ? { eventId } : {}),
      attachmentId,
    });
    return AttachmentDownloadUrlSchema.parse(data);
  }

  /**
   * Sidoeffektsfri förhandsvisning av klass B:s systemmall (TASK-246). POST
   * mot generate-event-attachment MED `preview: true` — se
   * `DataSourceAdapter.previewEventTemplate` för det fulla kontraktet (SAMMA
   * EF, en gren som aldrig når Bilagor-skrivningen).
   *
   * [ÄNDRAD, ADR-124, TASK-302.2] Svaret är nu `{ url, utgar }`
   * (`DocumentPreviewSchema`) — EF:en skriver ett transient Storage-utkast
   * och svarar med dess signerade URL i stället för `pdfBase64`.
   *
   * [UTBYGGD, TASK-309.6] `mall` skickas nu med — se
   * `DataSourceAdapter.previewEventTemplate` för varför den blev
   * obligatorisk (EF:en kräver den sedan TASK-309.4; detta anrop 400:ade).
   */
  async previewEventTemplate(eventId: string, mall: MallId): Promise<DocumentPreview> {
    const data = await postEdgeFunction<unknown>('generate-event-attachment', {
      eventId,
      mall,
      preview: true,
    });
    return DocumentPreviewSchema.parse(data);
  }

  /**
   * Skapa eller regenerera en Event-mallad bilaga (TASK-309.6, ADR-125 § 5).
   * POST mot generate-event-attachment UTAN `preview` — se
   * `DataSourceAdapter.skapaEventBilaga` för det fulla kontraktet
   * (`ersatt`-läget, dubblett-beteendet). `.parse()` validerar vid
   * datagränsen (ADR-026), speglar `uploadAttachment`.
   */
  async skapaEventBilaga(input: {
    eventId: string;
    mall: MallId;
    ersatt?: string;
  }): Promise<Attachment> {
    const data = await postEdgeFunction<{ attachment: unknown }>('generate-event-attachment', {
      eventId: input.eventId,
      mall: input.mall,
      ...(input.ersatt !== undefined ? { ersatt: input.ersatt } : {}),
    });
    // [TASK-309.6] `inaktuell` sätts inte här — en NYSKAPAD/nyss-regenererad
    // rads Källhash är per konstruktion den dagens hash (samma anrop skrev
    // båda), så `false` hade varit korrekt men ONÖDIGT: `attachments.byEvent`-
    // invalideringen (mutations-hooken) refetchar listan direkt efteråt, och
    // DEN vägen (`fetchEventAttachments`) härleder `inaktuell` riktigt. Att
    // gissa värdet här hade riskerat att glida isär från den härledningen.
    return { ...parsaAttachment(data.attachment), inaktuell: null };
  }

  /**
   * Sidoeffektsfri förhandsvisning av klass C:s kvitto-generator (TASK-246).
   * POST mot preview-receipt — en NY, dedikerad EF (INTE send-receipt-email
   * — se `DataSourceAdapter.previewReceipt` för varför den ordinarie
   * sändvägen inte kan återanvändas).
   *
   * [ÄNDRAD, ADR-124, TASK-302.2] Svaret är nu `{ url, utgar }`
   * (`DocumentPreviewSchema`) — samma leveransväg-ändring som
   * `previewEventTemplate` ovan.
   */
  async previewReceipt(eventId: string): Promise<DocumentPreview> {
    const data = await postEdgeFunction<unknown>('preview-receipt', { eventId });
    return DocumentPreviewSchema.parse(data);
  }

  /**
   * Hämta en cursor-paginerad sida av Aktivitetsloggen (TASK-201.5). Läsning
   * via get-activity-log: DIREKT ur Postgres-tabellen `activity_log`
   * (ADR-110) — ingen Airtable-tabell inblandad, till skillnad mot övriga
   * metoder på denna adapter (samma "AirtableAdapter är den LEVANDE
   * produktions-adaptern, inte bokstavligen bara Airtable"-precedent som
   * `getAuthHeader()`s Supabase-session redan etablerar). Query-params
   * byggs enligt husets mönster: bara satta nycklar tas med (formen kom från
   * `listPersons`, riven i TASK-286.3 — denna metod är sedan dess adapterns
   * enda kvarvarande cursor-port).
   * `.parse()` validerar varje statement vid datagränsen (ADR-026) — och
   * bevisar därmed, precis som `fetchMailLog`/`fetchEvents` m.fl., att
   * `ActivityStatementSchema` gäller läsvägen lika strikt som skrivvägen
   * (TASK-201.1 DoD #6), utan att EF:en själv Zod-validerar server-side.
   */
  async fetchActivityLog(params?: ActivityLogParams): Promise<ActivityLogPage> {
    const query: Record<string, string> = {};
    if (params?.category) query.category = params.category;
    if (params?.eventId) query.eventId = params.eventId;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    if (params?.cursor) query.cursor = params.cursor;
    if (params?.pageSize) query.pageSize = String(params.pageSize);

    const data = await callEdgeFunction<{
      statements: unknown;
      nextCursor: string | null;
      total?: unknown;
    }>('get-activity-log', Object.keys(query).length > 0 ? query : undefined);
    return {
      statements: z.array(ActivityStatementSchema).parse(data.statements),
      nextCursor: data.nextCursor ?? null,
      // TASK-225.2 — additivt och skew-säkert: fältet valideras defensivt
      // och utelämnas mot en äldre EF-deploy (klienten faller till
      // interimsformen i statusraden, aldrig NaN).
      ...(typeof data.total === 'number' && Number.isFinite(data.total)
        ? { total: data.total }
        : {}),
    };
  }
}
