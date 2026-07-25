import { z } from 'zod';
import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { CreateEventNoteInput, EventNote } from '../../domain/models/EventNote';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import {
  AttendanceSchema,
  type ConfirmRegistrationsInput,
  type ConfirmRegistrationsResult,
  ConfirmRegistrationsResultSchema,
  type CreatedEvent,
  CreatedEventSchema,
  type CreateEventInput,
  type EventFormat,
  EventFormatSchema,
  EventNoteSchema,
  EventSchema,
  type Intresserad,
  IntresseradSchema,
  MailLogEntrySchema,
  MailSendResultSchema,
  type PersonDetail,
  PersonDetailSchema,
  PersonSchema,
  type RegistrationDetail,
  RegistrationDetailSchema,
  RegistrationSchema,
  type SavedSegment,
  SavedSegmentSchema,
  type SaveSegmentInput,
  type SegmentResult,
  SegmentResultSchema,
  type SegmentRule,
  type UpdateEventInput,
  WaitlistEntrySchema,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ListParams, PersonsPage } from '../../domain/types/Pagination';
import { callEdgeFunction, postEdgeFunction } from '../config/supabase-client';
import type { DataSourceAdapter } from './DataSourceAdapter';

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

  async listPersons(params?: ListParams): Promise<PersonsPage> {
    const query: Record<string, string> = {};
    if (params?.search) query.search = params.search;
    if (params?.cursor) query.cursor = params.cursor;
    if (params?.pageSize) query.pageSize = String(params.pageSize);

    const data = await callEdgeFunction<{ persons: unknown; nextCursor: string | null }>(
      'get-persons',
      Object.keys(query).length > 0 ? query : undefined,
    );
    return {
      persons: z.array(PersonSchema).parse(data.persons),
      nextCursor: data.nextCursor ?? null,
    };
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
    throw new Error('Not deployed yet — see Gate 4B-resolution (post-Fas E)');
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
  async computeSegment(rule: SegmentRule): Promise<SegmentResult> {
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
}
