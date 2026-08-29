# ADR-124: Förhandsgranskningens leveransväg — transient utkast i Storage, signerad URL

- **Status:** Accepted (beslutat av orkestreraren på Marcus uttryckliga
  mandat, S108 resume 7, 2026-08-22: *"Va senior här Claude och led detta
  arbete framåt. Du har mandat att besluta ingången här."* — efter att
  kontraktskonflikten i § Kontext lagts fram som STOPP. Marcus muntliga GO
  för riktningen fanns redan från Del 10: *"Vi kör på din rekommendation"*.)
- **Datum:** 2026-08-22
- **Fas:** Dokument-, bilage- och mallspåret (S108, `ADR-119`-vägen)
- **Rör:** `supabase/functions/_shared/utkast.ts` (ny) ·
  `supabase/functions/test-docraptor-render/index.ts` ·
  `supabase/functions/preview-receipt/index.ts` ·
  `supabase/functions/generate-event-attachment/index.ts` ·
  `supabase/functions/_shared/send-receipt.ts` (`TASK-302.3`, `cleanupDraft`) ·
  `supabase/functions/send-receipt-email/index.ts` (`TASK-302.3`) ·
  `supabase/functions/test-attachments-storage/index.ts` (`TASK-302.3`,
  `list_prefix`/`remove_paths`) ·
  `src/data/mutations/dokumentKalla.ts` ·
  `src/data/mutations/useForhandsgranskaBilaga.ts` ·
  `src/domain/schemas/Attachment.schema.ts` (`DocumentPreviewSchema`) ·
  `.purge-staging-policy.json` · `TASK-302` (PRD + skivor `302.1`–`302.3`)
