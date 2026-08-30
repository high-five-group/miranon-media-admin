# supabase/migrations/

Deklarativ hemvist för Postgres-schemat (Supabase CLI-standard,
`supabase migration new`) — **inte** samma mekanism som Airtables
`create-*-table.mjs`-skript. Se `docs/decisions/ADR-110.md` för lagringsvalet
och den enskilda migrationsfilens huvud för varje tabells motiv.

## Applicera mot staging (TASK-199-klassen: dokumentera vägen, gissa den aldrig)

Två separata steg — **länka**, sedan **push**. Ingen av dem kräver
databas-LÖSENORDET (skiljt från Supabase CLI-INLOGGNINGEN, se nästa avsnitt).

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz
npx supabase db push
```

Kedjad (den form ett agent-uppdrag bokför i en PR-kropp — `&&` gör att en
misslyckad länkning aldrig följs av en push mot fel eller inget projekt):

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz && npx supabase db push
```

**Varför `echo "" |`:** körd interaktivt utan styrd stdin frågar `link` efter
databas-LÖSENORDET (en prompt, inte ett login-flöde) och HÄNGER i en headless
agent-miljö utan TTY. Ett tomt svar besvaras direkt — `link` behöver bara
projekt-referensen för att skriva `supabase/.temp/project-ref`; själva
schema-operationerna (`db push`, `migration list`,
`inspect db table-stats --linked`, `db query --linked`) går via Supabase
**Management API** (CLI:ts egen inloggning, se nästa stycke), inte en direkt
`postgres://`-anslutning — därför krävs aldrig ett databas-lösenord för någon
av kommandona i denna fil.

**Verifiera alltid vilket projekt du är länkad mot INNAN en skarp operation**
(`cat supabase/.temp/project-ref` eller läs `project_ref` i `link`-svaret).
Staging är `pqtshyierkdgwdnxuirz`. Prod (`lvjsfnphlauldxqlncpl`) skrivs ALDRIG
till av en agent.

### Förutsättning: Supabase CLI-inloggning

Kommandona ovan förutsätter att `npx supabase` redan har en giltig
Management API-inloggning. På en interaktiv utvecklarmaskin sker den EN gång
via `supabase login` och lagras i macOS-nyckelringen (posten "Supabase CLI",
konto "supabase") — CLI:t läser den själv, ingen `SUPABASE_ACCESS_TOKEN` i
miljön behövs. En körning UTAN denna inloggning (t.ex. en CI-runner eller en
färsk maskin) misslyckas snabbt och rent på `db push`:

```json
{"code":"LegacyProjectNotLinkedError","message":"Cannot find project ref. Have you run supabase link?"}
```

— vilket är en annan felklass än ett hängande `link` (se ovan): ETT rent fel
betyder "logga in eller länka", ETT häng utan utskrift betyder "stdin är
obesvarad, styr den".

### Verifiera appliceringen (mot den LEVANDE miljön, aldrig antaget ur exit 0)

```bash
npx supabase migration list                      # local === remote per fil
npx supabase inspect db table-stats --linked      # tabellen + dess index existerar
```

### Diagnostik/reparation vid behov (Management API, inget lösenord)

```bash
npx supabase db query --linked "<valfri SQL>"
```

Körs som `postgres`-rollen via Management API-proxyn — INTE `service_role`.
Detta är den enda vägen att t.ex. städa en test-rad ur `activity_log` (se
nästa avsnitt): `service_role` har medvetet ingen DELETE-rättighet.

## activity_log — RLS + GRANT tillsammans, inte RLS ensamt

`20260811211759_create_activity_log.sql` sätter `enable row level security`
+ ett explicit `revoke all ... from anon, authenticated`. Det räcker för att
neka anon/authenticated — men det räcker INTE ensamt för att `service_role`
ska kunna skriva. Mätt live mot staging (TASK-201.2, 2026-08-12): ett
PostgREST-anrop med en giltig `service_role`-nyckel gav
`403 permission denied for table activity_log` tills en andra migration,
`20260812143131_grant_service_role_activity_log.sql`, la till ett explicit
`grant select, insert on public.activity_log to service_role`.

**Rotorsak:** `service_role` bär `rolbypassrls = true` (bekräftat via
`select rolname, rolbypassrls from pg_roles`) — den hoppar över
RLS-POLICY-evaluering helt. Men BYPASSRLS är ett annat lager än vanliga
SQL-GRANT-rättigheter: Postgres kräver ändå SELECT/INSERT/UPDATE/DELETE-grant
för att en roll ska få röra en tabell, RLS eller ej. Ett nytt projekts
schema-default-privileges gav `service_role` REFERENCES/TRIGGER/TRUNCATE på
den nyskapade tabellen, men aldrig SELECT/INSERT/UPDATE/DELETE — samma
felkod (`42501`) som RLS-nekandet, men en helt annan orsak. Läs
grant-migrationens filhuvud för den fulla utredningen.

