# Åtkomst- och nyckelregister

> Syfte: EN plats som svarar på "har vi redan åtkomst till X?" och "varför kan
> agenten inte läsa filen jag lade i Y?" — innan frågan går till Marcus som en
> ny begäran om något som redan finns. Byggd efter att Marcus två gånger blivit
> ombedd att skapa åtkomster han redan hade (§ Bakgrund).

**REGEL — läs detta innan du deklarerar att en åtkomst saknas: kör
BEVIS-KOMMANDOT för den åtkomsten (tabellen nedan) innan du säger "vi saknar
X". Att mäta OMGIVNINGEN — miljövariabler, konfigkataloger, CI-workflow-filer
— är INTE att mäta ÅTKOMSTEN. Omgivningen kan vara tom av rätt skäl (nyckeln
lagras någon annanstans) lika gärna som fel skäl (nyckeln saknas).**

Detta dokument bär inga hemliga värden — bara namn, plats, klass och det
kommando som avgör frågan. Mekaniserad självdiagnos:
[`scripts/atkomst-diagnos.sh`](../../scripts/atkomst-diagnos.sh)
(`npm run atkomst:diagnos`).

## Bakgrund — varför registret finns (källmärkt)

Två separata rotorsaker låg bakom att Marcus fick frågan "får jag skapa X åt
dig?" om åtkomster som redan fanns, plus en återkommande "ibland kan agenten
läsa `~/Downloads`, ibland inte"-upplevelse. Källa för hela avsnittet:
uppdragstext till bygg-agenten, session S105, 2026-08-12 (orkestrerarens egna
mätningar samma dag) — verifierad av bygg-agenten där verifiering var möjlig,
se noter.

### Rotorsak 1 — omgivningen mättes, inte åtkomsten

En tidigare "token-utredning" (`tasks/sessions/archive/2026-08/2026-08-11-session-105.md`
Del 4, rad ~325–331) mätte fyra ytor — `printenv`, `~/.supabase/`,
CI-workflow-filer, `.env`-filnamn — och drog slutsatsen att
`SUPABASE_ACCESS_TOKEN` "saknas genuint". Slutsatsen var **fel**. Supabase
CLI hade en giltig inloggning i macOS nyckelring sedan **2026-03-30**
(verifierat av bygg-agenten 2026-08-12 via
`security dump-keychain`: tjänst `Supabase CLI`, konto `supabase`, `cdat`
[skapad-attribut] `20260330064650Z`).

