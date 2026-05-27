
# Byggplan — direktiv

> **Status:** Direktiv skapat 2026-05-04. Revisionsarbete inte påbörjat. Sektion 8.5 uppdaterad löpande under Fas A. Fas A SLUTFÖRD 2026-05-04.
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md`
> **Föregångare:** `~/Repon/miranon-media-admin/docs/conversion-plan.md` (2026-04-14, ersätts av byggplanen)
> **Output (när revisionen är klar):** `~/Repon/miranon-media-admin/docs/byggplan.md`

---

## 1. Sammanfattning

Conversion-plan är skriven 2026-04-14 och tjänade Fas 0+1 av React-konverteringen. Sedan dess har scopet växt — säkerhetshardening, datamodell-research, Airtable-drift, Supabase-migration — och "konvertering" är inte längre rätt ram. Det enda som faktiskt var Vue→React-konvertering är klart. Det som återstår är att *bygga ett system*.

Detta dokument är direktivet för byggplanen som ersätter conversion-plan: vad ska göras, varför, i vilken ordning, och vad som är beslutat sedan tidigare och därför INTE är öppet för omprövning.

Revisionsarbetet är fyra fokussessioner Chat-arbete (P0–P3). Fas A — säkerhetshardening genomfördes parallellt 2026-05-04 och är nu slutförd; revisionen kan starta i ren context.

Output är `docs/byggplan.md` plus uppdaterade stödspecs.

---

## 2. Bakgrund

Sedan conversion-plan skrevs har följande hänt, i kronologisk ordning:

| Datum | Händelse | Output |
|---|---|---|
| 2026-04-14 | Fas 0 + Fas 1 av conversion-plan genomförda | commits `fcc6de3` (Fas 0) + `c91bfa0` (Fas 1) |
| 2026-04-28 | dm-110-projektet — uttömmande dokumentation av befintlig Airtable-modell | `docs/reference/data-model.md`, 9 UNIVERSAL-lärdomar |
| 2026-04-28 | Codex projektanalys efter Fas 1 | `docs/analysis/Codex-project-analysis-after-fas-1.md` |
| 2026-04-29 | Code:s verifiering av Codex-analysen mot HEAD `245422c` | `docs/analysis/Code-verification-of-codex-analysis.md` |
| 2026-04-28 → 30 | Datamodell-research-projektet (forwards-look, 7 faser, Gate 6 passerad) | `docs/research/datamodell-research/04-research.md` → `docs/research/datamodell-research/07-migration-plan.md`, K1–K10 lyfta till lessons |
| 2026-05-03 | Odoo-validering som sidospår, post-Gate 6 | `docs/research/datamodell-research/08-odoo-validation.md`, 8 nya kandidater (E1–E8) |
| 2026-05-04 | Säkerhetshardening (Fas A) — alla 8 milstolpar levererade | 14 commits, 110+3 tester, 3 nya UNIVERSAL |

Ingen av dessa händelser är reflekterad i conversion-plan. Det är därför vi måste skriva en byggplan innan Fas 2 startar.

---

## 3. Varför conversion-plan ersätts av en byggplan

Två skäl.

**Det första är konceptuellt: ramen "konvertering" är inte längre sann.** När conversion-plan skrevs var Vue källan och vi porterade fil för fil. Idag är knappt något i den föreslagna fasstrukturen genuin konvertering — Fas A var hardening, Fas 2.5 är schema-sync mot data-model.md, Fas 3 bygger React Aria-primitiver från scratch, Fas B är Airtable-drift, Fas E är Supabase-migration. Det enda som var Vue→React-konvertering var Fas 0+1, och de är redan klara. Resten är att bygga ett system. Därav: byggplan, inte conversion-plan v2.

**Det andra skälet är konkret: åtta luckor i conversion-plan som påverkar genomförandet** (inte stilfrågor):

### 3.1 Säkerhet ligger i Fas 7, men risken var aktiv

**Conversion-plan säger:** "CSP, chaos testing, deploy" landar i Fas 7.

**Verkligheten 2026-04-29:** Code-verifieringen visade att Edge Functions var publikt skrivbara mot 18 produktionstabeller — wildcard CORS, ingen `requireUser`-gate, anon-key-fallback i klienten, formula-injektion, `create-admin-user` utan caller-verifiering.

**Konsekvens i byggplanen:** En Fas A — Säkerhetshardening lades in före Fas 2. **Status: SLUTFÖRD 2026-05-04.** Hela exponeringen stängd. Se §8.5 för detaljer.

### 3.2 Datamodellen som conversion-plan utgår från finns inte längre

**Conversion-plan säger:** Airtable är datakällan. Supabase nämns som "Fas 8 framtid".

**Verkligheten:** Vi har nu:

- `docs/research/datamodell-research/06a-airtable-redesign.md` — 12 Airtable hardening-åtgärder (A1–A12)
- `docs/research/datamodell-research/06b-supabase-target.md` — 36 Supabase target-tabeller
- `docs/research/datamodell-research/07-migration-plan.md` — strangler-fig-migrationssekvens i 10 steg, Future Code-prompt i Del H
- `docs/research/datamodell-research/08-odoo-validation.md` — 8 ytterligare kandidater (E1–E8)

**Konsekvens i byggplanen:** Två nya parallella spår behöver placeras i fasstrukturen — Fas B (Airtable hardening A1–A12, drift-arbete) och Fas E (Supabase-migration, framtida implementation som pekar på 07 Del H).

### 3.3 Status-typer i kod är out-of-sync mot data-model.md

**Conversion-plan säger:** Fas 1 (domäntransplant) är klar.

**Verkligheten:** `src/domain/types/Status.ts` speglar äldre/förenklad statusmodell. dm-110 dokumenterade sex statusvärden för Anmälningar inkl. `Inställt` och `Flytta till väntelista`. Code-verifieringen Blocker 5 bekräftar.

**Konsekvens i byggplanen:** En Fas 2.5 — Schema-kontrakt-sync inskjuten mellan Fas 2 och Fas 3 där status-typer, Zod-scheman och adapter-debt synkas mot data-model.md innan UI byggs.

### 3.4 AirtableAdapter har 9 metoder som pekar på Edge Functions som inte finns

**Conversion-plan säger:** Adapter är klar i Fas 1.

**Verkligheten:** Code-fynd F: 14 metoder deklarerade, 4 har deployad funktion, 10 är TODO med `// TODO: Edge Function 'X' behöver deployas`-kommentarer. Fas 6 kommer att smälla i runtime när UI börjar konsumera dessa metoder.

