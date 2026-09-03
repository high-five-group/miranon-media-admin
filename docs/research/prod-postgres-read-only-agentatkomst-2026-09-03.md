---
owner: marcus803
updated: 2026-09-03
review_by: 2026-12-03
status: draft
---

# Read-only agentåtkomst mot prod-Postgres — branschmönster och vår väg

> **Proveniens:** avgränsat research-pass, kört oisolerat i huvudkatalogen
> (branch `main`, `1a477f3f`). Frågan: hur ger branschledare en AI-agent
> read-only åtkomst till en produktions-Postgres på Supabase utan att
> exponera skrivrättigheter eller kontonyckel, och vilken form passar oss.
> Ingen kod skriven, inget committat.

## Vad jag redan hade innan jag sökte — och vad som var nytt

**Läst före första sökning:** `scripts/deny-prod-ref.sh` + `.prod-ref-policy.conf`
(hela filerna, verbatim), `docs/reference/atkomst-och-nycklar.md` (hela filen —
inga tidigare rader om Postgres-roller, bara Supabase PAT-klassificeringen och
Management API-mönster för Airtable/EF-provisionering), `ADR-128`
(betalningsdomänens Postgres-flytt) och `ADR-110`/`ADR-055` (sökta på
read-only/pooler/agent — noll träffar i ADR-110/ADR-055). Sökte
`docs/research/` på read-only/postgres/pooler/supavisor/MCP — **noll
befintliga pass om detta ämne**. Sökte `tasks/lessons.md` på samma termer —
noll träffar. Ingen ADR har alltså redan avgjort frågan; detta är genuint
nytt mark, inte en omprövning av ett tidigare beslut.

**Det viktigaste jag hittade var inte i `docs/`, utan i sessionshistoriken.**
`tasks/sessions/2026-08-29-session-113.md` Del 11 och Del 16 visar att
orkestreraren REDAN har läst prod-Postgres read-only, två gånger, med den
mekanism som finns idag: Marcus dikterar `deny-prod-ref.sh`s inbyggda
typa-för-att-bekräfta-bypass (`PROD_REF_GODKAND_AV_MARCUS=<ref>` inline på
kommandoraden) i klartext för VARJE enskilt kommando, verbatim citerat:
*"Diktera mig då, 'Kör, du har mitt godkännande'."* (rad ~1655–1667). Läsningen
2026-08-30 av kvittoledgern (`ADR-128` rad 173: *"prod bär 0 kvitton (mätt
read-only av orkestreraren 2026-08-30, S113 Del 11)"*) gick via
`npx supabase db query --linked` — alltså med **hela kontonyckeln** (`sbp_…`,
klassad "Kontonyckel — hela kontot" i `atkomst-och-nycklar.md`), bara det
FAKTISKA kommandot råkade vara en `SELECT`. Skrivrätten fanns hela tiden i
handen som höll pennan; det som saknades var bara avsikten att skriva.

Detta är den exakta lucka Marcus nu ber om att stänga: dagens mönster
förlitar sig på (a) att han manuellt dikterar bypass-frasen varje gång, och
(b) att agenten frivilligt bara kör `SELECT`. Ingenting vid databaslagret
hindrar ett misstag eller en prompt-injektion från att skriva om samma
kommando användes. **Mitt pass undersöker hur man gör skrivrätten
STRUKTURELLT frånvarande i stället för procedurellt otillåten.**