**Designval, medvetet:** grantet är begränsat till SELECT + INSERT — ALDRIG
UPDATE/DELETE. `activity_log`s tabell-kommentar säger redan "append-only,
ingen radering" (PRD `TASK-201`); att hålla UPDATE/DELETE utanför
`service_role`s grant gör det kravet strukturellt sant (verifierat live: en
`PATCH`/`DELETE` mot en rad skriven av `service_role` gav båda `403`), inte
bara en kod-konvention en framtida Edge Function kan råka bryta.

**Konsekvens för test/underhåll:** en `service_role`-skriven rad kan ALDRIG
tas bort via `service_role`-nyckeln (det är avsikten). Cleanup av en
tillfällig test-/probe-rad sker via `npx supabase db query --linked "delete
from public.activity_log where id = '<uuid>'"` (postgres-rollen, se ovan) —
aldrig via ett committat, rutinmässigt körande test som skriver via
`service_role`, eftersom ett sådant test inte kan städa efter sig och skulle
lämna permanenta skräprader i staging vid varje CI-körning.

### RLS-beviset — vad som är committat kontra manuellt verifierat

`tests/api/activity-log-rls.staging.test.ts` är CI-committat och täcker
anon+authenticated-halvan (läsning OCH skrivning, båda nekade) med de
befintliga `TEST_SUPABASE_ANON_KEY`/`TEST_USER_*`-secrets som redan finns i
CI. `service_role`-halvan ("skrivning går igenom", "UPDATE/DELETE nekas") är
INTE ett committat test — `SUPABASE_SERVICE_ROLE_KEY` är ingen CI-secret
(samma gap som
`docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`
redan dokumenterade för `invite-user`), och som ovan förklarat skulle ett
rutinmässigt körande insert-test dessutom lämna permanent skräp i staging.
Den halvan är i stället verifierad LIVE, en gång, mot skarp staging
(TASK-201.2, 2026-08-12) med omedelbar städning — samma
"hämta-engångs-nyckeln-kör-kasta"-mönster som
`scripts/provision-attachments-bucket.mjs`s filhuvud beskriver:

```bash
SUPABASE_URL="https://pqtshyierkdgwdnxuirz.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys \
  --project-ref pqtshyierkdgwdnxuirz -o json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      const k=JSON.parse(s).find(k=>k.name==="service_role"||k.id==="service_role");
      process.stdout.write(k.api_key);
    })')" \
  # ... POST/PATCH/DELETE mot $SUPABASE_URL/rest/v1/activity_log med
  # apikey/Authorization satta till $SUPABASE_SERVICE_ROLE_KEY
```

Utfall (fullständig mätning i backlog-kortets Implementation Notes):
INSERT → `201`; en efterföljande PATCH/DELETE mot samma rad → båda `403`;
raden lästes tillbaka via `service_role` (bekräftar synlighet), var
osynlig för anon/authenticated trots att den existerade, och städades sist
via `db query --linked` (postgres-rollen, inte `service_role`).

### get-activity-log — läsvägens paginerings-/filterbevis (TASK-201.5, 2026-08-12)

**AVVIKELSE mot mönstret ovan, källmärkt:** `npx supabase projects api-keys`
är sedan 2026-08-12 explicit FÖRBJUDET för agenter (skrev en `service_role`-
nyckel i klartext i ett agent-transkript samma dag) — en mekanisk spärr var
under uppbyggnad vid denna skivas bygge. `get-activity-log` behöver ingen
`service_role`-nyckel för sitt EGET arbete (den är auto-injicerad i den
deployade Edge Function-runtimen, samma väg `test-attachments-storage`s
filhuvud redan beskriver), men SEEDNING av testrader för att bevisa
paginerings-/filter-mekaniken mot verkliga rader kräver skrivbehörighet
`service_role` saknar för DELETE (append-only-grantet, se ovan). I stället
för den nu förbjudna nyckel-vägen seedades och städades raderna som
`postgres`-rollen via `db query --linked` (samma kommando som RLS-beviset
ovan redan använder för cleanup — `postgres` har full behörighet, `service_role`
behövs inte alls för detta ändamål).

