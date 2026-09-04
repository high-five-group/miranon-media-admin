# Fas 4 — EF-deploy-svepet mot PROD: underlag

> **Framtaget:** 2026-08-17, read-only agent-pass. **Modellbokföring:** Opus på
> Marcus order 2026-08-17.
> **Ingen prod-mutation utförd. Ingen repo-fil ändrad.** Deployen är Marcus
> HITL-moment.
> **Referens-SHA:** `origin/main` = `9cb9309c` (färsk `git fetch`, 2026-08-17).

---

## 0. Sammanfattning — det viktigaste först

| Fynd | Utfall |
|---|---|
| **Deploy-setet är 38 EF:er**, inte 12 | Handoffens "12 EF:er" är **falsifierat** — §2.1 |
| **Faktisk drift: 23 av 38.** 15 är rena no-ops | §2.3 — T39-mönstret upprepar sig exakt |
| **Prod-baslinjen är 2026-08-15** (35/35-deployen) | §2.2 — ren gräns, ingen EF-commit den dagen |
| **3 EF:er har ALDRIG deployats** | `delete-attachment`, `get-attachment-download-url`, `preview-receipt` |
| **Åtkomsten finns**; agent-vägen mekaniskt låst | §1 — låset fällde skarpt i detta pass |
| **`send-email`s AND/DNF-paritet finns INTE i prod** | §5 R8 — kritisk mailväg |
| **`task-147.12` påstår något FALSKT** om bilage-EF:erna | §5 R6 — motsagt av tre källor |
| **`data-model.md` är FEL om `Dokumentklass`** | §5 R7 — fältet finns i prod sedan 08-16 |
| **261-blinkfixen är front-only, redan på `main`** | §4.3 — kräver ingen EF-deploy |
| **`create-attendance` är EJ allowlistad** | §5 R9 — inte en `test-*`, ändå exkluderad |

---

## 1. Åtkomstbevisen (steg 0-mönstret)

### 1.1 Bevis-kommandot — GRÖNT

```bash
npm run atkomst:diagnos
```

**Utfall (verbatim-utdrag, 2026-08-17):**

```text
=== Nyckelringsposter (existens, aldrig värden) ===
  Supabase CLI: FINNS
  gh:github.com: FINNS
=== npx supabase projects list (bounded, 20s) ===
  OK — svarade inom tidsbudgeten:
    {"projects":[{...,"name":"miranon-media-admin-staging","status":"ACTIVE_HEALTHY",...},
                 {...,"name":"miranon-media-admin","status":"ACTIVE_HEALTHY",...}]}
```

**Steget lyckades** per runbookens kriterium
(`prod-driftsattning-runbook.md` rad 75–78): `Supabase CLI: FINNS` **och** båda
projekten listade. Ingen ny nyckel, inget `SUPABASE_ACCESS_TOKEN`, inget
databas-lösenord behövs för något steg.

Bifynd: båda projekten rapporterar `"linked": false`, och
`supabase/.temp/project-ref` **saknas** i denna worktree.

### 1.2 Prod-läsningen — BLOCKERAD AV VÅR EGEN HOOK (mätt, inte antaget)

```bash
npx supabase functions list --project-ref <prod-ref>
```

**Utfall — `PreToolUse`-hooken fällde före körning:**

```text
PROD-REF-LÅS (TASK-203): Bash-kommandot nämner produktions-Supabase-projektets
ref. Ingen bypass-form (PROD_REF_GODKAND_AV_MARCUS=<ref>) hittades på
kommandoraden.
```

**Distinktionen som betyder allt:** åtkomsten **finns** (§1.1 bevisar den mot
samma Management API-token). Det som stänger vägen är `scripts/deny-prod-ref.sh`
— vår egen konstruktion, med avsikt. **Korrekt beteende, inte ett fel**
(runbook rad 26–29, fälla 8 rad 651).

**Bypass-formen har medvetet INTE konstruerats.** `scripts/deny-prod-ref.sh`
§ MEDVETEN VÄG FÖRBI säger ordagrant: *"bypass-formen ska ENDAST skrivas av
Marcus, i klartext, aldrig av en agent på eget initiativ."* Ett uppdrag från en
annan agent är inte Marcus diktering.