Ett andra fynd i samma sessionsdok (rad ~2682, Del "prod-verifierad
read-only av orkestreraren", "smoke-kontot") visar en HELT ANNAN, redan
fungerande väg för fyra av de fem tabellerna — se § 6.

---

## Kort svar

**Domen:** branschledare (Supabase själva, `@modelcontextprotocol`-referens­
servern, tredjeparts AI-agent-guider) löser detta med **en dedikerad
Postgres-roll vars enda beviljade rättighet är `SELECT` på namngivna
tabeller** — aldrig genom att lita på att ett skript eller en
transaktionsflagga "beter sig". Supabase MCP-servern kör själv sina läs-frågor
"as a **read only postgres user**" (maintainer-citat, källa 3 nedan) — inte
statement-filtrering, inte bara en URL-flagga. Det är precis det mönster som
redan finns fyra gånger om i det här repot (`ADR-128`/`ADR-129`/`ADR-110`:s
"RLS + GRANT, tillsammans, aldrig RLS ensamt") — samma verktyg vi redan
använder, applicerat en femte gång.

**För oss:** bygg en ny roll `agent_readonly` via EN migration (samma form som
de tre migrationerna som redan finns), anslut via **Supavisor session-pooler**
(IPv4 garanterat, inget add-on), och håll `default_transaction_read_only` +
`statement_timeout` som andra försvarslinjer — inte som säkerhetsgränsen
själv (den gränsen är GRANT-lagret). En zero-migration-genväg för fyra av de
fem tabellerna finns redan bevisad i repot (§ 6) och kan användas i väntan på
migrationen.

---

## 1. Supabase officiella mönster för read-only-användare

**`CREATE ROLE ... WITH LOGIN` + `GRANT SELECT` är den dokumenterade grunden,
men Supabases egen "Postgres Roles"-guide saknar en färdig read-only-uppskrift.**
Sidan visar bara `create role "role_name";` och
`create role "role_name" with login password '...';`, och hänvisar i övrigt
till RLS för åtkomstkontroll — inget färdigt `GRANT SELECT`/
`ALTER DEFAULT PRIVILEGES`-recept står där (källa 1, läst 2026-09-03).

**RLS-bypass-frågan är den verkliga fällan, och den är källbelagd dubbelt.**
PostgreSQL-dokumentationen är entydig: den inbyggda rollen `pg_read_all_data`
"allows reading all data... **This role does not bypass row-level security
(RLS) policies.** If RLS is being used, an administrator may wish to set
BYPASSRLS on roles which this role is granted to." (källa 2, läst 2026-09-03).
Supabases egen RLS-guide bekräftar samma sak från andra hållet: "Once RLS is
enabled, no data is accessible through the API... until you create policies",
och att `service_role`/`postgres` är de roller som har `bypassrls` (källa 4).

**Konsekvens för en NY roll:** en helt ny Postgres-roll (t.ex. `agent_readonly`)
utan `bypassrls` och utan egna policies ser **noll rader** på en RLS-aktiverad
tabell, oavsett hur mycket `GRANT SELECT` den får — policies är knutna till
ROLLNAMN (`to authenticated`, `to service_role`), inte till behörighetsnivå.
Detta verifierade jag mot vår egen kod, inte bara mot dokumentationen:

| Tabell | RLS | Policy | Vem kan läsa idag | Källa |
|---|---|---|---|---|
| `public.inbetalningar` | på | `inbetalningar_las_authenticated`, `for select to authenticated using (true)` | `authenticated` (alla app-inloggade), `service_role` | `supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql:478,487,496,499` |
| `public.kvitton` | på | `kvitton_las_authenticated`, samma form | `authenticated`, `service_role` | samma fil, rad 479,488,497,503 |
| `public.kvittoserie_golv` | på | **ingen SELECT-policy alls** | endast `service_role`/`postgres` (deny-all, infrastruktur) | samma fil, rad 480 |
| `public.jobb` | på | `jobb_las_authenticated`, `using (true)` | `authenticated`, `service_role` | `supabase/migrations/20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql:493,496,499,502` |
| `public.jobb_rad` | på | `jobb_rad_las_authenticated`, `using (true)` | `authenticated`, `service_role` | samma fil, rad 494,497,500,506 |
| `public.activity_log` | på | **ingen policy för `anon`/`authenticated` — explicit `revoke all`** | **endast `service_role`** (`grant select, insert`) | `supabase/migrations/20260811211759_create_activity_log.sql:103,113` + `20260812143131_grant_service_role_activity_log.sql:33` |

Marcus fråga nämner fem mål: `inbetalningar`, `jobb`, `jobb_rad`, `kvitton`,
"aktivitetslogg" (`activity_log`). **Fyra av dem är redan `authenticated`-läsbara
via existerande policies. `activity_log` är det enda av de fem som idag är
stängt för ALLA utom `service_role`** — det är en medveten deny-all-design
("RLS nekar anon/authenticated helt", kommentar i migrationen rad ~92), och
att öppna den för en ny roll är en genuin, avsiktlig VIDGNING av dagens
säkerhetsläge, inte en neutral teknisk detalj. Den vidgningen bör vara ett
eget, synligt beslut i migrationen — aldrig en bieffekt av att "bara lägga
till en roll".

**`ALTER DEFAULT PRIVILEGES` och `default_transaction_read_only` hör hemma på
rollnivå, inte som ersättning för GRANT.** PostgreSQL-dokumentationen säger
rakt ut: *"A read-only SQL transaction cannot alter non-temporary tables. This
parameter controls the default read-only status of each new transaction. The
default is off."* (källa 5). Kritiskt: detta är en **session-parameter**, inte
en behörighet — en roll som får `ALTER ROLE agent_readonly SET
default_transaction_read_only = on;` kan i teorin själv köra
`SET default_transaction_read_only = off;` eller `SET TRANSACTION READ WRITE;`
mitt i sin egen session om den har någon anledning att försöka, **eftersom
detta är en `user`-kontext-GUC, inte en superuser-spärr.** PostgreSQL-docs för
`SET TRANSACTION` bekräftar att kommandot "sets the characteristics of the
current transaction" utan att nämna någon rollbaserad spärr mot att sätta om
det (källa 6) — jag hittade ingen dokumenterad mekanism som hindrar en
inloggad roll från att själv häva sin egen `default_transaction_read_only`.
**Slutsats: `default_transaction_read_only` är en bekväm standardinställning
och en extra felbroms (omedelbar transaktionsavbrytning vid ett skrivförsök,
tydligare felbild), INTE säkerhetsgränsen.** Säkerhetsgränsen är att rollen
saknar `INSERT`/`UPDATE`/`DELETE`/`CREATE`-behörighet helt — då spelar det
ingen roll vad transaktionsläget säger, Postgres nekar ändå med
`permission denied`.

---

## 2. Anslutningsformer — direkt vs Supavisor, och DSN-i-nyckelring-frågan

**Tre anslutningsformer, mätta mot Supabases egen "Connect to your
database"-guide (källa 7, läst 2026-09-03):**

| Form | Host:Port | Användarnamn | Nätverk |
|---|---|---|---|
| Direkt | `db.<ref>.supabase.co:5432` | `postgres` (eller `<roll>` — se nedan) | IPv6, eller IPv4 endast med betald add-on |
| Supavisor, session-läge | `aws-<region>.pooler.supabase.com:5432` | `<roll>.<ref>` | **IPv4 på ALLA plan-nivåer** |
| Supavisor, transaktionsläge | `aws-<region>.pooler.supabase.com:6543` | `<roll>.<ref>` | IPv4, stödjer inte prepared statements |
| Dedikerad pooler (PgBouncer) | `db.<ref>.supabase.co:6543` | `<roll>.<ref>` | betald plan, IPv6 nativt |

**Poolern accepterar VILKEN roll som helst, inte bara `postgres`** —
verifierat i två oberoende community-trådar: en Supabase-diskussion
(`orgs/supabase/discussions/34455`) där felet "Tenant or user not found"
löstes genom att byta `postgres.instance_id` mot
`supabase_read_only_user.instance_id` (källa 8), och en sökträff som visar
samma mönster generellt: `postgres://[custom_role].[project_ref]:[password]@
[cloud].pooler.supabase.com:6543/postgres` (källa 9). Formatet är alltså
`<rollnamn>.<project-ref>` som användarnamn, oavsett vilken roll det är.

**Rekommendation för anslutningsform:** Supavisor **session-läge** (port
5432). Skälet är sammansatt: (a) IPv4 garanterat på alla plan-nivåer — vi
slipper fråga om vår miljö har IPv6-utgång eller om ett IPv4-tillägg krävs;
(b) en tredjeparts AI-agent-guide (källa 10, läst 2026-09-03) rekommenderar
uttryckligen pooled framför direkt anslutning för just agent-arbetsbelastning:
*"Agents open connections in bursts and don't always clean up after
themselves, and the direct connection has a much lower ceiling."*;
(c) transaktionsläget stödjer inte prepared statements, vilket är en
onödig begränsning för enstaka, låg-volym incidentfrågor.

**Read Replicas är INTE rätt verktyg här, trots att namnet låter rätt.**
Supabases egen dokumentation beskriver dem som last balancing/latens/
redundans, kräver Team/Enterprise-plan (källa 11), och även om en replika
avvisar skriv-SQL är det en **infrastrukturell** egenskap (replikering är
inherent läsning), inte en åtkomstkontroll konstruerad för att begränsa EN
specifik användare — vem som helst med samma databaslösenord kan lika gärna
koppla mot primären. Fel lager för problemet.

### DSN-i-nyckelring-frågan — läsningen ur låsets egen text, med argument åt båda håll

Jag läste `scripts/deny-prod-ref.sh` (hela filen) och `.prod-ref-policy.conf`
(hela filen) ordagrant. Mekaniken är en ren substrängs-match:
`[[ "${COMMAND}" == *"${PROD_REF_PROD}"* ]]` mot `tool_input.command` — inget
annat än den bokstavliga Bash-kommandotexten prövas. En DSN hämtad i
runtime, t.ex. `DSN="$(security find-generic-password -s agent-readonly-dsn
-w)"; psql "$DSN" -c 'select 1'`, innehåller ALDRIG project-refen i
kommandoTEXTEN (bara `$DSN`) — mekaniskt verifierat genom att läsa hookens
egen kod, inte antaget. Detta är alltså en genuin, mätbar lucka, inte en
hypotes.

**Argument för att det är i låsets ANDA:** skriptets egen kommentar säger
uttryckligen att dess syfte är att stoppa "skarpa operationer (link/deploy/db
push)" — skrivmutationer — och att refen matchas brett just för att en
subkommando-lista är för svår att hålla komplett (`.prod-ref-policy.conf`
§ Matchning). Om den nya rollen strukturellt SAKNAR skrivbehörighet (GRANT-
lagret, § 1 ovan) håller den invariant hooken faktiskt skyddar — "ingen
obehörig skrivning når prod" — oavsett vad Bash-kommandots text råkar
innehålla. Låset skyddar ett UTFALL, inte en sträng.

