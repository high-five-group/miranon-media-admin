import { EventNoteSchema, EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from '../api/fixtures';
import {
  EVENT_NOTES_RESPONSE,
  EVENTS_RESPONSE,
  REGISTRATIONS_RESPONSE,
} from '../support/fixturvarld/fixture-data';
import type { Kontraktsfall } from './kontraktsjamforelse';

/**
 * De bevakade kontrakten (task-59.2, ADR-080 beslut 3).
 *
 * URVALET ÄR HÄRLETT UR MÄTDATA, INTE HANDPLOCKAT. Hermetik-mätningens råa
 * JSONL (S91, 863 poster över 32 filer) räknades om vid denna skivas arbete.
 * Av 863 restanrop var 745 typsnitt (86,3 %) och 118 skarpa mot Supabase.
 * Fördelningen av de 118, per sökväg:
 *
 *     55  /functions/v1/get-event-notes      46,6 %
 *     26  /functions/v1/get-registrations    68,6 % ackumulerat
 *     22  /functions/v1/get-events           87,3 % ackumulerat
 *      7  /functions/v1/get-event
 *      3  /functions/v1/get-event-formats
 *      2  /auth/v1/token
 *      1  /auth/v1/logout
 *      1  /functions/v1/get-persons
 *      1  /functions/v1/create-event
 *
 * De tre nedan bär alltså 103 av 118 skarpa restanrop. Svansen är 15 anrop
 * över sex adresser, varav tre inte ens är Edge Functions. Att bevaka dem
 * också hade kostat körtid och underhåll för marginell täckning — vakten är
 * en nattlig signal, inte en fullständighetsövning.
 *
 * ADR-080 anger 104 av 118 för samma tre. Omräkningen ger 103 (55+26+22).
 * Skillnaden är en enda anropsrad och rör ingen slutsats — men den bokförs
 * här hellre än att siffran ärvs vidare oprövad.
 *
 * `.hermetik/rapport.jsonl` är gitignorerad (en mätartefakt, inte källkod),
 * så tabellen ovan är räkningens hemvist. Den återskapas genom att köra
 * hermetik-mätningen om (`PLAYWRIGHT_HERMETIK_RAPPORT=1`).
 *
 * VID SUPABASE-BYTET är detta filen som skrivs om (ADR-080 beslut 5:s
 * ~10 %-halva). Jämförelsekärnan och larmformen överlever oförändrade.
 */

const URVAL =
  'get-event-notes, get-registrations och get-events bär 103 av 118 skarpa ' +
  'restanrop (hermetik-mätningen, S91). Svansen är obevakad.';

export const KONTRAKTSFALL: readonly Kontraktsfall[] = [
  {
    endpoint: 'get-events',
    sokvag: '/functions/v1/get-events',
    kuvertnyckel: 'events',
    schema: EventSchema,
    schemanamn: 'EventSchema',
    schemakalla: 'src/domain/schemas/Event.schema.ts',
    fixtur: EVENTS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENTS_RESPONSE.events',
    urval: URVAL,
  },
  {
    endpoint: 'get-registrations',
    // MEDVETET UTAN PARAMETRAR: fixturens REGISTRATIONS_RESPONSE ÄR den
    // event-lösa grenen (Hem-aggregeringen läser den utan params), och EF:en
    // svarar med olika berikning i de två grenarna — den event-lösa lämnar
    // personbatcharnas fält null, dokumenterat i funktionens egen header.
    // Ett anrop med eventId hade alltså jämförts mot fel gren.
    sokvag: '/functions/v1/get-registrations',
    kuvertnyckel: 'registrations',
    schema: RegistrationSchema,
    schemanamn: 'RegistrationSchema',
    schemakalla: 'src/domain/schemas/Registration.schema.ts',
    fixtur: REGISTRATIONS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → REGISTRATIONS_RESPONSE.registrations',
    urval: URVAL,
  },
  {
    // eventId krävs (utan den svarar EF:en 400). Ankaret är den PERMANENTA
    // beläggnings-fixturen i staging — samma record som api-sviten läser, så
    // vakten ärver dess "STÄDA INTE"-skydd i stället för att införa ett eget.
    // Att fixturens anteckningar hör till ett ANNAT event spelar ingen roll:
    // jämförelsen gäller form, inte innehåll.
    endpoint: 'get-event-notes',
    sokvag: `/functions/v1/get-event-notes?eventId=${BELAGGNING_EVENT_ID}`,
    kuvertnyckel: 'notes',
    schema: EventNoteSchema,
    schemanamn: 'EventNoteSchema',
    schemakalla: 'src/domain/schemas/EventNote.schema.ts',
    fixtur: EVENT_NOTES_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENT_NOTES_RESPONSE.notes',
    urval: URVAL,
  },
];
