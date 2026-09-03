// Aktivitetsloggens SERVER-SIDA för betalningsdomänen — TASK-346.4 AC #2
// ("aktivitetsloggen får poster (registrerade/makulerade/raderade)"),
// ADR-110/ADR-111.
//
// REN MODUL, TRANSITIVT DENO-FRI (ingen import alls) → Node-typkollad via
// `tsconfig.edge-shared.json`.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR STATEMENTET BYGGS PÅ SERVERN OCH INTE SKICKAS IN AV KLIENTEN
// ═══════════════════════════════════════════════════════════════════════════
// Repots etablerade väg är klient → `log-activity`-EF → Postgres
// (`recordActivity`, `src/data/activityLog/recordActivity.ts`). Den vägen
// förutsätter en KLIENT som bygger statementet, och `log-activity` binder
// identiteten hårt: `statement.actor.account.name` MÅSTE vara den anropande
// JWT:ns `user.id`, annars 403.
//
// Betalningsdomänens skrivningar sker i EF:er som redan har den verifierade
// anroparen i handen (`requireUser`) och som utför handlingen SJÄLVA. Att
// låta klienten skicka ett statement för en handling SERVERN utförde vore att
// göra loggen beroende av att varje framtida anropare minns att logga —
// exakt den hemvists-lucka `TASK-201.15`s mutation-hemvist-vakt byggdes för
// att stänga på klientsidan. Statementet byggs därför HÄR, ur den verifierade
// identiteten, och skrivs med `service_role` (som har SELECT+INSERT på
// `activity_log`, migration `20260812143131`).
//
// ═══════════════════════════════════════════════════════════════════════════
// DUPLICERINGEN MOT `log-activity/index.ts` ÄR MEDVETEN OCH BOKFÖRD
// ═══════════════════════════════════════════════════════════════════════════
// `log-activity/index.ts` bär sin egen, INLINE rad-mappning (statement →
// `activity_log`-kolumner). `statementTillRad` nedan är samma mappning.
// Att bryta ut den ur `log-activity` och låta båda dela hade varit renare —
// men `log-activity` är en PROD-DEPLOYAD funktion i `.prod-functions-
// allowlist.conf`, och en refaktorering av den i denna skiva hade utökat
// blast-radien från "nya funktioner" till "en fungerande prod-väg", på en
// natt utan mänsklig granskning.
//
// DRIFTRISKEN ÄR REELL och namnges hellre än tystas: ändras `activity_log`-
// tabellens kolumner måste BÅDA ställena följa med. Sammanslagningen är
// flaggad i slutrapporten som uppföljning, inte gjord här.

/** xAPI-basen. IDENTISK med `src/domain/schemas/ActivityStatement.schema.ts`
 * och `_shared/activity-statement-schema.ts` — samma medvetna duplicering de
 * två redan bär mot varandra (se den senares filhuvud). */
export const XAPI_IRI_BASE = 'https://admin.miranon.dev/xapi';
export const REQUEST_ID_EXTENSION_IRI = `${XAPI_IRI_BASE}/extensions/requestId`;

/**
 * IRI-nyckeln för den NYA anmälan vid en ombokning (TASK-368.4).
 *
 * En ombokning rör TVÅ anmälningar, och kortets AC #2 kräver att båda finns i
 * statementet. `object` bär den GAMLA (det är den som bokades om); den nya
 * bärs här, i `context.extensions`, som en anmälnings-IRI av samma form
 * (`anmalanObjektId`) — inte som ett rått record-ID, så att de två
 * identifierarna är jämförbara utan att någon konsument behöver veta vilken
 * som är rå och vilken som är IRI.
 *
 * Formen KRÄVER ingen schemaändring på klientsidan:
 * `ActivityStatement.schema.ts`s `ActivityContextExtensionsSchema` bär redan
 * `.catchall(z.unknown())` för exakt detta (samma väg `EVENT_ID_EXTENSION_IRI`
 * och `PERSON_ID_EXTENSION_IRI` tog).
 */
export const NY_ANMALAN_EXTENSION_IRI = `${XAPI_IRI_BASE}/extensions/nyAnmalanId`;

/**
 * Kategori-axeln. `betalning` och `kvitto` FANNS redan i klientens katalog
 * (`src/data/activityLog/activityTypes.ts` § ACTIVITY_OBJECT_TYPES) — ingen
 * ny kategori mintas här. En inbetalning ÄR en betalning; ett kvitto ÄR ett
 * kvitto.
 *
 * `anmalan` (TASK-368.2) är den FÖRSTA icke-betalningskategorin denna modul
 * bär — filhuvudet ovan beskriver modulen som "betalningsdomänens SERVER-
 * SIDA", men `byggStatement`/`anmalanObjektId`/`skrivAktivitet` (via
 * `betalningar-db.ts`) är redan domän-generella: ingen av dem nämner pengar.
 * Avbokning/återtagning är server-loggad av samma skäl som betalningarna
 * (uppdraget, S115 Del 3): servern utför handlingen själv och känner den
 * verifierade anroparen, så statementet byggs HÄR i stället för att skickas
 * in av klienten (samma resonemang som filhuvudets § "VARFÖR STATEMENTET
 * BYGGS PÅ SERVERN"). IRI:en är IDENTISK med klientens
 * `ACTIVITY_OBJECT_TYPES.anmalan` (samma `XAPI_IRI_BASE`-prefix) så
 * `get-activity-log`s `category`-filter fungerar oavsett vilken sida som
 * skrev raden.
 */