Det starkaste beviset vändes upp och ner. Supabase egen CLI-dokumentation
([`supabase.com/docs/reference/cli/introduction`](https://supabase.com/docs/reference/cli/introduction),
läst av bygg-agenten 2026-08-12) säger ordagrant: *"Your access token is
stored securely in native credentials storage. If native credentials storage
is unavailable, it will be written to a plain text file at
`~/.supabase/access-token`."* En tom `~/.supabase/access-token` är alltså
bevis för att inloggningen ligger **rätt** (i nyckelringen), inte bevis för
att den saknas. Bygg-agenten verifierade 2026-08-12: `~/.supabase/` som
katalog finns (`telemetry.json` + `traces/`) men `~/.supabase/access-token`
saknas — konsekvent med att CLI:t använder nyckelringen, inte filen.

**Bevis-kommandot som borde ha körts:** `npx supabase projects list` — svarar
direkt (inget interaktivt inloggningsflöde) och listar båda projekten om
inloggningen är giltig. Bygg-agenten körde det 2026-08-12: båda projekten
listades (staging `pqtshyierkdgwdnxuirz`, prod `lvjsfnphlauldxqlncpl`), inget
`SUPABASE_ACCESS_TOKEN` eller lösenord behövdes.

**En hängning är inte ett felmeddelande — den andra bottnen i samma
rotorsak.** `TASK-201.2`:s Implementation Notes (verifierat ordagrant av
bygg-agenten mot `npx backlog task 201.2 --plain`, 2026-08-12) bokför:
*"`supabase link --project-ref pqtshyierkdgwdnxuirz` (staging) hängde
oändligt (interaktivt login-flöde utan TTY)"* — och drog slutsatsen att CLI:t
saknade autentisering. Fel igen: CLI:t var redan inloggat. Hängningen var
prompten för **databas-lösenordet**, som `supabase link` ställer och väntar
på stdin för, inte ett login-flöde. Kontrollprovet som såg ut att bekräfta
hypotesen (ett ogiltigt token gav snabbt svar) bekräftade den inte — ett
ogiltigt token får `link` att fela FÖRE lösenordsprompten, ett annat skäl än
det antagna. Orkestreraren körde om 2026-08-12 med styrd stdin:
`echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz` → svarade
omedelbart. **Regeln:** ett headless-kommando som hänger har inte sagt VARFÖR
det hänger — kör om med tom eller styrd stdin innan orsaken antas.

### Rotorsak 2 — hypotesen om TCC per VÄRDAPP, FALSIFIERAD 2026-08-12

macOS Filer och mappar-behörighet (TCC, "Transparency, Consent and Control")
sätts i grunden per **app-bundle**, inte per kommandoradsverktyg — det är en
dokumenterad, allmän macOS-mekanism och den delen står fast. Uppdraget till
bygg-agenten (S105, 2026-08-12) drog ursprungligen slutsatsen att just DEN
mekanismen — konkret: `com.microsoft.VSCode` / `kTCCServiceSystemPolicy
DownloadsFolder` = `0` — var VARFÖR `~/Downloads` nekas i dagens session.

**Den slutsatsen visade sig fel, samma dag, innan detta dokument hann
publiceras.** Orkestreraren stoppade och rev förklaringen öppet (källa: S105
2026-08-12, rättelse mitt i detta korts uppdrag) sedan en tidigare sessions
transkript visade att exakt samma TCC-rad — oförändrad sedan 2026-01-03 —
inte hindrade en lyckad läsning av `~/Downloads` två dagar tidigare. Se
§ Aktuellt öppet läge (2026-08-12) för hela falsifieringen och vad som
faktiskt är känt. TCC-tabellen i § Fil-åtkomstmatris är kvar som verifierad
MÄTNING — läs den som en datapunkt, inte som en förklaring.

## Två nyckelklasser som lätt förväxlas (Supabase)

Gunilla-förklaring: tänk på skillnaden som **husnyckeln** kontra
**enskilda rumsnycklar**. Kontonyckeln öppnar hela huset (alla dina Supabase-
projekt, kan skapa/radera projekt); en projektnyckel öppnar bara ETT rum (ett
enda projekts data, med en specifik behörighetsnivå för det rummet).

| | Supabase PAT (kontonyckel) | Projektnyckel |
|---|---|---|
| **Prefix** | `sbp_…` | `sb_publishable_…` / `sb_secret_…` (nya formatet); `eyJ…` (JWT, äldre `anon`/`service_role`) |
| **Vad den öppnar** | Hela kontot — Management API, CLI-inloggning (`supabase login`), kan lista/skapa/radera projekt | Ett enda projekts data-API, inom den nyckelns behörighetsnivå |
| **Exempel** | CLI:ts nyckelrings-token (`Supabase CLI`-posten, se register nedan) | `TEST_SUPABASE_ANON_KEY` (repo-secret), `.env.staging`/`.env.production`s `VITE_SUPABASE_ANON_KEY` |
| **Källa** | [`supabase.com/docs/reference/api/introduction`](https://supabase.com/docs/reference/api/introduction): *"Authorization: Bearer sbp_bdd0••••4f23"* — PAT-exempel | [`supabase.com/docs/guides/api/api-keys`](https://supabase.com/docs/guides/api/api-keys): `sb_publishable_` = "safe to expose"; `sb_secret_` = backend-only; ersätter `anon`/`service_role` (JWT), utfasas "by end of 2026" |

Båda lästa av bygg-agenten via WebFetch 2026-08-12; citaten ovan är verbatim
ur sidorna.

## Register — åtkomst per rad

Alla "Senast verifierad"-datum där källan är bygg-agentens egen körning är
märkta så; övriga är källmärkta till uppdragets orkestrerar-mätning.

| Namn | Var den bor | Klass | Vad den öppnar | Bevis-kommando | Senast verifierad |
|---|---|---|---|---|---|
| Supabase CLI-inloggning | macOS nyckelring, tjänst `Supabase CLI`, konto `supabase` | Kontonyckel (PAT, `sbp_…`) | `supabase`-CLI:ts Management API + `db push`/`migration list`/`link` mot valfritt av kontots projekt | `npx supabase projects list` (svarar direkt, hänger aldrig — se § Bevis-kommandon som INTE får hänga) | 2026-08-12, bygg-agentens egen körning: båda projekten listade |
| GitHub personal access token | macOS nyckelring, tjänst `github-pat`; laddas till `GITHUB_PERSONAL_ACCESS_TOKEN` av `~/.zshrc` rad 7–9 | Kontonyckel (PAT) | `gh`-CLI:t, GitHub MCP-servern | `gh auth status` | 2026-08-12, bygg-agentens egen körning: inloggad som `marcus803`, scopes `repo`/`workflow`/m.fl. |
| `gh` CLI-inloggning (separat från ovan) | macOS nyckelring, tjänst `gh:github.com` | Kontonyckel | Samma som ovan — `gh` föredrar sin egen keyring-post | `gh auth status` | 2026-08-12 |
| OpenAI API-nyckel | macOS nyckelring, tjänst `openai-api-key`; laddas till `OPENAI_API_KEY` av `~/.zshrc` rad 15–17 | Projekt-/tjänstenyckel | OpenAI API-anrop | `env \| grep -c '^OPENAI_API_KEY='` (kontrollerar ATT den är satt, aldrig värdet) | 2026-08-12, bygg-agentens egen körning: satt |
| Resend SMTP-lösenord (staging) | macOS nyckelring, tjänst `RESEND_SMTP_PASS` | Tjänstenyckel | Utgående mail via Resend, staging-miljö | `security find-generic-password -s RESEND_SMTP_PASS -w` (skriver ALDRIG ut resultatet i loggar — se skriptets attributs-only-princip) | Poster bekräftat FINNS i nyckelring 2026-08-12 (bygg-agenten, attribut-nivå — värdet aldrig läst) |
| Resend SMTP-lösenord (prod) | macOS nyckelring, tjänst `RESEND_SMTP_PASS_PROD` | Tjänstenyckel | Utgående mail via Resend, produktionsmiljö | Samma form som ovan | Poster bekräftat FINNS 2026-08-12 |
| GitHub repo-secrets | `gh secret list` (GitHub, inte lokal maskin) | Repo-scopade CI-secrets | Testkonton + Airtable-token för CI-körningar | `gh secret list` | 2026-08-12, bygg-agentens egen körning: `STAGING_AIRTABLE_TOKEN`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_REGISTRATION_RECORD_ID`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` |
| Lokala `.env`-filer | Repo-roten, 9 filer (`.env.local`, `.env.development`, `.env.staging`, `.env.production`, `.env.test`, `.env.seed` + tre `.example`-mallar) | Projektnycklar (bl.a. `VITE_SUPABASE_ANON_KEY` per miljö) | Lokal dev/build/test mot rätt Supabase-projekt | `ls -1 .env* \| wc -l` (ska vara 9 i repo-roten) | 2026-08-12, bygg-agentens egen körning: exakt 9 filer |
| Vercel CLI-inloggning | Vercel CLI:ts egen auth-lagring (globalt installerad + via `npx vercel`), konto `marcus-2914`; repot länkat via `.vercel/project.json` (projekt `miranon-media-admin`, team `marcus-johanssons-projects-1d6d2a3a`) | Kontonyckel | Deploy-listor, `vercel inspect` med byggloggar, alias-läge — hela frontend-driftytan som `TASK-199` § 5 trodde saknade åtkomst | `npx vercel whoami` (svarar direkt) | 2026-08-14, orkestreraterns egen körning (S105 Del 10): `marcus-2914`; posten SAKNADES i registret och "ingen Vercel-åtkomst" hade hunnit påstås två gånger — exakt Rotorsak 1-klassen, omgivningen antogs i stället för att åtkomsten mättes |
| `INVITE_REDIRECT_URL` | Supabase secrets, BÅDA projekten (staging + prod) | Runtime-konfiguration (ett offentligt URL-värde, inte en hemlighet i vanlig mening) | Styr `redirectTo` i `invite-user`-Edge Function (`supabase/functions/invite-user/index.ts:260`/269) — saknas den faller Supabase Auth tillbaka på projektets bara Site URL utan sökväg, och inbjudningslänken hoppar över `/valkommen`-accept-flödet | `bash scripts/fas4-prod-deploy.sh --kontrollera <ref>` (mekanisk ✓/✗-kontroll av namnet, `TASK-359`; värdet kan som alltid inte läsas via `secrets list`) | 2026-09-02, orkestrerarens egen körning (S113 resume 8): satt i BÅDA miljöerna, sha256-digest `9b7efb779ddeb80236ff89f3e4aaadf275e86d0ccc2410a2091a59406373330c` matchar `https://admin.miranon.dev/valkommen` — se § "ÅTGÄRDAT 2026-09-02" nedan för hela historiken |

**Bevis-kommandon som INTE får hänga:** `npx supabase projects list` svarar
direkt och duger som bevis-kommando. `supabase link` (utan styrd stdin) duger
**inte** — den ställer en databas-lösenordsprompt och väntar på stdin, vilket
läses som en hängning i en headless-miljö (se § Rotorsak 1 ovan). Behövs
`link` ändå: styr stdin explicit, t.ex. `echo "" | npx supabase link
--project-ref <ref>`.

**Rå-extraktion av PAT-VÄRDET är agenten förbjuden, och kräver Marcus
(TASK-203).** `scripts/deny-hemlighet-utskrift.sh` blockerar mekaniskt varje
`security find-generic-password ... -w/-g` mot posten ovan — se
§ Relaterat. Existens-check (utan `-w`/`-g`) är fri och redan i bruk i
`atkomst-diagnos.sh`. Behöver en riktad Management API-`PATCH` (t.ex.
`config/auth`) genuint råvärdet: det är Marcus beslut att köra kommandot
själv, i sin EGEN terminal, utanför Claude Code. **Känd form, källmärkt
`TASK-231` (2026-08-16, Marcus egen körning):** `security
find-generic-password -s "Supabase CLI" -a supabase -w` gav INTE PAT:et
direkt — värdet macOS-nyckelringen returnerade var wrappat som
`go-keyring-base64:<base64>` (Supabase CLI:t går via Go:s `go-keyring`-
bibliotek, som base64-kodar värdet innan lagring). Uppackning krävs:
`security find-generic-password -s "Supabase CLI" -a supabase -w | sed
's/^go-keyring-base64://' | base64 -d` — resultatet är det faktiska
`sbp_…`-PAT:et, användbart som `Authorization: Bearer`-header. Detta är
återigen ett fall av § Bakgrund-mönstret ("omgivningen mättes, inte
åtkomsten") i en NY form: den råa nyckelrings-posten är inte tom eller fel
— den är WRAPPAD, och ett kommando som bara läser `-w` rakt av och stoppar
in resultatet som bearer-token hade fått ett `401` och sett ut som "PAT:et
fungerar inte", inte "PAT:et behöver packas upp".

## Prod-provisionering av externa Storage-resurser — kanonisk väg (`TASK-308`)

**Fyndet, källmärkt:** `preview-receipt` mätte skarpt 502 `sb-error-code:
EDGE_FUNCTION_ERROR`, `{"error":"Utkastet kunde inte sparas: Bucket not
found", ...}` i prod 2026-08-23 12:25Z — första skarpa prod-användningen av
`ADR-124`s leveransväg (`TASK-302`). Rotorsak:
[`scripts/provision-attachments-bucket.mjs`](../../scripts/provision-attachments-bucket.mjs)
(`TASK-146.3`) vägrar BY DESIGN köra sin SKRIVväg mot prod
(`assertStagingOnly()`) — ingen prod-provisionering av bucketen `bilagor`
fanns någonsin bokförd. Full historik: `ADR-124` § Updates 2026-08-23
(`TASK-308`).

**Kanonisk SKRIVväg till prod: Supabase-dashboarden, av Marcus.** Samma
doktrin som prod-EF-deploy (`fas4-prod-deploy.sh`/`deploy-prod-
functions.sh`, § ovan): en agent provisionerar aldrig en extern resurs i
prod. `assertStagingOnly()` i `provision-attachments-bucket.mjs` förblir
oförändrad av `TASK-308` — skriptets skrivväg är och förblir staging-låst.
Project Settings → Storage → New bucket, inställningar identiska med
skriptets `BUCKET_DESIRED_CONFIG` (privat, `fileSizeLimit` 25 MB,
`allowedMimeTypes: ['application/pdf']`).

**Kanonisk LÄSväg (konvergenskontroll) för BÅDA miljöerna: `--kontrollera
<ref>`.** Skriptet fick `TASK-308` ett nytt, read-only läge som accepterar
prod-refen som ARGUMENT (samma lås-mönster som `fas4-prod-deploy.sh`: refen
måste anges explicit och matcha den `SUPABASE_URL` som redan krävs) — den
ENDA avsiktliga vägen förbi `assertStagingOnly()`, och den skriver ALDRIG
(tvingar `dryRun` internt oavsett `--dry-run`).

**Exakt kommando, Marcus (`!`-prefixet eller egen terminal):**

```bash
! SUPABASE_URL="https://lvjsfnphlauldxqlncpl.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys \
    --project-ref lvjsfnphlauldxqlncpl -o json \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        const k=JSON.parse(s).find(k=>k.name==="service_role");
        process.stdout.write(k.api_key);
      })')" \
  node scripts/provision-attachments-bucket.mjs --kontrollera lvjsfnphlauldxqlncpl
```

Enklare alternativ som täcker samma kontroll (plus `CORS`/hemligheter) i ett
enda svep, redan den etablerade prod-lässvägen (§ "Prod-EF-deploy körs via
SKRIPTET" i repots `CLAUDE.md`):

```bash
! bash scripts/fas4-prod-deploy.sh --kontrollera lvjsfnphlauldxqlncpl
```

`fas4-prod-deploy.sh --kontrollera` kör bucket-kontrollen automatiskt sedan
`TASK-308` (`scripts/kontrollera-bilagor-bucket.sh`, hämtar service-role-
nyckeln engångs, aldrig på disk), och `--deploya` VÄGRAR (fail-closed) om
bucketen saknar konvergens — en Storage-beroende EF deployas inte längre
mot en bucket som inte finns.

**Testat mot STAGING skarpt** (bygg-agenten, `TASK-308`, ingen prod-ref
inblandad): `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` för
`pqtshyierkdgwdnxuirz` + `--kontrollera pqtshyierkdgwdnxuirz` rapporterade
`✅ Bucket "bilagor" konvergerad mot BUCKET_DESIRED_CONFIG.`, exit 0.

**ÖPPET vid `TASK-308`s landning:** prod-mätningen (att `bilagor` faktiskt
konvergerar i PROD) kräver Marcus egen körning — en agent kan inte rikta
kommandon mot prod-Supabase-projektet (`scripts/deny-prod-ref.sh`).

## Prod-deploy av bilagespåret (ADR-125, TASK-309.9)

Bilagespårets promovering (eventinnehåll, platser, en server-side renderare
— [ADR-125](../decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md))
blir skarp i prod i EXAKT denna ordning. **Ordningen är inte kosmetisk:**
körs (c) FÖRE (a)/(b) svarar de sex nya EF:erna 500 mot tabeller som inte
finns — schema FÖRE deploy, alltid.

**VEM som kan köra vad — mätt 2026-08-24 (S108 Del 17), inte antaget.**
Stegen delar sig i två klasser, och gränsen går vid vilken spärr som är
MEKANISK:

| Steg | Agent-körbar? | Varför |
|---|---|---|
| (a) schema · (b) seed | **JA** | Airtable-bas-ID:t bärs inte av `deny-prod-ref.sh` (den matchar Supabase-prod-refen). `AIRTABLE_PROD_GODKAND_AV_MARCUS` är en gate INUTI skripten — ingen hook, inget deny-skript (grep-verifierat över `scripts/` + `.claude/`). Den kräver alltså Marcus **GO i klartext**, inte hans tangentbord |
| (c) EF-deploy · (d) verifiering | **NEJ** | kommandot bär Supabase-prod-refen → `scripts/deny-prod-ref.sh` fäller det mekaniskt. Marcus egen terminal, alltid |
| (f) röktest | **NEJ** | manuell prod-användning |
| (g) nyckelrotation | **NEJ** | bär prod-refen |

**TOKEN-FÄLLAN, mätt och rättad (S108 Del 17 § A).** Meningen i (a) nedan om
att `.env.seed`s `AIRTABLE_SCHEMA_TOKEN` är staging-scopad är SANN — men den
säger något om *en variabel i en fil*, inte om vilken Airtable-åtkomst som
finns på maskinen. Airtable-MCP-serverns token
(`~/.claude.json` → `mcpServers.airtable.env.AIRTABLE_API_KEY`) når
**prod-basen** (`permissionLevel: "create"`) och fungerar via skript-vägen
när den exporteras som `AIRTABLE_SCHEMA_TOKEN`/`STAGING_AIRTABLE_TOKEN`.
En agent läste 2026-08-24 runbookens mening som "Marcus saknar prod-åtkomst"
och skrev tio instruktionspunkter för att skapa två nya PAT:ar som aldrig
behövdes — i samma session som den själv redan läst prod-basen två gånger.
**Mät åtkomsten, härled den aldrig ur en mening om en annan token.**

### (a) Prod-schemat — tre tabeller + fält, per tabell efter GO i klartext

`scripts/create-eventinnehall-modell.mjs` fick en MEDVETEN prod-väg
(TASK-309.9): basen anges som `--bas <baseId>` (aldrig ur config), och en
icke-staging-bas kräver DESSUTOM miljövariabeln
`AIRTABLE_PROD_GODKAND_AV_MARCUS=<baseId>` satt till EXAKT samma bas-ID —
Marcus GO i klartext ÄR kommandot han kör, ingen agent kan sätta den åt
honom. Token: en NY, egen prod-scopad PAT (`schema.bases:read` +
`schema.bases:write`, ENDAST prod-basen `app8uGPrVCVOm6LfD`) — `.env.seed`s
`AIRTABLE_SCHEMA_TOKEN` är scopad ENDAST till staging och funkar inte här;
sätt den nya token-strängen INLINE, aldrig i `.env.seed`.

Valfritt, men billigt: kör med `--dry-run` FÖRST för att se planen utan att
skriva något (samma flagga fungerar oförändrat mot prod-basen).

```bash
AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT-schema>" \
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
node scripts/create-eventinnehall-modell.mjs --bas app8uGPrVCVOm6LfD --dry-run

AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT-schema>" \
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
node scripts/create-eventinnehall-modell.mjs --bas app8uGPrVCVOm6LfD
```

Utan `AIRTABLE_PROD_GODKAND_AV_MARCUS`, eller med ett värde som inte är
EXAKT `app8uGPrVCVOm6LfD`, VÄGRAR skriptet med ett tydligt skäl — provat i
båda riktningar i `scripts/test-create-eventinnehall-modell.mjs`
(TASK-309.9). Skriptet skriver ut ett `SAMMANFATTNING`-block i slutet med
alla skapade tabell-/fält-ID:n i formen `Tabell.Fält (typ) — id` — klistra
in det blocket i
[`data-model.md`](data-model.md) § "Bilagornas datamodell" § Tabell-ID:n,
prod-kolumnen (ersätter "skapas efter GO (skiva 8)").

### (b) Seed — Rönninge + de sju Eventinnehåll-raderna

Samma `--bas`/`AIRTABLE_PROD_GODKAND_AV_MARCUS`-form, men EN ANNAN token:
`scripts/seed-eventinnehall-modell.mjs` skriver RECORDS, inte schema, och
läser sin token ur `STAGING_AIRTABLE_TOKEN` (namnet är historiskt — samma
separationsprincip som ADR-060 punkt 4 — värdet måste vara en prod-scopad
PAT här, `data.records:read` + `data.records:write`, ENDAST prod-basen).
Kör EFTER (a) — tabellerna/fälten måste redan finnas:

```bash
STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT-records>" \
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
node scripts/seed-eventinnehall-modell.mjs --bas app8uGPrVCVOm6LfD --dry-run

STAGING_AIRTABLE_TOKEN="<prod-scopad-PAT-records>" \
AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD \
node scripts/seed-eventinnehall-modell.mjs --bas app8uGPrVCVOm6LfD
```

Idempotent (läser befintliga rader by `Namn` innan skrivning) — en omkörning
skapar inga dubbletter. Klistra in slutens `SAMMANFATTNING`-block (record-ID:n)
i samma `data-model.md`-sektion.

### (c) Edge Functions — kontrollera, sedan deploya

Samma skript/samma prod-ref som § "Prod-EF-deploy körs via SKRIPTET" i
repots `CLAUDE.md` och § "Prod-provisionering av externa Storage-resurser"
ovan — prod-refen är `lvjsfnphlauldxqlncpl`, bokförd här i samma form som
den sektionen redan använder (aldrig i ett kommando en AGENT kör —
`scripts/deny-prod-ref.sh` fäller det mekaniskt):

```bash
bash scripts/fas4-prod-deploy.sh --kontrollera lvjsfnphlauldxqlncpl
```

Läs utdatan: sex NYA EF:er (`get-document-sources`, `get-event-contents`,
`get-places`, `save-event-content`, `save-event-text`,
`save-place-standard`) ska synas i deploy-planen (nu allowlistade,
TASK-309.9), plus bekräfta att bucketen `bilagor` (TASK-308) fortsatt är
konvergerad. Godkänns läget:

```bash
bash scripts/fas4-prod-deploy.sh --deploya lvjsfnphlauldxqlncpl
```

Detta deployar HELA allowlisten (inte bara de sex nya) — `deploy-prod-
functions.sh` känner inget begrepp "bara det som ändrats i denna skiva", så
även de TRE ÄNDRADE EF:erna (`generate-event-attachment`, `preview-receipt`,
`send-receipt-email` — ADR-125 § 5, pdf-lib → `renderaMallPdf`) och alla
tidigare allowlistade funktioner deployas om. Det är avsett (samma
"deploya om oförändrat är billigt, missa en ändrad EF är dyrt"-avvägning
som redan gäller för hela allowlisten) — inte en biverkning att oroa sig för.

### (d) Verifiera — läs `UPDATED_AT`, inte `VERSION`

Per `CLAUDE.md` § "Prod-EF-deploy körs via SKRIPTET": en deploy bumpar
`VERSION` på ALLA funktioner oavsett om de rördes. Kontrollera i stället att
`UPDATED_AT` för dessa NIO funktioner faktiskt rör sig vid denna deploy —
`npx supabase functions list --project-ref lvjsfnphlauldxqlncpl`:

- Sex nya: `get-document-sources`, `get-event-contents`, `get-places`,
  `save-event-content`, `save-event-text`, `save-place-standard`
- Tre ändrade: `generate-event-attachment`, `preview-receipt`,
  `send-receipt-email`

### (e) Klienten — ingen handling

Vercel bygger och deployar `src/` automatiskt när skiva 5:s (`TASK-309.6`)
gren landar via merge-kön mot `main`. Inget separat kommando.

### (f) Röktest i prod (kortets AC #4)

Marcus, i prod: skapa en bekräftelsebilaga för ett riktigt event → filen
syns i bilage-listan → bifogbar på Åtgärds-sidan → kvittoförhandsgranskningen
visar den NYA mallen utan vattenstämpel (bekräftar `ENVIRONMENT`s `test:
false`-gren, ADR-125 § 4).

### (g) Rotera DocRaptor-nyckeln — EFTER verifierat röktest

Nyckeln exponerades i chatten 2026-08-23 (S108 Del 14 § D, bokfört som öppen
skuld i samma avsnitt: *"rotera nyckeln i DocRaptor när promoveringen är
verifierad i prod, sätt om båda secrets"*). Med (f) grönt:

1. Rotera `DOCRAPTOR_API_KEY` i DocRaptors dashboard (ny nyckel, gammal
   invalideras).
1. Sätt om BÅDA miljöernas secret via `--env-file` (samma form som
   Del 14 § D redan etablerade för staging — `.env.docraptor`, gitignorad
   via `.env.*`, ALDRIG committad):

   ```bash
   echo "DOCRAPTOR_API_KEY=<ny-nyckel>" > .env.docraptor
   npx supabase secrets set --env-file .env.docraptor --project-ref pqtshyierkdgwdnxuirz
   npx supabase secrets set --env-file .env.docraptor --project-ref lvjsfnphlauldxqlncpl
   rm .env.docraptor
   ```

1. Verifiera via `npx supabase secrets list --project-ref <ref>` (digest
   ändrad, ingen värdeläsning möjlig — samma begränsning som § "Prod-
   provisionering..." ovan redan noterar).

### `INVITE_REDIRECT_URL` — ÅTGÄRDAT 2026-09-02 (`TASK-359`)

**Historik:** `INVITE_REDIRECT_URL` saknades i prod-secrets sedan mätningen
2026-08-23 (`fas4-prod-deploy.sh --kontrollera` — `secrets list` visar NAMN,
inte värden, se § ovan). `invite-user/index.ts:260` faller tillbaka på
`undefined` när variabeln saknas — `redirectTo` skickas då inte alls (rad
269), och Supabase Auth faller tillbaka på projektets bara `site_url`
(`https://admin.miranon.dev`, `supabase/config.toml` rad 459) UTAN sökväg, i
stället för den avsedda accept-sidan `/valkommen`. Ingen 500, inget hårt fel
— men inbjudningslänken landade på appens rotsida i stället för
accept-flödet. `TASK-270` (Done, 2026-08-17) hade bokfört frågan som
*"KVARSTÅENDE ROBUSTHETS-FRÅGA, INTE BLOCKERANDE (deferrad)"* — se den
kortets Implementation Notes för hela den ursprungliga mätningen (samtliga
16 lästa prod-secrets, ingen `INVITE_REDIRECT_URL` bland dem).

**Åtgärdat 2026-09-02 av orkestreraren (S113 resume 8, Marcus-order i
klartext).** Kommandot:

```bash
npx supabase secrets set INVITE_REDIRECT_URL=https://admin.miranon.dev/valkommen --project-ref <ref>
```

kördes mot **staging** (`07:54:07Z`) och mot **prod** (`07:56:00Z`, via
prod-ref-låsets diktering-bypass — se § "Medveten väg förbi" i
`.prod-ref-policy.conf`, den enda vägen en agent kan köra ett prod-riktat
kommando på Marcus egen instruktion). Verifierat i BÅDA miljöerna via
`secrets list`: sha256-digest `9b7efb779ddeb80236ff89f3e4aaadf275e86d0ccc2410a2091a59406373330c`,
identisk med `printf '%s' 'https://admin.miranon.dev/valkommen' | shasum -a 256`
— två oberoende källor (staging + prod), ingen gissning.

**Kontrollen är sedan `TASK-359` MEKANISK, inte längre bara en prosa-notis
att läsa.** `fas4-prod-deploy.sh --kontrollera` skrev redan tidigare en
prosa-notis om exakt denna variabel ("LÄS DETTA I UTDATAN OVAN") — mätt TRE
gånger (S107, S108, S113) att den INTE fångades som åtgärdbart innan Marcus
själv körde `--kontrollera` och läste raden 2026-08-17. Sedan `TASK-359`
verifierar `scripts/kontrollera-hemlighets-namn.sh` en config-driven mängd
krävda hemlighets-namn (`.hemlighets-namn-policy.conf`, `INVITE_REDIRECT_URL`
ibland dem) mot `secrets list`-utdatan och skriver ✓/✗ per namn — ett
saknat namn gör att `--kontrollera` avslutar exit ≠ 0. Bevis-kommando:

```bash
bash scripts/fas4-prod-deploy.sh --kontrollera <ref>
```

Genererar en röd `✗ INVITE_REDIRECT_URL SAKNAS`-rad ENDAST om variabeln
faktiskt saknas i det angivna projektet.

## Fil-åtkomstmatris per värdapp — MÄTNING, inte förklaring

TCC-behörighet (macOS "Integritet och säkerhet → Filer och mappar") sätts
per app-bundle, inte per verktyg — det är en dokumenterad, allmän
macOS-mekanism. Tabellen nedan är en verifierad ordagrann avläsning av
databasen. **Den är inte längre bevisad förklara varför en specifik
läsning nekas eller tillåts** — se § Aktuellt öppet läge nedan. `auth_value`
i `TCC.db`: **2 = tillåten, 0 = nekad.**

Källa för raderna: användarens `TCC.db`
(`~/Library/Application Support/com.apple.TCC/TCC.db`), verifierad ORDAGRANT
av bygg-agenten 2026-08-12 via `sqlite3` mot databasen:

| Värdapp | Downloads | Desktop | Documents |
|---|---|---|---|
| `com.microsoft.VSCode` | 0 (nekad) | 2 (tillåten) | 2 (tillåten) |
| `com.apple.Terminal` | 2 (tillåten) | 2 (tillåten) | 0 (nekad) |
| `com.openai.codex` | 2 (tillåten) | — | — |
| `com.google.antigravity` | 2 (tillåten) | — | — |

Faktisk läsning uppmätt FRÅN en Claude Code-session startad i VS Code,
processkedja `bash → zsh → Claude → zsh → Code Helper → Visual Studio
Code.app` (orkestrerarens egen direkta session, 2026-08-12):

- `~/Downloads` → NEKAD: `ls: /Users/marcus/Downloads: Operation not permitted`
- `~/Desktop` → OK (185 poster)
- `~/Documents` → NEKAD

Bygg-agentens EGEN session (denna, samma dag, worktree-isolerad subagent
spawnad av samma orkestrerar-session) mätte **inte ett stabilt tredje
mönster, utan ett INTERMITTENT förlopp inom en och samma session** —
ordnat efter faktisk körordning:

1. Vid sessionens start: samtliga tre kataloger — Downloads, Desktop OCH
   Documents — nekades, både med och utan verktygets egen
   sandbox-lägesflagga (samma utfall båda gångerna).
2. Senare i SAMMA session, utan att något medvetet åtgärdats: en körning av
   `scripts/atkomst-diagnos.sh` visade `Desktop: OK`, `Downloads: NEKAD`,
   `Documents: NEKAD` — alltså identiskt med orkestrerarens mönster ovan.
3. Ett omedelbart uppföljande, fristående `ls ~/Desktop`-anrop bekräftade
   OK igen; `~/Downloads` och `~/Documents` förblev NEKAD.

Desktop gick alltså från NEKAD till OK inom samma session utan någon känd
utlösande händelse. Detta är INTE en gissning om orsak — det är en
tidsordnad observation som stärker bilden i § Aktuellt öppet läge: symptomet
är intermittent på ett sätt ingen mekanism här förklarar, inte ett statiskt
läge kopplat till en viss process eller ett visst verktygsanrop. Rotorsaken
till intermittensen är omätt.

## Aktuellt öppet läge (2026-08-12) — TCC-förklaringen falsifierad

**Vad som en gång stod här:** att `~/Downloads` är onåbart från
VS Code-startade sessioner FÖR ATT TCC-raden ovan säger `0`, och att fixen
är att slå på behörigheten i Systeminställningar. **Det påståendet är
falsifierat**, källmärkt till S105 2026-08-12 (orkestrerarens rättelse mitt
i detta korts uppdrag, byggd på ett tidigare sessions transkript):

- **TCC-raden är oförändrad sedan 2026-01-03 18:35:41** (`last_modified` i
  användarens `TCC.db`). Ändå läste en tidigare session filen
  `~/Downloads/Inbjudningar-till-communityt.docx` med `textutil`
  **framgångsrikt** den 2026-08-10 (session S104) — belagt i sessionens
  eget transkript
  (`~/.claude/projects/-Users-marcus-Repon-miranon-media-admin--claude-worktrees-s104-segment-passet/a02154a9-654a-4f95-9120-0e8b18398ffc.jsonl`,
  kommandots faktiska utdata finns i filen). Hade TCC-raden varit den
  verksamma mekanismen hade den körningen fallit också.
- Marcus har bekräftat i klartext att han **alltid** kör i VS Code, utan
  undantag — värdappen är alltså konstant och kan inte vara skillnaden
  mellan de två sessionerna.
- S104 kördes också worktree-isolerat, precis som denna bygg-agent-session
  — isoleringsläget skiljer inte heller.
- **Starkaste kända ledtråd, uttryckligen märkt KORRELATION, INTE ORSAK:**
  Claude Code-versionen skiljer sig mellan de två sessionerna (lästa ur
  `"version"`-fältet i respektive sessions transkript, och ur den
  installerade paketets `package.json`): S104 (läsningen lyckades) körde
  `2.1.226`. Orkestrerarens session denna dag (läsningen nekas) kör
  `2.1.227`. På disk ligger nu `2.1.228` (installerad 2026-08-12 16:17,
  ännu OPRÖVAD i en levande session — se § Nästa mätning nedan).
  Mekanismen inuti `2.1.227` som eventuellt orsakar detta är **okänd** —
  ingen förklaring till DEN hör hemma i det här dokumentet förrän den är
  mätt.
- Felet visar sig i **två oberoende kodvägar** samma dag: `Operation not
  permitted` (Bash-verktyget) och `EPERM` (Read-verktyget) — alltså inte en
  enskild verktygs-sandlåda.
- `dangerouslyDisableSandbox: true` ändrar ingenting.
- Harnessets egna rättighetslager är uteslutet som förklaring:
  `~/.claude/settings.json` har `defaultMode: bypassPermissions` och ingen
  sökvägs-deny.
- Filen finns kvar på disk — felet är ett RÄTTIGHETSFEL, inte "hittades
  inte".
- `stat ~/Downloads` fungerar; `ls`, `find`, `open` och `textutil` mot
  innehållet gör det inte.
- `~/Desktop` är läsbart i orkestrerarens session, `~/Documents` är det
  inte — trots att TCC-tabellen ger `2` (tillåten) för båda, för VS Code.
  Även detta talar emot TCC-tabellen som fullständig förklaring.
- Bygg-agentens EGEN session (denna) uppvisade dessutom **intermittens
  inom en och samma session** — Desktop gick från NEKAD (sessionens start)
  till OK (senare, upprepat) utan känd utlösande händelse, medan Downloads
  och Documents förblev NEKAD hela tiden (fullständig tidsordning i
  § Fil-åtkomstmatris ovan). Detta talar emot att förklaringen är ett
  STATISKT läge alls, TCC-baserat eller ej. Vilken Claude Code-version
  bygg-agentens subagent-process kör under är **omätt** — det finns ingen
  enkel väg att läsa det ur subagent-kontext utan tillgång till sessionens
  eget transkript. Bokförs som öppen fråga, ingen gissning görs.

**Lärdomen, explicit (tas även med i lesson-fragmentet):** en TCC-rad som
PASSADE symptomet (Downloads nekad, TCC säger nekad) var sann men
irrelevant — sökningen stannade vid den första förklaring som stämde,
utan att pröva om den också förklarade fallen där symptomet UTEBLEV
(S104:s lyckade läsning, samma TCC-rad). En förklaring är inte verifierad
förrän den klarar båda riktningarna.

### Nästa mätning — billig, gör den vid nästa sessionsstart

1. Starta om Claude Code-sessionen (2.1.228 är redan installerad — en
   redan pågående session byter inte version retroaktivt bara för att en
   nyare version landat på disk).
2. Kör `claude --version` i den nya sessionen och bekräfta att den
   faktiskt kör `2.1.228` (anta aldrig — mät).
3. Kör `ls ~/Downloads` rått (ingen pipe, ingen `&&`/`||`-kedja) och läs
   exitkoden separat.
4. Kör `textutil -convert txt -stdout ~/Downloads/<en befintlig fil>` för
   att pröva både listning och innehålls-läsning.
5. Jämför utfallet mot de två kända punkterna: `2.1.226` (fungerade,
   S104) och `2.1.227` (fungerade inte, denna session).
6. **Bokför utfallet här i registret** (eller i ett nytt lesson-fragment)
   — inte bara i chatt-historik, som är hur den ursprungliga TCC-hypotesen
   fick stå oprövad i över en session.

## Möjlig åtgärd — OPRÖVAD, ingen bekräftad fix

Ursprungligen dokumenterades "slå på Hämtade filer i Systeminställningar"
här som DEN fixen. Det påståendet vilade på TCC-förklaringen, som är
falsifierad ovan — S104:s framgångsrika läsning 2026-08-10 skedde UTAN att
någon rört den inställningen, med exakt samma TCC-rad som gäller i dag.
Instruktionen nedan är därför nedgraderad till en **oprövad möjlig
åtgärd**, inte en bekräftad fix:

**Systeminställningar → Integritet och säkerhet → Filer och mappar →
Visual Studio Code → slå på "Hämtade filer" → starta om VS Code.**

Provas den och löser problemet: uppdatera denna rad till "bekräftad fix"
med datum och källa. Provas den och löser INTE problemet: stryk raden och
bokför det negativa resultatet — ett oprövat påstående som aldrig
kontrolleras är precis den fälla det här dokumentet finns för att
förhindra.

Det generella skälet toggeln ändå är rimlig att pröva, utan att vara
bevisad relevant för DETTA symptom: en TCC-driven vägg kan strukturellt
inte hävas av ett verktyg utan ett mänskligt klick i Systeminställningar —
TCC:s hela existensberättigande är att kräva just det klicket. Ett
verktyg som kunde slå på behörigheten åt sig själv vore per definition den
sårbarhet TCC finns för att förhindra, oavsett om toggeln råkar vara boven
i det aktuella fallet eller inte.

## Relaterat

- [`scripts/atkomst-diagnos.sh`](../../scripts/atkomst-diagnos.sh) —
  mekaniserad självdiagnos (`npm run atkomst:diagnos`) som kör bevis-
  kommandona ovan och skriver ett verdikt per rad.
- `tasks/lessons.d/` — lesson-fragmentet om att mäta åtkomsten, inte
  omgivningen (nummerlöst tills konsolidering, ADR-081).
- [ADR-086](../decisions/ADR-086-uppdragets-premisser-provas-av-mottagaren.md)
  — varför varje faktapåstående i det här dokumentet bär en källa.
