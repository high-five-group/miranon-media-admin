# Prod-driftsättning av aktivitetsloggen — runbook

> Syfte: ta aktivitetsloggen (`TASK-201`) från `main` till **prod**, Lottas
> skarpa miljö med verklig persondata, utan att komponera stegen i stunden.
> Varje steg bär kommandot verbatim, den förväntade utdatan, kvittot på att
> steget lyckades, och vad man gör när det inte gjorde det.
>
> **Vem kör denna: Marcus.** `TASK-201.9` är `ready-for-human` och mekaniskt
> låst för agenter — `scripts/deny-prod-ref.sh` (`TASK-203`) nekar varje
> agent-Bash-kommando som bär prod-projektets referens. Marcus beslut A
> 2026-08-12, ordagrant ur `TASK-201.9`-kortets notes: *"prod-driftsättning
> mot verklig persondata är ett Marcus-beslut, och en spärr som rutinmässigt
> kringgås just där den betyder mest är ingen spärr."*
>
> Syskondokument: [`staging-verifiering-runbook.md`](staging-verifiering-runbook.md)
> (samma genre, annan miljö) · [`prototyp-verifiering-runbook.md`](prototyp-verifiering-runbook.md).
> Appliceringsvägens mekanik (varför inget databas-lösenord behövs, vad
> `link` faktiskt gör): [`supabase/migrations/README.md`](../../supabase/migrations/README.md).

## Var kommandona körs — och varför det avgör om de fungerar

**Kör allt i din egen terminal, utanför Claude Code.** Prod-ref-låset är en
`PreToolUse`-hook: den ser bara Claude Codes egna Bash-anrop. Ett kommando du
skriver själv når den aldrig. Det är den strukturella vägen, och den kräver
ingen bypass (`scripts/deny-prod-ref.sh` § MEDVETEN VÄG FÖRBI).

Ber du en agent köra ett prod-kommando åt dig faller det på låset med en
svensk deny-text som pekar hit. Det är korrekt beteende, inte ett fel att
felsöka.

**Arbetskatalog:** en ren utcheckning av `main` i huvudrepot
(`~/Repon/miranon-media-admin`), inte en agent-worktree. `link`-tillståndet
skrivs till `supabase/.temp/project-ref` och är **per arbetskatalog** — en
worktree har sitt eget, och de vet inget om varandra.

## Projekt-referenserna

| Miljö | Projektnamn | Ref | Roll här |
|---|---|---|---|
| Staging | `miranon-media-admin-staging` | `pqtshyierkdgwdnxuirz` | Redan driftsatt 2026-08-12, källan till stegen nedan |
| **Prod** | `miranon-media-admin` | `lvjsfnphlauldxqlncpl` | **Målet för denna runbook** |

Uppmätt 2026-08-13 via `npm run atkomst:diagnos` (som kör
`npx supabase projects list`): båda `ACTIVE_HEALTHY`, båda Postgres 17,
region `eu-west-1`. Prod-projektet skapades 2026-03-30, staging 2026-06-13.

## Steg 0 — Förkrav: bevisa åtkomsten, be aldrig om en du redan har

**Regeln som gör detta steg kort:** mät ÅTKOMSTEN, aldrig omgivningen. Att en
miljövariabel saknas, att `~/.supabase/` ser tom ut eller att ett kommando
hänger är inte bevis för att en åtkomst saknas — samtliga tre lästes fel en
gång och kostade en hel arbetsdag (`TASK-201.11`, stängd som falsifierad).
Registret: [`atkomst-och-nycklar.md`](atkomst-och-nycklar.md).

Ett kommando avgör hela förkravslistan:

```bash
npm run atkomst:diagnos
```

**Förväntad utdata** (verifierad körning 2026-08-13, exit 0 — skriptet är ett
diagnosverktyg och returnerar alltid 0, så läs RADERNA, aldrig exitkoden):

```text
=== Nyckelringsposter (existens, aldrig värden) ===
  Supabase CLI: FINNS
  gh:github.com: FINNS
  ...
=== npx supabase projects list (bounded, 20s) ===
  OK — svarade inom tidsbudgeten:
    {"projects":[{...,"name":"miranon-media-admin-staging",...},
                 {...,"name":"miranon-media-admin",...}],"message":""}
```

**Steget lyckades när:** `Supabase CLI: FINNS` **och** listan innehåller båda
projekten. Då är Management API-inloggningen giltig, och inget
`SUPABASE_ACCESS_TOKEN`, inget databas-lösenord och ingen ny nyckel behövs
för något steg i denna runbook.

**Om det inte lyckades:**

| Symptom | Vad det betyder | Åtgärd |
|---|---|---|
| `Supabase CLI: SAKNAS` | CLI:t har aldrig loggat in på denna maskin | `supabase login` en gång, interaktivt |
| `projects list` tomt eller `LegacyInvalidAccessTokenError` | Inloggningen finns men är ogiltig | `supabase login` igen |
| Kommandot **hänger** | En hängning är inte ett felmeddelande | Kör om med styrd stdin (`echo "" \| ...`) innan orsaken antas |

Utöver diagnosen behövs tre saker som inte är åtkomster:

1. **`main` utcheckad och ren.** `git fetch origin && git status --short` —
   tomt, och `git log --oneline -1` == `origin/main`.
2. **Prod-appens anon-nyckel**, för RLS-probena i steg 3. Den ligger redan i
   repots gitignorerade `.env.production` (`VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY`) — ingen ny nyckel ska skapas.
3. **En inloggad prod-användare i browsern** (Lotta eller du själv), för
   AC #3 och AC #4.

### Steg 0.1 — Den enda blockeraren som kräver en landning först

**De två Edge Functions står INTE i prod-allowlisten.** Uppmätt 2026-08-13:

```bash
bash scripts/deploy-prod-functions.sh --list
```

```text
Deploy-set (33):
  [prod]        compute-segment
  ...
Exkluderade (6) — deployas ALDRIG till prod:
  [EXKLUDERAD]  get-activity-log
  [EXKLUDERAD]  log-activity
  [EXKLUDERAD]  test-attachments-storage
  [EXKLUDERAD]  test-auth
  [EXKLUDERAD]  test-invite-completion
  [EXKLUDERAD]  test-pdf-generation
```

Allowlisten är fail-closed med avsikt: allt som inte står i
[`.prod-functions-allowlist.conf`](../../.prod-functions-allowlist.conf) når
aldrig prod, så en framtida `test-*`-bakdörr inte slinker igenom för att
någon glömde blocklista den. Konsekvensen här är att **AC #2 inte kan
uppfyllas förrän två rader landat**:

```text
# Aktivitetsloggen (TASK-201.9, <datum>, Marcus GO "<citat>"):
get-activity-log
log-activity
```

Formen — kommentarsblock med datum och GO-citat före de nya raderna — är
filens egen konvention sedan app-paritetsutvidgningen 2026-08-11.