**Konsekvens:** prod-versionerna är **härledda ur bokföringen** (§2.2), inte
mätta. Mätningen är därför **steg 1** i körsekvensen.

### 1.3 CLI-versionerna (runbookens fälla 6 — bekräftad live)

| Binär | Version | Används av |
|---|---|---|
| `supabase` (bar, `/usr/local/bin/supabase`) | **2.75.0** | `scripts/deploy-prod-functions.sh` |
| `npx supabase` | **2.114.0** | Runbookens övriga kommandon |

---

## 2. EF-driftkartan

### 2.1 Deploy-setet är 38 — handoffens "12" är falsifierat

```bash
bash scripts/deploy-prod-functions.sh --list
```

**Deploy-set: 38. Exkluderade: 5** (`create-attendance`,
`test-attachments-storage`, `test-auth`, `test-invite-completion`,
`test-pdf-generation`).

S102-handoffen (`tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 1232 och 1367,
speglat i `tasks/todo.md` rad 67 och 102) säger *"fulla allowlisten (12 EF:er)"*.
Talet stämmer inte mot någon mätning som går att hitta. Uppdragets instruktion
att derivera färskt var befogad.

### 2.2 Prod-baslinjen: 2026-08-15

Bokföringen bär **åtta** prod-EF-deploy-händelser. Den senaste:

> **2026-08-15 (S106 Del 3): 35/35 = hela allowlisten**, via
> `scripts/deploy-prod-functions.sh` från Marcus egen terminal, torrkörning →
> skarpt. `test-*` aldrig rörda.
> Källa: `tasks/sessions/archive/2026-08/2026-08-15-session-106.md` rad 160–165 ·
> `tasks/todo.md` rad 29–31 · `docs/BUILD-LOG.md` rad 3284–3287.

**Efter 2026-08-15 finns ingen bokförd prod-EF-deploy.**

**Gränsen är ren.** Exakt 8 commits rör `supabase/functions/` efter den dagen —
samtliga daterade 2026-08-16 eller 2026-08-17, **ingen 2026-08-15 självt**. Det
finns alltså ingen gränsdragningsrisk kring baslinjen.

```text
aeab8b50  2026-08-17 06:32  TASK-249.3  send-email-pariteten + tidsperioden
87c3d5f8  2026-08-17 03:47  TASK-249.2  AND/DNF i membership, compute-segment
63384db2  2026-08-17 03:31  TASK-249.4  Kursfamilj/Kursnivå skapelse+läsväg
2ec0c6d1  2026-08-16 19:12  TASK-246    genererad PDF i Visa-overlayen (klass B/C)
f7bc0acf  2026-08-16 17:50  TASK-245    signerad nedladdnings-EF
662f3818  2026-08-16 12:25  TASK-147.11 äkta ersätt/radera för bilagor
9d9bac20  2026-08-16 12:10  TASK-147.12 Dokumentklass + skrivvägarna
```

**Två varningar om beviskedjan** (ur historik-rekonstruktionen):

1. **Ingen mätning mot prod finns i repot.** Deploy-skriptet saknar
   `--audit`-läge (rekommenderat i `t39-…md` rad 165–172, aldrig byggt,
   `backlog/tasks/task-37`). Grinden är fail-closed framåt men **blind bakåt**.
2. **Inget kvitto namnger vilka 35.** Medlemskapet är härlett ur
   `.prod-functions-allowlist.conf` per commit och matchat mot bokförda antal.
   Passformen är exakt — men det är en härledning.
3. **VERSION-kolumnen ljuger, `UPDATED_AT` gör det inte.** En deploy-operation
   bumpar VERSION +1 på *alla* funktioner medan `UPDATED_AT` står stilla
   (plattforms-artefakt, `docs/BUILD-LOG.md` rad 2029). **Läs `UPDATED_AT`.**

### 2.3 Driftkartan — 23 drivna, 15 no-ops

**Metod:** effektiv senaste ändring = `max(egen katalog, alla transitiva
`_shared`-beroenden)`. Detta följer T39 (`t39-ef-sync-preflight-2026-07-24.md`
§1): den deployade bundlen **innehåller** `_shared`-filerna, så en EF med orörd
egen katalog kan ändå ha drivit.

#### DRIVNA — kräver deploy (23)

| # | EF | Effektiv drift | Driver | Prod-status |
|---|---|---|---|---|
| 1 | `send-email` | 08-17 | egen (`aeab8b50`) | 08-15-kod — **AND/DNF saknas** |
| 2 | `compute-segment` | 08-17 | egen (`aeab8b50`) | 08-15-kod |
| 3 | `create-event` | 08-17 | egen (`63384db2`) | 08-15-kod |
| 4 | `get-event` | 08-17 | egen (`63384db2`) | 08-15-kod |
| 5 | `get-events` | 08-17 | egen (`63384db2`) | 08-15-kod |
| 6 | `update-event` | 08-17 | egen (`63384db2`) | 08-15-kod |
| 7 | `create-event-note` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 8 | `create-person-note` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 9 | `create-registration` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 10 | `get-segments` | 08-17 | `_shared/segment-membership.ts` | 08-15-kod |
| 11 | `save-segment` | 08-17 | `_shared/segment-membership.ts` | 08-15-kod |
| 12 | `send-action-email` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 13 | `send-registration-confirmation` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 14 | `update-record` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 15 | `send-receipt-email` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 16 | `generate-event-attachment` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod — **`preview:true` saknas** |
| 17 | `finalize-attachment-upload` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 18 | `upload-attachment` | 08-17 | `_shared/field-allowlists.ts` | 08-15-kod |
| 19 | `create-attachment-upload-ticket` | 08-16 | `_shared/attachments.ts` | 08-15-kod |
| 20 | `get-event-attachments` | 08-16 | egen (`9d9bac20`) | 08-15-kod |
| 21 | **`delete-attachment`** | 08-16 | egen (`662f3818`) | **ALDRIG DEPLOYAD** |
| 22 | **`get-attachment-download-url`** | 08-16 | egen (`f7bc0acf`) | **ALDRIG DEPLOYAD** |
| 23 | **`preview-receipt`** | 08-16 | egen (`2ec0c6d1`) | **ALDRIG DEPLOYAD** |

#### NO-OPS — deployas utan innehållsändring (15)

`get-activity-log` (08-15) · `log-activity` (08-14) · `get-person` (08-12) ·
`get-attendance`, `get-leads`, `get-mail-log`, `get-registration`,
`get-waitlist` (08-11) · `get-event-formats`, `get-event-notes`,
`get-person-notes`, `get-persons`, `get-registrations` (08-10) ·
`invite-user` (08-05) · `create-admin-user` (07-31)

**Detta är T39:s huvudslutsats igen, oberoende reproducerad:** *"den verkliga
innehålls-driften är väsentligt smalare än versionsgapet"* — 3 av 12 redeploys
var rena no-ops 2026-07-24. Idag: **15 av 38**.

**Den dominerande driftbäraren är `_shared/field-allowlists.ts`**
(`63384db2`, TASK-249.4). Den ensam lyfter 12 EF:er utan att deras egen kod
rörts. Det gör "vi rör bara det vi ändrat" till en illusion vid en
`_shared`-ändring.

### 2.4 Vad som INTE gick att avgöra utan deploy

1. **Faktiska versionsnummer och `UPDATED_AT` per EF i prod.** Blockerat (§1.2).
   Versionsnummer är över huvud taget bara bokförda t.o.m. 2026-08-13.
2. **Den verkliga innehålls-diffen (T39-mönstret).** Kräver
   `supabase functions download` av prod-artefakten + diff mot HEAD. Min karta
   är en **git-derivering**, inte en artefakt-diff. Den kan därför **överskatta**
   driften (en `_shared`-ändring som inte berör en viss EF:s kodväg räknas här
   ändå som drift).
3. **Om `CORS_ALLOWED_ORIGINS` finns i prod-secrets** med prod-appens origin.
4. **Exakt kodpunkt (SHA) för deployerna 08-11, 08-13 och 08-15** — aldrig
   bokförd; deployerna kördes från Marcus arbetskatalog.
5. **Om de fem oavsiktligt deployade EF:erna 2026-08-10 återställdes.** Ingen
   bokföring hittad. Praktiskt irrelevant sedan 08-11-deployen.

---

## 3. Marcus körfärdiga HITL-sekvens

**Var:** Marcus **egen terminal, utanför Claude Code** — den strukturella vägen
som inte kräver någon bypass (`deny-prod-ref.sh` § MEDVETEN VÄG FÖRBI (1)).
**Arbetskatalog:** `~/Repon/miranon-media-admin` (huvudrepot), **inte** en
agent-worktree — `link`-tillståndet är per arbetskatalog (runbook rad 31–34).

> **Var godkännandet kommer in:** väljer Marcus i stället att låta en agent köra
> kommandona, måste `PROD_REF_GODKAND_AV_MARCUS=<prod-ref>` stå som prefix **på
> samma kommandorad** (Bash-verktyget startar en färsk shell per anrop — ett
> tidigare `export` når aldrig fram). Det är väg (2), den svagare.
> **Kör Marcus själv i egen terminal behövs ingen bypass alls.**

### Steg 0 — Förkrav

```bash
cd ~/Repon/miranon-media-admin
git fetch origin && git merge --ff-only origin/main
git status --short          # ska vara tomt
git log --oneline -1        # ska vara 9cb9309c eller senare
npm run atkomst:diagnos     # läs RADERNA, aldrig exitkoden
```

**Mätt 2026-08-17:** huvudkatalogen stod på `e5094e6b`, **8 commits efter**
`origin/main`, arbetsträdet rent. **För EF-deployen spelar det ingen roll** —
`git diff --name-only e5094e6b 9cb9309c -- supabase/functions/` är **tom**.
Fast-forwarda ändå: deployen sker från **arbetsträdets filer** (runbook § R2),
och de 8 commitsen bär 261-blinkfixen som fronten behöver.

### Steg 1 — MÄT PROD FÖRST

```bash
npx supabase functions list --project-ref lvjsfnphlauldxqlncpl
npx supabase secrets list  --project-ref lvjsfnphlauldxqlncpl
```

Spara utdatan. **Läs `UPDATED_AT`, inte VERSION** (§2.2 varning 3).

**Tre kontroller:**

- `test-auth` ska **inte** förekomma (raderad 2026-07-24, T39 §7)
- De **tre nya** ska **inte** förekomma — bekräftar att de aldrig deployats
- `CORS_ALLOWED_ORIGINS` ska finnas i secrets-listan

**T39-innehållsdiffen** för de EF:er där en oavsiktlig ändring svider mest:

```bash
mkdir -p /tmp/prod-ef && cd /tmp/prod-ef      # scratch, ALDRIG in i arbetsträdet
for fn in send-email send-action-email update-record create-event; do
  npx supabase functions download "$fn" --project-ref lvjsfnphlauldxqlncpl
  diff -ru "/tmp/prod-ef/$fn" ~/Repon/miranon-media-admin/supabase/functions/"$fn"
done
```

### Steg 2 — Länka mot prod

```bash
cd ~/Repon/miranon-media-admin
cat supabase/.temp/project-ref                                   # vad NU?
echo "" | npx supabase link --project-ref lvjsfnphlauldxqlncpl
cat supabase/.temp/project-ref                                   # och nu?
```

`echo "" |` är obligatoriskt — utan styrd stdin frågar `link` efter
databas-LÖSENORDET och blockerar (fälla 1; kostade en arbetsdag, `TASK-201.11`).
**Läs `cat`-raden varje gång** — den är hela skillnaden mellan Lottas data och
staging.

> Not: länken behövs för `db query --linked` / `inspect`. Själva EF-deployen tar
> `--project-ref` explicit och är oberoende av länken.

### Steg 3 — Deploya

```bash
bash scripts/deploy-prod-functions.sh --list          # bekräfta 38 / 5 igen
bash scripts/deploy-prod-functions.sh --project-ref lvjsfnphlauldxqlncpl
```

Skriptet deployar **varje funktion explicit vid namn** — aldrig ett naket
`supabase functions deploy` (som hade skickat *alla*, inklusive `test-*`).

**Alternativ smal form** — endast de 23 drivna, om Marcus vill hålla ingreppet
minimalt:

```bash
for fn in send-email compute-segment create-event get-event get-events \
          update-event create-event-note create-person-note create-registration \
          get-segments save-segment send-action-email \
          send-registration-confirmation update-record send-receipt-email \
          generate-event-attachment finalize-attachment-upload upload-attachment \
          create-attachment-upload-ticket get-event-attachments \
          delete-attachment get-attachment-download-url preview-receipt; do
  npx supabase functions deploy "$fn" --project-ref lvjsfnphlauldxqlncpl
done
```

**Avvägningen, ärligt:** den kanoniska formen bumpar 15 no-ops i onödan —
harmlöst i sig (T39 §2 mätte tre rena no-op-redeploys). Den smala formen
förlorar skriptets två skyddsräcken: den fail-closed allowlist-kontrollen och
garantin att aldrig göra ett namnlöst deploy. **Rekommendation: kanonisk form.**
De 15 no-oparna är bevisat innehållslika, och skriptet är den granskade vägen.

**Förväntad utdata per funktion:**

```json
{"project_ref":"lvjsfnphlauldxqlncpl","functions":["<namn>"],"message":"Deployed Functions."}
```

### Steg 4 — Verifiera deployen

```bash
npx supabase functions list --project-ref lvjsfnphlauldxqlncpl
```

**Lyckades när:** alla 38 står `ACTIVE` med färsk `UPDATED_AT`, de tre nya finns
nu, och `test-auth` fortfarande saknas.

### Steg 5 — Deny-triple

Formen (`T39` §6, runbook rad 346–392): **anon → 401 · fel metod → 401 ·
anon-Bearer → 401**. Alla tre blir 401 därför att gatewayen (`verify_jwt = true`)
stoppar varje JWT-lös anropare **före** funktionskoden.

```bash
set -a; source .env.production; set +a
FN="$VITE_SUPABASE_URL/functions/v1"
ANON="$VITE_SUPABASE_ANON_KEY"

# GET-funktioner
for f in get-attachment-download-url get-event-attachments; do
  curl -s -o /dev/null -w "$f anon      %{http_code}\n" -X GET  "$FN/$f"
  curl -s -o /dev/null -w "$f fel metod %{http_code}\n" -X POST "$FN/$f"
  curl -s -o /dev/null -w "$f anon-bear %{http_code}\n" -X GET -H "Authorization: Bearer $ANON" "$FN/$f"
done

# POST-funktioner
for f in preview-receipt delete-attachment generate-event-attachment \
         upload-attachment finalize-attachment-upload send-email send-action-email; do
  curl -s -o /dev/null -w "$f anon      %{http_code}\n" -X POST "$FN/$f"
  curl -s -o /dev/null -w "$f fel metod %{http_code}\n" -X GET  "$FN/$f"
  curl -s -o /dev/null -w "$f anon-bear %{http_code}\n" -X POST -H "Authorization: Bearer $ANON" "$FN/$f"
done
```

Metoderna är **källverifierade** ur varje EF:s egen metod-vakt
(`req.method !== '…'` i respektive `index.ts`), inte antagna.

**Förväntat:** `401` överallt. **`404` = deployen gick inte igenom** (tillbaka
till steg 3). **`200` någonstans = STOPPA** och rulla tillbaka per § R2.

**Valfri fjärde probe** — fel metod **plus** anon-nyckeln som Bearer. Anon-nyckeln
är ett giltigt signerat JWT som passerar gatewayen men faller i `requireUser`, så
anropet når metod-vakten först. Förvänta `405`, men **ingen `Allow`-header**
(T39-bifynd, TASK-38). Diagnostisk, inte blockerande.

### Steg 6 — Prod-verifikatspunkterna

| # | Verifikat | Väntar på deploy? | Not |
|---|---|---|---|
| a | **261-blinkfixen** (login→passkey) | **NEJ** | Front-only, redan på `main` — §4.3 |
| b | **Dokument-ytans Visa** | **JA** | Kärnan i svepet — §4.1 |
| c | **Testmail till egen inkorg** | **JA** | `send-action-email` — §4.2 |

**Före allt browser-arbete:** DevTools → Application → Storage → **Clear site
data**. Service worker-precachen kan annars servera en gammal bundle, och ingen
passiv självläkning finns (runbook steg 6 punkt 3).

**b — Dokument-ytans Visa:** öppna ett event → Dokument-ytan → **Visa** på en
uppladdad bilaga (klass A), ett event-mallat dokument (klass B) och ett kvitto
(klass C). Pröva även **ersätt/radera** (`delete-attachment`).

**c — Testmail:** åtgärdsytan → "Testmail till mig". Mailet går **alltid** till
`user.email` ur JWT:n, aldrig till en klientburen adress
(`_shared/send-action-email.ts` § `runActionTestSend`).

### Steg 7 — Länka tillbaka till staging

```bash
echo "" | npx supabase link --project-ref pqtshyierkdgwdnxuirz
cat supabase/.temp/project-ref     # ska skriva pqtshyierkdgwdnxuirz
```

**Hoppa inte över detta.** `link`-tillståndet är sticky och osynligt — nästa
`db push` eller `db query --linked` i samma katalog går annars mot prod
(runbook steg 8 + fälla 4).

### Steg 8 — Bokför

Skriv de **faktiskt uppmätta** värdena i korten: HTTP-koderna från steg 5,
`UPDATED_AT` från steg 1 och 4, tidsstämpeln på testmailet.
*"Klart" är inte ett mätvärde* (runbook rad 540).

```bash
npm run bl -- task edit 147.12 --check-ac 3
npm run bl -- task edit 245 --check-ac 3
npm run bl -- task edit 246 --check-ac 4
```

**Passa samtidigt på att rätta de två faktafelen** (§5 R6, R7) — de är
billigast att åtgärda medan mätdatan ligger framme.

---

## 4. Verifikatspunkterna i detalj

### 4.1 Dokument-ytans Visa — vad den behöver

Källa: `src/data/adapters/AirtableAdapter.ts` rad 721–771.

| Klass | EF | Metod | Prod-status |
|---|---|---|---|
| A (uppladdad) | `get-attachment-download-url` | GET | **ALDRIG DEPLOYAD** |
| B (event-mallad) | `generate-event-attachment` (`preview: true`) | POST | Deployad, men **utan preview-grenen** |
| C (person-genererad, kvitto) | `preview-receipt` | POST | **ALDRIG DEPLOYAD** |
| Radera/ersätt | `delete-attachment` | POST | **ALDRIG DEPLOYAD** |

Bokföringen drar själv slutsatsen: *"Därefter fungerar dokument-ytans Visa i
PROD"* (`tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 1235) ⇒ **den fungerar
inte i prod idag.**