**Konsekvens i byggplanen:** Adapter-debt explicit tracked i Fas 2.5 — varje metod klassas som "deploy nu", "defer till specifik fas" eller "ta bort som död kod".

### 3.5 ACCESSIBILITY-CHECKLIST är Vue/FKUI-specifik

**Conversion-plan säger:** Fas 3 (UI-primitiver) använder den som kvalitetsgrind.

**Verkligheten:** Codex rekommendation #2 — checklistan matchar inte React-stacken (refererar fortfarande Vue-mönster och FKUI-komponentnamn).

**Konsekvens i byggplanen:** Fas 3.5 (eller integrerat i Fas 3) — A11y-baseline omskriven för React Aria + WCAG 2.2 AA innan Fas 3-leveransen kvalitetsgranskas.

### 3.6 Zod-scheman finns men används inte konsekvent

**Conversion-plan säger:** Fas 1 levererade 8 Zod-scheman.

**Verkligheten:** Codex rekommendation #3 — schemana används inte som runtime-validering vid alla externa datagränser. Adapter castar fortfarande resultat från Edge Functions utan parse.

**Konsekvens i byggplanen:** Zod-validering vid alla externa datagränser blir ägd av Fas 2.5 — Edge Function input + output, adapter response, form payloads, statusövergångar.

### 3.7 Sentry är installerad men aldrig initierad

**Conversion-plan säger:** "Sentry/Faro" nämns diffust i gap-analysen.

**Verkligheten 2026-04-29:** Code-fynd D — `@sentry/react: ^10.48.0` finns i `package.json`, men `grep "Sentry" src/` ger noll träffar.

**Status 2026-05-04:** Stängd i Fas A M7. Klient-DSN beslutat i Gate A1 (alternativ A). Sentry-konto + projekt `react-platform` etablerat. `initSentry()` anropas i `src/main.tsx` före React mount. `isOperationalError`-klassning skyddar quota mot 401/403-spam.

### 3.8 ~20 nya UNIVERSAL-lärdomar inte integrerade

**Conversion-plan säger:** Refererar lessons.md generellt.

**Verkligheten:** dm-110 (9 poster), datamodell-research (K1–K10), Odoo-validering (3 nya), Fas A (3 nya). Flera är direkt relevanta för byggplanen — t.ex. K6 om config-as-data drift, lärdomen om att verifiera mot kod inte minne, Odoo-lärdomen om mogen open source som referens, Fas A-lärdomarna om test-prefix, två-stegs auth-check, hypotes-validering.

**Konsekvens i byggplanen:** P2-steget i revisionen syntetiserar de mest relevanta lärdomarna in i fas-prompterna och stödspecsen.

---

## 4. Vad som är beslutat (frusen kontext — INTE öppet för omprövning)

Under revisionen ska vi inte återuppfinna saker som redan är beslutade. Följande är frusna:

| Beslut | Källa | Status |
|---|---|---|
| Datamodell-research-projektet är slutfört | Gate 6 passerad 2026-04-30 | FRUSEN |
| Tvåstegsstrategi: Airtable 11/10 först, Supabase sen | 07 Del A | LÅST |
| 06b är target. Inga ändringar | Gate 4B passerad | LÅST |
| Soft multi-tenant från dag ett i Supabase | G0.3 = soft | LÅST |
| Stable keys för integration sources | 06b Del D | LÅST |
| 8 Odoo-kandidater (E1–E8) lyfts i framtida 07-iteration | 08 Del E | LÅST som scope, inte som datum |
| H6 REJECTED, H3/H4/H7 DECIDED | Datamodell-research arbetsdokument §9 | LÅST |
| MK 1–3 maj är genomfört, freezen är lyft | Drift | FRUSEN |
| Fas 0 + Fas 1 är genomförda | commits `fcc6de3` + `c91bfa0` | FRUSEN |
| Fas A är slutförd (M1–M8) | commits `9490d8e` → `924af41` | FRUSEN |
| Bottom tab bar, max-width 600px, FK-inspirerad app-shell | Conversion-plan §L | LÅST |
| 21st.dev component-strategi (testa builder, fall tillbaka till inspiration) | Conversion-plan öppna beslut #5 | OFÖRÄNDRAD |
| Kvalitetsribba: bibliotek 11/11/11, vyer 11/10/10 | CLAUDE.md | LÅST |
| Hub-and-spoke-arkitekturen för marcus-system | CLAUDE.md global | LÅST — utanför detta projekts scope |
| Sentry klient-DSN (alternativ A) | Gate A1 fråga 5 | LÅST |
| Operations-baserad write-API (operationKey, inte tableId) | Fas A M4 design | LÅST |
| `corsHeadersFor(req)` per-call-mönster | Fas A M3 design | LÅST |
| `AuthContext \| Response` discriminated union | Fas A M1 design | LÅST |
| INVARIANT round-trip-mönster för säkerhetshelpers | Fas A M5 + classify401Body | LÅST |
| Structured JSON-loggning + isOperationalError-klassning | Fas A M7 | LÅST |
| Test-only-prefix `test-*` (ej `_test_*`) | Fas A M2 | LÅST |

Allt annat är öppet för omprövning under revisionen.

---

## 5. Föreslagen fasstruktur (preliminär — finslipas i P1)

| Fas | Namn | Status | Estimat | Anmärkning |
|---|---|---|---|---|
| 0 | Projektsetup + tokens | KLAR | – | Frusen |
| 1 | Domäntransplant | KLAR | – | Frusen |
| **A** | **Säkerhetshardening** | **KLAR** | **1 dag** | **Genomförd 2026-05-04** — se §8.5 |
| 2 | Routing + Auth | NY scope | 1 session | Bygger på Fas A:s `requireUser` |
| **2.5** | **Schema-kontrakt-sync** | **EJ PÅB.** | **1 session** | Schema-kontrakt-sync — Status.ts mot data-model.md, Zod vid alla externa datagränser, **adapter-debt klassad (deployar 0 EF — se A5-klassningstabell i sessionsdok)**, ev. borttagning av död-kod-stubs |
| 3 | UI-primitiver | NY scope | 2–3 sessioner | Förutsätter ny a11y-baseline |
| **3.5** | **A11y-baseline (alt. integrerat i Fas 3)** | **EJ PÅB.** | **0,5–1 session** | **Villkorad** — egen fas eller integrerad i Fas 3, triggas av P2:s checklist-bedömning enligt trigger-kriterier i sessionsdok. Estimat: **0,5–1 session (egen fas) ELLER 0 (integrerat i Fas 3)**. |
| 5 | App-shell + tab bar | NY scope | 1 session | **Förenklat** — minimal app-shell + tab bar + skip-to-content + route announcer + responsivt 375/768/1024 + `prefers-reduced-motion`/`prefers-contrast:more` + **error boundaries app/sektion-nivå** + **Workbox SW (cache-first/network-first/offline.html)** + **TanStack offline-config**. **View Transitions, Speculation Rules, web-vitals och widget-error-boundary flyttade till Fas 7.** **1 session** (förenklat från 1–2). ADR krävs för förenklingsbeslutet. |
| **5.5** | **Första vertikala produktionsslice** | **EJ PÅB.** | **2 sessioner** | Vertikal write-slice: 'markera anmälan-betalning' via befintlig `update-record` EF med ny operationKey. **Inga nya EF-deploys.** Hostas i minimal Event-detaljvy med Betalning-flik. Etablerar TanStack optimistic mutation-mönster + operations-allowlist-utvidgning + 3 Playwright-tester (2 deny, 1 allow) + Fas A:s aktiveringsguides 5 steg. ADR-krav för mutation-mönstret som mall för Fas 6. **2 sessioner** (oförändrat). |
| 6 | Hem + Event + Personer + Mer | NY scope | 3,5 sessioner | **Strangler-fig-sekvens i fem sub-faser:** **6a Persons** (0,75 sess, deployar `fetchPerson`) → **6b Events** (0,75 sess, deployar `fetchEvent` + `fetchAttendance`) → **6c Registrations + Väntelista** (1 sess, deployar `createRegistration` + `fetchWaitlist`, ADR för idempotency) → **6d Hem-aggregering** (0,5 sess, polling 60s + pull-to-refresh + visibility-trigger) → **6e Mer villkorlig** (0,5 sess, ev. `sendEmail` med direct-Resend-ADR + ev. `fetchLeads`/`fetchMailLog` om behållna). Per-sub-fas: registrera operation i `field-allowlists.ts` + deny/allow-test grönt. Realtime-subscription defer:ad till Fas E. **Total 3,5 sess oförändrat.** |
| 6.5 | Aktivitetslogg | OFÖRÄNDRAD | 2 sessioner | – |
| 7 | Konsolidering | NY scope | 2,5 sessioner | Konsolidering — säkerhet redan i Fas A. **Ärver från B3:** View Transitions implementation, Speculation Rules, web-vitals rapportering, widget-error-boundary. **Plus existerande:** test-prefix-exkludering från prod-deploy, CSP-plugin (ADR), PostCSS-fix-bedömning (sidofix), DataTable villkorlig, 3 ADR:er från P0 (CSP-defer, conversion-plan→byggplan-skiftet, Fas 4-borttagning), vy-namn i design-audit-skriptet, chaos testing, deploy-prep. **Background Sync defer:ad till Fas 8** (separat ADR). **2,5 sessioner** (utökat från 2 pga B3-flyttar). |
| **B** | **Airtable hardening (A1–A12)** | **EJ PÅB.** | **Parallell** | **Parallell-spår, drift**. Fotnot: Synk-gate 1 — A1–A12 inventerade före Fas 2.5. Synk-gate 2 — handshake mot `field-allowlists.ts` per Fas 5.5/6-operation. Ägs av Lotta + Roger med Code-stöd punktvis. Inte session-räknad. |
| **E** | **Supabase migration (07 Del H)** | **DEFER** | **Senare** | Pekar på 07 Del H. **Fas E-fönster inkluderar omskrivning av sendEmail till outbox-pattern + ev. fetchEngagements-deploy beroende på Gate 4B fråga 4-resolution.** |
<!-- vale Vale.Repetition = NO --> <!-- legitim repetition: svensk förkortning "m.m." (med mera) -->
| **8** | **Background Sync m.m. (defer:ad)** | **FRAMTID** | **Framtid (post-Fas E)** | **Framtid (post-Fas E).** Background Sync API (offline-mutationskö, defer:ad från Fas 7 — se ADR). Övrigt scope (Passkeys, push) ej låst i denna revision. Estimat fastställs vid aktualisering. Ersätter conversion-plans 'Fas 8 — Passkeys, push, offline'. |
<!-- vale Vale.Repetition = YES -->

