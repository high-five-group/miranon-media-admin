
# ADR-060: Sentinel-markerade test-records + setup-purge för create-write-conformance

- **Status:** Accepted
- **Datum:** 2026-06-22
- **Fas:** 6c (Registrations + Väntelista)

## Kontext

Fas 6c Leverabel 4 introducerade `create-registration` — den **första EF:en som
SKRIVER skarpa rader** mot staging-Airtable i en conformance-test
(`tests/api/create-registration.staging.test.ts`). Tidigare conformance-tester
var antingen rena läs-tester (get-*) eller skrev-och-restaurerade EN seedad
fixtur i `try/finally` (`update-record.staging.test.ts`). En CREATE har ingen
fixtur att restaurera — varje körning **producerar en ny rad**. Det reser tre
frågor som inget tidigare test behövde besvara:

1. **Hur undviker testet cross-run-kollision** (gårdagens skapade rad får inte
   få dagens 409-test att fela, och vice versa)?
2. **Hur städas de skapade raderna** så staging inte växer obegränsat?
3. **Var ligger städnings-credentialen** — testet är medvetet EF-only (ingen
   Airtable-token i test-env, en CI/CD-säkerhets-gräns), så testet kan inte
   självt radera via Airtable-API:t.

Empiriskt tillstånd (verifierat Session 26, Code LÄS mot disk): CI:s
api-staging-steg bär bara `TEST_*`-secrets + `TEST_REGISTRATION_RECORD_ID`,
**ingen `AIRTABLE_TOKEN`**; `tests/api/auth.setup.ts` loggar bara in users. Det
finns alltså **ingen Airtable-creddad seed/cleanup-fas skild från test-jobbet**
i pipelinen idag.

## Beslut

Etablera en **sentinel-markerad-records-konvention med setup-tids-purge** som
mall för all framtida create-write-conformance:

1. **Per-körning-UNIK sentinel.** Varje skapad test-rad bär en markör som är unik
   per körning — `create-test+${randomUUID()}@staging.test` som e-post + en
   per-anrop `idempotencyKey` (`randomUUID()`). Konsekvens: en "allow"-create är
   alltid en fräsch 201 (ingen kollision med tidigare körningars rader), och
   "409"-fallet bevisas av en **inom-körning**-dubblett (samma sentinel skickad
   två gånger i samma test). Beviset binds till testets EGEN markör, aldrig till
   ett rent blad.

2. **Conformance förblir EF-only.** Testet får ALDRIG en Airtable-token. All
   verifiering går via EF-HTTP (create → 201/409/400/404, läs-tillbaka via
   get-registrations). Säkerhets-gränsen "test-env exponerar inga
   data-credentials" hålls intakt (CI/CD-cleanup-säkerhetsprincip).

3. **Purge vid SETUP, inte teardown.** När en städnings-fas införs ska den purga
   gamla sentinel-rader **före** testet skapar nya — inte i teardown. Teardown
   skippas vid rött test (en assertion som kastar hoppar över efterföljande
   cleanup), vilket läcker rader exakt när man felsöker mest. Setup-purge är
   robust mot det (Vlad Mihalcea: "clean before, not after").

4. **Purge bor i Airtable-creddad seed-tooling SKILD från testet.** Raderingen
   (som kräver Airtable-token) körs i en separat CI-fas/tooling med egna
   credentials, aldrig i test-jobbet. Testet och städaren delar bara
   sentinel-KONVENTIONEN (markör-formatet), inte credentials.

5. **Interim (6c): purge är manuell/schemalagd, bounded ackumulering tolereras.**
   Eftersom ingen Airtable-creddad CI-fas finns idag (se Kontext) wiras ingen
   automatisk setup-purge nu. Sentinel-rader ackumuleras bounded i staging
   (endast `create-test+*@staging.test`-markerade rader, isolerad
   duplicerad bas — ADR-050; aldrig prod). Testet asserterar på sin egen
   per-körning-sentinel → ackumuleringen gör aldrig testet falskt rött. När en
   Airtable-creddad seed-fas byggs (eller Fas E flyttar datahem) wiras purge:n in
   per punkt 3–4.

## Alternativ som övervägdes

**Alt A — Dedikerad prod-delete-EF som testet anropar för cleanup.** Avvisat:
skulle kräva en destruktiv DELETE-yta nåbar med användar-JWT — exakt den
attack-yta deny-by-default-arkitekturen (field-allowlists + write-EF-ribba)
minimerar. En radera-records-EF är en permanent prod-risk för en ren
test-bekvämlighet.