`preview-receipt` är avsiktligt en **egen** EF: `send-receipt-email` kan inte
återanvändas eftersom den alltid allokerar ett riktigt kvittonummer och skickar
ett riktigt mail vid lyckad körning (`.prod-functions-allowlist.conf` rad 75–88).

**Airtable-förkravet är redan uppfyllt.** `Dokumentklass` skapades i prod-basen
2026-08-16 (fält-ID `fldeB2dlwfk2KkKVT`; choices `selzhVB3EU7vAGetM` /
`selRCThfTxaBeZuvU` / `selu96NPchIercPeU`) — `task-147.12`s klicklista punkt 1–2
är utförda. `Bilagor` (`tblevR1B54wFjp7QC`) och `Kvitton` (`tblZC6jBQIHiuS24a`)
speglades till prod 2026-08-11 (`data-model.md` rad 146–152).

### 4.2 Testmailet — koden ÄR på main

`runActionTestSend` landade 2026-08-10 (`2877d403`, TASK-147.10, status `Done`)
och finns på `origin/main` i `_shared/send-action-email.ts` rad 293 och
`send-action-email/index.ts` rad 499. `send-action-email` deployades till prod
2026-08-11 och 2026-08-15 — **testmail-grenen finns alltså sannolikt redan i
prod.** Men EF:en har drivit sedan dess via `_shared/field-allowlists.ts`
(§2.3 rad 12), så den ingår i svepet ändå.