**Argument för att det är ett kringgående:** samma skriptkommentar bygger
in en EXPLICIT, dokumenterad bypass-väg (`PROD_REF_GODKAND_AV_MARCUS=<ref>`)
och lägger stor vikt vid att den **loggas synligt till stderr, aldrig
tyst** ("extra observerbarhets-spärr"). En keychain-DSN som aldrig gör att
refen syns i kommandotexten ger INGEN sådan logg-rad — varje användning blir
osynlig för samma efterhandsgranskning skriptets författare uttryckligen
byggt in för den sanktionerade vägen. Det är en regression i observerbarhet,
även om det inte är en regression i skrivskydd.

**Min bedömning (REKOMMENDATION, inte beslut):** bygg INTE på att
substrängs-matchningen råkar missa DSN:en. Gör det till en explicit,
namngiven, LOGGAD undantagsform — samma disciplin som den redan sanktionerade
bypass-varianten, men en EGEN variabel för läsvägen (t.ex.
`PROD_REF_READONLY_DSN_VAR` i `.prod-ref-policy.conf`, som hooken känner
igen och tillåter med en synlig "READ-ONLY-VÄG ANVÄND"-rad till stderr) i
stället för en tyst lucka som råkar fungera. Det håller kvar den
spårbarhet skriptets egen text uttryckligen värdesätter, och det är en
liten ändring eftersom bypass-mönstret redan finns att kopiera formen från.
Detta är mitt förslag — Marcus äger beslutet, och skriptets egen kommentar
säger uttryckligen att en agent aldrig konstruerar en bypass-form på eget
initiativ.