**Detta är ett medvetet tillägg, inte en formalitet.** Raden i conf-filens
huvud säger det rakt ut: *"Ny prod-funktion = lägg MEDVETET till en rad
här."* Landa ändringen som en egen liten PR före driftsättningen, och kör
`--list` igen efteråt: deploy-setet ska då vara **35** och de exkluderade
**4** (enbart `test-*`).

## Ordningen — och varför den är just denna

| # | Steg | AC | Varför här |
|---|---|---|---|
| 1 | Länka mot prod | — | Allt nedan riktas av länken; fel länk = fel miljö |
| 2 | Applicera migrationerna | #1 | Tabellen måste finnas innan någon EF skriver till den |
| 3 | RLS- och GRANT-bevis mot levande prod | #1 | Exit 0 från push är inte bevis för åtkomstläget |
| 4 | Deploya de två Edge Functions | #2 | Skriv- och läsvägen |
| 5 | Deny-triple per funktion | #2 | Bevisar att grindarna håller innan datavägen rörs |
| 6 | Front-deployen verifierad utrullad | #3 | **Preliminärt** — se stegets egen not |
| 7 | Rök-test med en riktig åtgärd | #4 | Hela kedjan i drift, en gång, på riktigt |
| 8 | Länka tillbaka till staging | — | Annars går nästa staging-operation mot prod |

**Migrationsordningen inuti steg 2 är inte utbytbar.**
`20260811211759_create_activity_log.sql` skapar tabellen;
`20260812143131_grant_service_role_activity_log.sql` ger `service_role` sitt
`select, insert`-grant på **den tabellen**. Kör den andra utan den första och
den faller på att relationen inte finns. `supabase db push` applicerar i
filnamnens tidsstämpelordning och håller alltså ordningen av sig självt — men
beroendet är verkligt och värt att känna till när något går snett halvvägs
(§ Rullbakåt R1).

Att grant-migrationen behövs alls är ett mätt fynd, inte en försiktighetsåtgärd:
`service_role` bär `rolbypassrls = true`, men BYPASSRLS hoppar bara över
RLS-**policy**-evaluering. Postgres kräver ändå ett vanligt SQL-GRANT, och det
nya projektets schema-default-privileges gav aldrig SELECT/INSERT. Utan andra
migrationen svarar prod `403 permission denied for table activity_log` på varje
skrivning från `log-activity` (`TASK-201.2`, verifierat live mot staging
2026-08-12).

## Steg 1 — Länka mot prod

```bash
cd ~/Repon/miranon-media-admin
cat supabase/.temp/project-ref          # vad är du länkad mot NU?
echo "" | npx supabase link --project-ref lvjsfnphlauldxqlncpl
cat supabase/.temp/project-ref          # och vad är du länkad mot nu?
```

**Förväntad utdata:**

```json
{"project_ref":"lvjsfnphlauldxqlncpl","message":""}
```

följt av att `cat` skriver `lvjsfnphlauldxqlncpl`.

**Varför `echo "" |`:** utan styrd stdin frågar `link` efter
databas-LÖSENORDET och blockerar. Det är en prompt, inte ett inloggningsflöde
— och den feltolkningen kostade en arbetsdag en gång (`TASK-201.11`). Ett
tomt svar räcker: `link` behöver bara projekt-referensen för att skriva
`supabase/.temp/project-ref`. Schema-operationerna går via Management API,
inte via en direkt `postgres://`-anslutning, så inget lösenord behövs i något
steg i denna runbook.

**Steget lyckades när:** `cat supabase/.temp/project-ref` skriver
prod-referensen. Läs den raden varje gång — den är hela skillnaden mellan att
skriva till Lottas data och till staging.

**Om det inte lyckades:** `link` kan skriva ett rent fel
(`LegacyInvalidAccessTokenError`) — då är inloggningen ogiltig, gå tillbaka
till steg 0. Hänger det trots `echo "" |`, avbryt och kör om; en hängning har
inte sagt varför den hänger.

## Steg 2 — Applicera migrationerna (AC #1, halva ett)

```bash
npx supabase migration list
npx supabase db push
npx supabase migration list
```

**Förväntad utdata.** Första `migration list` visar båda versionerna som
lokala utan remote-motsvarighet. `db push` skriver en rad per applicerad fil:

```text
Applying migration 20260811211759_create_activity_log.sql...
Applying migration 20260812143131_grant_service_role_activity_log.sql...
```

Andra `migration list` visar `local === remote` för **båda** versionerna.

**Steget lyckades när:** den andra `migration list` parar ihop
`20260811211759` och `20260812143131` på båda sidor. Bekräfta att tabellen
verkligen finns i miljön, aldrig ur exit 0:

```bash
npx supabase inspect db table-stats --linked
```

`public.activity_log` ska förekomma med sina två index
(`activity_log_occurred_at_idx`, `activity_log_request_id_idx`).

**Om det inte lyckades:** se § Rullbakåt R1. Applicera aldrig om blint —
`migration list` säger exakt vilken av de två som gick igenom.

## Steg 3 — RLS- och GRANT-beviset mot levande prod (AC #1, halva två)

Samma bevisform som staging (`TASK-201.2`), anpassad till att tabellen inte
har någon Edge Function framför sig: anropen går direkt mot PostgREST.

```bash
set -a; source .env.production; set +a
PROD_URL="$VITE_SUPABASE_URL"
ANON="$VITE_SUPABASE_ANON_KEY"

# anon läsning
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  "$PROD_URL/rest/v1/activity_log?select=id&limit=1"

# anon skrivning
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Content-Type: application/json' \
  -d '{"id":"00000000-0000-0000-0000-000000000001"}' \
  "$PROD_URL/rest/v1/activity_log"
```

**Förväntad utdata:** `401` på båda. Med en giltig **användar**-JWT i stället
för anon-nyckeln blir samma två anrop `403` — PostgREST skiljer "ingen
identitet" (401) från "identitet utan rättighet" (403), medan Postgres-felkoden
är `42501` i alla fyra fallen. Det är exakt det mönster som mättes mot staging
2026-08-12.

**Steget lyckades när:** samtliga fyra utfall nekas. Ett `200` eller `201`
någonstans här betyder att tabellen är öppen och att driftsättningen ska
stoppas omedelbart (§ Rullbakåt R1).

**Om du vill bevisa den tredje halvan** — att `service_role` KAN skriva men
inte uppdatera eller radera — kräver det en engångshämtad `service_role`-nyckel.
**Hoppa över den här.** Skälen: (a) `npx supabase projects api-keys` skrev en
`service_role`-nyckel i klartext i ett transkript 2026-08-12 och är sedan dess
förbjudet för agenter, (b) skrivvägen bevisas ändå i steg 7 genom `log-activity`,
som använder den runtime-injicerade nyckeln, och (c) en probe-rad skriven av
`service_role` kan inte städas av `service_role` — grantet saknar DELETE med
avsikt, och raden hade blivit permanent i Lottas logg. Behöver du ändå städa
något i prod går det via `postgres`-rollen:

```bash
npx supabase db query --linked "delete from public.activity_log where id = '<uuid>'"
```

