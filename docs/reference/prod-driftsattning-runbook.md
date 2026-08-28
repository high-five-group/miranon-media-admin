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
läs kortet innan du väljer.

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