**Alt B — Ge test-env en Airtable-token så testet städar själv.** Avvisat:
bryter EF-only-säkerhets-gränsen (test-env skulle bära en data-write-credential),
emot CI/CD-praxis att inte bredda credential-scope för test-bekvämlighet. Det
skulle också göra testet beroende av Airtable-API-formen det är tänkt att
abstrahera bort.

**Alt C — Teardown-baserad cleanup (try/finally i testet).** Avvisat: teardown
skippas vid rött test → läcker rader vid felsökning (Vlad Mihalcea); och kräver
ändå Airtable-cred i testet (Alt B:s problem).

**Alt D — Restaurera-en-fixtur (update-record-mönstret).** Inte tillämpligt: en
CREATE har ingen för-existerande rad att restaurera; varje körning skapar
nödvändigtvis en ny rad.

## Konsekvenser

**Positiva:**

- Första create-write-conformance-konventionen — **återanvändbar** rakt av för
  framtida create-tester (väntelista-create, person-create m.fl.).
- Conformance förblir EF-only → ingen credential-scope-breddning, ingen ny
  destruktiv prod-yta.
- Per-körning-unik sentinel gör testet immunt mot cross-run-state → deterministiskt
  utan delad fixtur-restaurering.
- Setup-purge-disciplinen (när den wiras) är robust mot rött-test-läckage.

**Negativa / öppna trådar:**

- **Bounded sentinel-ackumulering i staging tills purge wiras.** Endast
  `create-test+*@staging.test`-rader, isolerad bas, aldrig prod — men växer en
  rad per "allow"+"409"-körning tills en Airtable-creddad seed-fas byggs. Tråd:
  wira setup-purge när CI får en cred-skild seed-fas (eller vid Fas E-datahem-byte).
- Sentinel-rader saknar Person-länk (A2 hinner ev. inte köra / e-post är
  syntetisk) — de är medvetet ofullständiga test-artefakter, inte representativa
  anmälningar.

## Branschförankring