## Steg 4 — Deploya de två Edge Functions (AC #2, halva ett)

Förkrav: steg 0.1 landad, `--list` visar de två i deploy-setet.

Kontrollera först att projektets secrets finns (namn, aldrig värden):

```bash
npx supabase secrets list --project-ref lvjsfnphlauldxqlncpl
```

`CORS_ALLOWED_ORIGINS` måste finnas och innehålla prod-appens origin —
funktionerna läser den via `_shared/cors.ts` och avvisar annars varje
webbläsaranrop i preflight. `SUPABASE_URL`, `SUPABASE_ANON_KEY` och
`SUPABASE_SERVICE_ROLE_KEY` injiceras av plattformen och står inte i listan.

Deploya sedan. **Två former, och valet är ditt:**

```bash
# A — smal: bara de två nya funktionerna
npx supabase functions deploy log-activity --project-ref lvjsfnphlauldxqlncpl
npx supabase functions deploy get-activity-log --project-ref lvjsfnphlauldxqlncpl

# B — kanonisk: hela allowlisten (35 funktioner efter steg 0.1)
bash scripts/deploy-prod-functions.sh --project-ref lvjsfnphlauldxqlncpl
```

**A rekommenderas för denna driftsättning.** Den rör exakt det skivan handlar
om. B bumpar versionen på 33 orörda funktioner också; versionsbump utan
innehållsändring är i sig harmlöst (`T39` §2 mätte tre rena no-op-redeploys),
men varje funktion vars disk-kod hunnit drifta från prod ändras då i samma
andetag, utan att någon tittat på diffen. Det är en bredare ändring i Lottas
skarpa miljö än `TASK-201.9` ber om.

Skriptet bär två egenskaper A saknar, och båda är värda att känna till:
det deployar aldrig något oallowlistat, och det gör aldrig ett namnlöst
`supabase functions deploy` (vilket hade skickat *alla* funktioner, inklusive
`test-*`). Väljer du A: skriv alltid ut funktionsnamnet, aldrig en naken
deploy.

**Förväntad utdata** per funktion (samma form som staging-deployen i
`TASK-196`, verbatim ur kortets notes):

```json
{"project_ref":"lvjsfnphlauldxqlncpl","functions":["log-activity"],"message":"Deployed Functions."}
```

**Steget lyckades när:**

```bash
npx supabase functions list --project-ref lvjsfnphlauldxqlncpl
```

visar båda funktionerna som `ACTIVE` med färsk `updated_at`, och `test-auth`
fortfarande saknas.

**Om det inte lyckades:** en deploy som faller lämnar den tidigare versionen
orörd — funktionen som inte fanns finns fortfarande inte, och en befintlig
funktion står kvar på sin gamla version. Läs felet, rätta, deploya om. Kom
ihåg `ADR-050`: det finns ingen deploy-automatik, varken i CI eller någon
annanstans, och ingen sådan väg ska byggas runt skriptet utan ett eget beslut.
Verifierat 2026-08-13 att detta fortfarande gäller — `ADR-050` rad 31, och
inget CI-workflow refererar `supabase functions deploy`.

## Steg 5 — Deny-triple per funktion (AC #2, halva två)

Formen är repots etablerade EF-smoke (`T39` §6, körd mot 13 prod-funktioner
2026-07-24): **anon → 401 · fel metod → 401 · anon-Bearer → 401**. Den kräver
ingen användare och rör aldrig datavägen.

**Rättat (S105, 2026-08-14):** raden ovan sa tidigare `fel metod → 405`. Det
höll inte. `verify_jwt = true` för båda funktionerna
(`supabase/config.toml:209-210` + `:219-220`) gör att Supabase-gatewayen
svarar 401 på VARJE anrop utan giltig JWT — FÖRE funktionskoden körs. De tre
curl-anropen nedan saknar `Authorization`-header, så samtliga träffar
gatewayen, aldrig koden. Källpåståendet om kodordningen står kvar och
stämmer fortfarande: båda funktionerna prövar metoden FÖRE autentiseringen
(källverifierat: `log-activity/index.ts:88`, `get-activity-log/index.ts:156`)
— men "405 före auth" gäller bara ANROPARE SOM NÅR KODEN, och en anropare
utan giltig JWT kommer aldrig dit, oavsett metod. Discriminatorn är ett
giltigt JWT som faller SENARE, i `requireUser` — anon-nyckeln (se
[[L570]]).

```bash
FN="$PROD_URL/functions/v1"

# log-activity (POST är rätt metod)
curl -s -o /dev/null -w 'anon      %{http_code}\n' -X POST "$FN/log-activity"
curl -s -o /dev/null -w 'fel metod %{http_code}\n' -X GET  "$FN/log-activity"
curl -s -o /dev/null -w 'anon-bear %{http_code}\n' -X POST \
  -H "Authorization: Bearer $ANON" "$FN/log-activity"

# get-activity-log (GET är rätt metod)
curl -s -o /dev/null -w 'anon      %{http_code}\n' -X GET  "$FN/get-activity-log"
curl -s -o /dev/null -w 'fel metod %{http_code}\n' -X POST "$FN/get-activity-log"
curl -s -o /dev/null -w 'anon-bear %{http_code}\n' -X GET \
  -H "Authorization: Bearer $ANON" "$FN/get-activity-log"
```

**Förväntad utdata:** `401 · 401 · 401` för vardera funktionen.

**Steget lyckades när:** alla sex utfallen stämmer. `requireUser` returnerar
401 vid saknad header, fel headerformat, tom token, ogiltig eller utgången
JWT, och även när token är en anon-nyckel (`_shared/auth.ts` rad 30–37, som
räknar upp precis dessa fem fall) — samt (för `fel metod`-raderna) gatewayens
egen 401 innan `requireUser` någonsin anropas.

**Om något utfall avviker:** stoppa kedjan. En `200` betyder att en obehörig
kan skriva till eller läsa Lottas aktivitetslogg. Rulla tillbaka funktionen
per § Rullbakåt R2 innan något annat görs. En `404` betyder att deployen inte
gick igenom — tillbaka till steg 4.

**VALFRI fjärde probe — metodvakten, observerad utifrån.** De tre
obligatoriska proberna ovan kan aldrig visa "405 före auth" utifrån, eftersom
gatewayen alltid stoppar en JWT-lös anropare tidigare. För den som vill se
metod-vakten faktiskt köra: kombinera FEL metod med anon-nyckeln som
`Authorization`-header. Anon-nyckeln är ett giltigt SIGNERAT JWT — den
passerar gatewayen — men representerar ingen användare och faller i
`requireUser`. Kombinationen passerar alltså gatewayen och når funktionens
metod-vakt FÖRE `requireUser`:

```bash
curl -s -o /dev/null -w 'fel metod + anon-bear %{http_code}\n' -X GET \
  -H "Authorization: Bearer $ANON" "$FN/log-activity"
curl -s -o /dev/null -w 'fel metod + anon-bear %{http_code}\n' -X POST \
  -H "Authorization: Bearer $ANON" "$FN/get-activity-log"
```