**Numreringsnot:** Byggplanen behåller conversion-plans siffror för Fas 0–8 för att undvika omdöpning av befintliga fas-prompter och lessons.md-poster. Det "saknas" en Fas 4 — den är medvetet borttagen i conversion-plan (DataTable flyttad till Fas 7). Nya faser får bokstavs- eller decimalsuffix (A, B, E, 2.5, 3.5, 5.5). **Fas 8** har omdefinierats: conversion-plans ursprungliga "Fas 8 — Passkeys, push, offline" ersätts av framtidsspår där Background Sync är primär leverans (defer:ad från Fas 7 — se sessionsdok 2026-05-04-byggplan-revision-p1.md Del 6 + ADR).

---

## 6. Revisionsplan — P0 → P3

Fyra fokussessioner Chat-arbete. Fas A är klar — revisionen kan starta i ren context.

### P0 — Inventering (1 session)

**Mål:** Konkret lista över påståenden i conversion-plan som motsägs av nyare dokument.

**Output:** `docs/logs/byggplan-revision-inventory.md` med tabellen "Påstående → Källa → Korrigering".

**Indata att gå igenom:**

- `docs/conversion-plan.md` (~1 800 rader) — sektion för sektion
- `docs/analysis/Codex-project-analysis-after-fas-1.md`
- `docs/analysis/Code-verification-of-codex-analysis.md`
- `docs/research/datamodell-research/04-research.md` → `docs/research/datamodell-research/08-odoo-validation.md`
- `marcus-system/tasks/lessons.md` (sektioner 2026-04-28 → 2026-05-04)
- §8.5 i detta direktiv (Fas A-fynd)
- `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` (Fas A-arbetsdokument inkl. slutsummering)

**Stop-test:** Inventering är klar när varje påstående i conversion-plan §D (fas-för-fas-plan) är klassad: oförändrad / behöver justering / behöver omformuleras / försvinner.

### P1 — Fas-sekvens-revision (1 session)

**Mål:** Slutgiltig fas-lista för byggplanen. Beslut på alla "NEW" och "modified scope"-faser ovan.

**Output:** Uppdaterat avsnitt 5 i detta direktiv + en kort design-not per ny fas (vad är scope, vad är inte scope, vilka beroenden, vilket estimat).

**Beslut som måste fattas i P1:**

- Är Fas 3.5 (a11y-baseline) en egen fas eller integrerad i Fas 3?
- Är Fas 5.5 (vertikal slice) "list-anmälningar" eller något annat? **(Måste vara write-flow per §8.5.1)**
- Sekvenseras Fas 6 enligt strangler-fig (Persons → Events → Registrations) eller enligt "Hem först"-prioritet?
- Är Fas B (Airtable hardening) helt parallell, eller har den beroenden mot Fas A?
- Vilka adapter-debt-metoder ska deployas i Fas 2.5 vs defer:as till senare faser?

### P2 — Stödspec-synkning (1 session)

**Mål:** Uppdatera de stödspecs som är direkta beroenden för byggplanens fasprompter.

**Filer att uppdatera (preliminär lista):**

- `docs/specs/SECURITY-SPEC.md` — införliva Code-verifieringens fynd, Fas A-resultat (klient-DSN, två-stegs auth-check, test-*-prefix-konvention, operations-baserad API, INVARIANT-mönster, structured JSON-loggning)
- `docs/specs/ACCESSIBILITY-CHECKLIST.md` — skriv om för React Aria + WCAG 2.2 AA
- `docs/specs/STATE-STRATEGY.md` — synk mot strangler-fig-ordningen i 07
- `docs/research/react-stack-research.md` — markera vad som är överspelat sedan 2026-04
- `docs/reference/data-model.md` — kontrollera att den fortfarande är källan för status-typer (den ska vara det per dm-110)