**Vad som INTE är CI-committat, och varför:** `tests/api/get-activity-log.
staging.test.ts` är CI-committat och bevisar KONTRAKTET (auth-gate, svarsform,
alla fyra filterparametrar accepteras, 400 på felformad `cursor`/`from`/`to`,
`pageSize`-klampning, best-effort-ordning) mot tabellens FAKTISKA innehåll vid
körningstillfället — samma "kontrakt-mot-tom, ingen seedad fixtur"-disciplin
som `get-mail-log.staging.test.ts` redan etablerat, av samma tre skäl (tabellen
var tom vid denna skivas start; ingen CI-secret ger skrivbehörighet; syntetiska
statements vore falsk aktivitetshistorik i en logg som ska spegla VERKLIGA
åtgärder). Den mekaniska CORREKTHETEN (håller sidbrytningen exakt vid en känd
radmängd? filtrerar `category`/`eventId`/`from`/`to` EXAKT rätt delmängd?) är
därför verifierad MANUELLT, en gång, mot fyra seedade rader + en femte
requestId-fokuserad rad:

```bash
npx supabase db query --linked -f <seed.sql>   # 4 rader, spridda occurred_at, en bär eventId-extension
# ... HTTP-anrop mot https://pqtshyierkdgwdnxuirz.supabase.co/functions/v1/get-activity-log
#     med en riktig user-JWT (playwright/.auth/api-tokens.json)
npx supabase db query --linked "delete from public.activity_log where actor_name = 'ZZ-TASK-201.5 Probe'"
```

Utfall, samtliga mot LIVE staging (inte antaget ur exit 0):

1. **Senaste-först:** 4 seedade rader (occurred_at 1–4 dagar bak) kom tillbaka
   i EXAKT omvänd insättningsordning.
2. **Keyset-paginering:** `pageSize=2` gav sida 1 = de två NYASTE raderna i
   HELA tabellen vid tillfället (två RIKTIGA rader skrivna av `TASK-201.3`s
   parallella landning under samma tidsfönster — se § Öppen observation
   nedan), `nextCursor` satt; sida 2 (via cursorn) gav exakt de två därpå
   äldsta raderna (probe 1+2), `nextCursor: null` på sista sidan. Ingen
   dubblett, inget hopp.
3. **`category`-filtret** (equality mot `object_type`): isolerade EXAKT de
   två probe-raderna med matchande typ, uteslöt de två med annan typ OCH de
   två samtida `TASK-201.3`-raderna (annan `object_type`).
4. **`eventId`-filtret** (`.contains()` mot `context.extensions`): isolerade
   EXAKT den enda probe-raden som bar den nyckeln — den högsta-risk-designen
   i denna skiva (PostgREST jsonb-`cs`-operatorn mot en URI-nyckel), nu
   EMPIRISKT bevisad, inte bara research-underbyggd.
5. **`from`/`to`-intervallet:** inneslöt exakt de tre probe-rader vars
   `occurred_at` föll i fönstret, uteslöt den fjärde (utanför) — och uteslöt
   samtidigt `TASK-201.3`-raderna (för sena, utanför `to`).
6. **`requestId`-propagering** (byggplanens DoD 3–4): en femte, separat
   seedad rad med `request_id = '12345678-90ab-4cde-8f12-34567890abcd'` kom
   tillbaka med EXAKT samma värde i
   `statement.context.extensions['…/extensions/requestId']` — klient → EF →
   rad → läsning är en obruten kedja.

Samtliga fem seedade rader (`ZZ-TASK-201.5 Probe` ×4, `ZZ-TASK-201.5
RequestId Probe` ×1) städade omedelbart efter mätningen; `select count(*)
where actor_name like 'ZZ-TASK-201.5%'` → `0` bekräftat efteråt.

**Öppen observation (ej denna skivas att lösa, bokförd öppet):** under
seed-passet dök två RIKTIGA rader upp i `activity_log` (`actor_name: 'Lotta'`,
`object_type: '…/activity-types/api-kontroll'`, skrivna ~16:13–16:14 UTC
2026-08-12) — `TASK-201.3`s parallella landning (tracer bullet-skivan) hade
alltså redan börjat skriva mot SAMMA staging-tabell. De rördes inte (utanför
denna skivas yta) och kvarstår i tabellen.

**Öppen koordinerings-skuld (`eventId`-nyckeln):** `get-activity-log`s
`eventId`-filter matchar `context.extensions['https://admin.miranon.dev/
xapi/extensions/eventId']` (`EVENT_ID_EXTENSION_IRI`,
`src/domain/schemas/ActivityStatement.schema.ts`) — ett kontrakt DENNA skiva
definierar för läsvägen. Skrivvägen (`TASK-201.3`/`TASK-201.4`) emitterar
ÄNNU INGEN sådan nyckel (bekräftat ovan: de två riktiga raderna som redan
finns bär den INTE). Filtret returnerar alltså `[]` mot riktiga rader tills
skrivvägen antar samma nyckel — verifierat KORREKT som mekanism, inte ännu
verifierat som fullbordad ände-till-ände-funktion.