---

## 3. Alternativ: Management API, read replicas, `db query --linked`

**Management API — `POST /v1/projects/{ref}/database/query` — hämtade jag
OpenAPI-specen live (`https://api.supabase.com/api/v1-json`, 2026-09-03,
338 077 byte) i stället för att lita på en sammanfattning:**

```json
"summary": "[Beta] Run sql query",
"security": [{"bearer": []}],
"x-oauth-scope": "database:write",
"x-fga-permissions": [["database_read"], ["database_write"]]
```

Body-schemat (`V1RunQueryBody`) har fälten `query` (krav), `parameters`,
och `read_only: boolean` — exempel i specen: `{"query": "select * from
pg_stat_activity limit 1;", "read_only": true}`.

Tre problem med den här vägen för OSS specifikt: **(a) endpointen är
uttryckligen märkt Beta** av Supabase själva; **(b) den OAuth-scope som
krävs är `database:write`** — det finns ingen renodlad läs-scope för denna
endpoint i specen, trots att kroppen accepterar `read_only:true` (specens
`x-fga-permissions` nämner visserligen `database_read` separat, men
`x-oauth-scope`-badgen som faktiskt styr OAuth-appar säger `write`); **(c)
den kräver en PAT eller OAuth-token — vår enda idag är `sbp_…`,
klassad som hela-konto-nyckel** (`atkomst-och-nycklar.md` § Två nyckelklasser).
Att använda Management API för läsning betyder alltså att exponera samma
bredd av behörighet som ett `db push` skulle göra, och lita på att Supabases
BACKEND (inte något vi kontrollerar) faktiskt respekterar `read_only:true`.
Maintainer-citatet i § 4 nedan visar att den respekten är verklig (Supabase
kör frågan mot en dedikerad read-only-Postgres-användare internt) — men det
är fortfarande TILLIT till ett fjärrsystems implementation, inte en garanti
vi kontrollerar på vår sida. Sämre passform än en egen databasroll.

**`supabase db query --linked` (CLI):** Supabases CLI-referens listar
kommandot i navigeringen men **saknar en egen dokumentationssektion** —
ingen beskrivning, inga flaggor (källa 12, läst 2026-09-03, bekräftat tomt).
Vår egen `atkomst-och-nycklar.md` dokumenterar redan att kommandot kräver
`supabase link` (sticky-läge — länken pekar kvar mot senaste projektet tills
den återlänkas, en känd fälla som redan kostat en oavsiktlig prod-deploy,
se `CLAUDE.md` § "Prod-EF-deploy körs via SKRIPTET"). Samma svaghet som
Management API: kräver samma `sbp_…`-PAT, ingen inbyggd läs-scope.

**Read Replicas:** se § 2 ovan — fel lager, Team/Enterprise-plan krävs,
skyddar inte mot att koppla mot primären med samma lösenord.

**Slutsats § 3:** ingen av dessa tre är en RIKTIGT scopad läsväg. Alla tre
delar samma svaghet — de sitter ovanpå kontonyckeln, inte ovanpå en egen,
smalt beviljad databasroll.

---

## 4. Hur andra agent-ramverk gör: MCP-mönstret

**Supabases egen MCP-server (`github.com/supabase/mcp`) enforcar read-only
på DATABASROLL-nivå, inte bara genom att gömma verktyg.** Källbelagt i tre
oberoende lager:

1. **Maintainer-citat, verbatim**, från GitHub-issue #112 i repot (öppnat av
   `gregnr`, Supabase-anställd, 2025-07-19, Closed): read-only-läget täcker
   idag *"execute_sql (by running as **read only postgres user**)"* och
   *"apply_migration (by rejecting the tool)"* (källa 13, läst 2026-09-03).
2. **Källkoden** (`packages/mcp-server-supabase/src/platform/api-platform.ts`,
   läst via WebFetch 2026-09-03) visar att `executeSql` bara vidarebefordrar
   `read_only` som fält i kroppen till Management API:t
   (`/v1/projects/{ref}/database/query`) — MCP-servern själv innehåller ingen
   enforcement-logik, den delegerar helt till backend.
3. **Supabases egen "Access Control"-dokumentation** bekräftar samma mönster
   från ett tredje håll: organisationsrollen "Read-Only" (Team/Enterprise-plan)
   kör SQL Query Snippets *"against the database using the
   **supabase_read_only_user**"*, och den rollen *"has the predefined
   Postgres role **pg_read_all_data**"* (källa 14, läst 2026-09-03) — samma
   inbyggda PostgreSQL-roll jag källbelade i § 1 (källa 2), som uttryckligen
   INTE bypassar RLS.

**Detta är den starkaste enskilda källan i hela passet**, eftersom det är
Supabase som själva byggt sin egen agent-integration mot exakt det mönster
jag rekommenderar: en dedikerad Postgres-ROLL, inte statement-filtrering,
inte en app-nivå-flagga. `pg_read_all_data` är för BREDA för vårt syfte
(den ger `SELECT` på ALLA tabeller i ALLA scheman — mer än de fem namngivna
målen, se § 1), men principen — en egen inloggningsbar roll utan
skrivbehörighet — är identisk med vad jag föreslår i § 6.