### 4.3 261-blinkfixen — front-only, ingen EF inblandad

`ac8aed14` *"fix(auth): [TASK-261] ta bort racet som blinkade fram
Förberedelseskärmen mellan inloggning och passkey-erbjudande"* (2026-08-17),
landad via PR #1528 (merge `1fb8533a`), **verifierad ancestor till
`origin/main`**.

Rör `src/routes/login.tsx`, `src/lib/auth/inloggningsdestination.ts`,
`tests/acceptance/login.acceptance.test.ts` och ett kort. **Noll filer under
`supabase/functions/`.**

**Slutsats: den rullas ut av Vercels git-integration, inte av detta EF-svep** —
och är alltså sannolikt redan ute. Men **det kan inte bekräftas härifrån**:

> `TASK-199` är fortfarande **`To Do`** (`backlog/tasks/task-199…`,
> `updated_date: 2026-08-14`). Runbookens steg 6 är därmed **fortfarande
> preliminärt**, och kortet mätte prod-fronten **stale ≥20 timmar** över ~15
> merges trots grön git-integration. **Verifiera mot Vercel-dashboarden**
> (senaste Production-deployens SHA == `git rev-parse origin/main`) innan
> blinkfixen bedöms som ute.

---

## 5. Riskrader och rullbakåt