## Betalningsdomänen + jobbmotorn (TASK-346.3, ADR-128/ADR-129)

Tre migrationer, i denna ordning (tidsstämplarna gör ordningen bindande):

| Fil | Vad den skapar |
|---|---|
| `20260830195728_betalningsdomanen_inbetalningar_kvitton.sql` | `inbetalningar`, `kvitton`, `kvittoserie_golv`, `allokera_kvittonummer()`; RLS + grants; `inbetalningar` i Realtime-publikationen |
| `20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql` | `pgmq`/`pg_cron`/`pg_net`, kön `jobbko`, `jobb` + `jobb_rad`, kö-wrappers i `public`, `jobb_cron_tick()` + cron-posten `jobbmotor-tick`; `jobb`/`jobb_rad` i publikationen |
| `20260830200100_purga_testrader_sentineler.sql` | `purga_testrader()` — städvägen för `ZZ-TASK-346…`-testrader |

### TVÅ STEG KRÄVS EFTER `db push` — annars är motorn inert

`db push` ensamt gör INTE staging körbart. Två DATA-steg återstår, och båda
är medvetet skilda från schemat:

**1. Kvittoseriens golv.** `allokera_kvittonummer()` är FAIL-CLOSED mot ett
saknat golv — den kastar hellre än gissar 1001 och kolliderar med den gamla
Airtable-serien. Golvet är miljöberoende och kan inte bo i en migration
(Postgres kan inte läsa Airtable-ledgern):

```bash
npx supabase db query --linked "insert into public.kvittoserie_golv (ar, forsta_lopnummer, motivering) values (2026, 1003, 'Airtable-ledgern i staging bar hogst MM-2026-1002 (matt 2026-08-30) — serien fortsatter efter den.') on conflict (ar) do nothing"
```

Staging: **1003** (ledgern bär `MM-2026-1001` och `MM-2026-1002`, mätt
2026-08-30). Prod: **1001** (ledgern är tom, mätt read-only samma dag) — det
steget är Marcus, i prod-runbooken (`TASK-346.11`).

**2. Vault-hemligheterna.** Cron-ticket ringer inte ut förrän alla tre finns
(ADR-129 beslut 7). Namnen är `jobbmotor_funktions_url`,
`jobbmotor_anon_nyckel` och `jobbmotor_delad_hemlighet`; den sista måste ha
SAMMA värde som Edge Function-secreten `JOBBMOTOR_DELAD_HEMLIGHET`.
Staging seedas av en agent, prod av Marcus.

### Verifieringen körs EN gång, efter push

```bash
npx supabase db query --linked -f scripts/task-346-3-staging-verifiering.sql
```

Bevisar det som bor i databasen och därför inte kan bevisas hermetiskt:
sekvensens golv och täthet, den unika nyckeln per inbetalning (andra
insättningen fäller), den genererade kvittonummer-kolumnen, pengalogikens
check-constraints, och jobbmotorns dubblettskydd. Städar efter sig, bränner
inga kvittonummer och lämnar 2026-serien orörd. Exit 0 + slutraden
`ALLA KONTROLLER PASSERADE` är utfallet.

Deny-halvan (anon/authenticated) och kolumnkontraktet är däremot COMMITTADE,
i `tests/api/betalningsdomanen-rls.staging.test.ts` — de kräver ingen
skrivbehörighet och körs i varje `npm run test:api:staging`.

### En känd, accepterad transient vid första appliceringen

Cron-posten anropar `jobb-konsument`, som byggs först i `TASK-346.4`.
Anropet 404:ar tills funktionen deployats — men det sker aldrig i praktiken:
`jobb_cron_tick()` ringer bara när det FAKTISKT finns rader i `vantar`, och
aldrig alls medan Vault saknar sina tre värden. Med tom jobbtabell görs noll
anrop, och `cron.job_run_details` fylls inte med fel.

### Ingen down-migration finns — Supabase CLI har ingen

Varje migrationsfil bär i stället sin rollback-SQL som ett kommentarblock
sist. Läs `20260830195900`:s: `drop extension pgmq cascade` lämnar schemat
`pgmq` KVAR, tomt (mätt 2026-08-30, ADR-129 § Kontext), så en avinstallation
som inte droppar det explicit ser ren ut utan att vara det.