**Referens-MCP-servern för Postgres (`@modelcontextprotocol/servers`,
det generiska `server-postgres`-paketet)** enforcar på TRANSAKTIONSnivå:
*"All queries are executed within a **READ ONLY transaction**"* (källa 15,
läst 2026-09-03) — motsvarande `BEGIN READ ONLY` i vårt skript-golv (§ 5).
Detta förklarar för övrigt en obesvarad community-fråga jag hittade av en
slump (`orgs/supabase/discussions/34325`, 2025-03-21): en användare undrade
varför Cursor-anslutningen "bara" var read-only trots att hen inte bett om
det — svaret ligger sannolikt i att `server-postgres` gör detta by DEFAULT,
inte i något Supabase-specifikt (frågan förblev obesvarad i tråden, men
mekaniken förklarar symptomet).

**Nyare Supabase-funktion, värd att känna till men INTE moget för oss än:**
"Feature Preview: Temporary token-based database access" (Supabase changelog,
publicerat 2026-05-25, källa 16) — ett JIT-liknande system där en
projektadministratör kopplar en Supabase-ANVÄNDARE till en specifik
databasroll för en tidsbegränsad period (minuter till 90 dagar), autentiserat
med PAT/dashboard-JWT i stället för databaslösenord, fullt auditerbart (*"it
will be possible to see who accessed the database, and with which role"*).
Tre skäl att INTE luta oss mot den nu: (a) uttryckligen märkt **"Feature
Preview"**, inte GA; (b) kräver **Postgres 17.6.1.081 eller senare** — staging
kör 17.6 (odokumenterad patch-version), och **prods version är omätt av en
agent** (prod-ref fälls, se `ADR-128` § "Prod-halvan är obelagd, med avsikt");
(c) den är byggd för **riktiga projektmedlemmar** — "external contractor
access is not yet supported" — inte för ett tjänstekonto/agent-identitet.
En dedikerad Postgres-roll (§ 6) löser samma problem idag, utan att vänta på
att en preview-funktion blir GA och utan att kräva ett mänskligt
dashboard-medlemskap för agenten.

---

## 5. Skript-golvet — hur man tvingar fram read-only i praktiken

**Verktygsläge, mätt mot vår egen miljö (2026-09-03), inte antaget:**
`which psql` → **"psql not found"**. Ingen `pg`/`postgres`-npm-paket i
`package.json`. Detta är ett konkret, opåräknat fynd som formar
rekommendationen: ett skript byggt kring `psql -v ON_ERROR_STOP=1` kräver
antingen att `psql` installeras (Homebrew, inte en del av detta repos
verktygskedja idag) eller att vägen byggs i **Node** (repot är redan
Node/TypeScript, och moderna Node-versioner har inbyggd `fetch` för
REST-vägen i § 6; en rå Postgres-anslutning från Node kräver `pg`
npm-paketet som devDependency — inte installerat idag, en liten,
tillagd yta).

**Vad PostgreSQL-dokumentationen faktiskt ger oss (källa 17, läst
2026-09-03):**

- `ON_ERROR_STOP` sätts via `-v ON_ERROR_STOP=1` (eller `--set=...`) — vid
  fel i ett skript avbryts körningen med exit-kod 3 i stället för att
  fortsätta.
- **Det finns INGET `-R`/read-only-flagga i `psql`** — jag sökte
  dokumentationen specifikt efter en sådan och den existerar inte.
  Read-only måste komma från transaktionsläget eller rollens rättigheter,
  aldrig från en klientflagga.
- `statement_timeout` sätts inte via en egen `-v`-variabel utan som ett
  SQL-`SET`-kommando i själva anropet (`psql -c 'SET statement_timeout TO
  30000; SELECT ...'`) eller — bättre, per rollens defaultkonfiguration —
  `ALTER ROLE agent_readonly SET statement_timeout = '30s';` (rollnivå,
  gäller varje ny session automatiskt, ingen risk att glömmas per anrop).

**Det lager-tänk som håller ihop skript-golvet, i prioritetsordning
(starkast först):**

1. **GRANT-lagret (den enda RIKTIGA säkerhetsgränsen).** Rollen har
   `SELECT` och ingenting annat på de fem namngivna tabellerna — inget
   `INSERT`/`UPDATE`/`DELETE`/`CREATE`/`TRUNCATE`, ingen `bypassrls`. Även om
   varje annat lager nedan faller bort, kan rollen mekaniskt inte skriva.
2. **Transaktionsläget (`BEGIN READ ONLY` eller
   `ALTER ROLE ... SET default_transaction_read_only = on`).** Ger en
   omedelbar, tydlig felsignal vid ett skrivförsök i stället för att förlita
   sig enbart på ett `permission denied` djupare i planen — och blockerar
   dessutom saker ett rent GRANT-SELECT inte gör (t.ex. `EXPLAIN ANALYZE` av
   en skrivande fråga, eller `SELECT ... FOR UPDATE`-lås). Kan i teorin
   hävas av rollen själv (§ 1) — därför lager 2, aldrig lager 1.
3. **Statement-allowlist i skript-golvet** (regex `^\s*(SELECT|WITH|EXPLAIN)\b`,
   avvisa flerstatement-kommandon som kan smuggla in en skrivning efter ett
   semikolon). Billigast att kontrollera, men helt mjukvarubaserat — den
   enda av de fyra lagren en bugg i VÅR EGEN kod kan råka kringgå.
4. **Connection limit + statement_timeout + radtak på resultatet**
   (`ALTER ROLE agent_readonly CONNECTION LIMIT 3;`,
   `ALTER ROLE agent_readonly SET statement_timeout = '30s';`, plus en
   `LIMIT` i skriptets egen fråge-mall) — begränsar blast radius om något
   ändå går snett (en läckande frågeloop, en oavsiktlig fullständig
   tabellscan), skyddar inte mot skrivning i sig.

**Nyckelläsning ur macOS-nyckelringen — redan etablerad repo-konvention,
återanvänd, inte uppfunnen här:** `security find-generic-password -s <tjänst>
-w`, alltid pipat vidare, **aldrig** i en `echo`/`printf` som hamnar i en
logg. `atkomst-och-nycklar.md` dokumenterar redan en snarlik fälla för
Supabase CLI:ts egen nyckelringspost: värdet kommer wrappat som
`go-keyring-base64:<base64>` och måste packas upp
(`security find-generic-password -s "Supabase CLI" -a supabase -w | sed
's/^go-keyring-base64://' | base64 -d`) — men det gäller CLI:ts EGEN PAT-post,
inte en ny DSN vi själva skapar. En ny nyckelringspost för
`agent_readonly`s lösenord (skapad av Marcus, läst av skriptet) slipper den
specifika wrapping-fällan eftersom vi själva väljer lagringsformatet — men
mönstret "läs med `-w`, aldrig `-g` om attribut räcker, pipa alltid vidare,
aldrig i klartext på kommandoraden" är redan etablerad disciplin
(`deny-hemlighet-utskrift.sh`, samma fil-familj).

---

## 6. Redan bevisat i repot: smoke-kontot täcker fyra av fem tabeller UTAN någon ny infrastruktur

Detta var det oväntade fyndet i sessionshistoriken (§ "Vad jag redan hade").
`inbetalningar`, `kvitton`, `jobb`, `jobb_rad` har ALLA redan en
`authenticated`-scopad `SELECT`-policy (tabellen i § 1). Det betyder att
**varenda befintlig app-inloggning** (Marcus, Lotta, Roger, eller ett
dedikerat "smoke"-konto som redan används för prod-verifiering,
`tasks/sessions/2026-08-29-session-113.md` rad ~2682) är **strukturellt
skrivskyddad** mot dessa fyra tabeller redan idag — inte av konvention, utan
av samma GRANT-mekanism som § 1: `authenticated` har `revoke all` följt av
enbart `grant select`, verifierat rad för rad i migrationerna. All skrivning
går uteslutande via `service_role` inuti Edge Functions — en helt separat
HTTP-yta (`/functions/v1/*`) som ett skript begränsat till PostgREST-läsningar
(`GET /rest/v1/<tabell>`) aldrig anropar.

**Konkret:** en agent som autentiserar med den redan "safe to expose"-klassade
`anon`/publishable-nyckeln (`atkomst-och-nycklar.md` § Två nyckelklasser,
citat ur Supabase-docs: *"sb_publishable_ = safe to expose"*) plus ett
befintligt kontos inloggningssession, och som BARA gör GET-anrop mot
`/rest/v1/inbetalningar`, `/rest/v1/kvitton`, `/rest/v1/jobb`,
`/rest/v1/jobb_rad`, kan mekaniskt inte skriva dessa fyra tabeller — oavsett
vad kommandotexten innehåller. **Detta kräver NOLL ny migration, noll ny
Postgres-roll, noll nytt lösenord.** Det var redan i produktion 2026-08-29
(smoke-kontot).

**Vad den vägen INTE ger:** (a) `activity_log` förblir stängd (deny-all för
`authenticated`, oavsett vilket konto som loggar in) — samma problem som en
ny roll också måste lösa medvetet; (b) autentiseringen är en människo-formad
Supabase Auth-session (JWT med förfallotid, refresh-token-hantering,
eventuellt en passkey-prompt — sessionsdoket nämner uttryckligen
"passkey-erbjudandet inte klickat" för smoke-kontot) — fler rörliga delar för
ett obemannat skript än ett stabilt databaslösenord; (c) kontot ärver TYST
vad `authenticated` någonsin råkar få för nya rättigheter i framtida
migrationer — en dedikerad roll ärver ingenting den inte uttryckligen
beviljas.

---

## Dom

**Ingen enskild källa säger "gör exakt X mot Supabase" i en färdig uppskrift**
— Supabases egen roll-guide saknar den (§ 1). Men **tre oberoende
källgrupper konvergerar på samma princip**: PostgreSQL-dokumentationen
(GRANT är gränsen, transaktionsläge är bara en bekväm broms),
Supabase-plattformens EGNA verktyg (MCP-serverns `read_only`-läge kör som
en dedikerad Postgres-användare; organisationens "Read-Only"-roll kör som
`supabase_read_only_user` med `pg_read_all_data`), och en tredjeparts
AI-agent-specifik guide (samma `agent_readonly`-mönster, samma
`default_transaction_read_only`/`statement_timeout`-kombination, oberoende
formulerad). **Branschmönstret är entydigt: en dedikerad, smalt beviljad
Postgres-roll — inte en klientflagga, inte ett skript-löfte, inte
kontonyckelns fulla behörighet med ett artigt löfte att bara läsa.**

**För oss specifikt** delar sig svaret i två delar som inte konkurrerar:

1. **Idag, utan att bygga något:** fyra av fem tabeller
   (`inbetalningar`/`kvitton`/`jobb`/`jobb_rad`) är redan strukturellt
   read-only för varje inloggad app-användare, PostgREST-vägen (§ 6) — det
   räcker för de flesta incidentverifieringar rakt av.
2. **För att täcka alla fem, och för en långsiktigt stabil, oberoende
   scopad credential:** bygg `agent_readonly` som en femte instans av det
   mönster repot redan följer fyra gånger (§ 1-tabellen) — en migration,
   samma "RLS + GRANT, tillsammans"-disciplin, uttrycklig `activity_log`-
   vidgning som eget synligt beslut.

---

## Vad jag inte kunde belägga

- **Prods exakta Postgres-version.** Staging kör 17.6 (bekräftat i
  `CLAUDE.md` och sessionsdoket); prod är **omätt av en agent**
  (`scripts/deny-prod-ref.sh` fäller varje sådant försök) — relevant om den
  nyare JIT-token-funktionen (§ 4) någonsin blir aktuell, eftersom den
  kräver PG ≥ 17.6.1.081.
- **Om `authenticated` är en `NOLOGIN`-roll i Supabase per default.** Jag
  hittade bred, konsekvent sekundärkälls-konsensus om detta (WebSearch-
  syntes, inte ett verbatim primärkälls-citat jag kunde peka på), men ingen
  enskild rad i Supabases officiella docs som säger det rakt ut. Jag
  behandlar det som sannolikt sant men INTE lika hårt källbelagt som
  resten av rapporten.
- **Exakt hur Management API:ts backend implementerar `read_only:true`
  internt.** Maintainer-citatet (källa 13) säger "running as read only
  postgres user" för MCP-serverns `execute_sql`, men jag har inte sett
  Management API:ts egen serverkod (den är inte öppen källkod) — jag litar
  på ett förstapartscitat, inte på egen verifiering av implementationen.
- **Om `pg_read_all_data`+`bypassrls` verkligen är EXAKT hur
  `supabase_read_only_user` är konfigurerad internt**, eller om Supabase
  lägger till något extra lager för sin dashboard-SQL-editor. Docs säger
  att rollen "has the predefined Postgres role pg_read_all_data" men
  specificerar inte om den ÄVEN har `bypassrls` (vilket skulle förklara
  varför den ser "allt" i dashboarden trots RLS) — om den har det är den
  BREDARE än vad vi vill ha för `agent_readonly` (se § 1: vi vill INTE ha
  `bypassrls`, vi vill ha uttryckliga policies för exakt fem tabeller).
- **Om `.prod-ref-policy.conf`s DSN-lucka (§ 2) redan diskuterats och
  medvetet accepterats av Marcus** vid skriptets ursprungliga design
  (`TASK-203`, 2026-08-12) — jag hittade inget spår av att just DENNA
  specifika kringgåendeform (keychain-DSN) övervägdes då. Min läsning i
  § 2 är min egen bedömning av skriptets TEXT, inte ett återgivet beslut.
- **Kostnaden/friktionen av att skapa en ny macOS-nyckelringspost för
  `agent_readonly`s lösenord** har jag inte mätt (inget lösenord skapat i
  detta pass) — bara att MÖNSTRET för att läsa en befintlig post säkert
  redan finns och fungerar (`atkomst-och-nycklar.md`).

---

## Rekommendation (min bedömning — Marcus beslut)

1. **Bygg `agent_readonly` som en Postgres-roll via EN migration**, i samma
   stil som `20260830195728_betalningsdomanen_inbetalningar_kvitton.sql`:
   `create role agent_readonly with login password '<slumpad, i keychain>'
   connection limit 3;`, `alter role agent_readonly set
   default_transaction_read_only = on;`, `alter role agent_readonly set
   statement_timeout = '30s';`, `grant usage on schema public to
   agent_readonly;`, `grant select on public.inbetalningar, public.kvitton,
   public.jobb, public.jobb_rad, public.activity_log to agent_readonly;`,
   plus NYA policies `for select to agent_readonly using (true)` på de fem
   tabellerna (fyra speglar redan `..._las_authenticated`, den femte —
   `activity_log` — är en medveten, dokumenterad vidgning värd sin egen
   rad i migrationens kommentar, inte en biverkning).
2. **Anslut via Supavisor session-pooler** (`agent_readonly.<prod-ref>@
   aws-<region>.pooler.supabase.com:5432`) — IPv4 garanterat, inget
   add-on, matchar tredjepartsguidens agent-specifika rekommendation.
3. **Lösenordet i en NY, egen macOS-nyckelringspost** (t.ex. tjänst
   `agent-readonly-prod-dsn`), läst med `security find-generic-password -s
   agent-readonly-prod-dsn -w`, pipat direkt in i skriptets anslutnings-DSN,
   aldrig i klartext på kommandoraden eller i loggar.
4. **Lös DSN/hook-frågan explicit, inte tyst** — utöka
   `.prod-ref-policy.conf` med en NY, namngiven och LOGGAD läsväg (mirror
   av den befintliga skriv-bypassen) i stället för att förlita sig på att
   keychain-hämtningen råkar missa substrängs-matchningen. Det här är den
   enda punkten i denna rekommendation som rör den befintliga
   `deny-prod-ref.sh`-mekaniken — allt annat är nytt, additivt (en ny roll,
   en ny nyckelringspost, ett nytt skript).
5. **Under tiden — eller om migrationen bedöms för dyr just nu — använd
   smoke-konto-vägen (§ 6) för `inbetalningar`/`kvitton`/`jobb`/`jobb_rad`.**
   Den kräver noll nytt bygge och är redan bevisad i prod 2026-08-29. Den
   täcker bara inte `activity_log`, och bär den mänskliga
   session-hanteringens extra rörliga delar (§ 6 (b)).
6. **Skriv INTE ett skript som förlitar sig på `default_transaction_read_only`
   eller en statement-regex som den enda spärren.** Båda är värdefulla
   extra lager (§ 5), men om GRANT-lagret (steg 1) inte finns på plats är
   "read-only" ett löfte, inte en garanti — exakt den skillnad Marcus fråga
   efterfrågar.

---

## Källförteckning

1. [Postgres Roles | Supabase Docs](https://supabase.com/docs/guides/database/postgres/roles) — läst 2026-09-03
2. [Predefined Roles | PostgreSQL Documentation](https://www.postgresql.org/docs/current/predefined-roles.html) — läst 2026-09-03 (`pg_read_all_data` bypassar inte RLS)
3. [Exclude any mutating tools when in read_only mode · Issue #112 · `supabase/mcp`](https://github.com/supabase-community/supabase-mcp/issues/112) — maintainer-citat `gregnr`, 2025-07-19, läst 2026-09-03
4. [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — läst 2026-09-03
5. [Server Configuration — default_transaction_read_only | PostgreSQL Documentation](https://www.postgresql.org/docs/current/runtime-config-client.html) — läst 2026-09-03
6. [SET TRANSACTION | PostgreSQL Documentation](https://www.postgresql.org/docs/current/sql-set-transaction.html) — läst 2026-09-03
7. [Connect to your database | Supabase Docs](https://supabase.com/docs/guides/database/connecting-to-postgres) — läst 2026-09-03
8. [Unable to use a readonly user · Discussion #34455 · `supabase`](https://github.com/orgs/supabase/discussions/34455) — läst 2026-09-03
9. WebSearch-syntes av community-exempel på pooler-anslutning med anpassad roll (`<roll>.<project_ref>`), läst 2026-09-03 — sekundärkälla, ingen enskild primär URL att peka på för själva formatet utöver källa 7/8
10. [Connect AI Agents to Supabase: A Safe Setup Guide — QueryBear](https://querybear.com/blog/connect-ai-agents-to-supabase) — läst 2026-09-03 (tredjepart, ej förstaparts, men konvergerar oberoende med källa 1–4)
11. [Read Replicas | Supabase Docs](https://supabase.com/docs/guides/platform/read-replicas) — läst 2026-09-03
12. [`supabase db query` | Supabase CLI Reference](https://supabase.com/docs/reference/cli/supabase-db-query) — läst 2026-09-03 (bekräftat sparsam dokumentation)
13. Se källa 3.
14. [Access Control | Supabase Docs](https://supabase.com/docs/guides/platform/access-control) — läst 2026-09-03 (`supabase_read_only_user`, `pg_read_all_data`, Team/Enterprise-krav)
15. `@modelcontextprotocol/servers` (arkiverat), `src/postgres`-referensservern, README läst via WebFetch 2026-09-03 (`"All queries are executed within a READ ONLY transaction"`)
16. [Feature Preview: Temporary token-based database access · Changelog](https://supabase.com/changelog/46346-feature-preview-temporary-token-based-database-access) — publicerat 2026-05-25, läst 2026-09-03; se även [Temporary access | Supabase Docs](https://supabase.com/docs/guides/platform/temporary-access) och [Discussion #46346](https://github.com/orgs/supabase/discussions/46346)
17. [psql | PostgreSQL Documentation](https://www.postgresql.org/docs/current/app-psql.html) — läst 2026-09-03 (`ON_ERROR_STOP`, ingen read-only-flagga)
18. Live hämtad OpenAPI-spec, `https://api.supabase.com/api/v1-json`, hämtad 2026-09-03 (`/v1/projects/{ref}/database/query`, `V1RunQueryBody`-schema, `x-oauth-scope: database:write`)
19. `orgs/supabase/discussions/34325`, "MCP read only?" — läst 2026-09-03 (obesvarad, men förklarar symptomet via källa 15)
20. `supabase/postgres` Issue #11, "Set up readonly role" — läst 2026-09-03 (community-precedent, gruppnroll + LOGIN-roll-mönstret)

**Interna källor (repo):** `scripts/deny-prod-ref.sh`, `.prod-ref-policy.conf`,
`docs/reference/atkomst-och-nycklar.md`, `docs/decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md`,
`supabase/migrations/20260830195728_betalningsdomanen_inbetalningar_kvitton.sql`,
`supabase/migrations/20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql`,
`supabase/migrations/20260811211759_create_activity_log.sql`,
`supabase/migrations/20260812143131_grant_service_role_activity_log.sql`,
`tasks/sessions/2026-08-29-session-113.md` (Del 11, Del 16, Paushistorik).