export const AKTIVITETSTYP = {
  betalning: `${XAPI_IRI_BASE}/activity-types/betalning`,
  kvitto: `${XAPI_IRI_BASE}/activity-types/kvitto`,
  anmalan: `${XAPI_IRI_BASE}/activity-types/anmalan`,
} as const;

/** Objekt-IRI för en anmälan — SAMMA form som klientens `registrationObjectId`. */
export function anmalanObjektId(anmalanRecordId: string): string {
  return `${XAPI_IRI_BASE}/objects/registrations/${anmalanRecordId}`;
}

export type Verb = { id: string; display: Record<string, string> };

/**
 * Betalningsdomänens verb. Svensk dåtidsform (loggen berättar vad någon HAR
 * gjort), samma stil som klientkatalogens `SKAPADE_ANMALAN_VERB` m.fl.
 *
 * INGET INNEHÅLL I VERBET: makuleringens SKÄL är fritext Lotta skrivit och
 * hör inte hemma i loggen (samma integritetsgaranti som `ANTECKNADE_VERB`
 * bär för anteckningar, S105 Del 2 beslut 2). Loggen bär ATT en inbetalning
 * makulerades, aldrig varför.
 */
export const INBETALNING_VERB = {
  registrerade: {
    id: `${XAPI_IRI_BASE}/verbs/registrerade-inbetalning`,
    display: { 'sv-SE': 'registrerade inbetalning' },
  },
  makulerade: {
    id: `${XAPI_IRI_BASE}/verbs/makulerade-inbetalning`,
    display: { 'sv-SE': 'makulerade inbetalning' },
  },
  raderade: {
    id: `${XAPI_IRI_BASE}/verbs/raderade-inbetalning`,
    display: { 'sv-SE': 'raderade inbetalning' },
  },
  koade_kvitton: {
    id: `${XAPI_IRI_BASE}/verbs/koade-kvitton`,
    display: { 'sv-SE': 'köade kvitton' },
  },
  skickade_kvitto_igen: {
    id: `${XAPI_IRI_BASE}/verbs/skickade-kvitto-igen`,
    display: { 'sv-SE': 'skickade kvitto igen' },
  },
} as const satisfies Record<string, Verb>;

/**
 * Anmälan-domänens verb (TASK-368.2) — samma grupperingsform som
 * `INBETALNING_VERB` ovan: TVÅ handlingar på samma entitet, en operation
 * (`cancel-registration`) med ett `atgard`-fält. Svensk dåtidsform (samma
 * stil som `INBETALNING_VERB`/klientens `SKAPADE_ANMALAN_VERB`).
 *
 * INGET SKÄL I LOGGEN, av samma integritetsskäl som `INBETALNING_VERB`s
 * egen kommentar: Lottas fria avbokningsskäl hör hemma i basens Notering
 * (`_shared/cancel-registration.ts`), aldrig i xAPI-statementet.
 */
export const ANMALAN_VERB = {
  avbokade: {
    id: `${XAPI_IRI_BASE}/verbs/avbokade-anmalan`,
    display: { 'sv-SE': 'avbokade anmälan' },
  },
  atertogAvbokning: {
    id: `${XAPI_IRI_BASE}/verbs/atertog-avbokning`,
    display: { 'sv-SE': 'återtog avbokning' },
  },
  /**
   * Ombokningen (TASK-368.4). Objektet är den GAMLA anmälan; den NYA bärs i
   * `context.extensions` under `NY_ANMALAN_EXTENSION_IRI` — se den konstantens
   * docblock för varför båda ska finnas i samma statement.
   */
  bokadeOm: {
    id: `${XAPI_IRI_BASE}/verbs/bokade-om-anmalan`,
    display: { 'sv-SE': 'bokade om anmälan' },
  },
} as const satisfies Record<string, Verb>;

export type Statement = {
  id: string;
  actor: {
    objectType: 'Agent';
    name: string;
    account: { homePage: string; name: string };
  };
  verb: Verb;
  object: {
    objectType: 'Activity';
    id: string;
    definition: { name: Record<string, string>; type: string };
  };
  context: { extensions: Record<string, unknown> };
  timestamp: string;
};