**Förväntad utdata:** `405` för vardera funktionen. Detta är EN ENDA VÄG att
observera "405 före auth" mot en levande prod-gateway — och den kräver just
denna icke-uppenbara kombination (fel metod OCH ett giltigt-men-icke-
användar-JWT), inte bara "fel metod". Bifynd (TASK-38-kortet rad 37): ingen
av de tretton allowlistade EF:erna emitterar en `Allow`-header på sitt
405-svar (RFC 9110 kräver den) — förvänta dig INTE `Allow: POST`/`Allow: GET`
i svaret, bara statuskoden. Proben är diagnostisk, inte blockerande: ett
avvikande utfall här (t.ex. `401` i stället för `405`) är en regression i
metod-vaktens PLACERING (se TASK-38) och bör felsökas, men stoppar inte
driftsättningen på egen hand — de sex obligatoriska proberna ovan äger den
bedömningen.

## Steg 6 — Front-deployen verifierad utrullad (AC #3)

> **DETTA STEG ÄR PRELIMINÄRT.** `TASK-199` (priority high, öppen) utreder
> exakt denna fråga och tar fram ett verifikations-kommando för den.
> **När utredningen landat: kör det kommandot, och ersätt formerna nedan med
> det.** Hitta inte på ett fjärde sätt — konkurrerar din egen mätning med
> `TASK-199`:s, är det `TASK-199` som gäller.

Varför steget alls är svårt, och varför det är AC:ns svagaste länk:
`TASK-199` mätte att prod-fronten stod **stale ≥20 timmar** trots grön
Vercel-git-integration — `admin.miranon.dev` servade en bundle utan en route
som landat på `main` dagen innan, efter ~15 mellanliggande merges. Ingen
signal skilde det läget från ett friskt. Kortet noterar dessutom PWA-lagret:
service worker-precachen kan hålla en gammal bundle hos klienten även efter en
lyckad deploy.

**Interimsform tills `TASK-199` levererat**, tre delar som var för sig är
otillräckliga:

1. **Vercel-deployen mot `main`.** Öppna projektets deploy-lista och bekräfta
   att den senaste **Production**-deployen bär samma commit-SHA som
   `git rev-parse origin/main`. Detta är samma avläsning `TASK-199` gjorde när
   avvikelsen upptäcktes.
2. **Bundle-identiteten före och efter.** `TASK-199`:s egen metod: hämta
   `admin.miranon.dev`, läs ut `index-*.js`-namnet, hämta den och sök efter en
   sträng som bara den nya koden bär. Kortet använde route-registrets
   `event/$eventId/atgarder`; motsvarigheten här är route-posten
   `aktivitetshistorik`. **Obelagd risk:** vid kodsplittring kan strängen ligga
   i en lat-laddad chunk i stället för huvudbundeln — går sökningen tom betyder
   det alltså inte med säkerhet att deployen är stale. Låt `TASK-199` avgöra
   den frågan, gissa den inte.
3. **Klientens egen cache.** Öppna appen i en färsk browserkontext, eller kör
   DevTools → Application → Storage → **Clear site data**. Det avregistrerar
   service workern och tömmer precachen. Ingen passiv självläkning finns —
   inte ens en 404 på `/sw.js` avregistrerar en aktiv worker
   ([`staging-verifiering-runbook.md`](staging-verifiering-runbook.md) § fälla 5).

**Steget lyckades när:** `/mer/aktivitetshistorik` renderar i prod-appen efter
inloggning, och hem-vyn visar spalten "Senaste aktivitet" på en skärm bredare
än `xl`. Både vyn och spalten är landade på `main`
(`7b7a2d44` respektive `d72e9c90`, båda verifierade som ancestors till
`origin/main` 2026-08-13).

**Om det inte lyckades:** § Rullbakåt R3.

## Steg 7 — Rök-test: en riktig åtgärd → posten i historiken (AC #4)

Sista steget, och det enda som bevisar hela kedjan klient → EF → tabell →
läsväg i drift.

**Välj en mailfri åtgärd.** Flera instrumenterade mutationer skickar mail
(`skickade bekräftelsemail`, `skickade betalningspåminnelse`,
`skickade deltagarinformation`, `skickade kvitto`). Den lämpligaste här är
**att skriva en anteckning** — verbet `antecknade`, ingen utgående post, och
raden går att ta bort i Airtable efteråt om du vill.

1. Logga in i prod-appen som Lotta eller du själv.
2. Öppna en person eller ett event och skriv en kort anteckning.
3. Gå till `/mer/aktivitetshistorik`.
4. Ladda om hem-vyn.

**Förväntad utdata:** posten ligger överst i historikvyns lista, med rätt
aktörsnamn, rätt verbtext (`antecknade`) och en tidsstämpel på sekunden, och
samma post står i hem-spalten "Senaste aktivitet". Aktörsnamnet härleds
server-side ur JWT:ns `user_metadata.display_name` — ett klientburet namn
skrivs över, så visar raden fel namn är det profilen som är fel, inte loggen.

**Steget lyckades när:** posten syns i båda vyerna. Vill du korsverifiera mot
databasen:

```bash
npx supabase db query --linked \
  "select actor_name, verb_display, object_name, occurred_at
     from public.activity_log order by occurred_at desc limit 5"
```

**Om posten uteblir:** skrivvägen är avsiktligt tyst mot användaren — en
misslyckad loggning fäller aldrig mutationen den följer (`TASK-201.3` byggde
det negativa testet för just det). Felsök i den ordningen:

| Kontroll | Kommando eller plats | Vad ett fel betyder |
|---|---|---|
| Nådde anropet EF:en? | Nätverksfliken, `POST /functions/v1/log-activity` | 404 → deployen saknas (steg 4); CORS-fel → `CORS_ALLOWED_ORIGINS` saknar prod-origin |
| Svarade EF:en 403? | Samma anrop | Grant-migrationen gick inte igenom (steg 2) |
| Skrevs raden? | `db query` ovan | Rad finns men syns inte i vyn → läsvägen, inte skrivvägen |
| Är fronten färsk? | Steg 6 | En stale bundle anropar en äldre kodväg |

**Känt tomt filter, inte ett fel:** `get-activity-log`s `eventId`-filter matchar
`context.extensions[…/eventId]`, en nyckel skrivvägen ännu inte emitterar
(`TASK-201.12`, öppen). Filtret returnerar därför en tom lista mot riktiga
rader. Mekaniken är bevisad mot seedad data i staging; ände-till-ände är den
inte. Filtrera inte på event i rök-testet.

## Steg 8 — Länka tillbaka till staging