**Filer som troligen INTE behöver uppdateras (kontrolleras kort):**

- DESIGN-MANIFESTO, DESIGN-OPERATING-SYSTEM, DESIGN-SYSTEM-SPEC — designprinciper är oförändrade
- KVALITETSDEFINITIONER-11.md — kvalitetsdefinitionerna är kärnstabila
- PERFORMANCE-BUDGET, URL-STATE-SPEC, ARIA-UPGRADE — kontrolleras kort men förväntas oförändrade
- FUTURE-COMPAT.md — uppdateras endast om Passionslyftet-tidsplanen ändrats

### P3 — Skriv byggplanen + städning (1–2 sessioner)

**Mål:** `docs/byggplan.md` är klar, granskad och committad. Repo:t är "rent och 11/10" — alla artefakter på rätt plats, ingen drift mellan dokument och verklighet.

**Output (byggplan):**

- `docs/byggplan.md` (ny fil, ersätter conversion-plan som styrande dokument)
- `docs/archive/conversion-plan-2026-04-14.md` (arkiverad conversion-plan)
- ADR i `docs/decisions/` om varför conversion-plan ersattes av byggplan, inte uppdaterades till v2

**Output (städning) — DoD för "rent och 11/10":**

*Repo-hygien:*

- `tasks/byggplan-direktiv.md` markeras SLUTFÖRT
- `docs/BUILD-LOG.md` får ny sektion för Fas A (alla 8 milstolpar med commit-hashar, planerat vs faktiskt, avvikelser)
- ADR:er skrivna för alla beslut Fas A låst (operations-baserat API, corsHeadersFor, AuthContext|Response, klient-DSN, INVARIANT-mönster, structured logging)
- `tasks/todo.md` rensad från conversion-plan-poster + uppdaterad enligt byggplanen
- Lessons.md UNIVERSAL-poster lyfta från projekt → marcus-system per WORKFLOW.md
- `docs/decisions/README.md` uppdaterad

*Dokument-hygien:*

- `CLAUDE.md` (projekt) uppdaterad med ny fasordning + alla referenser till conversion-plan
- `CLAUDE.md` (global, marcus-system) uppdaterad om något UNIVERSAL kommer från revisionen
- Stödspecs uppdaterade per P2

*Verifierings-hygien (sanity-baseline innan UI-bygg startar):*

- `npm run test:api` → grön (113 tester förväntas)
- `npm run typecheck` → 0 fel
- `npx @biomejs/biome check .` → 0 fel
- `npm run build` → grön
- Lighthouse-baseline tagen på en placeholder-route (för senare jämförelse)

*Beslut värda att ta i P3 (men kan defer:as till första session de blir aktuella):*

- 4 CSS-warnings i `src/styles/base.css:72-75` — behåll eller städa?
- PostCSS audit-fix — kör nu eller vänta?
- ADR för CSP-plugin-deferral till Fas 7

---

## 7. Hela planen i sekvens (efter att byggplanen är skriven)

| Vecka från idag | Code | Marcus + Chat | Lotta/Roger |
|---|---|---|---|
| 1 (klar) | Fas A — säkerhetshardening, M1–M8 ✅ | – | – |
| 2 | – | P0 + P1 + P2 + P3 | (Eventuell start på Fas B) |
| 3 | Börja Fas 2 mot byggplanen | Granska Fas 2-output | Fas B om ej påbörjat |
| 4–5 | Fas 2.5 + Fas 3 | Granska + uppdatera lessons | Fas B fortsatt |
| 6–7 | Fas 5 + 5.5 (vertikal slice) | Granska | – |
| 8–11 | Fas 6 (4 flikar mot live-data) | Granska | – |
| 12–13 | Fas 6.5 + Fas 7 | Slutgranskning | – |
| Senare | Fas E — Supabase-migration enligt 07 | – | – |

Tidsangivelser är illustrativa — verkliga sessionsfrekvensen styrs av Marcus.

---

## 8. Öppna frågor som besvaras under revisionen

(Inte uttömmande — fler kommer dyka upp under P0–P1.)

1. **Hur strängt sekvenseras Fas 6 efter strangler-fig?** Persons-domän först, eller Hem-vyn först? Argumenten: Persons-först bygger fundament som resten lutar mot; Hem-först ger Lotta värde tidigast.
2. **Ska Fas 3.5 vara egen fas eller integrerad i Fas 3?** Argumenten: egen fas ger tydlig kvalitetsgrind; integrerad sparar overhead.
3. **Vad är "Första vertikala slice" konkret?** Måste vara write-flow per §8.5.1 — bara läsa-flöden bevisar inget om M4-infrastrukturen. Konkret förslag fattas i P1.
4. **Ska Fas B (Airtable hardening) ägas av Code eller Marcus + Lotta?** A1–A12 är drift på Airtable-basen. Code kan stödja men driver inte rutinarbete.
5. **Hur hanterar byggplanen conversion-plans "öppna beslut" som ännu inte är stängda?** Färgvariabler #8E5F07 vs #96680A, fokusring guld vs mörkblå, 21st.dev component_builder.
6. **Vad i adapter-debt-listan (Code-fynd F) ska deployas vs defer:as i Fas 2.5?**
7. ~~DSN-strategi för Sentry — klient eller backend?~~ **STÄNGD** — klient-DSN beslutat i Gate A1, implementerad i Fas A M7.
8. **Ska aktivitetsloggen (Fas 6.5) byggas mot Airtable eller direkt mot Supabase?** Påverkar timing relativt Fas E.