/** Raden i `activity_log`, kolumn för kolumn. Se filhuvudets § DUPLICERINGEN. */
export type AktivitetsRad = {
  id: string;
  actor_name: string;
  actor_account_name: string;
  verb_id: string;
  verb_display: string;
  object_id: string;
  object_type: string;
  object_name: string;
  request_id: string;
  occurred_at: string;
  statement: Statement;
};

export type StatementSpec = {
  /** Statementets egen UUID. Injicerad, så ett test slipper slumpen. */
  statementId: string;
  /** Korrelations-ID:t (ADR-111) — EF:ens `generateRequestId()`. */
  requestId: string;
  /** Den VERIFIERADE anroparens Supabase-user-id. Aldrig klient-buret. */
  actorAccountId: string;
  /** Anroparens visningsnamn, härlett server-side ur JWT/e-post. */
  actorName: string;
  verb: Verb;
  objektId: string;
  objektNamn: string;
  aktivitetstyp: string;
  timestamp: string;
  /**
   * Ytterligare IRI-nycklade `context.extensions` utöver `requestId`
   * (TASK-368.4 — ombokningens andra anmälan). ADDITIVT och frivilligt:
   * utelämnas fältet blir statementet BYTE FÖR BYTE detsamma som före
   * tillägget, så samtliga befintliga anropare är opåverkade.
   *
   * `requestId` kan inte skrivas över härifrån — den sätts EFTER spridningen
   * nedan, medvetet: ADR-111 gör korrelations-ID:t obligatoriskt, och en
   * anropare ska inte kunna råka nolla det.
   */
  extraExtensions?: Record<string, unknown>;
};

/** Auktoritetens hemvist i xAPI-actorns `account.homePage`. */
const HOME_PAGE = 'https://admin.miranon.dev';

export function byggStatement(spec: StatementSpec): Statement {
  return {
    id: spec.statementId,
    actor: {
      objectType: 'Agent',
      name: spec.actorName,
      account: { homePage: HOME_PAGE, name: spec.actorAccountId },
    },
    verb: spec.verb,
    object: {
      objectType: 'Activity',
      id: spec.objektId,
      definition: { name: { 'sv-SE': spec.objektNamn }, type: spec.aktivitetstyp },
    },
    context: {
      extensions: {
        ...(spec.extraExtensions ?? {}),
        [REQUEST_ID_EXTENSION_IRI]: spec.requestId,
      },
    },
    timestamp: spec.timestamp,
  };
}

/** Första nyckelns värde ur en Language Map — `sv-SE` först. IDENTISK i sak
 * med `firstDisplayValue` i `log-activity/index.ts`. */
function forstaVardet(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/**
 * Läser `user_metadata.display_name` ur den REDAN VERIFIERADE JWT:ns payload.
 *
 * IDENTISK I SAK med `readDisplayNameFromJwt` i `log-activity/index.ts` och
 * dess tre syskon i `create-person-note`/`create-event-note`/`invite-user`.
 * `ADR-026`s ≥3-tröskel för `_shared`-extraktion var alltså passerad långt
 * före denna kopia; det som skiljer HÄR är att funktionen faktiskt LIGGER i
 * `_shared` och därmed är den plats framtida EF:er kan dela.
 *
 * De fyra befintliga kopiorna migreras INTE i denna skiva: tre av dem bor i
 * prod-deployade funktioner, och en refaktorering av dem hade utökat
 * blast-radien från "nya funktioner" till fyra fungerande skrivvägar, på en
 * natt utan mänsklig granskning. Bokfört som uppföljning, inte gjort.
 *
 * DEKODAR BARA — VERIFIERAR ALDRIG. Anroparen MÅSTE ha kört `requireUser`
 * först; denna funktion läser en payload som redan bevisats äkta. Att
 * använda den på en overifierad token vore att lita på vad avsändaren
 * påstår om sig själv.
 */
export function lasVisningsnamnUrJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const delar = authHeader.slice('Bearer '.length).trim().split('.');
  if (delar.length !== 3) return null;
  try {
    const b64 = delar[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(paddad), (tecken) => tecken.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as {
      user_metadata?: { display_name?: unknown };
    };
    const ra = claims.user_metadata?.display_name;
    return typeof ra === 'string' && ra.trim() !== '' ? ra.trim() : null;
  } catch {
    return null;
  }
}

export function statementTillRad(statement: Statement): AktivitetsRad {
  const requestId = statement.context.extensions[REQUEST_ID_EXTENSION_IRI];
  return {
    id: statement.id,
    actor_name: statement.actor.name,
    actor_account_name: statement.actor.account.name,
    verb_id: statement.verb.id,
    verb_display: forstaVardet(statement.verb.display),
    object_id: statement.object.id,
    object_type: statement.object.definition.type,
    object_name: forstaVardet(statement.object.definition.name),
    request_id: typeof requestId === 'string' ? requestId : '',
    occurred_at: statement.timestamp,
    statement,
  };
}