**Hoppa inte över detta.** `link`-tillståndet är sticky och osynligt: nästa
`db push`, `db query --linked` eller `inspect` i samma katalog går mot det
projekt du senast länkade. Huvudkatalogen stod länkad mot staging före denna
runbook (uppmätt 2026-08-13: `supabase/.temp/project-ref` innehöll
staging-referensen) — återställ det läget.

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz
cat supabase/.temp/project-ref
```

**Steget lyckades när:** `cat` skriver `pqtshyierkdgwdnxuirz`.

## Steg 9 — Bocka av kortet

Kort ändras endast via backlog-CLI:t:

```bash
npx backlog task edit 201.9 --check-ac 1 --check-ac 2 --check-ac 3 --check-ac 4
```

Skriv in de faktiskt uppmätta värdena i kortets notes — HTTP-koderna från steg
3 och 5, funktionsversionerna från steg 4, commit-SHA:n från steg 6, och
tidsstämpeln på rök-testets post. "Klart" är inte ett mätvärde.

## Rullbakåt

Prod bär verklig persondata. Varje väg nedan är formulerad så att den kan
köras utan att något annat än aktivitetsloggens egna objekt rörs.

### R1 — Migrationen gick fel halvvägs

`migration list` säger vilken av de två som applicerades. Tre lägen:

| Läge | Vad som finns i prod | Väg framåt |
|---|---|---|
| Ingen applicerad | Inget | Rätta felet, kör `db push` igen. Ingen städning behövs |
| Bara tabellmigrationen | Tabellen utan `service_role`-grant | Kör `db push` igen — den andra filen är idempotent i praktiken (`grant` på ett redan givet privilegium är en no-op) |
| Båda, men något är fel | Tabellen + grant | Se nedan |

**Att riva tabellen är säkert så länge steg 7 inte körts** — inget annat objekt
i schemat refererar den, och den är per definition tom före rök-testet:

```bash
npx supabase db query --linked "drop table if exists public.activity_log"
npx supabase migration repair --status reverted 20260812143131 --linked
npx supabase migration repair --status reverted 20260811211759 --linked
```

Indexen försvinner med tabellen. `migration repair` uppdaterar
historiktabellen så att en senare `db push` applicerar om filerna i stället
för att hoppa över dem.

**Efter steg 7 är rivningen inte längre neutral:** tabellen bär då minst en
verklig rad, och loggen är append-only med avsikt (PRD `TASK-201`: "ingen
radering"). Stanna och besluta medvetet i stället för att riva reflexmässigt.

**`supabase migration down --linked --last N` finns**, men är oprövad mot vårt
prod-projekt och betydligt trubbigare — den återställer de N senaste
migrationerna, inte de två namngivna. Använd den inte här.

### R2 — En Edge Function deployades trasig

Det finns ingen rollback-till-föregående-version i Supabase CLI (verifierat
2026-08-13: `functions` har `list`, `delete`, `download`, `deploy`, `new`,
`serve` — inget mer). Två vägar, i denna ordning:

**Deploya om den kända goda koden.** Deployen sker från arbetsträdets
filer — checka därför ut den version du vill ha, deploya, och återställ
trädet direkt efteråt så inget halvtillstånd blir kvar:

```bash
git checkout <känd-god-sha> -- supabase/functions/<namn>
npx supabase functions deploy <namn> --project-ref lvjsfnphlauldxqlncpl
git checkout HEAD -- supabase/functions/<namn>
```

**Ta bort funktionen helt.** Eftersom båda är nya i prod är detta en ren
återgång till läget före driftsättningen — appen förlorar aktivitetsloggen
och behåller allt annat:

```bash
npx supabase functions delete log-activity --project-ref lvjsfnphlauldxqlncpl
npx supabase functions list --project-ref lvjsfnphlauldxqlncpl
```

Samma kommandoform användes för `test-auth`-raderingen i prod 2026-07-24
(`T39` §7). Verifiera alltid med `list` efteråt.

**Vad du behöver veta först: vad ligger faktiskt i prod?** Den deployade
artefakten är sanningen, inte den pushade källan:

```bash
npx supabase functions download <namn> --project-ref lvjsfnphlauldxqlncpl
```

Ladda ner till en scratch-katalog, aldrig in i arbetsträdet.

### R3 — Fronten är fel eller stale

Fronten deployas av Vercels git-integration, inte av något kommando i denna
runbook — den kan därför inte "rullas tillbaka" härifrån. Tre vägar, i
stigande ingrepp:

1. **Klientlokalt läge**: `Clear site data` i browsern. Löser en stale
   precache, aldrig en stale deploy.
2. **Vercel-dashboarden**: promota en tidigare Production-deploy. Detta rör
   bara fronten; migrationen och funktionerna står kvar.
3. **Revert på `main`**: en revert-PR genom merge-kön triggar en ny deploy.
   Långsammast, och den enda som ändrar sanningen i git.

`TASK-199` är öppen just för att väg 2 och 3 saknar dokumenterad kontroll —
läs kortet innan du väljer. Väg 2:s fulla kommandosekvens (och den bieffekt
som gör den farligare än den ser ut: en tillbakarullning stänger av
automatisk tilldelning av produktionsdomänen tills man aktivt slår på den
igen) finns nu i § [Rollback av frontenden (Vercel)](#rollback-av-frontenden-vercel)
längre ned i denna fil.

### R4 — Allt ska tillbaka till läget före

I ordning, motsatt driftsättningen: R3 (fronten) → R2 (radera båda
funktionerna) → R1 (riv tabellen och reparera historiken) → steg 8 (länka
tillbaka till staging). Sista steget glöms lättast och kostar mest senare.

## Fällor

Var och en kostade tid när aktivitetsloggen togs till staging 2026-08-12, eller
när prod-EF-synken kördes 2026-07-24.

| # | Symptom | Rotorsak | Skyddsräcke |
|---|---|---|---|
| 1 | `supabase link` hänger utan utskrift | Det är prompten för databas-LÖSENORDET, inte ett inloggningsflöde. Lästes en gång som "CLI:t saknar autentisering" och stängde en hel arbetsdag (`TASK-201.11`) | `echo "" \|` före kommandot. **En hängning är inte ett felmeddelande** |
| 2 | Tom `~/.supabase/` läses som "ingen inloggning" | Supabase CLI lagrar tokenen i macOS-nyckelringen (posten `Supabase CLI`, skapad 2026-03-30). `~/.supabase/access-token` är bara reservplatsen när nyckelringen saknas. Den tomma katalogen var **bevis för rätt lagring** | `npm run atkomst:diagnos`. Mät åtkomsten, aldrig omgivningen |
| 3 | `service_role` får 403 trots `BYPASSRLS` | BYPASSRLS hoppar över RLS-policyer, inte SQL-GRANT. Nya tabellens default-privileges gav aldrig SELECT/INSERT | Grant-migrationen `20260812143131`. Ordningen efter tabellmigrationen är verklig |
| 4 | Kommandot gick mot fel projekt | `link`-tillståndet är per arbetskatalog, sticky och osynligt. Huvudkatalogen stod länkad mot staging före denna runbook | `cat supabase/.temp/project-ref` före varje skarp operation, och steg 8 efteråt |
| 5 | Deployen når aldrig prod | `log-activity` och `get-activity-log` står inte i prod-allowlisten — fail-closed med avsikt | Steg 0.1. `--list` före och efter |
| 6 | `scripts/deploy-prod-functions.sh` beter sig annorlunda än dina andra kommandon | Skriptet anropar **bar** `supabase` (den globalt installerade binären, uppmätt v2.75.0 2026-08-13) medan runbookens övriga kommandon använder `npx supabase` (v2.114.0, hämtas vid körning — CLI:t är inte pinnat i `package.json`). Två versioner på samma maskin | Kör `supabase --version` och `npx supabase --version` före steg 4 om något beter sig oväntat. Inloggning och link-tillstånd delas; kommandoytan kan skilja |
| 7 | Prod-fronten servar gammal kod trots grön git-integration | Oförklarat, mätt ≥20 h stale över ~15 merges. Plus PWA-precachen på klientsidan | `TASK-199` (öppen). Steg 6 är preliminärt tills den landat |
| 8 | En agent nekas mitt i driftsättningen | Prod-ref-låset ser Claude Codes Bash-anrop. Det är avsiktligt | Kör i din egen terminal. Låt aldrig en agent konstruera bypass-prefixet |
| 9 | Rök-testet väljs till en åtgärd som skickar mail | Fyra instrumenterade verb skickar utgående post | Välj `antecknade`. Sessionen bär dessutom ett mekaniskt mailstopp |

## Rollback av frontenden (Vercel)

> **Detta avsnitt är FRISTÅENDE från aktivitetsloggens driftsättning ovan.**
> Det beskriver hur man rullar tillbaka HELA APPEN (fronten, det Lotta ser i
> webbläsaren) till en tidigare version om en ny version visar sig trasig —
> oavsett vilken skiva som orsakade det. Ursprung: `TASK-199` (öppen sedan
> 2026-08-11, se kortets egen historik för utredningen av deploy-vägen) och
> granskningsfyndet N9
> (`docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md`
> § N9, byggt som `TASK-450.7`).
>
> ⚠ **VÄGEN ÄR OÖVAD HOS OSS.** Kommandona nedan är verifierade mot
> leverantörens (Vercels) egen dokumentation 2026-09-18, men har ALDRIG
> körts skarpt i det här projektet. Kör inte detta för första gången mitt i
> en verklig incident om det går att undvika — öva det EN gång i en lugn
> stund, mot en känd god version, INNAN det behövs på riktigt. Marcus
> beslutar när övningen sker; den ingår inte i denna skiva.
>
> **Övningens utfall** (fylls i av Marcus efter första övningen):
>
> - Datum:
> - Vad som hände:
> - Avvikelser mot stegen nedan:

### Ord du behöver innan du börjar

- **Tillbakarullning ("rollback")** — att peka webbadressen Lotta använder
  tillbaka till en TIDIGARE version av appen som redan fungerade, i stället
  för att hasta fram en ny fix. Det går på sekunder, inte minuter, eftersom
  ingenting byggs om — Vercel (företaget som driftsätter fronten åt oss,
  se [ADR-091](../decisions/ADR-091-hosting-deploy-vercel-pro.md)) pekar
  bara om vilken redan färdig version som visas.
- **Deployment ("bygge")** — en version av appen som byggts färdig och kan
  visas. Varje gång kod landar på `main` skapar Vercel ett nytt bygge.
- **Produktionsdomän** — webbadressen Lotta faktiskt använder,
  `admin.miranon.dev`. Skild från en "preview"-adress, som bara en
  utvecklare ser innan något släpps skarpt.
- **Automatisk tilldelning ("auto-assignment") av produktionsdomänen** —
  normalläget vi har i dag: varje gång en ändring landar på `main` bygger
  Vercel den och pekar automatiskt om `admin.miranon.dev` till det nya
  bygget, utan att någon människa gör något. **En tillbakarullning stänger
  av just detta** tills man aktivt slår på det igen — se steg FR9 nedan,
  som är skälet till att detta avsnitt skrivs.

### Vem kör detta, och var

Samma princip som resten av denna runbook: **Marcus, i sin egen terminal**,
inte en agent. Vercel-CLI:t är redan inloggat på denna maskin
(`npx vercel whoami` svarar `marcus-2914` — se
[`atkomst-och-nycklar.md`](atkomst-och-nycklar.md)), och repot är redan
länkat mot rätt projekt (`miranon-media-admin`, team
`marcus-johanssons-projects-1d6d2a3a`). Kommandona nedan skrivs `npx vercel …`
för att matcha resten av repots dokumentation — Vercels egen dokumentation
kallar samma binär bara `vercel`.

### Åttastegssekvensen (destillat ur Vercels egen incident-guide)

Källa för samtliga åtta steg och kommandon nedan:
[vercel.com/docs/deployments/rollback-production-deployment](https://vercel.com/docs/deployments/rollback-production-deployment)
(hämtad 2026-09-18) — sidans eget "Quick reference"-block numrerar exakt
åtta steg, med binärsöket som en del av steg 6 och "promota direkt" som ett
alternativ inom steg 8, precis som nedan.

#### FR1 — Bekräfta att produktionen faktiskt är trasig

```bash
npx vercel logs --environment production --status-code 5xx --since 30m
```

**Vad du gör:** ber Vercel om produktionens senaste serverfel.
**Vad du ska se:** en lista med nyliga fel (HTTP 5xx betyder att servern
kraschade — inte att en användare skrev fel i ett formulär).
**Om du ser något annat** (listan är tom): produktionen är sannolikt inte
trasig på det sätt du trodde. Leta vidare innan du rullar tillbaka något —
en tillbakarullning löser inget som inte satt i frontend-bygget.

#### FR2 — Rulla tillbaka omedelbart

```bash
npx vercel rollback <tidigare-deployment-url-eller-id>
npx vercel rollback status
```

**Vad du gör:** anger webbadressen eller ID:t för den TIDIGARE, kända goda
versionen (hittas i Vercel-dashboardens deploy-lista, filtrerad på `main`),
och pekar produktionen om till den.
**Vad du ska se:** `rollback status` bekräftar att bytet gick igenom. Bytet
sker på sekunder — inget byggs om. Källa, ordagrant: *"This points
production traffic to the deployment you specify without rebuilding"*
([vercel.com/docs/deployments/rollback-production-deployment](https://vercel.com/docs/deployments/rollback-production-deployment),
hämtad 2026-09-18).
**Om du ser något annat** (ett felmeddelande i stället för en bekräftelse):
läs meddelandet — vanligast är ett felaktigt deployment-ID. Rätta och
försök igen innan du går vidare till nästa steg.

**Vår plan tillåter tillbakarullning till VILKEN SOM HELST tidigare
produktionsversion, inte bara den senaste.** Källa, ordagrant: *"For teams
on a Pro or Enterprise plan, all deployments previously aliased to a
production domain are eligible to roll back."* Hobby-planen tillåter bara
den OMEDELBART föregående ([vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback),
hämtad 2026-09-18). Vi är på Vercel Pro
([ADR-091](../decisions/ADR-091-hosting-deploy-vercel-pro.md)), så den
fria formen gäller.

#### FR3 — Verifiera att tjänsten är återställd

```bash
npx vercel logs --environment production --status-code 5xx --since 5m
```

**Vad du gör:** kontrollerar felloggen igen, nu efter tillbakarullningen.
**Vad du ska se:** färre eller inga nya 5xx-fel jämfört med FR1.
**Om du ser något annat** (felen fortsätter): tillbakarullningen löste inte
problemet — felet sitter sannolikt någon annanstans (Supabase, Airtable),
inte i frontend-versionen. Fortsätt ändå till FR9 innan du gör något annat:
produktionen står nu i rullat-tillbaka-läge oavsett orsak, och det läget
måste hanteras medvetet.

#### FR4 — Hitta VILKEN version som orsakade felet

```bash
npx vercel list --prod
npx vercel inspect <trasig-deployment-url>
```

**Vad du gör:** listar tidigare produktionsversioner och läser ut vilken
git-commit den trasiga byggdes från.
**Vad du ska se:** en lista med tidsstämplar och commits; `inspect` visar
commit-SHA, gren och byggtid för den trasiga versionen.
**Om du ser något annat** (listan saknar den trasiga versionen): den kan ha
rullats bort ur den korta listan — lägg till `--meta` eller bläddra i
Vercel-dashboardens deploy-lista i stället.

#### FR5 — Läs byggloggen för den trasiga versionen

```bash
npx vercel inspect <trasig-deployment-url> --logs
```

**Vad du gör:** läser vad som hände UNDER bygget, inte bara vad som
händer när appen körs.
**Vad du letar efter:** varningar eller fel som inte stoppade bygget men
ändå påverkar hur appen beter sig (t.ex. en miljövariabel som saknades).

#### FR6 — Jämför felloggar mellan den goda och den trasiga versionen

```bash
npx vercel logs --deployment <trasig-id> --level error --expand
npx vercel logs --deployment <god-id> --level error --expand
```

**Vad du gör:** hämtar detaljerade felloggar för båda versionerna, sida vid
sida.
**Vad du letar efter:** skillnaden i feltyper mellan de två avslöjar vad som
faktiskt gick sönder.

**Rör felet flera versioner, inte bara den senaste** (flera landningar
mellan den goda och den trasiga): binärsök i stället för att gissa.

```bash
npx vercel bisect --good <god-url> --bad <trasig-url>
```

**Vad du gör:** Vercel går igenom versionerna en i taget och frågar dig om
var och en är god eller trasig, tills den hittar exakt den som introducerade
felet.

#### FR7 — Fixa lokalt och testa som förhandsvisning

```bash
npx vercel deploy
npx vercel curl /den-paverkade-sidan --deployment <forhandsvisnings-url>
```

**Vad du gör:** kodar fixen lokalt och släpper den som en FÖRHANDSVISNING
(en adress bara du ser) innan den går till produktion.
**Vad du ska se:** den drabbade sidan fungerar mot förhandsvisningen.
**Om du ser något annat** (samma fel kvarstår): fixa vidare — släpp aldrig
en förhandsvisning som fortfarande visar felet till produktion.

#### FR8 — Släpp fixen till produktion

Två vägar, beroende på om du har en ny fix att släppa eller bara vill peka
tillbaka till en känd god version:

```bash
# A — en ny fix finns, från FR7:s förhandsvisning
npx vercel deploy --prod