---

## 8.5 Fynd och flaggor från Fas A som påverkar byggplanen

> Fas A är slutförd 2026-05-04. Sektionen är frusen. Fynd integreras i fas-prompterna under P3.

### 8.5.1 M4 discovery-fyndet (2026-05-04)

Discovery-fasen i M4 visade att Vue-versionen är **mestadels placeholder**, inte sanningskälla för UI-skrivflöden. Lottas skrivande idag sker via:

- Airtable Interface direkt (Lotta klickar i Airtable-UI)
- Zapier-ingest från externa formulär (per K6/G14/H7)

Edge Functions är byggda men har inga UI-callers. Hypotes-listan från Gate A1 fråga 6 är härledd från `data-model.md`, inte från observerad användning.

**Beslut:** M4 implementerades som "infrastruktur + tom allowlist". Operations läggs till när faktiska write-flöden byggs.

**Konsekvens för Fas 5.5 (vertikal slice):**

- Sliceen måste vara en write-flow för att ha värde som mall
- Sliceens DoD ska inkludera: lägg till första operation i `field-allowlists.ts` + skapa motsvarande Playwright deny/allow-test mot operation
- Allowlist växer organiskt med UI:t, inte i förväg

**Konsekvens för Fas 6:**

- Varje vy som skriver lägger till sin operation i `field-allowlists.ts`
- Fas 6:s per-vy-checklista måste innehålla: "operation registrerad? deny/allow-test grönt?"
- Estimatet för Fas 6 är inte påverkat (5–15 min per operation)

**Aktiveringsguide för Fas 5.5+** är dokumenterad i `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` §F (5 steg: lägg till operation, avskip 3 tester, byt TODO_REPLACE-token, re-deploya, kör tester).

### 8.5.2 Nya UNIVERSAL-lärdomar från Fas A

Tre UNIVERSAL-lärdomar har lyfts till `tasks/lessons.md` under Fas A. De ska refereras i P2 (stödspec-synkning) och i fas-prompterna i P3:

1. **Test-only-endpoints (prefix `test-*`) får ALDRIG nå produktion.** Källa: Fas A M2 staging-uppsättning. Implikation: deploy-pipelinen i Fas 7 måste filtrera `test-*`-prefix.

2. **Supabase Edge Functions har två-stegs auth-check.** Gateway-nivå (`verify_jwt` i `config.toml`) + funktion-nivå (`requireUser`) returnerar olika 401-format. Klient-felhantering och deny-path-tester måste acceptera båda. Källa: Fas A M2 staging-verifiering, commit `605502f`. Generaliserbart till AWS API Gateway + Lambda Authorizer, Cloudflare Workers + custom auth.

3. **Hypotes om UI-flöden måste valideras mot faktisk implementation, inte mot specs.** Discovery-fasen i Fas A M4 antog Vue-versionen som sanningskälla — den var själv placeholder. Mönster: verifiera att källan faktiskt gör det den påstås göra innan inventering. Källa: Fas A M4 discovery 2026-05-04.

### 8.5.3 Test- och produktions-infrastruktur etablerad i Fas A

Följande infrastruktur är på plats och ska inte återimplementeras i senare faser:

**Staging:**

- 2 Playwright API test-användare:
  - `playwright-test@miranon-admin.local` (icke-admin)
  - `playwright-admin@miranon-admin.local` (admin)
- Test-only Edge Function `test-auth` (deployad bara i staging, dokumenterad som icke-prod)
- `test-*`-prefix-konvention för framtida test-only-endpoints
- `.env.test` + `.env.test.example` setup-mönster
- Staging secrets: `ADMIN_EMAILS`, `CORS_ALLOWED_ORIGINS`, `VITE_SENTRY_DSN`

**Produktion (förberett):**

- Sentry-organisation + projekt `react-platform` skapat på sentry.io
- Klient-DSN konfigurerad (publik per Gate A1-beslut, alternativ A)

**Test-helpers:**

- `classify401Body`-helper för dual-format auth-test (gateway + funktion)
- Playwright-konfiguration med två projekt: `api` + `visual-*`
- Fuzz-test-pattern (per-kategori + INVARIANT round-trip)

Fas 5.5+ ska *inherita* denna infrastruktur, inte uppfinna parallella mönster.

### 8.5.4 Arkitekturmönster etablerade i Fas A

Följande mönster är beslutade under Fas A och ska refereras i fas-prompterna:

- **Operations-baserad write-API:** klient skickar `{operationKey, recordId, fields}` istället för tabellnamn/fältnamn direkt. Operations-registret är den enda sanningskällan för "vad får skrivas av vem."
- **`corsHeadersFor(req)` per-call:** CORS-headers genereras per-request baserat på origin, inte hårdkodade. Mönstret skalar till tenant-baserade allowlists post-S-track.
- **`AuthContext | Response` discriminated union:** auth-helpers returnerar antingen success-payload eller färdig 401-Response. Callers gör `if (result instanceof Response) return result`.
- **Deny-by-default genomgående:** tom config → deny, okänd input → deny, missing claims → deny. Aldrig "allow om vi inte vet."
- **Generic external errors:** `{error: 'Internal error', requestId}` utåt. Full detaljer i server-loggen. `requestId` (UUID v4) länkar klient-fel till server-stack.
- **`isOperationalError`-klassning:** förväntade fel (401/403/400) loggas på info-nivå, oväntade på error-nivå. Skyddar Sentry-quota mot triviala 4xx-events.
- **Structured JSON-loggning:** `console.error(JSON.stringify({level, requestId, errorName, stack, function, method, callerUserId}))`. Sökbart i Supabase Logs.
- **INVARIANT round-trip-mönster för säkerhetshelpers:** för säkerhetskritiska transformationer (eskapering, parsing, klassning) skall det finnas ett atomärt round-trip-test som bevisar att transformation→inverse återger exakt input. Skyddar mot hela klasser av attacker, inte bara de vi tänkt på. Tillämpat i `escapeFormulaValue` (M5) och `classify401Body` (M2).

### 8.5.5 Fas A-arkitektur-summering — kvalitativt

Fas A levererade 8 milstolpar (M1–M8) över ~14 commits:

| Milstolpe | Stänger |
|---|---|
| M1 — `requireUser`-helper | Auth-grund |
| M2 — wire i 4 datafunktioner + tester | Ingen `requireUser`-gate |
| M3 — CORS origin-allowlist | Wildcard CORS |
| M4 — operations-allowlist (infrastruktur) | `update-record` saknar fält/operations-allowlist |
| M5 — formula-eskapering + INVARIANT | Formula-injektion i `get-registrations`/`get-persons` |
| M6 — caller-verifiering i `create-admin-user` | Vem som helst kan skapa admins |
| M7 — generisk felmodell + Sentry-init | Råa felmeddelanden + Sentry oinitierad |
| M8 — `config.toml` med `verify_jwt` per funktion | `config.toml` saknades |

**Resultat:** Hela exponeringen från Code-verifieringen 2026-04-29 stängd. 113 tester (110 + 3 skipped för Fas 5.5-aktivering). Bundle 244 → 324 kB (+80 kB Sentry SDK).

Detaljer: `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` (frusen efter slutsummering).

### 8.5.6 Pre-existerande teknisk skuld verifierad under Fas A

Saker som inte var Fas A-scope men verifierade som existerande:

- **4 CSS-warnings** i `src/styles/base.css:72-75` (`!important` i `prefers-reduced-motion`-block) — legitimt CSS-mönster, ingen åtgärd nödvändig om inte Fas 7-cleanup vill rensa
- **PostCSS moderate vulnerability** (`<8.5.10`) — fixbar med `npm audit fix`. Kan tas som sidofix när som helst
- **`vite.config.ts` saknar säkerhetsplugin** (CSP-nonce) — medvetet uppskjutet till Fas 7 enligt SECURITY-SPEC. Saknar ADR. Bör få en ADR i P3.
- **AirtableAdapter:s 9 odeployade metoder** — Code-fynd F. Hanteras i Fas 2.5.
- **`Status.ts` out-of-sync mot data-model.md** — Code blocker 5. Hanteras i Fas 2.5.
- **Service worker registreras tyst** men `public/sw.js` är skelett — Code-fynd G. Hanteras i Fas 7.

---

## 9. Vad som INTE är i scope för revisionen

För att undvika scope-creep:

- **Inte ny datamodell-research.** Datamodell-research-projektet är klart. 06a/06b/07 är fryst design.
- **Inte nya Odoo-stickprov.** 08 är levererat. Eventuella nya kandidater hanteras i framtida 07-iteration, inte i denna revision.
- **Inte ändringar i kvalitetsdefinitionerna 11/11/11 + 11/10/10.** De är stabila per CLAUDE.md.
- **Inte omprövning av React-stacken.** TanStack Router/Query, React Aria, Zod, Biome är beslutade. Eventuella nya bibliotek hanteras som Fas 2.5+ tillägg, inte som ny stack-research.
- **Inte ny gap-analys från grunden.** Conversion-plans gap-analysis.md uppdateras endast med fynd från Codex/Code-verifieringen.
- **Inte ändringar i hub-and-spoke-arkitekturen** eller marcus-system. Det är ett separat system.
- **Inte början på Supabase-implementation.** Fas E är defer:ad. Den körs när byggplanen är skriven, inte under revisionen.
- **Inte återöppning av Gate 4B eller Gate 6.** Datamodell-research-besluten är frusna.
- **Inte återöppning av Fas A-beslut.** M1–M8 är slutförda och låsta.

---

## 10. Indata-filer (sökvägar)

Allt nedanstående är frusen indata för revisionen.

**Styrande från conversion-plan:**

- `~/Repon/miranon-media-admin/docs/conversion-plan.md` (frusen efter revisionen, arkiveras till `docs/archive/`)
- `~/Repon/miranon-media-admin/docs/BUILD-LOG.md` (Fas 0 + Fas 1)
- `~/Repon/miranon-media-admin/CLAUDE.md`
- `~/Repon/miranon-media-admin/tasks/todo.md`
- `~/Repon/miranon-media-admin/tasks/lessons.md`