- **Relation till tidigare beslut:** bygger på
  [`ADR-119`](ADR-119-pdf-renderingsvagen-extern-motor-per-event.md) (PDF:en
  renderas av en extern HTML/CSS-motor; beslut 7:s minimaltest-disciplin är
  exakt den som fällde två hypoteser här). **Amenderar `TASK-146.5`:s AC #3**
  (förhandsvisningens sidoeffektsfrihet) öppet — ordalydelsen i § Beslut 3
  ersätter den gamla i båda EF-filhuvudena. Supersederar inget.
  Respekterar [`ADR-055`](ADR-055-datakalla-atkomst-router-context-di.md)/
  [`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md): klienten når
  Storage enbart via adaptern och den signerade URL:en, aldrig direkt.

## Kontext

**Problemet är mätt, inte antaget.** Marcus A/B i riktig Chrome 151 (headed;
headless Chromium saknar PDF-visare — S108 Del 10 § A): samma 174 KB-PDF
scrollar **perfekt** när den serveras som `http://` av en statisk server,
och **laggigt** som `blob:` — dagens leveransväg för klass B/C i
`dokumentKalla.ts` § `blobUrlFranBase64` och för prototypens
förhandsgranskning. Två oberoende agent-pass friade innehållet
(`docs/research/pdf-scrollprestanda-pdfium-chrome-2026-08-22.md`: bilderna
41 %, texten 27 %, vattenstämpeln 20 %, QR-koderna 1,9 % av
renderingskostnaden — och kostnaden är densamma oavsett leveransväg).

**Klientvägarna föll i sex armar** (resume 7, scratchpad-riggen
`sw-range-rigg/`, mätt mekaniskt headed och bedömd av Marcus):

| Arm | Leverans | Marcus dom |
|---|---|---|
| A | `http://` direkt från statisk server (utan Range-stöd) | **perfekt** |
| B | Service Worker ur Cache API, 206/Range-kapabel | lika dålig som C |
| C | `blob:` (dagens väg) | laggig |
| D | SW-passthrough av ett nätverkssvar | dålig |
| E | B + `noopener` | dålig |
| F | C + `noopener` | *"näst bäst"* — lindring, inte lösning |

Tre slutsatser bär beslutet. **Range-stöd är inte förklaringen** — arm A:s
server saknar det helt. **Det som skiljer är vem som serverar:** svar från
Chromes nätverkstjänst scrollar jämnt; svar som passerar renderer-/blob-/SW-
piping gör det inte (mekaniken är bara halvt belagd —
`docs/research/pdf-forhandsgranskning-leveransvag-blob-vs-url-2026-08-22.md`
§ 1–2 — men utfallet är entydigt). **Alltså är ingen klientlösning möjlig;**
PDF:en måste ligga bakom en riktig URL.

**Kontraktet som står i vägen.** `generate-event-attachment/index.ts` rad
58–68 (AC #3, `TASK-146.5`) och `preview-receipt/index.ts` rad 10–30 säger
att förhandsvisningen *"rör VARKEN Storage-uppladdningen … eller
Bilagor-radskapelsen … noll sidoeffekter, inte 'sidoeffekter som sedan
städas'"*. Premissen bakom den formuleringen var att bytes till klienten
räcker för att visa dokumentet. Den premissen är falsifierad ovan. Handoffen
från paus 6 tolkade avsikten som "inga Bilagor-rader, inget kvittonummer" —
källtexten förkastar uttryckligen den tolkningen, vilket var STOPP-punkten
vid resume 7.

**Servervägarna, mot förstapartskällor**
(`docs/research/pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22.md`):
transient Storage-objekt + signerad URL är den enda kandidaten vars förkrav
redan är mätt i vår miljö (staging: `HEAD 200 accept-ranges=bytes
content-type=application/pdf`, `RANGE 206`, Del 10 § C). DocRaptors hosted
documents ger en *"publicly-accessible"* URL *"[that] doesn't require
authentication"* — persondata på en publik extern URL, `T171`-klassen — och
är ett separat betalt tillägg. En Edge Function som GET-svarar har ett
motstridigt källäge om Kong-omskrivning av `application/pdf`, kräver en egen
token-mekanism utan precedent, och dess mellanlagrings-variant kollapsar till
Storage eftersom EF-isolater är tillståndslösa. Vercel-projektet är ren SPA.

## Beslut

### 1. Förhandsgranskningen levereras som en signerad Storage-URL — samma mönster som klass A

Alla tre dokumentklasser får sin visnings-URL från Storage. Klass A har den
redan (`get-attachment-download-url`, `SIGNED_DOWNLOAD_URL_TTL_SECONDS =
300`). Klass B/C (och prototypens DocRaptor-väg) skriver ett transient utkast
och returnerar `{ url, utgar }` i stället för `{ pdfBase64 }`. Klienten
bygger aldrig mer en `blob:` för ett dokument — `blobUrlFranBase64` rivs i
`302.2`. Ingen ny TTL, ingen ny bucket, ingen ny konstant.

### 2. Utkastet är bundet per konstruktion — inte städat av en klocka

Sökvägen är `utkast/<eventId>/<typ>.pdf` i bucket `bilagor`, `typ` ∈
`bilaga` | `kvitto` | `deltagarinformation`, skriven med `upsert: true`.
Därmed finns högst **ett** utkast per event och dokumenttyp: mängden växer
med antalet events, inte med antalet förhandsgranskningar. Skarp generering
eller sändning för ett event tar bort `utkast/<eventId>/` (utkastet är
ersatt). Staging-CI:s setup-purge får en target för prefixet. Ingen
`pg_cron`, ingen `waitUntil`-städning — en klocka hade lagt till en mekanism
utan nuvarande användare (dubbelriktad över-engineering-vakt) för en mängd
som redan är bunden.

### 3. AC #3 amenderas öppet — ordalydelsen är fastlagd här

Den nya formuleringen, som skrivs VERBATIM i båda EF-filhuvudena (`302.2`)
och ersätter den gamla:

> Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen
> Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett
> TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor` —
> aldrig listat i appen, överskrivet per event och typ (`upsert`), borttaget
> vid skarp generering — för att Chromes PDF-visare bara scrollar jämnt på en
> URL serverad av nätverkstjänsten (ADR-124).

Det gamla resonemanget om kvittonummer och Resend står kvar; det är
fortfarande sant. Det som ändras är ETT led: Storage-bytes räknas inte längre
som den sidoeffekt AC #3 skyddar mot, eftersom skyddets syfte — att Lotta
aldrig ser en artefakt hon inte bett om och att inget räknas — hålls intakt.

### 4. Utkast-URL:en ligger aldrig under appens origin

Den signerade URL:en är cross-origin (Supabase Storage). Det är inte en
tillfällighet: appens Service Worker (`src/sw.ts`) bär en `NavigationRoute`
som serverar `index.html` för varje navigering under appens origin, och arm
B/D visar att en SW-förmedlad leverans laggar även när den är korrekt. En
framtida "snyggare" URL under appens domän skulle återskapa exakt det
uppmätta felet.

### 5. Acceptansen är Marcus scroll, inte ett mekaniskt bevis

Riggen bevisade att SW-vägen öppnar *identiskt* med http-vägen — och Marcus
hand fällde den ändå. `302.1` är därför enhetens grind: prototypen byts
först, Marcus bedömer scrollen mot `http://`-referensen, och först då rörs
de skarpa EF:erna (`302.2`). Faller grinden är hypotesen att Storage-URL:en
beter sig som arm A falsifierad, och enheten går tillbaka till Marcus.

## Öppet, och medvetet inte beslutat här

- **Tidsstyrd städning i prod.** Mängden är bunden (beslut 2), men ett event
  som aldrig får en skarp bilaga behåller sitt utkast. Bokförs som känd rest;
  byggs när en mätning visar att det kostar något.
- **Persondata i kvitto-utkastet.** Köparuppgifter ligger i privat bucket
  bakom en 300-sekunders signerad URL, högst ett per event. Exponeringsklassen
  bokförs i `T171` (`302.3`); om `T171` landar i en striktare policy följer
  utkastet den.
- **`generate-event-attachment` ritar fortfarande med pdf-lib.** Bytet till
  DocRaptor-vägen är promoveringens sak, inte denna ADR:s.

## Alternativ som förkastades

**Service Worker-route med `workbox-range-requests`.** Bevarar AC #3:s
bokstav och rör ingen server — rangordnad etta av research-passet. Prövad
med minimaltest innan något byggdes (`ADR-119` beslut 7-disciplinen):
mekaniskt identisk med http-vägen, men Marcus scroll lika dålig som blob.
Falsifierad.

**`noopener` på blob-URL:en.** Arm F, *"näst bäst"*. En enradsfix som lindrar
men inte når referensen. Förkastad som lösning; står kvar som fallback om
`window.open` blockeras.

**DocRaptor hosted documents.** Uppfyller AC #3:s bokstav till hundra
procent — och lägger persondata på en publik, oautentiserad extern URL.
Förkastad på `T171`-grund, inte på kostnad.

**Edge Function som GET-svarar `application/pdf`.** Odokumenterat om Kong
skriver om typen, egen token-mekanism utan precedent, och en ~10 sekunders
tom flik under rendering — UX:et Marcus redan avvisat (Del 10 § E).

## Konsekvenser

- **Positivt:** förhandsgranskningen scrollar som en fil — det enda
  acceptanskriteriet; en leveransväg för alla tre klasser i stället för två;
  blob-URL:ernas "revokera aldrig"-minnesläcka (`dokumentKalla.ts` rad 30–35,
  en motivering som dessutom var falsifierad — en blob kan inte svara på
  byte-range-anrop) försvinner.
- **Kostnad:** en Storage-skrivning per förhandsgranskning; tre EF:er och
  adapter-kontraktet ändras; prod-deploy av två skarpa EF:er (Marcus moment,
  `scripts/fas4-prod-deploy.sh`); `.purge-staging-policy.json` får en target.
- **Risk:** att någon "förenklar" bort upsert-sökvägen till en per anrop —
  då växer mängden obundet och beslut 2 faller. Därför API-testet i `302.1`
  (andra anropet skapar inget nytt objekt).

## ADR-bar

Alla tre villkor håller: (1) svårt att återställa i koherens — ett
kontrakt i två EF-filhuvuden amenderas och klientens dokumentflöde byter
form; (2) överraskande utan kontext — *varför skriver en förhandsvisning
till Storage?* har ett svar bara den som sett sex-arms-mätningen känner;
(3) verklig avvägning — sidoeffektsfrihetens bokstav mot det enda
leveranssätt som fungerar.

## Updates

**2026-08-22 (`TASK-302.3`):** Beslut 2 (städning) landad. `rensaUtkast`
(`_shared/utkast.ts`) tar bort HELA `utkast/<eventId>/`-mappen — anropad
EFTER lyckad persistering i `generate-event-attachment/index.ts` (klass B)
och efter lyckad, finaliserad sändning i `_shared/send-receipt.ts` §
`sendReceipt` (klass C, steg 7). Best-effort i båda led (funktionens egen
try/catch OCH `sendReceipt`s egen fångst av ett kastat `cleanupDraft`-fel)
— live-bevisat mot staging: ett utkast existerar (HEAD 200) direkt efter
`preview: true`, och samma signerade URL slutar svara 200 direkt efter en
skarp generering för samma event (`tests/api/
generate-event-attachment.staging.test.ts` § "AC #1 (TASK-302.3)").

`.purge-staging-policy.json` fick en `storageTargets`-klass (`utkast-drafts`,
bucket `bilagor`, prefix `utkast`) — en NY target-typ utöver de Airtable-
baserade. Exekveringen går via två nya, JWT-gated actions på den befintliga
staging-only testharness-EF:en `test-attachments-storage`
(`list_prefix`/`remove_paths`, fail-closed till exakt namnrymderna
`ZZ-TEST-EVENT-`/`utkast`) — samma "ingen ny hemlighet, bara requireUser
som gateway"-mönster den EF:en redan etablerade för sin `cleanup`-action.
Live-verifierat: `npm run purge:staging` (lokalt, `.env.test` + `.env.seed`
källade) listade 6 verkliga utkast-objekt i staging, raderade det ENA som
passerat 60-minutersguarden, lämnade de fem färska orörda — en efterföljande
`--dry-run` bekräftade 5 kvar. CI:s `Staging sentinel purge`-jobb injicerade
vid denna skivas landning ENDAST `STAGING_AIRTABLE_TOKEN`
(`.github/workflows/ci-suite.yml`) — de fyra `TEST_*`-secrets storage-purgen
behöver var INTE trådade in i det jobbets `env:`-block av denna skiva
(medvetet: att utöka vilka secrets ett CI-jobb når vägdes som en egen,
separat avvägning — se skivans slutrapport). Mekanismen kördes alltså då
lokalt/på begäran, inte automatiskt i CI. **Rättat i `TASK-305`
(2026-08-23): tråden är dragen — se § Updates nedan.**

Beslut 3 (AC #3-formuleringen) landades redan i `TASK-302.2`.

Kvarstår, oförändrat av denna skiva: "Tidsstyrd städning i prod" (§ Öppet
ovan) — mängden är fortsatt bunden per event men inte tidsstyrd bortom
skarp-generering-triggern. Persondata-klassningen för kvitto-utkastet
specifikt är nu även bokförd i `T171` § "Adjacent, lägre allvarlighetsgrad".

**2026-08-23 (`TASK-305`):** Tråden ovan dragen. `purge`-jobbet
("Staging sentinel purge") i `.github/workflows/ci-suite.yml` fick de fyra
`TEST_*`-secreten (`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`,
`TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`) i sitt `env:`-block, namngivna
exakt som `STORAGE_PURGE_ENV_VARS` i `scripts/purge-staging-sentinels.mjs`
förväntar sig — ingen `secrets: inherit`, ingen ny `environment:`-gating.
Beslutet vilar på ett dedikerat research-pass
(`docs/research/ci-stadjobbets-credential-scope-2026-08-23.md`): de fyra
secreten flödar REDAN genom `test-staging`-jobbet i samma workflow-fil och
utövar redan JWT-gated Storage-operationer mot samma
`test-attachments-storage`-EF — TASK-305 lägger alltså INTE till en ny
credential-klass i workflow-filens attack-yta, den ger ett andra, redan
Airtable-separerat jobb tillgång till en klass som redan finns där
(ADR-053-triage: ingen ny riskklass). `storageTargets`-purgen (`utkast-drafts`)
exekverar därmed i CI också, inte bara lokalt/på begäran som ovan. Skarpt
CI-bevis (purge-loggen visar targeten exekverad, inte "hoppas över") är
öppet till nästa `post-merge`/`nightly`-körning efter landning — secrets kan
inte prövas lokalt.

**2026-08-23 (`TASK-308`):** Denna ADR:s § Beslut 1 (signerad Storage-URL)
förutsätter att bucketen `bilagor` FINNS i den miljö som läser den. Den
förutsättningen höll inte i prod: `preview-receipt` mätte skarpt en **502**
`sb-error-code: EDGE_FUNCTION_ERROR`, body `{"error":"Utkastet kunde inte
sparas: Bucket not found", ...}` 2026-08-23 12:25Z — appens och EF:ernas
första prod-användning av just denna leveransväg (`TASK-302`). Rotorsak:
`scripts/provision-attachments-bucket.mjs` (`TASK-146.3`) vägrar BY DESIGN
köra mot prod (`assertStagingOnly()`); ingen prod-provisionering av bucketen
fanns någonsin bokförd (BUILD-LOG, sessionsdok, kort: 0 träffar). Marcus
skapade bucketen för hand i Supabase-dashboarden samma dag, med samma
inställningar som skriptets `BUCKET_DESIRED_CONFIG` (privat, 25 MB,
`application/pdf`) — symptomet var borta, men provisioneringen var
odokumenterad och oupprepbar, exakt det skriptets egen fil-header varnar
för.

**Löst:** dashboarden bokförs som den KANONISKA prod-skrivvägen (ingen
skript-skrivväg mot prod byggd — samma doktrin som `fas4-prod-deploy.sh`/
`deploy-prod-functions.sh`: en agent provisionerar aldrig en resurs i prod).
`provision-attachments-bucket.mjs` fick ett nytt, read-only `--kontrollera
<ref>`-läge som accepterar prod-refen som ARGUMENT (samma lås-mönster som
`fas4-prod-deploy.sh`: refen måste anges explicit och matcha `SUPABASE_URL`)
— den enda avsiktliga vägen förbi `assertStagingOnly()`, och den skriver
ALDRIG (tvingar `dryRun` internt). `fas4-prod-deploy.sh --kontrollera`
kör nu samma kontroll automatiskt (ny fil `scripts/kontrollera-bilagor-
bucket.sh`, hämtar service-role-nyckeln engångs, aldrig på disk) och
`--deploya` VÄGRAR (fail-closed, `doden`) om bucketen inte konvergerar —
en Storage-beroende EF deployas inte längre mot en bucket som inte finns.
Testat mot STAGING skarpt (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` för
`pqtshyierkdgwdnxuirz`, ingen prod-ref inblandad): `--kontrollera
pqtshyierkdgwdnxuirz` rapporterade `✅ ... konvergerad`, exit 0.

**Öppet vid denna skivas landning:** prod-mätningen (att `bilagor` faktiskt
konvergerar mot `BUCKET_DESIRED_CONFIG` i PROD) kräver Marcus egen körning
— en agent kan inte rikta kommandon mot prod-Supabase-projektet
(`scripts/deny-prod-ref.sh`). Exakt kommando: se
[`docs/reference/atkomst-och-nycklar.md`](../reference/atkomst-och-nycklar.md)
§ "Prod-provisionering av externa Storage-resurser". Källa: `TASK-308`-kortets AC #1.

**2026-08-29 (`TASK-340.1`/`TASK-340.3`):** § Beslut 1, 2 och 4 amenderas
INTE — de håller oförändrade. `generate-event-attachment` KONSUMERAR nu
utkastet i stället för att bara producera det och kasta det bort:
preview-svaret bär `kallhash` (den `Källhash` EF:en redan räknade ut och
tidigare kastade i preview-grenen). Skapa skickar `kallhash` tillbaka;
servern räknar om dagens hash server-side och (a) vid likhet OCH ett
befintligt utkast **promoverar** — utkastets bytes kopieras till eventets
prefix med en Storage-kopiering INOM bucketen (`_shared/storage-kopiera.ts`,
rå REST `POST /storage/v1/object/copy` med header `x-upsert: true` —
`storage-js` sätter den ALDRIG, och `copy()` mot en redan existerande
destination ger annars 409), INGEN DocRaptor-rendering; (b) vid skillnad
renderas om och svaret bär `underlagAndrat: true`; (c) saknas utkastet
renderas tyst, aldrig ett fel. Klientens hash är ett PÅSTÅENDE som ALLTID
verifieras mot serverns egen omräkning — en felaktig hash ger aldrig
promovering av fel underlag, bara ett misslyckat försök som faller tillbaka
på rendering.

Skälet till att bära hashen i ANROPET/SVARET i stället för i Storage-
objektets metadata eller i objektnamnet
(`docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
§ 4): metadata syns inte i `list()` (öppen förstaparts-issue
`supabase/storage#759`) och kan inte uppdateras i efterhand, och namnet hade
brutit § Beslut 2:s `upsert`-invariant (högst ETT utkast per event och typ)
— hashen bärs alltså av anropet/svaret, aldrig av lagringen. Invarianten
består oförändrad.

**Varför promovera i stället för att lita på determinism:** DocRaptor
slumpar PDF:ens `/ID`-par i trailern per anrop och det går inte att styra —
mätt i `research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
§ 2.3, som samtidigt rättar en felaktig determinism-slutsats i
[`docraptor-minimaltest-2026-08-22.md`](../research/docraptor-minimaltest-2026-08-22.md)
(mätningen där var ett byte-ANTAL ur en header, inte en innehållsjämförelse).
Två renderingar av identiskt underlag ger alltså bevisligen OLIKA bytes —
den sparade filen ska vara BEVISLIGEN samma bytes Lotta granskade, inte bara
"samma innehåll".

§ Beslut 5 ("Marcus scroll, inte ett mekaniskt bevis") gäller helt
oförändrat och är den regel som styr mätmetoden för en framtida option C —
egen mätyta i `TASK-340.4`. Ingen ny avgörandeaxel tillkommer av denna
skiva.

**§ Beslut 3:s AC #3-text amenderas en tredje gång I SAK, men inte ännu i
denna ADR:s löptext.** Den nya lydelsen (två tillagda led: promovering vid
server-verifierad hash-likhet, och skälet "de bytes hon granskade") står
VERBATIM i `generate-event-attachment/index.ts`s filhuvud (`TASK-340.1`).
`preview-receipt/index.ts` bär fortsatt den ÄLDRE (andra amenderade)
lydelsen — dess utkast promoveras aldrig av kvittoflödet, så den nya
klausulen gäller inte den EF:en. Divergensen mellan EF-filhuvudet och detta
§ Beslut 3-blocks löptext är öppet bokförd här (ADR-083-klassen), inte
tyst: § Beslut 3 rättas till den tredje lydelsen när kvittoflödet (utanför
`TASK-340`s omfattning) ärver samma promoverings-mönster.