- **Setup > teardown för test-data-cleanup** — Vlad Mihalcea ("always clean up
  before a test runs, not after"): teardown är opålitlig vid rött test.
- **Exponera inte data-credentials i test-runtime** — CI/CD-least-privilege
  (samma princip som [ADR-050](ADR-050-isolerad-staging-miljo.md):s prod/staging-
  isolering och repots EF-only-test-gräns).
- **Sentinel/markör-baserad radering** — standard test-data-hygien: städa exakt
  det testet skapade (markör-match), aldrig "töm tabellen".

## Relaterade dokument

- [ADR-050](ADR-050-isolerad-staging-miljo.md) — staging-isolering (duplicerad bas, explicit `--project-ref`)
- [ADR-059](ADR-059-idempotens-lagring-defer-fas-e.md) — idempotens-nyckel-kontraktet som testet utövar (INVARIANT)
- [tests/api/create-registration.staging.test.ts](../../tests/api/create-registration.staging.test.ts) — konventionens första konsument
- [BUILD-LOG.md](../BUILD-LOG.md) — implementation-journal

## Updates

### 2026-07-06 — Tröskeln nådd: sentinel-ackumulering fällde get-attendance-conformance (Session 52)

Den öppna tråden "bounded sentinel-ackumulering i staging tills purge
wiras" visade sig ha en CROSS-TEST-blastradius beslutet inte förutsåg:
60 ackumulerade create-event-sentineller (`Ort='ZZ-create-event-test'`)
gjorde get-attendance-conformances linjära fixtur-sökning (~750–1 300 ms
per event × 63 event ≈ 47 s) större än test-timeouten (30 s) → CI-rött
på orörd kod (run 28755566920, 2026-07-06) med tröskeleffekt: grönt på
förmiddagen, deterministiskt rött på kvällen. Interim-åtgärd
(Marcus-beslut väg A): markör-matchad radering av samtliga 60 via MCP —
0 länkade anmälningar verifierat före delete, ZZ-History-fixturerna
orörda; sviten därefter grön på 7,9 s. Strukturell fix spåras som
backlog-kort `task-2` (O(1)-isering av fixtur-sökningen + purge-wiring
per detta besluts § Lösning, vidgad till create-event-sentinellerna).
Beslutstexten ovan står orörd (L53).

### 2026-07-19 — Andra tröskeln: create-registration-sentineler fällde väg D lokalt (Session 69)

Ackumuleringen nådde tröskeln igen, nu i beslutets EGEN konsument: 354
create-registration-sentineler (`create-test+*@staging.test`, samtliga
på seed-ankarets event) × stagings `REGISTRATIONS_BATCH_SIZE=2` ⇒ 180
seriella Airtable-anrop i get-registrations väg D ⇒ ~32 s från EU
(EF exekverar i anroparens region, `x-sb-edge-region: eu-central-1`;
CI:s US-runners får kortare RTT och ligger under 30-s-timeouten →
CI-grön/lokal-röd, TASK-14:s fynd). Interim-åtgärd (Marcus-beslut,
samma väg som 2026-07-06-posten): markör-matchad radering av samtliga
354 via MCP mot staging-basen `apphjj8Q7lkXCMsL4` — seed-ankaret
`recynkk5KWpWirv7k` + 4 icke-sentineler bevarade, verifierat före OCH
efter (sentinel-filter → 0 träffar) → väg D 32 s → 1,3 s, lokala
sviten 294/296 → 296/296 (20,1 s). Återackumuleringstakten (~2–3
sentineler/svitkörning ≈ 250/månad) ger ~6 veckors horisont till nästa
tröskel — purge-wiringen per punkt 3–4 spåras nu som backlog-kort
`task-16` (två tröskel-händelser skärper prioriteten över task-2-erans
enskilda). Beslutstexten ovan står orörd (L53).

### 2026-07-19 — Purge-wiringen landad: interimet i punkt 5 ERSATT av punkt 3–4-formen (Session 71, TASK-16)

Setup-purgen är driftsatt exakt per beslutets punkt 3–4: separat CI-jobb
**Staging sentinel purge** (egen runner-VM, egen secret
`STAGING_AIRTABLE_TOKEN` = least-privilege-PAT scopad till ENBART
staging-basen med `data.records:read+write`) kör
`scripts/purge-staging-sentinels.mjs` FÖRE Test + Build; test-jobbet ser
aldrig token (punkt 2+4 ordagrant). Lokal form: `npm run purge:staging`
(token ur gitignorade `.env.seed`). Fyra skyddsräcken, samtliga
guard-testade (`scripts/test-purge-staging-sentinels.mjs`, 23 fall):
bas-guard (prod-basen hårt blockerad — kritiskt då staging/prod DELAR
tabell-ID:n, data-model §ID-topologi) · ålders-guard 60 min i KOD på
`createdTime` (skyddar in-flight-körningar; täcker CI↔lokal-hålet som
staging-mutexen inte når) · exakt markör-match per klass
(`create-test+<uuid>@staging.test` i Anmälningar ·
`Ort='ZZ-create-event-test'` EXAKT i Eventplanering —
ZZ-History-fixturerna [S52] och Eventformat-fixturen träffas aldrig) ·
namn-agnostisk länk-guard (event med rec-ID-arrayer i något fält hoppas
över + rapporteras; fältnamnet "Anmälningar (länkat fält)" live-verifierat
S71). Värden config-drivna i `.purge-staging-policy.json`. Punkt 5:s
interim ("bounded ackumulering tolereras") är därmed UTGÅNGET — L285-skulden
(två tröskel-händelser) stängd vid källan. Beslutstexten ovan står orörd
(L53).

### 2026-08-24 — Setup-purgen KOMPLETTERAS med en efter-körning-purge; punkt 3:s "inte i teardown" amenderas (TASK-309.15)

**Vad som ändras:** punkt 3 sade *"Purge vid SETUP, inte teardown"*, och Alt C
(teardown-baserad cleanup) avvisades. Setup-purgen är kvar oförändrad som ANDRA
försvarslinje — men den kompletteras nu av en FÖRSTA linje som städar EFTER
körningen. Punkt 2 (EF-only-gränsen) och punkt 4 (städ-credentialen bor i
Airtable-creddad tooling SKILD från testet) står helt orörda och är i själva
verket det som formar lösningen.

**Vad som falsifierade den gamla formen — mätt, inte antaget.** Punkt 3:s
rationale (Vlad Mihalcea: teardown skippas vid rött test) är fortfarande sann
och är exakt därför setup-purgen behålls. Vad rationalen INTE såg var att
setup-purgen är strukturellt oförmögen att stänga fönstret MELLAN en körning
och nästa staging-jobb — och att det fönstret har en användar-synlig kostnad
som inte fanns 2026-06-22, när sentinelerna bara var Anmälningar-rader.
Sentinel-familjerna som tillkommit sedan dess (`ZZ-create-event-test`,
`ZZ-TASK-309.3-*`) är EVENT med framtida `startdatum`, alltså **KOMMANDE
event i appens eventväljare**.

Mätning 2026-08-24 (`mcp__airtable__list_records` + räknat script mot
`apphjj8Q7lkXCMsL4`, tabellen Eventplanering, `FIND('ZZ-', {Ort}) = 1`):

| familj | antal | äldsta |
|---|---|---|
| `ZZ-create-event-test` | 61 | 0,1 d |
| `ZZ-TASK-309.3-text-*` | 55 | 0,1 d |
| `ZZ-TASK-309.3-plats-*` | 30 | 0,1 d |
| `ZZ-TASK-309.3-content-*` | 5 | 0,1 d |
| `ZZ-create-event-test-uppdaterad` | 2 | **32,3 d** |
| permanenta fixturer (ej kastbara) | 10 | — |

Att varje kastbar familj utom en var yngre än 2,4 h är BEVISET för att
setup-purgen fungerar: den hade kört, och ändå låg 151 kommande testevent i
väljaren. Marcus valde ett av dem vid en granskning 2026-08-24 och fick en
genereringsvy där varje block var tomt (testeventet har varken
Eventinnehåll-data eller Plats-länk) — det läste som ett designfel i vyn och
kostade en granskningsrunda.

Den sjätte raden i tabellen är en ANNAN klass: `ZZ-create-event-test-uppdaterad`
matchade INGEN target alls och låg därför kvar i 27 respektive 32 dygn.
`update-event.staging.test.ts` döper om sitt sentinel-event mitt i testet och
återställer i `finally`; faller `finally` är raden opurgbar för alltid.

**Beslutet:** branschpraxis för integrationstester mot en delad databas är
setup-purge KOMBINERAD med teardown — den första minskar fönstret, den andra
är den deterministiska botten som överlever krascher. Repot kör nu båda:

1. **Efter-körning-purge (ny, första linjen).** Varje staging-svit som skapar en
   kastbar Airtable-rad registrerar dess record-ID i ett **ägar-manifest**
   (`tests/support/kastbara-poster.ts`, JSONL). Manifestet bärs över till
   `scripts/purge-staging-sentinels.mjs --efter-korning` — CI-jobbet **Staging
   sentinel purge (efter körning)** (`ci-suite.yml`, `if: always()`), lokalt
   `npm run purge:staging:efter`.
2. **Setup-purge (oförändrad, andra linjen).** Rör inte en rad; samma fyra
   skyddsräcken, samma 60-minutersgräns.

**Alt C:s avvisning står kvar i sak — lösningen är inte en teardown i testet.**
Punkt 2 gäller ordagrant: testet får aldrig en Airtable-token, och det finns
ingen delete-EF för event, så sviten KAN strukturellt inte städa själv.
Manifestet bär bara KUNSKAPEN (vilka rader körningen skapade) dit credentialen
redan finns — vilket är punkt 4 ordagrant, bara tillämpad på efter-läget också.
Alt A (en delete-EF nåbar med användar-JWT) förblir avvisad; ingen ny
destruktiv yta har byggts.

**Ålders-guarden är ERSATT, inte borttagen, i det nya läget.** I setup-läget är
åldern det enda tillgängliga beviset för "ingen kör på den här raden just nu".
I efter-körning-läget finns ett starkare: raden står i den avslutade körningens
EGET manifest, och en samtidig lokal körnings rader kan per konstruktion aldrig
hamna i CI:s manifest. Bas-guard, `filterByFormula`, exakt markör-match och
länk-guard körs oförändrat via SAMMA `planPurge`.

**Två nya mekaniska svar på den 32 dygn gamla läckan:**

- `.purge-staging-policy.json`-targeten `update-event-uppdaterad-sentineler`
  gör den uppdaterade orten purge-bar i sig (försvar i djupled).
- Efter-körning-läget bär en **luckdetektion**: en ägd post som FINNS KVAR i
  basen men som ingen target gör anspråk på fäller jobbet (exit 2). Hade den
  funnits 2026-07-23 hade läckan larmat samma dag i stället för att upptäckas
  av en manuell räkning en månad senare.

Guard-testerna (`scripts/test-purge-staging-sentinels.mjs`, CI-wirade) täcker
båda riktningarna för det nya läget, inklusive den bärande negativa: en
FRÄMMANDE rad som matchar formeln och mönstret perfekt raderas ALDRIG när den
saknas i manifestet. Beslutstexten ovan står orörd (L53).
