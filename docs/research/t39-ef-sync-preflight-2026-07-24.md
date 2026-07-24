# T39-pre-flight: EF-sync-kartan prod→HEAD + deploy-/smoke-plan (S84, 2026-07-24)

> **Proveniens:** Session 84 (parallell session bredvid aktiva S83, T67/
> S82-formen). Pre-flighten T39-noten föreskriver ("diff disk vs deployad
> per funktion") — utförd read-only: ingen prod-mutation, ingen deploy.
> Metod: `supabase functions list` mot båda projekten med explicit
> `--project-ref` (T34-disciplinen) + `supabase functions download` av
> samtliga 12 deployade prod-funktioner till scratch (aldrig in i
> arbetsträdet) + innehålls-diff mot disk-HEAD (`e5830cd`), inklusive den
> BUNDLADE `_shared/`-versionen per funktion (L204: deployad artefakt är
> sanningen, inte pushad källa). Korsverifierat mot
> `docs/reference/data-model.md` § Prod-basens additiva tillskott och
> `npx supabase secrets list` (namn, ej värden).

<!-- markdownlint-disable-next-line MD028 -->

> **UTFALL 2026-07-24 (samma dag, S84 A-kedjan på Marcus-go):** planen
> §5–§6 EXEKVERAD. test-auth raderad (§7 AC #1) → kanonisk
> full-allowlist-deploy 13/13 (11 versionsbump + notes-paret NYTT I
> PROD) → deny-triple ×13 grön → autentiserade smokes gröna: läs-tripeln
> (Airtable-secreterna runtime-bevisade — §3.1-fyndet stängt),
> create-event-idempotensen (201→replay 200 samma rad),
> notes-rundturen, save-segment 201; ZZ-teardown verifierad. Två nya
> fynd: **fälla 45** (Månad/år-selectens options-horisont slutar dec
> 2026 → create-event 500 för 2027-event) + **sju EF:er saknar egen
> metod-vakt** (GET → 401 i stället för 405; backlog-fynd). L216:s
> override-krav upphävt. T39/T40/T33 stängda; frontend-kontrollen +
> allowlist-utvidgningen övergick till T46.

## 1. Huvudslutsats

**Den verkliga innehålls-driften är väsentligt smalare än versionsgapet.**
Versionsnummer bumpas vid varje redeploy oavsett innehåll (stagings
S75-omdeploy av hela batchen bumpade utan kodändring). Innehålls-diffen
visar: **4 funktioner har ändrad egen kod, 7 har enbart `_shared`-drift
koncentrerad till två filer** (`airtable-client.ts` + `field-allowlists.ts`),
och **3 redeploys är rena no-ops** (deployad bundle == HEAD).
Staging är HEAD-aktuell för batchen (omdeployad 2026-07-23 10:54, efter
sista EF-commiten `6bccc03` 06:38).

## 2. Sync-kartan per funktion

"Verklig drift" = filer som finns i BÅDE deployad bundle och på disk och
skiljer sig. "Only in disk"-filer är bundlings-artefakter (bundlern tar
bara importerade filer) och räknas inte som drift.

| Funktion | Prod | Staging | Verklig drift | Delta-karaktär | Klass |
|---|---|---|---|---|---|
| `create-admin-user` | v11 (2026-05-04) | v13 | **INGEN** | Redeploy = innehålls-no-op | – |
| `get-event-formats` | v3 (2026-06-27) | v6 | **INGEN** | Redeploy = innehålls-no-op | Läs |
| `compute-segment` | v3 (2026-06-29) | v7 | **INGEN** | Redeploy = innehålls-no-op | Läs |
| `get-segments` | v3 (2026-06-29) | v6 | **INGEN** | Redeploy = innehålls-no-op | Läs |
| `save-segment` | v3 (2026-06-29) | v6 | `field-allowlists.ts` | Nya operationer (se §4) — påverkar ej save-segments egen väg | Write |
| `send-email` | v1 (2026-06-29) | v8 | `field-allowlists.ts` | Som ovan; egen kod oförändrad | Write/send |
| `update-record` | v12 (2026-05-04) | v16 | `airtable-client.ts` + `field-allowlists.ts` | Env-driven bas-ID (§3) + nya operationer (§4) | **Write** |
| `create-event` | v3 (2026-06-27) | v8 | `index.ts` + `field-allowlists.ts` | Publiceringsflaggan `Publicerad på miranon.se` (task-19.4, valfri boolean, utelämnas oarmerad) | **Write** |
| `get-events` | v11 (2026-05-04) | v18 | `index.ts` + `airtable-client.ts` | Tabell per NAMN, coerce-helpers, beläggnings-läsning mot Anmälningar, env-driven bas-ID | Läs |
| `get-persons` | v12 (2026-05-04) | v15 | `index.ts` + `airtable-client.ts` | Cursor-paginering (ADR-056: `fetchAirtablePage` + cursor-kodning), tabell per namn, env-driven bas-ID | Läs |
| `get-registrations` | v12 (2026-05-04) | v19 | `index.ts` + `airtable-client.ts` | Störst egen-diff (386 rader): `fetchAirtableRecord`, filter-ombyggnad, coerce, tabell per namn, env-driven bas-ID | Läs |
| `test-auth` | v10 (2026-05-04) | v13 | INGEN (== HEAD:s test-only-kod) | **RADERAS, aldrig redeploy** — TASK-35 (§7) | Förbjuden |
| `create-event-note` | **SAKNAS** | v2 | NY i prod | Write mot nya Anteckningar-tabellen (`tblaUhH1KF9k9imul`, finns i prod) | **Write** |
| `get-event-notes` | **SAKNAS** | v2 | NY i prod | Läs mot Anteckningar | Läs |

## 3. Nyckelfynd

1. **Bas-ID-skiftet är kärnan i 2026-05-04-kvintettens drift.** Deployad
   kod bär hårdkodat `AIRTABLE_BASE_ID = 'app8uGPrVCVOm6LfD'`; HEAD läser
   env-secret med fail-fast och INGEN fallback (ADR-050:s isolerings-spak).
   Secreten **finns** i prod (satt 2026-06-15, verifierat via
   `secrets list`) — men dess VÄRDE är såvitt bokfört **aldrig
   runtime-bevisat**: T40-noten visar att ingen autentiserad prod-EF-körning
   mot Airtable ägt rum (deny-grindarna returnerar före datavägen).
   Smoke-planen (§6) är därför sekvenserad att bevisa secreten med en
   läs-smoke FÖRST.
2. **`field-allowlists.ts`-driften bär event-familjens nya operationer:**
   `mark-final-payment-paid`, `update-registration-payment-note`,
   `log-payment-reminder`, `set-registration-lodging`, `update-event`,
   `create-event-note`, `send-email`, `send-registration-confirmation`.
   Fält adresseras per NAMN (ADR-050-portabilitet); samtliga fältnamn de
   kräver finns i prod sedan S75-speglingen (korsverifierat mot
   data-model.md-tabellen: Notering-/Påminnelse-fälten, `Bor över`,
   `Publicerad på miranon.se`, Anteckningar-tabellen).
3. **Känd kvarstående bas-divergens:** `Väntelista.Event` är singleLineText
   i prod (länkfältet medvetet EJ speglat — typkonvertering är inte
   additiv). Berör `get-event`:s väntelista-räkning — som INTE är
   allowlistad och inte ingår i synken. Ingen sync-blockerare; T16-kandidat.
4. **Allowlist-gapet mot appens faktiska EF-yta:** 9 disk-EF:er som
   event-familjens app-kod anropar står UTANFÖR allowlisten och finns inte
   i prod: `get-event`, `get-attendance`, `update-event`,
   `create-registration`, `get-waitlist`, `get-person`, `get-leads`,
   `get-mail-log`, `send-registration-confirmation`. T39-synken gör alltså
   prod HEAD-aktuell för de 13 allowlistade — men prod-appen blir INTE
   funktionellt komplett för event-familjen förrän allowlisten medvetet
   utvidgats (per-rad-beslut per conf-filens kontrakt). Det är
   go-live-kartans fråga (T46), inte T39:s — registrerad öppet här.
5. **Redeploy-no-op:erna är trots det värdefulla:** de tre no-op-funktionerna
   och `create-admin-user` lyfts till samma deploy-ögonblick som övriga, vilket
   nollställer L216-läget (deklarerad ≠ deployad-aktualitet upphör).

## 4. Förkravskedja (måste hålla FÖRE deploy)

1. **Marcus-go** för prod-mutationen (T39-synken är en 13-funktioners
   ändring i Lottas skarpa miljö).
2. **Prod-testanvändaren provisionerad** (T40:s precondition; rätt kanal =
   dashboarden/Marcus — ej programmatisk kontoskapelse, inget lösenord i
   chatt). Utan den kan §6 steg 3+ inte köras och synken saknar
   verifieringsväg — T39-noten klassar det som icke försvarbart.
3. Rent `main`-HEAD med gröna grindar; deploy sker från main-utcheckning,
   inte från branch/worktree.
4. **Target-verifiering vid körning** (T34/L204): `supabase projects list`
   och explicit `--project-ref lvjsfnphlauldxqlncpl` i varje kommando —
   CLI:t står `linked` mot prod, länken får aldrig bära targetvalet.

## 5. Deploy-planen

1. **TASK-35 först** (oberoende av synken, minskar attack-ytan direkt):
   radera `test-auth` per §7 efter Marcus-go.
2. **Kanonisk full-allowlist-deploy:**
   `bash scripts/deploy-prod-functions.sh --project-ref lvjsfnphlauldxqlncpl`.
   Detta är FÖRSTA tillfället den oscopeade kanoniska formen är korrekt:
   alla 13 allowlist-medlemmar är HEAD-avsedda (innehålls-verifierade i §2),
   så L216:s override-smalnings-KRAV upphör i och med lyckad synk — bokförs
   i T39-tråden vid stängning. Skriptets utskrift bevisar samtidigt
   exkluderingarna (test-auth + de 9 icke-allowlistade).
3. **Versions-verifiering:** `functions list --project-ref <prod>` — 13
   ACTIVE, samtliga v-bumpade med färsk `updated_at`; `test-auth` borta.
4. **Avbrottsregel (fail-closed):** varje avvikelse i steg 2–3 eller röd
   smoke i §6 stoppar kedjan — ingen delvis bokföring, T39 förblir öppen
   med avvikelsen registrerad.

## 6. Smoke-planen

1. **Deny-triplen per funktion, direkt efter deploy** (kräver ingen
   användare, rör aldrig datavägen): anon → 401 · fel metod → 405 ·
   anon-Bearer → 401. Samma bevisform som 6f/6g-deployerna.
2. **Utan prod-testanvändare STANNAR kedjan här** — då är synken deployad
   men datavägen obevisad (exakt det T40 finns för).
3. **Autentiserad LÄS-smoke först:** `get-event-formats` (minsta läs-EF:en)
   — första lyckade 200 bevisar `AIRTABLE_BASE_ID` + `AIRTABLE_TOKEN` i
   drift (fynd §3.1). Därefter `get-events` + `get-registrations` läs.
4. **Write-idempotens-smokesen (T40:s kärna):** `create-event`
   (ZZ-create 201 → replay 200 → teardown, T40-notens form) →
   `save-segment` (201-happy-path + teardown) → `create-event-note` +
   `get-event-notes` (write → läs tillbaka → teardown mot
   Anteckningar-tabellen).
5. **`send-email` smoke-körs INTE här** — mail-vägen ägs av
   T53/T55-grindarna (go-live-grind F); synken deployar koden men
   aktiverar ingen utskicksväg.
6. Vid grönt: T40:s resolutions-trigger utlöses — closeout-förkravsraden
   ("vertikaler prod-deployade + prod-smoke-verifierade") wiras in i
   byggplanens closeout-block (T40-notens åtgärd).

## 7. TASK-35-underlaget (test-auth i prod)

**Verifierat läge 2026-07-24:** `test-auth` v10 ACTIVE i prod, deployad
2026-05-04 (före allowlisten). Innehållet är identiskt med HEAD:s
test-only-kod — ingen okänd kod, men en förbjuden yta per allowlistens
uttryckliga kontrakt.

- **AC #1 — raderingen** (EFTER Marcus-auktorisering, prod-mutation):
  `npx supabase functions delete test-auth --project-ref lvjsfnphlauldxqlncpl`
  → verifiera med `functions list` att endast allowlistade funktioner
  återstår.
- **AC #2 — audit-läget: REKOMMENDATION JA, som läge i deploy-skriptet.**
  `--audit --project-ref <ref>`: hämta live-funktionslistan, diffa mot
  allowlisten, rapportera icke-allowlistade och exit 1 vid träff
  (fail-closed även BAKÅT — dagens grind är fail-closed framåt men blind
  bakåt, exakt hålet test-auth föll igenom). Återanvänder skriptets
  befintliga allowlist-inläsning (ingen duplicerad parsning; logik
  universell, värden i conf-filen per CI-grindvakts-principen) + testfall
  i `scripts/test-deploy-prod-functions.sh`. Implementeras när TASK-35
  plockas.

## 8. Öppna Marcus-beslut (samlade)

1. Provisionera prod-testanvändaren (T40-förkravet; låser upp §6 steg 3+).
2. Go för TASK-35-raderingen (§7).
3. Go för T39-synken (§5) — rekommenderad ordning: 1 → 2 → 3.
4. Allowlist-utvidgningen för de 9 app-använda EF:erna (§3.4) — hör till
   go-live-kartan (T46); inget T39-blockeri.