**Stödspecs (kontrolleras, vissa uppdateras):**

- `~/Repon/miranon-media-admin/docs/specs/SECURITY-SPEC.md`
- `~/Repon/miranon-media-admin/docs/specs/ACCESSIBILITY-CHECKLIST.md`
- `~/Repon/miranon-media-admin/docs/specs/STATE-STRATEGY.md`
- `~/Repon/miranon-media-admin/docs/specs/PERFORMANCE-BUDGET.md`
- `~/Repon/miranon-media-admin/docs/specs/URL-STATE-SPEC.md`
- `~/Repon/miranon-media-admin/docs/specs/ARIA-UPGRADE.md`
- `~/Repon/miranon-media-admin/docs/specs/FUTURE-COMPAT.md`
- `~/Repon/miranon-media-admin/docs/specs/SPA-ARCHITECTURE-DECISION.md`
- `~/Repon/miranon-media-admin/docs/specs/DESIGN-MANIFESTO.md`
- `~/Repon/miranon-media-admin/docs/specs/DESIGN-OPERATING-SYSTEM.md`
- `~/Repon/miranon-media-admin/docs/specs/DESIGN-SYSTEM-SPEC.md`
- `~/Repon/miranon-media-admin/docs/specs/KVALITETSDEFINITIONER-11.md`
- `~/Repon/miranon-media-admin/docs/logs/gap-analysis.md`

**Externa analyser:**

- `~/Repon/miranon-media-admin/docs/analysis/Codex-project-analysis-after-fas-1.md`
- `~/Repon/miranon-media-admin/docs/analysis/Code-verification-of-codex-analysis.md`

**Datamodell-leverans:**

- `~/Repon/miranon-media-admin/docs/reference/data-model.md`
- `~/Repon/miranon-media-admin/docs/reference/hur-systemet-funkar.md`
- `~/Repon/miranon-media-admin/docs/research/datamodell-research/01-extraction.md` → `08-odoo-validation.md` (åtta filer)
- `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
- `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md`
- `~/Repon/miranon-media-admin/tasks/sessions/archive/2026-04/2026-04-28-datamodell-research-projekt.md` (FRUSEN)

**Fas A-leverans:**

- `~/Repon/miranon-media-admin/tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` (frusen efter slutsummering)
- `~/Repon/miranon-media-admin/supabase/functions/_shared/auth.ts`
- `~/Repon/miranon-media-admin/supabase/functions/_shared/cors.ts`
- `~/Repon/miranon-media-admin/supabase/functions/_shared/field-allowlists.ts`
- `~/Repon/miranon-media-admin/supabase/functions/_shared/airtable-filter.ts`
- `~/Repon/miranon-media-admin/supabase/functions/_shared/errors.ts`
- `~/Repon/miranon-media-admin/supabase/config.toml`
- `~/Repon/miranon-media-admin/src/observability/sentry.ts`

**Lärdomar:**

- `~/Repon/marcus-system/tasks/lessons.md` (sektioner 2026-04-28 → 2026-05-04)
- `~/Repon/miranon-media-admin/tasks/lessons.md`

---

## 11. Status

| | |
|---|---|
| Skapat | 2026-05-04 |
| Klar (P0) | 2026-05-04 |
| Klar (P1) | 2026-05-04 |
| Klar (P2) | 2026-05-04 |
| Klar (P3a) | 2026-05-05 |
| Klar (P3b) | 2026-05-05 |
| Fas A-status | **SLUTFÖRD 2026-05-04** — alla M1–M8 levererade, 14 commits, 113 tester |
| Ägare | Marcus + Claude Chat |
| Code-medverkan | Endast vid kodbasverifiering, slutlig commit av byggplanen, och eventuell M5+ av framtida implementations-faser |
| Direktiv-status | **SLUTFÖRT 2026-05-05** — alla §6 P3-städnings-DoD verifierade, byggplanen är aktiv styrande plan |
| Senast uppdaterat | 2026-05-05 (P3b SLUTFÖRT — se tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md) |

---

## 12. Slutnot

P3 är klar och `docs/byggplan.md` är committad:

- ✅ Detta direktiv markerades SLUTFÖRT i §11 (P3b K4 commit 7, 2026-05-05)
- ✅ Conversion-plan flyttades till `docs/archive/conversion-plan-2026-04-14.md` (P3b K2 commit 1: `2075ab3`, 2026-05-05)
- ✅ ADR skrevs i `docs/decisions/` om varför conversion-plan ersattes av byggplan (ADR-012, P3a commit `866b430`, 2026-05-05)
- ✅ Alla städnings-DoD per §6 P3 verifierade (P3b K2/K3/K4, se `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md` Del 7 Stop-test)
- ✅ Fas 2 av React-arbetet kan starta mot byggplanen (klart efter denna commit)

Direktivet är nu arkivvärt. Det utförde sin roll — höll oss i kontext över 5 sessioner (P0 → P1 → P2 → P3a → P3b) och säkerställde att Fas A-fynden införlivades i byggplanen utan drift. Framtida läsare: använd `docs/byggplan.md` som styrande plan; använd detta direktiv som arkivreferens om frågor uppstår om varför conversion-plan ersattes.