| # | Risk | Vad som händer | Rullbakåt / åtgärd |
|---|---|---|---|
| **R1** | **Fel projekt länkat** | Skarp operation träffar Lottas data i stället för staging | `cat supabase/.temp/project-ref` **före varje** skarp operation + steg 7 efteråt. Runbook **fälla 4**. *Precedent: fem EF:er deployades OAVSIKTLIGT till prod 2026-08-10 16:47 på exakt detta fel* (`tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 155–191) |
| **R2** | **`link` hänger** | Det är prompten för databas-LÖSENORDET, inte ett inloggningsfel | `echo "" \|` före kommandot. *"En hängning är inte ett felmeddelande."* **Fälla 1** |
| **R3** | **En EF deployas trasig** | Ingen rollback-till-föregående finns i Supabase CLI (verifierat: `functions` har bara `list/delete/download/deploy/new/serve`) | Runbook **§ R2**: `git checkout <känd-god-sha> -- supabase/functions/<namn>` → deploya → `git checkout HEAD -- …`. För de **tre nya**: `functions delete <namn>` = ren återgång |
| **R4** | **Deploy-loopen avbryter halvvägs** | `set -euo pipefail` + ohanterad loop ⇒ första felet stoppar skriptet. Tidigare EF:er deployade, resten inte — **partiellt tillstånd, ingen transaktion** | Läs vilken funktion som föll, rätta, kör om. Skriptet är idempotent per funktion |
| **R5** | **`CORS_ALLOWED_ORIGINS` saknar prod-origin** | Varje webbläsaranrop avvisas i preflight — **deny-triplen ser ändå grön ut** (curl skickar ingen `Origin`) | Verifiera i **steg 1** via `secrets list`. Runbook rad 293–296 |
| **R6** | **`task-147.12` påstår något FALSKT** | Kortets notes säger *"EF:erna aldrig prod-deployade ⇒ inga rader kunnat födas"*. **Motsagt av tre källor:** de fyra bilage-EF:erna deployades oavsiktligt 08-10, avsiktligt i 33/33 08-11, och i 35/35 08-15. Rätt förklaring till noll rader: **ingen har laddat upp en bilaga i prod-appen** | **Ingen deploy-blockerare** — men det är repots enda källa som påstår detta, och den motsäger tre andra. **Rätta kortets notes** |
| **R7** | **`data-model.md` är FEL om `Dokumentklass`** | Rad 158/165–168 säger *"finns ENDAST i staging"* och *"prod-Bilagor har fortfarande bara sina ursprungliga 5 fält"*. **Falsifierat** — fältet skapades i prod 08-16 (`fldeB2dlwfk2KkKVT`). Kortets punkt 5 är ogjord | **Ingen deploy-blockerare** — men `data-model.md` är auktoritativ för fält-data (**ADR-100 §1**), så en agent som läser den drar fel slutsats. **Flytta raden till en prod+staging-sektion med prod-ID:t** |
| **R8** | **`send-email` bär ny paritetslogik** | AND/DNF-membership + server-side tidsperiod (`TASK-249.2`/`249.3`) finns **inte** i prod — och `send-email` är en **utskicksväg mot verkliga mottagare**. Kortet bokför endast **staging**-bevis (`task-249.3` rad 65–71) | Deployen ändrar hur segment **löses upp** till mottagare. **Verifiera mottagarurvalet i prod före ett skarpt utskick** — inte efter |
| **R9** | **`create-attendance` är exkluderad** | Landad 2026-08-14 (`7a66316b`, TASK-214.1 check-in-dörrens backup-väg), har `config.toml`-post rad 87, men **saknas i allowlisten** ⇒ backup-vägen fungerar aldrig i prod | Avgör medvetet: **antingen** allowlist-rad med GO-citat per filens konvention, **eller** explicit beslut att den förblir staging-only. **Gissa inte** — fail-closed-formen är avsiktlig |
| **R10** | **Fronten stale trots grön deploy** | Mätt ≥20 h över ~15 merges; plus PWA-precachen klientsidan | `TASK-199` **öppen**. Runbook **§ R3**: Clear site data → promota tidigare deploy i Vercel → revert-PR. Läs kortet före val av väg |
| **R11** | **Två CLI-versioner** | Deploy-skriptet kör bar `supabase` **2.75.0**; övriga kommandon `npx supabase` **2.114.0** | Bekräftat live (§1.3). Kör `supabase --version` om något beter sig oväntat. **Fälla 6** |
| **R12** | **Agent nekas mitt i** | Prod-ref-låset ser Claude Codes Bash-anrop | Avsiktligt. Kör i egen terminal. **Låt aldrig en agent konstruera bypass-prefixet.** **Fälla 8** |

**Total återgång (runbookens § R4):** R10 (fronten) → R3 (radera de tre nya) →
steg 7 (länka tillbaka till staging). Sista steget glöms lättast och kostar mest
senare.

---

## 6. Källförteckning

| Påstående | Källa |
|---|---|
| Åtkomstbeviset | `npm run atkomst:diagnos`, körd 2026-08-17 |
| Låsets fällning | `scripts/deny-prod-ref.sh` via `PreToolUse`, mätt 2026-08-17 |
| Bypass-formens ägare | `scripts/deny-prod-ref.sh` § MEDVETEN VÄG FÖRBI |
| Deploy-set 38 / exkluderade 5 | `bash scripts/deploy-prod-functions.sh --list`, 2026-08-17 |
| Handoffens "12 EF:er" | `tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 1232, 1367; `tasks/todo.md` rad 67, 102 |
| Prod-baslinjen 35/35 | `tasks/sessions/archive/2026-08/2026-08-15-session-106.md` rad 160–165 · `tasks/todo.md` rad 29–31 · `docs/BUILD-LOG.md` rad 3284–3287 |
| 33/33-deployen 08-11 | commit `c6c96a52` meddelandekropp · `tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 317 |
| Aktivitetsloggen 08-13 | `tasks/sessions/archive/2026-08/2026-08-11-session-105.md` rad 983, 1059–1061 · `backlog/tasks/task-201.9` rad 77–81 |
| Ref-incidenten 08-10 | `tasks/sessions/archive/2026-08/2026-08-10-session-102.md` rad 155–191 |
| Driftkartan | `git log origin/main` per EF-katalog + transitiv `_shared`-upplösning |
| 8 commits efter baslinjen | `git log origin/main --since=2026-08-15 -- supabase/functions/` |
| T39-mönstret | `docs/research/t39-ef-sync-preflight-2026-07-24.md` §1–§3 |
| VERSION vs UPDATED_AT | `docs/BUILD-LOG.md` rad 2029 |
| Runbookens steg | `docs/reference/prod-driftsattning-runbook.md` (rad angiven per punkt) |
| `Dokumentklass` i prod | `backlog/tasks/task-147.12` Implementation Notes, sista stycket |
| `data-model.md`-driften | `docs/reference/data-model.md` rad 158, 165–168, 172 |
| `send-email` staging-only | `backlog/tasks/task-249.3` rad 65–71 |
| 261-fixen | `ac8aed14`, `git merge-base --is-ancestor` mot `origin/main` |
| `TASK-199` öppen | `backlog/tasks/task-199…` frontmatter `status: To Do` |
| Testmailets kod | `git grep runActionTestSend origin/main`; `2877d403` |
| EF-metoderna | `req.method !== '…'` i respektive `index.ts` |
| CLI-versionerna | `supabase --version` / `npx supabase --version`, 2026-08-17 |
| Saknat `--audit`-läge | `t39-ef-sync-preflight-2026-07-24.md` rad 165–172 · `backlog/tasks/task-37` |