# B — ingen ny kod behövs, peka bara tillbaka till en version som redan finns
npx vercel promote <deployment-url>
npx vercel promote status
```

**Vad du gör:** släpper den fixade koden till produktion (A), eller pekar
produktionen till en version som redan är byggd och känd god (B) — t.ex.
om felet berodde på en extern tjänst och inte på appens egen kod.
**Vad du ska se:** väg B bekräftas av `promote status`. Båda vägarna är
formellt EXPLICITA produktionstilldelningar, och väg B är dokumenterat
liktydigt med dashboardens knapp "Undo Rollback" (se FR9). Källa, ordagrant:
*"This promotes the specified deployment to production and re-enables
auto-assignment of production domains."*
([vercel.com/docs/cli/rollback](https://vercel.com/docs/cli/rollback),
hämtad 2026-09-18).
**Om du ser något annat** (ett fel vid promote/deploy): läs meddelandet,
rätta, försök igen. Gå INTE vidare till FR9 förrän ett av de två lyckats —
produktionen står annars kvar i rullat-tillbaka-läge.

### FR9 (VÅRT EGET TILLÄGG) — Kontrollera att automatisk tilldelning är PÅ igen

**Detta steg finns INTE i Vercels egen guide.** Det är skälet till att
detta avsnitt skrivs: utan det kan man tro sig ha "löst" incidenten i FR8
och gå vidare med jobbet, medan produktionen i verkligheten fortfarande
står frånkopplad från `main` — huvudgrenen fortsätter se grön ut i CI,
kollegor fortsätter landa kod som ser ut att gå live, medan Lotta i tysthet
står kvar på en gammal version tills någon råkar märka det.

**Vad du gör:** öppnar projektets översiktssida i Vercel-dashboarden.
**Vad du ska se:** så länge produktionen står i "rullad tillbaka"-läge
visar produktions-rutan en knapp med texten **"Undo Rollback"**. Ser du den
knappen är automatisk tilldelning FORTFARANDE AVSTÄNGD — oavsett vad du
gjort i terminalen innan dess.
**Om du ser den knappen** (den är alltså PÅSLAGEN-avstängd): slå på
tilldelningen igen på ett av två sätt:

- **I dashboarden:** klicka **"Undo Rollback"** på produktions-rutan, välj
  vilken version som ska promotas, klicka **"Confirm"**.
- **I terminalen:** `npx vercel promote <deployment-url>` (FR8, väg B).

**Steget är klart när:** knappen "Undo Rollback" INTE längre visas på
produktions-rutan. Gör därefter en sista kontroll som inte går via
dashboarden, som EGENTLIGEN bevisar att kopplingen är tillbaka: landa en
trivial, ofarlig ändring på `main` (eller vänta in nästa naturliga
landning) och bekräfta att `admin.miranon.dev` faktiskt byter version av
sig själv, utan att någon kör ett kommando. Bara det visar att `main` och
produktionen verkligen är hopkopplade igen — inte bara att en knapp
försvann.

Källa, ordagrant: *"After a rollback, Vercel turns off auto-assignment of
production domains. This means new pushes to your production branch won't
go live automatically. To restore normal deployment behavior, you need to
undo the rollback by promoting a different deployment."*
([vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback)
§ "Undo a rollback", hämtad 2026-09-18).

### Vårt andra tillägg — funktionsflaggan följer med bakåt

**`VITE_FEATURE_BETALNINGAR` bakas in i appen VID BYGGET, inte vid
körning.** Den definieras i `src/env.ts:63` och läses genom
`betalningarPa()` i `src/lib/funktionsflaggor.ts:74`
(`env.VITE_FEATURE_BETALNINGAR === 'pa'`). Byggverktyget Vite skriver in
värdet i den färdiga appens kod redan när den byggs (`runtimeEnv:
import.meta.env` i `src/env.ts:65`, Vites standardmekanik för
byggtidsvariabler) — det finns ingen efterhandsomkoppling i en redan
byggd, körande app.

**Praktisk konsekvens för en tillbakarullning:** rullar du tillbaka till en
version av appen som byggdes INNAN flaggan hade sitt NUVARANDE värde i
Vercels projektinställningar, får du TILLBAKA det gamla flaggvärdet — inte
det som gäller idag. En tillbakarullning ändrar alltså inte bara vilken
KOD som körs, utan i förlängningen även vilka FUNKTIONER som är på eller
av, om flaggan hunnit ändras mellan de två versionerna.

Det här är inte en gissning om Vercels beteende — det följer direkt av att
miljövariabler över huvud taget inte rör sig vid en tillbakarullning.
Källa, ordagrant: *"Vercel won't update environment variables if you change
them in the project settings and will roll back to a previous build"* samt
*"There are no change in Environment Variables, and they will remain in
their original state"*
([vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback),
hämtad 2026-09-18). Den gamla byggen behåller alltså sitt eget, redan
inbakade flaggvärde — miljövariabeln i projektinställningarna må vara
ändrad sedan dess, men den gamla byggen läste den aldrig på nytt, eftersom
den aldrig byggs om av en tillbakarullning.

### En bieffekt till, för fullständighetens skull

**Schemalagda jobb ("cron jobs") återställs till den tillbakarullade
versionens tillstånd.** Källa, ordagrant: *"If the project uses cron jobs,
they will be reverted to the state of the rolled back deployment."*
([vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback),
hämtad 2026-09-18). Har ett schemalagt jobb lagts till eller tagits bort
mellan de två versionerna försvinner eller återkommer det vid
tillbakarullningen. Vi har (2026-09-18) inga Vercel-cron-jobb konfigurerade
för detta projekt — posten är bokförd i förväg, inte en känd risk just nu.

### Kvarstående osäkerhet — inte verifierad, öppet bokförd

Vercels dokumentation säger EXPLICIT att `npx vercel promote` (FR8 väg B)
återställer automatisk tilldelning (citatet i FR8/FR9 ovan). Den säger INTE
lika explicit att en vanlig `npx vercel deploy --prod` (FR8 väg A) gör
detsamma — den ÄR en ny, uttrycklig produktionstilldelning, så det är
rimligt att anta att effekten är densamma, men ingen mening i
dokumentationen (läst i sin helhet 2026-09-18) säger det rakt ut. Lita
därför alltid på FR9:s KONTROLL (om knappen "Undo Rollback" är borta),
aldrig på antagandet att FR8 väg A räckte på egen hand.

#### Källor för detta avsnitt (samtliga hämtade 2026-09-18)

- [vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback)
  — bieffekten (auto-tilldelning stängs av), miljövariabler, cron-jobb,
  plan-skillnader.
- [vercel.com/docs/cli/rollback](https://vercel.com/docs/cli/rollback) —
  `vercel rollback`/`vercel rollback status`-syntax, promote-citatet.
- [vercel.com/docs/deployments/rollback-production-deployment](https://vercel.com/docs/deployments/rollback-production-deployment)
  — hela åttastegssekvensen, verbatim "points production traffic"-citatet.
- [vercel.com/docs/cli/promote](https://vercel.com/docs/cli/promote) —
  `vercel promote`/`vercel promote status`-syntax.
- `src/env.ts:63,65` och `src/lib/funktionsflaggor.ts:74` (denna kodbas,
  läst 2026-09-18) — att `VITE_FEATURE_BETALNINGAR` är en byggtidsflagga.

## Vad denna runbook medvetet inte täcker

- **`TASK-201.10` (QA)** — den manuella testplanen i browsern är ett eget kort
  och ett eget moment.
- **Prod-deploy av `finalize-attachment-upload`-fixen** (`TASK-196`, landad som
  kod, staging-verifierad). Samma prod-väg, annan skiva — bokförd på det kortet.
- **Nyckelmigreringen** (`TASK-204`) — legacy `service_role`/`anon`-nycklarna
  kan inte längre roteras, vilket gör migreringen till golv snarare än
  förbättring. Eget pass, medvetet efter denna driftsättning.
- **Allt mail.** Inga utskicksvägar aktiveras, inga `send-*`-funktioner
  smoke-körs.
- **Den skarpa övningen av frontend-rollbacken** (§ Rollback av frontenden
  ovan) — `TASK-450.7`/N9 kräver bara att vägen är DOKUMENTERAD och
  verifierad mot leverantörens dokumentation. Att köra den en gång, skarpt,
  mot en känd god version är Marcus eget beslut om NÄR, inte en del av
  denna skiva.

## Relaterat

- [`supabase/migrations/README.md`](../../supabase/migrations/README.md) —
  appliceringsvägen, GRANT-fyndet, `db query --linked`-mönstret.
- [`atkomst-och-nycklar.md`](atkomst-och-nycklar.md) — åtkomstregistret och
  bevis-kommandona; `npm run atkomst:diagnos`.
- [`staging-verifiering-runbook.md`](staging-verifiering-runbook.md) — sex
  fällor i browser-verifiering, inklusive service worker-precachen (fälla 5)
  och localStorage-cachen (fälla 6).
- [`t39-ef-sync-preflight-2026-07-24.md`](../research/t39-ef-sync-preflight-2026-07-24.md)
  — deny-triplens form och den förra prod-EF-synken, med dess avbrottsregel.
- [`ADR-050`](../decisions/ADR-050-isolerad-staging-miljo.md) — isolerad
  staging-miljö; ingen deploy-automatik för Edge Functions.
- [`ADR-110`](../decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
  · [`ADR-111`](../decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md)
  — lagringsvalet och korrelations-ID:t.
- `scripts/deploy-prod-functions.sh` +
  [`.prod-functions-allowlist.conf`](../../.prod-functions-allowlist.conf) —
  fail-closed deploy-grinden.
- `scripts/deny-prod-ref.sh` + `.prod-ref-policy.conf` — prod-ref-låset och
  dess dokumenterade väg förbi.
- [`ADR-091`](../decisions/ADR-091-hosting-deploy-vercel-pro.md) — valet av
  Vercel Pro för frontend-hosting, plan-skillnaderna § Rollback av
  frontenden bygger på.
- `TASK-199` (`npm run bl -- task 199 --plain`) — den fulla utredningen av
  frontend-deploy-vägen (stale bundles, service worker-precache, Skew
  Protection) som § Rollback av frontenden ovan är ett svar på en del av.
- `docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md`
  § N9, och underlagets
  [`kg2-externa-fakta-och-rattelser.md`](../research/ci-djupgranskning-2026-09-17/underlag/kg2-externa-fakta-och-rattelser.md)
  § A2 — granskningsfyndet och den ursprungliga leverantörsverifieringen
  denna skiva (`TASK-450.7`) byggde vidare på och verifierade på nytt
  2026-09-18.
