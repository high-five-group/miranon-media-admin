---
owner: marcus803
updated: 2026-09-04
review_by: 2026-11-15
status: stable
---

# Byggplan — Miranon Media Admin (React)

> **Status:** AKTIV — ersätter `docs/conversion-plan.md` som styrande fas-för-fas-direktiv för React-bygget.
> **Skapat:** 2026-05-05
> **Version:** 1.0
> **Ägare:** Marcus + Claude Code (planering + implementation)
> **Föregångare:** `docs/conversion-plan.md` (arkiveras till `docs/archive/conversion-plan-2026-04-14.md` i P3b)
> **Fas-sekvensens proveniens:** ursprungligen föreslagen i `docs/archive/byggplan-direktiv.md` §5 (preliminär, finslipad i P1; flyttad `tasks/` → `docs/archive/` i Session 17, commit `f343db3d` — direktivet är SLUTFÖRT). **Auktoritativ källa för fas-sekvensen i dag är denna byggplan §2** (se § Dokumentstruktur — tre lager nedan: Plan-lagret äger sekvens) — byggplanen är direktivets levande efterträdare, inte en parallell auktoritet vid sidan av det.
> **ADR-katalog:** `docs/decisions/` (räkningen är README.md:s CI-grindade token — se [README.md](../README.md) § Arkitekturbeslut + `scripts/check-adr-count.sh` — inte upprepad här som ett eget, ogrindat tal, ADR-100 §2; §5 nedan listar bara de 10 skrivna i P3a; numrering tilldelas av Code mot befintlig katalog vid commit-tillfället; fullt index i `docs/decisions/README.md`)
> **Äger:** fas-sekvensen och fas-status (§2 fas-tabellen nedan) för
> React-bygget. **Kartlägger:** `docs/decisions/` (ADR-index, räkningen ägs
> av `README.md`), `docs/archive/byggplan-direktiv.md` (avslutad proveniens,
> ej längre levande). **Vid konflikt vinner:** denna byggplan §2 för
> fas-status; `README.md` för ADR-antalet; de enskilda ADR:erna för
> sak-besluten bakom varje fas.

---

## Innehåll

1. Prolog — Syfte, läsanvisning, dokumentstruktur
2. Fas-tabell (post-P1, 16 rader)
3. Övergripande arkitektur — etablerade mönster post-Fas A
4. Per-fas-prompter
5. ADR-index
6. Versionshistorik

---

## 1. Prolog

### Syfte

`docs/byggplan.md` är den styrande planen för Miranon Media Admin (React). Den ersätter `docs/conversion-plan.md` (arkiverad) och `docs/archive/byggplan-direktiv.md` (SLUTFÖRT — flyttad dit i Session 17 sedan P3 avslutades).

Skillnaden mot conversion-plan: byggplan utgår från **etablerad arkitektur post-Fas A** (operations-baserat API, AuthContext|Response, klient-DSN, structured logging) och **låst datamodell post-Fas E target-research** (06b Supabase-target + 07 migrationsplan + 08 Odoo-validering). Conversion-plan utgick från en pre-research-arkitektur och har därför drift som hade krävt patch-på-patch.

> **Airtable-basen är en förstklassig LEVERABEL, inte ett provisorium:** den maxas till 11/10 / branschledarmässig och blir mall + övningsprojekt i Passionslyftet. Den är datakälla nu för att bygget ska avtäcka vad appen behöver av sin datakälla; defekt-registret är kravspecen för bas-maximeringen. Supabase-migration är ett separat senare spår, ej en ersättning ([ADR-063](decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)).
>
> **Byggplanen är Övning 2:s karta** ([ADR-068](decisions/ADR-068-ovnings-ramverket.md)): Övning 1 (session 1–50) byggde grunden och metoden; Övning 2 (session 51 →) exekverar UI + backend med det uppdaterade arbetssättet, fram till och med den namngivna slutfasen Fas E (Supabase-migration). Epok-ramen + lins-noten för historiskt material: ADR-068.

### Läsanvisning

Per fas finns en fas-prompt med åtta sektioner:

- **Mål** — kort syfte (1–2 meningar)
- **Scope** — vad fasen ska bygga
- **Inte scope** — medvetet exkluderat (refererar var det bygges istället)
- **Beroenden** — vilka faser måste vara klara
- **Estimat** — sessioner (1 session ≈ 3–4 timmars Code-tid)
- **Filer som skapas/uppdateras** — diskbild
- **DoD** — Definition of Done (verifieringspunkter)
- **ADR-krav** — om fasen producerar ett arkitekturbeslut

`[GA]`-prefix på en bullet markerar tillägg utöver miniminivå (gold-aktivering — kan defer:as men bör motiveras om så).

### Dokumentstruktur — tre lager

| Lager | Dokument | Roll |
|---|---|---|
| **Strategi** | `docs/archive/byggplan-direktiv.md` (post-P3 SLUTFÖRT), `IDENTITET.md`, `KVALITETSDEFINITIONER-11-REACT.md` | Vad och varför — låsta principer |
| **Plan** | **`docs/byggplan.md`** (detta dokument) | Hur — fas-för-fas, sekvens, beroenden |
| **Implementation** | `docs/decisions/` (ADR), `docs/BUILD-LOG.md`, `tasks/sessions/` | Vad faktiskt skedde — beslut, avvikelser, retrospektiv |

Stödspecs (`SECURITY-SPEC.md`, `STATE-STRATEGY.md`, `ACCESSIBILITY-CHECKLIST.md`, etc.) refereras från detta dokument men ägs separat.

---

## 2. Fas-tabell (post-P1)

16 rader. Sekvens följer §5 i direktivet efter P1-applicering 2026-05-04. Estimat anges per fas; sub-fas-allokering under Fas 6 listas i Fas 6-prompten. Rad 16 (AT‑Max) är en MILSTOLPE, inte en fas — se ADR-063 + §4-milstolpe-blocket.

| Fas | Status | Anmärkning | Estimat |
|---|---|---|---|
| **0** | ✅ KLAR | Projektsetup + tokens. Session 1 (React) 2026-04-14, commits `1aa2544` → `e3d8e8a`. | (avslutad) |
| **1** | ✅ KLAR | Domäntransplant (13 filer + Zod + fetchWithRetry). Session 1, commits `e3d8e8a` → `c91bfa0`. Skuld → Fas 2.5. | (avslutad) |
| **A** | ✅ KLAR | Säkerhetshardening M1–M8. Slutförd 2026-05-04, 14 commits, 113 tester. | (avslutad) |
| **2** | ✅ KLAR | Routing + Auth — Sessions 4+5+5b 2026-05-13. ADR-026, ADR-027, ADR-028. Defense-in-depth tre-skikt-arkitektur. | 3 sessioner (faktiskt) |
| **2.5** | ✅ KLAR | Schema-kontrakt-sync — Session 13 2026-06-10. Status.ts 4→6, enum-granskning noll divergens, z.enum-hårdning + modell-smalning, 9 adapter-metoder A5-klassade (0 EF deployade — by design), inga död-kod-stubs (A5-utfall). Synk-gate 1 stängd före fasen. | 1 session (faktiskt) |
| **3** | ✅ KLAR | UI-primitiver — Sessions 14–15, 2026-06-11. Alla 6 primitiver på react-aria-components + CVA (ADR-044) + /dev/primitives. DoD 1+4 stängda mot Fas 3.5-infran per ADR-020 sekvens-noten; felmeddelande-wiring per ADR-046. | 1 session bygge + DoD-stängning i Session 15 (estimat 2) |
| **3.5** | ✅ KLAR | **A11y-baseline EGEN FAS** per P2 A1-utfall — Session 15, 2026-06-11. Axe-runner 12/12 (ADR-045), gate-proof-bevisad CI-grind, 5 mönster i `docs/aria-patterns/` + /dev/patterns, "A11y-baseline godkänd"-gate passerad före Fas 6. | 1 session (faktiskt) |
| **5** | ✅ KLAR | App-shell — Session 16, 2026-06-12. Skal på `_authenticated` (STOPPA-utfall A) + tab bar + skip-länk + route announcer + Workbox SW via `vite-plugin-pwa` injectManifest (ADR-047) + offline.html + manifest/ikoner + error boundaries två lager (SectionError + AppErrorBoundary, ADR-038-tråden stängd) + TanStack `networkMode: 'online'` + offline-indikator. DoD 4 moderniserad per ADR-047 (Lighthouse v12 tog bort PWA-kategorin); Performance ärver Fynd 7-defern (ADR-047-noten). API-runtime-caching defer till Fas 6 (versionsrad 1.9). | 1 session (faktiskt) |
| **5.5** | ✅ KLAR | Vertikal write-slice "markera anmälningsavgift som betald" — Sessions 18/19 (server-kontrakt K1 + staging) + Session 22 (klient-UI K2), 2026-06-17. Server: operation `mark-registration-fee-paid` → `Anmälningsavgift` (ADR-049) + isolerad staging (ADR-050) + deny/allow-svit grön. Klient: optimistic mutation via router-context-DI (ADR-055) + `EdgeFunctionError`-requestId + MessageBox-fel-yta + 3 e2e. ADR-016 (mönster) + ADR-049 + ADR-050 + ADR-055. | 2 sessioner (faktiskt: 18/19 + 22) |
| **6** | 🟡 PÅGÅR | **Strangler-fig-sekvens i åtta sub-faser:** **6a Persons ✅ KLAR** (Session 23, 2026-06-19 — lista + cursor-port ADR-056 + detaljvy + write `Personer.Anteckningar` via `update-person-note`; commits `b29ace9`→`e1034ee`) → **6b Events ✅ KLAR** (Session 25, 2026-06-20 — /event-lista + info-vy + närvaro-vy; EF get-event + get-attendance; arch-audit ren 5/5; commits `8fadfac`→`4642482`) → 6c Registrations + Väntelista (1) → 6d Hem-aggregering (0,5) → 6e Mer (1,0) → 6f Skapa nytt event (1,0) → 6g Segment-yta (2,0, ADR-062) → 6h Mail-handling (0,5). Per-sub-fas: registrera operation i `field-allowlists.ts` + deny/allow-test grönt + vy-Playwright baseline. → **Dokument-/bilagespåret ✅ I PROD 2026-08-28** (S108, PRD TASK-309 — eventinnehåll, platser, en renderare (DocRaptor/Prince, ADR-125), höjdanpassning, kvitto; ADR-103 promovering; QA 309.11 + facit-stämpling kvar hos Marcus) | 7,5 sessioner |
| **6.5** | ✅ KLAR (2026-08-14) | Aktivitetslogg (xAPI). `requestId`-mönstret från Fas A M7 ärvs. LIVE i prod sedan 2026-08-13 ~18:30; fas-avslut 2026-08-14 efter QA (`task-201.10`, mekanisk browser-vandring), skrivvägs-extraktionen med hemvist-grind (`TASK-201.15`), e2e-skarven (`TASK-201.16`), filter-etiketterna (`TASK-201.17`) och död-kod-rivningen (`TASK-201.18`) — katalog-invarianten 16/16/0. Full trail: `tasks/sessions/2026-08-11-session-105.md` Del 8–11 + PRD `task-201`. | 1 session |
| **AT‑Max** | 🏔️ MILSTOLPE (ej fas) | **Airtable-bas-maximering** (post-Fas-6-milstolpe, [ADR-063](decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)) — placerad EFTER Fas 6.5 (då hela app↔Airtable-interaktions-ytan är byggd av **Fas 6:s EF ensamt** — Fas 6.5:s `Activity Log`-write flyttades till Supabase och tillför INGEN Airtable-interaktion, **amenderat 2026-08-11 (S105/`TASK-201.1`) per [ADR-110](decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)**, ersätter den ursprungliga premissen "Fas 6:s EF + Fas 6.5:s `Activity Log`-write"; Fas 7 tillför inga nya Airtable-interaktioner). (a) audita att ALLA app↔Airtable-interaktioner är registrerade KORREKT (`docs/reference/airtable-interaction.md` + interaktions-registret); (b) audita att HELA Airtable-skatten (`data-model.md` §Kända fällor) är registrerad KORREKT + KOMPLETT; (c) lösa ut allt — städa/fixa/optimera basen till 11/10 / branschledarmässig / mall-redo (Passionslyft-övningsprojekt). Resolution sker I BASEN (ej lappa, ej designa-bort). Egen kommande pass-kedja. Se §4-milstolpe-blocket. | (estimat sätts vid milstolpens dekomponering, ADR-063) |
| **7** | NY scope | Konsolidering — CSP-plugin (med ADR), web-vitals, Speculation Rules, View Transitions, widget-error-boundary, chaos testing, deploy-pipeline, Background Sync defer-not (se Fas 8 + ADR). **AVVIKELSE S95 (2026-08-02, öppen — inte tyst hopp):** deploy-pipeline-biten FRAMDRAGEN före Fas 6.5 och AT-Max på Marcus beslut (T95 Grind 0: utan publik HTTPS-URL finns varken PWA-installation eller invite-länk-mål; sessionsdok S95 Del 2 beslut 1). Hosting: Vercel Pro (Marcus-kvitterad kostnad; R1-research `docs/research/t95-r1-hosting-vercel-2026-08-02.md` — OBS: R1 falsifierade SECURITY-SPEC:s CSP-nonce-mönster; Fas 7:s CSP-arbete ärver hash-/self-formen). Grind 0-paketets operativa checklista: T46-kartan. Resterande Fas 7-scope oförändrat. | 3 sessioner |
| **8** | NY (framtid) | Background Sync API (offline-mutationskö, defer:ad från Fas 7 — se ADR). Övrigt scope (Passkeys, push) ej låst i denna revision. Estimat fastställs vid aktualisering. Ersätter conversion-plans "Fas 8 — Passkeys, push, offline". | TBD |
| **B** | PARALLELL | Airtable-hardening — parallell-spår med 2 synk-gates mot React-bygget per A4: Synk-gate 1 — A1–A12 inventerade och kategoriserade (redan applicerade / före Fas 2.5 / efter Fas 2.5) innan Fas 2.5 startar; Synk-gate 2 — handshake mot `field-allowlists.ts` per Fas 5.5/6-operation. Roger/Lotta-arbete. | (parallell, separat estimat) |
| **E** | DEFER | Supabase-migration enligt 07 §A2. **Övning 2:s namngivna SLUTFAS ([ADR-068](decisions/ADR-068-ovnings-ramverket.md)) — designas i egen ADR när fasen närmar sig.** **HORISONTEN OMANKRAD 2026-07-27 (S91 premiss 4):** aktualiseras när **appens sidor är klara**, inte post-Fas 7 — se §4 Fas E § Horisont. Inkluderar Realtime-omläggning per B1. | (defer, separat planering) |

**Numreringsnot:** Det "saknas" en Fas 4 i sekvensen ovan. Conversion-plan hade en Fas 4 (DataTable) som flyttats till Fas 7 efter beslut i Session 0 (förbygges-research). Numreringen behålls för spårbarhet mot conversion-plan och tidiga BUILD-LOG-poster. Se ADR-013 (Fas 4-borttagningen).

**Total estimat (Fas 6 → Fas 7, exkl. klara Fas 0/1/A/2/2.5/3/3.5/5/5.5 och defer:ade Fas 8/B/E):** 11,5 sessioner — uppdaterad 2026-06-25 efter Fas 6e-omdefiniering + Fas 6g/6h-tillägg (ADR-062). Beräkning: 7,5 + 1 + 3 = 11,5. En session ≈ 3–4 timmars Code-tid vid normal sessionsfrekvens.

> **Milstolpe AT‑Max (Airtable-bas-maximering, ADR-063) är OSATT** och därför **ej inräknad** i 11,5 ovan — storleken sätts vid milstolpens dekomponering (egen pass-kedja efter Fas 6.5). Ingen provisorisk siffra injiceras (L1: provisoriska estimat märks som sådana).

### Per-subfas arkitektur-fitness-audit (ADR-058) — status

O(1)-läsbar audit-status per Fas 6-subfas (L200: spridd-över-sessioner-status gömmer luckor):

| Subfas | Bygg-status | Per-subfas arch-audit |
|---|---|---|
| 6a Personer | KLAR | ✅ ren — Inc 4 / Session 25 (fem områden GODKÄNDA) |
| 6b Event | KLAR | ✅ ren — Session 25 |
| 6c Anmälningar + Väntelista | KLAR | ✅ ren — Session 26 |
| 6d Hem | KLAR | ✅ ren — Session 30 |
| 6e Mer (Intresserade + Maillogg) | byggd L1+L2 (S33) | ❌ EJ körd — S33 stängde utan; "ingen app-kod"-justifiering felaktig (get-leads/get-mail-log + vyer landade) → tråd T38 |
| 6f Skapa nytt event | byggd L0–L2 (S38, staging) | ✅ ren — Session 38 (fem områden GODKÄNDA, AVVIKELSE ingen; bibliotek 11/11/11, vy 11/10/10). Prod-deploy (fält + EF) bundlad separat-auktoriserad handling kvarstår |
| 6g Segment-yta | KLAR (L1–L4) + **PROD-DEPLOYAD (S43)** | ✅ ren — Session 37 (fem områden GODKÄNDA, AVVIKELSE ingen, 11/10/10). **Prod-deploy S43:** compute-segment/save-segment/get-segments ACTIVE v1 på prod (`lvjsfnphlauldxqlncpl`), auth-grind-bevisad (401/405), override-smal (de 5 stale orörda); full autentiserad prod-smoke deferrad → T40 |
| 6h Mail-handling | byggd L0–L3 (S39–S41, staging) | ✅ ren — Session 41 (fem områden GODKÄNDA; EN avvikelse noll-leverans-send ROT-RESOLVERAD samma session; bibliotek 11/11/11, vy 11/10/10). Prod-deploy = T44 M3 + Code-at-prod-deploy kvarstår |

> **ÖVERORDNAT FÖRKRAV, tillagt 2026-07-27 (S91 premiss 1 + 2 — Marcus-beslut):** **Fas 6 stängs INTE** förrän appens sidor är byggda som Marcus vill ha dem. **Fem facit-lösa ytor** ska genom samma kedja som eventsidan fick — prototyp → Marcus väljer → facit → PRD → skivor: **Personer · Hem · Mer/Intresserade/Maillogg · Segment · Mail-handling**. Detta är ett krav OVANPÅ closeout-förkraven nedan, inte i stället för dem: bygg-status och arch-audit kan vara gröna medan ytan ändå inte är den Marcus vill ha. Premiss 3 lägger dessutom **CI-/grind-arkitekturen FÖRE** det arbetet. Kanonisk karta över spåren: [`../tasks/s91-restlistan.md`](../tasks/s91-restlistan.md) § Beslutade premisser.
>
> **Closeout-förkrav:** FULLT Fas 6 fas-avslut kan ske först när: 6e retro-auditerad, 6f byggd + auditerad, 6h byggd + auditerad (6g klar + auditerad ✓), samt **vertikaler prod-deployade + prod-smoke-verifierade** (T40-dimensionen, inwirad 2026-07-24 S84 vid T40-lösningen; EF-lagret uppfyllt samma dag — T39-synken av alla 13 allowlistade + autentiserade smokes gröna; send-emails utskicksväg ägs separat av T55, prod-frontend-deploy-kontrollen av T46). Avslutet inkluderar phase-end-verify, byggplan 6→KLAR, FAS-NIVÅ fitness-svep (full port-paritet + komplett EF-ribba-inventering tvärs ALLA subfaser — ej bara ackumulerade per-slice-audits), CHANGELOG, lessons-hub-lyft L149–L201, arkivering.

---

## 3. Övergripande arkitektur — etablerade mönster post-Fas A

Dessa mönster är låsta sedan Fas A slutförts 2026-05-04. Alla per-fas-prompter nedan refererar dem och får inte motsäga dem.

### 3.1 Operations-baserat API

Klienten skickar `{operationKey, recordId, fields}` (inte `{tableId, ...}`). Server äger ett operations-register med deny-by-default. Fält-allowlist per operation. Källa: `SECURITY-SPEC.md §6.1`, `STATE-STRATEGY.md §8`.

Konsekvens för per-fas-prompter: varje vy som skriver registrerar sin operation i `field-allowlists.ts` och levererar 1 deny-test + 1 allow-test som DoD-villkor.

### 3.2 Auth-mönster

`AuthContext | Response`-pattern: Edge Functions returnerar antingen verifierad context eller direkt 401-Response. Två-stegs auth-check (token + behörighet). `corsHeadersFor(req)` per request. Källa: Fas A M2 + M3.

### 3.3 Observability

`requestId` på varje request, propagerat genom EF-loggar + klient-toast vid fel. Structured JSON-loggning på server. Klient-DSN för Sentry (beslut taget i Fas A — befintlig ADR i `docs/decisions/`). Källa: Fas A M7.

### 3.4 INVARIANT-mönster

Server-side runtime-assertions för data-shape-kontrakt. `INVARIANT(condition, message)` ger fast-fail vid kontraktsbrott istället för silent corruption. Källa: Fas A M5.

### 3.5 Test-prefix-konvention

Alla test-EF prefix:as med `test-` (hyphen, inte underscore — Supabase CLI-regex `^[A-Za-z][A-Za-z0-9_-]*$`). Test-EFs deployas inte till production. Källa: Fas A M6.

### 3.6 Strangler-fig migrationsväg

Persons → Events → Registrations → Hem-aggregering är primärordning för Fas 6. Samma ordning gäller framtida Fas E (Supabase-migration). Källa: `docs/research/datamodell-research/07-migration-plan.md` §A2.

### 3.7 Operations utan empirisk användning är onödig attack-yta

M4-principen från Fas A: deploya inte EF i förskott. Varje deploy ska följa en namngiven UI-konsument. Konsekvens: Fas 2.5 deployar 0 EF; Fas 6:s sub-faser deployar 9 EF organiskt. Klassning i P1-sessionsdok Del 3 (A5-tabellen).

### 3.8 Källa-vs-implementation-skiktning

`data-model.md` är källa för status-typer. `Status.ts` följer källan, inte tvärtom. Vid stack-byte: target-shape separat från source-shape; adapter-gränsen översätter. Källa: P2 Lessons-post 4.

---

## 4. Per-fas-prompter

### Fas 0 — Projektsetup + tokens (KLAR)

✅ Avslutad i Session 1 (React) 2026-04-14, commits `1aa2544` → `fcc6de3` → `e3d8e8a`.

**Output:** Vite + React 19 + Tailwind v4 (`@theme`-baserad) + Biome 2.4 + 3-lagers tokens (ADR-002, ADR-003) + 20-raders SW-skelett.

**Skuld:** `[GA] vite.config.ts` säkerhetsheaders-plugin med CSP-nonce **uppskjuten till Fas 7** — ADR-011 (CSP-plugin-deferral) skrivs i P3a för spårbarhet.

**Korsreferens:** `docs/BUILD-LOG.md` Fas 0-sektion.

---

### Fas 1 — Domäntransplant (KLAR)

✅ Avslutad i Session 1 (React) 2026-04-14, commits `e3d8e8a` → `c91bfa0`.

**Output:** 13 domänfiler portade från Vue, Zod-scheman, `fetchWithRetry`-utility, AirtableAdapter-skelett.

**Skuld noterad — flyttas till Fas 2.5 (omdefinierar inte "klar" retroaktivt):**

- `src/domain/types/Status.ts` — out-of-sync mot `data-model.md` (Status.ts har 4 värden, data-model 6)
- `AirtableAdapter` — 9 odeployade EF-metoder, varje TODO-markerad
- Zod — finns men används inte som runtime-validering vid alla externa datagränser (per ADR-005, defer till Fas 2/3)

**Korsreferens:** `docs/BUILD-LOG.md` Fas 1-sektion.

---

### Fas A — Säkerhetshardening (KLAR)

✅ Slutförd 2026-05-04, M1–M8 levererade, 14 commits, 113 tester gröna.

**Output:** 8 etablerade arkitekturmönster (se §3 ovan) + uppdaterad `SECURITY-SPEC.md` §6 + `STATE-STRATEGY.md` §8.

**Korsreferens:** `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`, `docs/BUILD-LOG.md` Fas A-sektion (skrivs retrospektivt i P3b).

---

### Fas 2 — Routing + Auth (KLAR)

✅ Slutförd 2026-05-13 över Sessions 4 + 5 + 5b. Alla 8 DoD-rader stängda och empiriskt verifierade via 6-tests Playwright-regression-suite (K4.3 Test 1-6).

**Output:**

- Defense-in-depth tre-skikt-arkitektur: skikt 1 (klient-guard K3.2/K3.3) + skikt 2 (AuthError throw K3.4) + skikt 3 (server requireUser, Fas A M2 oförändrad)
- TanStack Router file-based skelett med pathless `_authenticated`-layout
- AuthProvider med Supabase-integration (InnerApp-pattern + router-extract per Kandidat 29)
- nuqs URL-state-setup + dev-only test-route (DoD 4)
- Playwright `authenticatedPage`-fixture med `storageState` (DoD 6)
- 3 nya ADR:er: ADR-026 (Runtime-validering med Zod .parse()), ADR-027 (KVALITETSDEFINITIONER stack-skifte Vue→React), ADR-028 (Supply chain incident-respons-protokoll, K0åg-respons)

**Korsreferens:**

- Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](../tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md)
- Commits: `13cdf86`..K5.9-trail (samtliga K0+K2+K3+K3.4+K3.5+K4+K5-commits)
- BUILD-LOG.md "Session 5+5b"-sektion för retrospektiv

**Kvalitetsklyfta deferred till Fas 3.5:** Skikt 2 (AuthError throw-path) är typkontrakt-bevisad via tsc + Biome men inte regression-skyddad i isolation. Auth-error-path unit-test-mönster lyfts vid Fas 3.5 test-infra-arbetet (vitest-installation hör hemma där per Gate 1-beslut 2026-05-13).

---

#### Ursprunglig Fas 2-prompt (bevaras för historisk spårbarhet)

#### Mål

Etablera fil-baserad routing (TanStack Router) + Supabase-autentisering + URL-state-hantering (nuqs) som grund för alla efterföljande vyer.

#### Scope

- TanStack Router file-based med `src/routes/`-struktur
- `__root.tsx` med AuthProvider + ErrorBoundary + Suspense
- Skyddade routes via `beforeLoad`-guard mot Supabase-session
- Login-vy (publik) + Logout-flöde
- nuqs för URL-state (filter, sökterm, aktiv flik) — initial setup, ej per-vy-implementation
- Devtools för Router + Query (dev-only)

#### Inte scope

- Vy-implementation (Hem, Event, etc.) — Fas 6
- Tab bar / app-shell — Fas 5
- Optimistic mutations — Fas 5.5

#### Beroenden

- Fas 1 (domäntransplant) — Supabase-klient redan etablerad
- Fas A (auth-mönster) — `AuthContext | Response` etablerat på server

#### Estimat

2 sessioner.

#### Filer som skapas/uppdateras

- `src/routes/__root.tsx`
- `src/routes/index.tsx` (login-redirect-stub)
- `src/routes/login.tsx`
- `src/auth/AuthProvider.tsx`
- `src/auth/useAuth.ts`
- `vite.config.ts` (TanStack Router-plugin återinförs — togs bort i Fas 0)
- `tsr.config.json`

#### DoD

1. `npm run dev` ger fungerande login → redirect till `/hem` (placeholder-route)
2. Logout klart — session rensas, redirect till `/login`
3. Skyddad route utan session → automatisk redirect till `/login`
4. nuqs `useQueryState` fungerar mot test-route med `?test=value`
5. Router devtools synliga i dev, inte i prod
6. Playwright auth-fixture (`authenticatedPage`) etablerad
7. `[GA]` Suspense-fallback på root visar laddningsindikator under auth-resolution
8. `[GA]` Error boundary på root fångar router-fel och visar fallback med "ladda om"-knapp

#### ADR-krav

Inget nytt ADR krävs. URL-state-strategin följer befintlig `URL-STATE-SPEC.md`.

#### Korsreferens

- `STATE-STRATEGY.md` §1, §3 (server/UI/URL-state-uppdelningen)
- `URL-STATE-SPEC.md`

---

### Fas 2.5 — Schema-kontrakt-sync

✅ Slutförd 2026-06-10, Session 13 (klunga 1–4). Alla 7 DoD-rader stängda; 0 EF deployade (by design); Synk-gate 1 stängd före fasstart med MCP-verifierad A1–A12-inventering (`docs/research/datamodell-research/09-a1-a12-synk-gate-1-inventering.md`). Korsreferens: `tasks/sessions/archive/2026-06/2026-06-10-session-13.md` Del 2–4.

#### Mål

Synka kodens domäntyper mot `data-model.md` (källa) + införa Zod-validering vid alla externa datagränser + klassa adapter-debt utan att deploya EF i förskott.

#### Scope

- `Status.ts` skrivs om: 4 → 6 statusvärden för Anmälningar (mot `data-model.md` 2026-04-26)
- Övriga enums i `src/domain/types/` granskade mot `data-model.md`
- Zod-scheman aktiveras som runtime-validering i `AirtableAdapter` läs-metoderna
- Adapter-debt-klassning: 9 metoder enligt P1-sessionsdok Del 3 (A5-tabellen) markeras med klass i koden (`@deferTo: Fas-Xx` JSDoc + ev. `throw new Error('Not deployed yet — see Fas Xx')`)
- Stub-metoder som klassas som död kod tas bort

#### Inte scope

- **Inga nya EF-deploys.** Per A5-beslutet: 0 EF deployas i denna fas.
- Field-allowlists-implementation — sker per-vy i Fas 5.5/6
- Refaktorering av AirtableAdapter:s read-metoder utöver Zod-aktivering

#### Beroenden

- Fas 1 (Status.ts + Zod-scheman finns)
- Fas A (operations-API + INVARIANT-mönster låsta)
- Synk-gate 1 — A1–A12-inventering genomförd (hård gate per A4, `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md`)

#### Estimat

1 session.

#### Filer som skapas/uppdateras

- `src/domain/types/Status.ts` (omskrivs)
- `src/domain/types/*.ts` (granskas, ev. uppdateras)
- `src/data/adapters/AirtableAdapter.ts` (Zod aktiveras, 9 metoder klassade i JSDoc)
- `src/domain/schemas/*.ts` (Zod-scheman, ev. justering)

#### DoD

1. `Status.ts` har 6 värden för RegistrationStatus matchande `docs/reference/data-model.md:121-130` (verbatim svenska Airtable-värden, pre-A-track-läget per `docs/archive/Code-verification-of-codex-analysis.md` Tillägg Fråga 1)
2. `npm run typecheck` 0 fel — alla konsumenter av Status uppdaterade
3. Zod-scheman validerar runtime vid varje read i AirtableAdapter — fångar shape-drift
4. 9 adapter-metoder har JSDoc-klassning per A5-tabellen (defer-fas + 06b-impact)
5. Eventuella död-kod-stubs borttagna med spårbarhet i commit
6. `npm run test:api` grön — alla 113 tester från Fas A passerar fortfarande
7. Biome `0 fel`

#### ADR-krav

Inget nytt ADR. A5-beslutet är dokumenterat i P1-sessionsdok Del 3 — kan refereras därifrån.

#### Korsreferens

- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 3 (A5-klassningstabell)
- `docs/reference/data-model.md` (källa för status-typer per dm-110)

---

### Fas 3 — UI-primitiver

✅ Slutförd 2026-06-11 över Sessions 14–15. Bygget levererat på 1 session (Session 14, estimat 2): alla 6 primitiver på react-aria-components + CVA (ADR-044) + demo-route `/dev/primitives`. DoD 1 (axe-/skärmläsardel) + DoD 4 stängda i Session 15 mot Fas 3.5-infran per ADR-020 sekvens-noten: runner 0 violations på alla 6 (run 27343206661), Marcus tangentbords-checklista (Session 14) + VoiceOver-pass (Session 15; feltext-dubbelreferens åtgärdad per ADR-046 — post-fix-omlyssning av Input/Select defererad till öppen todo-tråd, ej blockerande; DOM-verifierad en-vägs-referens via describedby). Korsreferens: `tasks/sessions/archive/2026-06/2026-06-11-session-15.md` Del 4–5.

#### Mål

Bygga den minimala uppsättning UI-primitiver som Fas 5 + 5.5 + 6 behöver: Button, Input, Select, MessageBox, Modal, Dialog. Alla med React Aria-bas + CVA-variantsystem + ARIA 1.3-attribut.

#### Scope

- 6 primitiver enligt ovan, med varianter (size: sm/md/lg, intent: primary/secondary/danger/ghost)
- CVA-konfiguration per primitiv
- react-aria-components som bas (per ADR-044) — komponenterna bygger på React Aria-hooks internt; hooks är per-komponent-reservutgång vid behov av extra flexibilitet, inte default
- Demo-route `/dev/primitives` (render-guardad till dev-läge) för visuell verifiering — Storybook avvisad per ADR-044, omprövas vid ev. framtida Mm Component Library-paketering
- 11/11/11-verifiering per komponent (Tillgänglighet alltid 11)

#### Inte scope

- Komplex komponent-komposition (DataTable, Calendar) — Fas 7 vid behov
- Toast/Notification — Fas 5 (app-shell-leverans)
- Form-validering-orchestrering — Fas 6 per-vy

#### Beroenden

- Fas 0 (3-lagers tokens etablerade)
- Fas 3.5 — **kvalitetsgranskningsbasen** etableras innan Fas 3:s DoD kan stämmas av (men Fas 3 kan börja byggas parallellt med Fas 3.5:s test-infra-setup)

#### Estimat

2 sessioner.

#### Filer som skapas/uppdateras

- `src/components/primitives/Button.tsx`
- `src/components/primitives/Input.tsx`
- `src/components/primitives/Select.tsx`
- `src/components/primitives/MessageBox.tsx`
- `src/components/primitives/Modal.tsx`
- `src/components/primitives/Dialog.tsx`
- `src/components/primitives/index.ts`
- Demo-route eller Storybook-config

#### DoD

1. Varje primitiv passerar 11/11/11 mot `KVALITETSDEFINITIONER-11-REACT.md`:
   - Tillgänglighet: axe-core 0 violations + manuell tangentbordstest + skärmläsartest
   - Teknik: TypeScript strikt, Biome 0 fel, < 150 rader, single responsibility
   - Återanvändbarhet: ingen produktspecifik logik, props-driven, kan exporteras till Mm Component Library utan ändring
2. CVA-konfiguration har minst 3 varianter per primitiv (size + intent + state)
3. Demo/Storybook visar alla varianter
4. Playwright a11y-runner (etablerad i Fas 3.5) kör mot alla primitiver — 0 violations
5. JSDoc per primitiv med usage-exempel

#### ADR-krav

Inget nytt ADR.

#### Korsreferens

- `ACCESSIBILITY-CHECKLIST.md` (omskriven 2026-05-04 — React Aria + WCAG 2.2 AA)
- `ARIA-UPGRADE.md` (per-komponent ARIA 1.3-detaljer)
- `DESIGN-SYSTEM-SPEC.md`

---

### Fas 3.5 — A11y-baseline (NY EGEN FAS)

✅ Slutförd 2026-06-11, Session 15 (estimat hållet). Alla 6 DoD-rader stängda: axe-runner 12/12 (7 primitiv- + 5 mönster-tester, 0-tolerans per ADR-045), CI-grinden gate-proof-bevisad (medvetet brytande branch → run 27337333679 röd exakt på a11y-steget), fixture-mönstret återanvänt i primitiv-testerna, 5 mönster-filer i `docs/aria-patterns/` + referens-implementationer på `/dev/patterns`, checklist §5/§6 stämplade, "A11y-baseline godkänd"-gate dokumenterad i BUILD-LOG före Fas 6. ADR-045 + ADR-046. Korsreferens: `tasks/sessions/archive/2026-06/2026-06-11-session-15.md`.

#### Mål

Etablera test-infrastruktur (axe + Playwright a11y) + 5 React Aria-mönster som Fas 6 kommer att konsumera. ACCESSIBILITY-CHECKLIST omskriven i P2 — denna fas levererar test-koden + mönsterbiblioteket som checklisten förutsätter.

#### Scope

- `axe-core` + `@axe-core/playwright` installerade
- Playwright a11y-runner-config (separat eller integrerad i `playwright.config.ts`)
- Fixture-mönster: `renderWithA11y(component)` eller motsvarande
- CI-integration: axe-violations failar bygget
- 5 React Aria-mönster med kodexempel + test-mall:
  1. **Overlay** (`Modal` + `Dialog`) — modaler, confirm-dialoger, slide-in
  2. **Listbox** (`ListBox`) — dropdowns, filter, sortering
  3. **Disclosure** (`Disclosure` + `DisclosureGroup`) — accordion, expanderbara rader
  4. **MenuTrigger** (`MenuTrigger` + `Menu`) — kontextmeny, åtgärdsmeny
  5. **ComboBox** (`ComboBox`) — sökfält med autocomplete
- Per pattern: kodexempel + test-mall + a11y-acceptance-criteria

#### Inte scope

- Komponentimplementation per primitiv — Fas 3
- A11y-fixar i befintlig kod — Fas 7 vid behov
- WCAG 2.2 AAA-nivå — målet är AA

#### Beroenden

Ingen mot tidigare faser. Blockerar Fas 3:s DoD (Fas 3 kan inte kvalitetsgranskas mot React Aria utan testkoden).

#### Estimat

1 session.

#### Filer som skapas/uppdateras

- `playwright.config.ts` (a11y-runner-config tillagd)
- `tests/a11y/fixtures.ts` (renderWithA11y + fixture-mönster)
- `tests/a11y/patterns/Overlay.spec.ts`
- `tests/a11y/patterns/Listbox.spec.ts`
- `tests/a11y/patterns/Disclosure.spec.ts`
- `tests/a11y/patterns/MenuTrigger.spec.ts`
- `tests/a11y/patterns/ComboBox.spec.ts`
- `docs/aria-patterns/` (5 markdown-filer per pattern med kodexempel)
- `package.json` (`axe-core`, `@axe-core/playwright`)

#### DoD

1. `npm run test:a11y` kör Playwright a11y-runner — 0 violations på alla 5 patterns
2. CI failar vid axe-violation (verifiera med medvetet brytande commit på branch)
3. Fixture-mönstret återanvänds i Fas 3:s primitiv-tester
4. 5 markdown-filer i `docs/aria-patterns/` har kodexempel + test-mall + acceptance-criteria
5. ACCESSIBILITY-CHECKLIST §"Test-infrastruktur" + §"Mönsterbibliotek" markeras "✅ levererad i Fas 3.5"
6. "A11y-baseline godkänd"-gate dokumenterad i `docs/BUILD-LOG.md` innan Fas 6 startar

#### ADR-krav

**ADR-020 — Fas 3.5 = egen fas (P2 A1-utfall)**: dokumenterar trigger-tabellen från P1 + utfallet från P2 (rad 2 + rad 3 båda JA).

#### Korsreferens

- `ACCESSIBILITY-CHECKLIST.md` (omskriven i P2)
- `tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md` Del 5 (A1-trigger-rapport)

---

### Fas 5 — App-shell (förenklad) (KLAR)

✅ Slutförd 2026-06-12, Session 16 (1 session, estimat hållet). Alla 10 DoD-rader stängda — varav DoD 4 i moderniserad ADR-047-form och DoD 4c via Fynd 7-arvet (ADR-047-korrigeringsnoten). Leverans-noter:

- **Skalet bor på `_authenticated`-layouten, inte `__root`** (STOPPA-utfall A via Chat): login/dev-ytorna bär egna `<main>`-landmarks och tab bar utanför inloggat läge vore död navigation — Filer-listans `__root.tsx`-rad nedan ersattes i praktiken av `src/routes/_authenticated.tsx` + `src/components/AppShell/`. RouteAnnouncer ligger globalt i `__root` (landmark-fri).
- **Error-boundary-konsolidering till exakt två lager** (Session 16 K4, STOPPA-utfall A): `Sentry.ErrorBoundary` (__root) + `RouteErrorFallback` rivna → `SectionError` som `defaultErrorComponent` + `AppErrorBoundary` (main.tsx, täcker även provider-fel). ADR-038-tråden i todo stängd; boundaries renderar, createRoot-hooks rapporterar.
- **DoD-trail:** varaktiga tester `tests/e2e/shell.staging.test.ts` (DoD 1/2/3-mekanisk/6/8/9/10 + offline-banner) + `tests/e2e/pwa-offline.staging.test.ts` (DoD 5/B3b, manifest-B3a-stöd); gröna runs 27410118400 (K5) → 27412742687 (K5d). Marcus-moment PASS: VoiceOver-annonsering, DevTools-installerbarhet, maskable safe zone (efter K5c-paddingfix), rund favicon (K5d). Lighthouse 81/100/100 mot baseline 86/100/96 — Perf per ADR-047-noten.
- **DoD 5-not:** offline.html-grenen är ej naturligt testbar — `NavigationRoute` serverar precachat skal för alla navigationer; grenen nås bara vid skadad cache (konstlat grepp undveks). Kärnkravet (cachat skal offline) maskinellt bevisat.
- **DoD 7-not:** app-boundaryn verifierad via K4:s ad hoc-pass (temp-grepp, exakt reverterade); varaktigt app-boundary-test → backlogg i todo.
- **Ikon-rundorna K5b–K5d:** assets-generatorns palett-kvantisering fixad (lossless-PNG via `pwa-assets.config.ts`), maskable-padding 0.45 (hörn-radie-geometri, kvot 0,868), rund favicon med vit platta ur `public/favicon/favicon.svg` (`scripts/generate-favicons.mjs`).

Korsreferens: `tasks/sessions/2026-06-12-session-16.md` Del 2.

#### Mål

Minimal app-shell som tål mobil-först-användning (Lotta på telefon i mötet) + tab bar + offline-foundation. **Förenklad** per B3-beslutet — ej full app-shell-leverans.

#### Scope

- App-shell layout: header (minimal) + content-area (max-width 600px) + bottom tab bar
- Tab bar: 4 flikar, fixed bottom, ARIA-tabs-mönster
- Skip-to-content-länk + route announcer (för skärmläsare)
- Responsivt: 375 / 768 / 1024 px breakpoints
- `prefers-reduced-motion` + `prefers-contrast: more` respekt
- Error boundaries: app-nivå + sektion-nivå (per route)
- Workbox SW: cache-first för statiska assets (precache), offline.html-fallback
- TanStack Query offline-config (`networkMode: 'offlineFirst'` för läs, `'online'` för skriv)

#### Inte scope

Flyttat till Fas 7 per B3 (ADR-018):

- View Transitions API
- Speculation Rules
- web-vitals-mätning
- Widget-error-boundary (mer granulär än sektion-nivå)

Defer per Session 16 K3:

- Runtime-caching av API-anrop (network-first, `networkTimeoutSeconds`) — defer till Fas 6 där API-konsumtionsmönstren byggs (ADR-017-polling): autentiserade svar med persondata i Cache Storage kräver säkerhetsgenomgång, samma rationale som ADR-047 B5:s persistQueryClient-defer. Beslut Session 16 K3.

#### Beroenden

- Fas 2 (routing)
- Fas 3 (Button, MessageBox för error-fallbacks)
- Fas 3.5 (a11y-test för tab bar och skip-link)

#### Estimat

1 session (förenklat från 1–2 i conversion-plan).

#### Filer som skapas/uppdateras

- `src/routes/__root.tsx` (utökas med shell)
- `src/components/AppShell/AppShell.tsx`
- `src/components/AppShell/TabBar.tsx`
- `src/components/AppShell/SkipLink.tsx`
- `src/components/AppShell/RouteAnnouncer.tsx`
- `src/components/ErrorBoundary/AppError.tsx`
- `src/components/ErrorBoundary/SectionError.tsx`
- `public/sw.js` (utbyggt från 20-raders skelett till Workbox-baserad)
- `public/offline.html`
- `src/data/queryClient.ts` (offline-config)

#### DoD

1. `/hem` placeholder visar shell + tab bar med 4 flikar (Hem/Event/Personer/Mer)
2. Skip-to-content fungerar (Tab → Enter hoppar till `<main>`)
3. Route-changes annonseras till skärmläsare (verifierat med VoiceOver eller NVDA)
4. PWA-verifiering (per [ADR-047](decisions/ADR-047-pwa-arkitektur-fas-5.md)): (a) manifest uppfyller Chromes installability-kriterier — DevTools Application-panel visar installerbar, 0 manifest-fel; (b) offline-beteende verifieras maskinellt via Playwright (`context.setOffline(true)` → reload → cachat skal eller offline.html); (c) kvarvarande Lighthouse-kategorier (Performance/Accessibility/Best Practices) håller trösklar mot Fas 0-baselinen
5. Offline-läge: ladda om sidan utan nät → offline.html visas eller cachat innehåll renderas
6. Sektions-error: medvetet fel i en route → error boundary visar fallback utan att krascha shell
7. App-error: medvetet fel i shell → app-error visar fallback med "ladda om"-knapp
8. `prefers-reduced-motion` testat — inga animations triggas
9. Responsiv: 375/768/1024 — tab bar förblir användbar på alla
10. axe-core 0 violations på shell

#### ADR-krav

**ADR-018 — Fas 5-förenklingen** (per B3): dokumenterar vilka [GA]-tillägg som flyttas till Fas 7 + motiv.

#### Korsreferens

- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 5 (B3-beslutet)

---

### Fas 5.5 — Vertikal write-slice

✅ Slutförd 2026-06-17 över Sessions 18/19 (server-kontrakt K1 + isolerad staging) + Session 22 (klient-UI K2). Server-sidan: operation `mark-registration-fee-paid` skriver `Anmälningsavgift` (INTE `Status` — ADR-049 supersederar DoD-radens fält-exempel), isolerad staging-miljö byggd (ADR-050), deny/allow-svit grön (`tests/api/update-record.staging.test.ts`, 401-anon via delad `requireUser`-gateway). Klient-sidan: datakälla-åtkomst via TanStack Router-context-DI ([ADR-055](decisions/ADR-055-datakalla-atkomst-router-context-di.md) — första UI→data-wiringen, precedens för Fas 6), optimistic mutation per ADR-016:s fem komponenter (`src/data/mutations/markRegistrationPaid.ts`), typad `EdgeFunctionError` med strukturerad `requestId`, fel-yta via MessageBox `role="alert"` (avvikelse från DoD 6:s "toast"-ord — ingen toast-infra finns; medveten, dokumenterad), aria-live för lyckad flip via `alertScreenReader`. 3 e2e (`tests/e2e/mark-paid.staging.test.ts`) via deterministisk `page.route`-gate täcker DoD 1/5/6/7/8 (mockad e2e — server-write-kontraktet bevisas separat av staging-sviten). Slicen är **mall för Fas 6:s mutationer** (DoD 10). Faktiska fil-/testsökvägar avviker från Filer-listan nedan (drift mot byggd struktur, dokumenterad): `event/$eventId.tsx` (ej `betalning.tsx`), `mark-paid.staging.test.ts` (ej `markPaid.spec.ts`), `field-allowlists.ts` i `supabase/functions/_shared/`. DoD-trail: feature-CI run `27706856446` (alla jobb success inkl. `test:e2e:staging`). Korsreferens: `tasks/sessions/archive/2026-06/2026-06-17-session-22.md` Del 2.

#### Mål

Etablera mutation-mönstret (TanStack `useMutation` + optimistic UI + operations-baserat API) genom en minimal vertikal slice: "markera anmälan som betald" via befintlig `update-record` EF med ny `operationKey`. Sliceen blir mall för Fas 6:s mutationer.

#### Scope

- Minimal Event-detaljvy med Betalning-flik
- Anmälda-lista med betalning-status + "Markera som betald"-knapp
- Mutation: `mark-registration-paid` (eller motsvarande operationKey, finslipas vid sessionsstart) via `update-record` EF
- Optimistic UI: status-flip omedelbart, rollback vid fel
- 3 Playwright-tester:
  - 2 deny-tester (förbjudet fält, förbjuden roll)
  - 1 allow-test (lyckad mutation)
- Operations-allowlist utvidgad med ny `operationKey` i `field-allowlists.ts`
- Status-flip annonseras till skärmläsare via `aria-live` (förutsätter Fas 3.5:s a11y-mönster)
- Fas A:s aktiveringsguides 5 steg följs (operationKey → allowlist → test → UI → integration)

#### Inte scope

- **Inga nya EF-deploys.** Använder befintlig `update-record`.
- Andra mutationer (närvaro, mail) — Fas 6
- Realtime-updates av anmälda-listan — polling (B1) istället, implementeras i Fas 6d

#### Beroenden

- Fas 5 (app-shell + tab bar)
- Fas 3 (Button, MessageBox)
- Fas 2.5 (operations-API och Status.ts uppdaterade)
- Fas 3.5 (a11y-test för knapp + status-flip-announcement)

#### Estimat

2 sessioner.

#### Filer som skapas/uppdateras

- `src/routes/event/$eventId/betalning.tsx` (ny route)
- `src/components/registrations/MarkPaidButton.tsx`
- `src/data/mutations/markRegistrationPaid.ts`
- `supabase/functions/_shared/field-allowlists.ts` (utvidgas — INTE ny EF)
- `tests/e2e/markPaid.spec.ts` (3 Playwright-scenarier)
- `tests/api/markPaid.spec.ts` (deny/allow på server-nivå)

#### DoD

1. Manuellt: ladda Event-detalj/Betalning → klicka "Markera som betald" → status flippar omedelbart (optimistic) → rollback fungerar vid simulerat fel
2. Server: deny-test 1 — försök ändra `Anteckningar`-fält via `mark-registration-paid` → 403
3. Server: deny-test 2 — anonym användare → 401
4. Server: allow-test — auktoriserad admin + endast Status-fält → 200 + Airtable uppdaterad
5. Klient: optimistic UI flippar inom 50 ms (ingen network-wait innan visuell feedback)
6. Klient: vid 5xx-svar → rollback + toast med `requestId`
7. Klient: TanStack Query-cache invaliderad på `['registrations', eventId]`
8. axe-core 0 violations + status-flip annonseras till skärmläsare via `aria-live`
9. Fas A aktiveringsguides 5 steg avbockade i sessionsdok
10. Mönstret dokumenterat som "mall för Fas 6 mutationer" i sessionsdok
11. ADR-016 (TanStack optimistic mutation-mönster) skriven

#### ADR-krav

**ADR-016 — TanStack optimistic mutation-mönster med operations-baserat API** (per A2 + dependency på Fas A M4): dokumenterar `mutationFn` med `executeOperation({operationKey, recordId, fields})` + `onMutate`-rollback-pattern + cache-invalidation-strategy. Skrivs i Fas 5.5 som mall.

#### Korsreferens

- `STATE-STRATEGY.md` §4 (Optimistisk UI), §8 (Operations-baserat write-API)
- `SECURITY-SPEC.md` §6.1 (operations-registret)
- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 4 (A2-beslutet)

---

### Fas 6 — Hem + Event + Personer + Mer (strangler-fig)

#### Mål

Bygga de fyra produkt-flikarna i strangler-fig-ordning: Persons-domän → Events-domän → Registrations + Väntelista → Hem-aggregering → Mer-fliken → Skapa nytt event → Segment-yta → Mail-handling. Hem byggs efter de tre datadomänerna (Persons/Events/Registrations) eftersom den aggregerar dem; Mer och Skapa nytt event är fristående och byggs sist. Segment-ytan (6g, ADR-062) och bulk-mail-handlingen (6h) bygger på person-/deltagardata och bär mail-vertikalen som flyttats ut ur 6e — mail byggs efter segment-motorn eftersom mottagar-upplösning kräver den.

#### Sub-fas-allokering

| Sub-fas | Domän/grupp | Estimat | Innehåll | EF som deployas |
|---|---|---|---|---|
| **6a** | Persons | 0,75 sess | `/personer` lista (befintlig fetchPersons) + `/personer/[id]` detaljvy + minimal write (uppdatera notering) | `fetchPerson` |
| **6b** | Events | 0,75 sess | `/event` lista (befintlig fetchEvents) + `/event/$eventId` info-route + `/event/$eventId/narvaro`-route (C1 nested, ej flik) | `fetchEvent`, `fetchAttendance` |
| **6c** | Registrations + Väntelista | 1 sess | Anmälda-flik på Event-detalj, väntelista-konvertering på Mer, idempotent registrering | `createRegistration`, `fetchWaitlist` |
| **6d** | Hem-aggregering | 0,5 sess | `/hem` med greeting + nya anmälningar + info-cards + CTA. Polling 60s + pull-to-refresh + visibility-trigger (B1) | (inga nya — använder befintliga read-EF) |
| **6e** | Mer-fliken | ~1,0 sess | Intresserade (leads-läsvy) + Maillogg (läsvy) + logga ut (Inställningar de-scopad 6e → T47, ADR-058-audit iv-1/Väg 1) | `get-leads`, `get-mail-log` |
| **6f** | Skapa nytt event | ~1 sess | `/mer/skapa-event`-formulär + create-event write-vertikal mot Eventplanering (egen session) | `create-event` (write, egen ADR) |
| **6g** | Segment-yta | ~2,0 sess | Bygg/se/spara/exportera segment av personer ur deltagarhistorik; beräknat medlemskap från källan (Deltaganden); dynamisk regel + snapshot-export; SKOOL-modulbehörighet (union per kurs×modalitet). Egen session, multi-landning | beräknings-/segment-EF:er definieras vid 6g-design (ADR-062) |
| **6h** | Mail-handling (bulk-utskick) | ~0,5 sess | `send-email` PÅ ett segment — byggs EFTER 6g eftersom bulk-mail behöver segment-motorn för att lösa mottagare | `send-email` (direct-Resend, ADR-015 + Idempotency-Key) |

**Total: 7,5 sessioner** (6a–6d klara: 3,0; 6e ~1,0; 6f ~1,0; 6g ~2,0; 6h ~0,5).

#### Scope (per sub-fas)

- Domän-vy enligt sub-fas-tabell
- Mutationer registreras i `field-allowlists.ts`
- 1 deny-test + 1 allow-test per ny operationKey
- Vy-Playwright baseline (1 happy path)
- TanStack Query med stale-time + cache-time per vy

#### Inte scope (per sub-fas)

- Polling/Realtime utöver 6d Hem (per B1: hybrid polling 60s + pull-to-refresh; Realtime defer:as till Fas E)
- Närvaro-Background-Sync — defer:ad till Fas 8 per B2
- xAPI-aktivitetslogg — Fas 6.5

#### Beroenden

- Fas 5 + Fas 5.5 (mutation-mönstret etablerat)
- Fas 3 (UI-primitiver)
- Fas 3.5 (a11y-baseline)
- Fas 2.5 (adapter-debt klassad)
- Inom Fas 6: 6a → 6b → 6c är hård kedja; 6d kräver att 6a + 6b + 6c levererat data-EF:er; 6e är fristående och kan defer:as; 6g (Segment-yta) bygger på 6a-domänens person-/deltagardata och beräknar medlemskap från källan (Deltaganden); 6h (mail-handling) kräver 6g — bulk-mail behöver segment-motorn för att lösa mottagare

#### Estimat

7,5 sessioner totalt, sub-fördelat enligt tabell.

#### Filer som skapas/uppdateras

**6a (Persons):**

- `src/routes/personer/index.tsx`, `src/routes/personer/$personId.tsx`
- `supabase/functions/get-person/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/personer.spec.ts`

**6b (Events):**

- `src/routes/event/index.tsx`, `src/routes/event/$eventId/info.tsx`, `src/routes/event/$eventId/narvaro.tsx`
- `supabase/functions/get-event/index.ts`, `supabase/functions/get-attendance/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/event.spec.ts`

**6c (Registrations + Väntelista):**

- `src/routes/event/$eventId/anmalda.tsx` — **riven 2026-09-04 (TASK-389).**
  18.13-skulden betald: länken från Mer → Anmälningar gick till denna
  gamla, hela-eventets Anmälda-lista i stället för anmälans egen sida
  (task-18.17). Länken i `AnmalningarSida.tsx` pekar nu på
  `/event/$eventId/anmalan/$registrationId`; routen, `EventRegistrations.tsx`
  och `AddRegistrationModal.tsx` är rivna tillsammans med den.
- `src/routes/mer/vantelista.tsx`
- `supabase/functions/create-registration/index.ts` (deploy med idempotency)
- `supabase/functions/get-waitlist/index.ts` (deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/registrations.spec.ts`

**6d (Hem):**

- `src/routes/hem.tsx`
- `src/components/hem/Greeting.tsx`, `NyaAnmalningar.tsx`, `InfoCards.tsx`, `CTA.tsx`
- `src/data/queries/usePollingQuery.ts` (60s + pull-to-refresh + visibility-trigger)
- `tests/e2e/hem.spec.ts`

**6e (Mer):**

- `src/routes/_authenticated/mer/index.tsx` (skal: Intresserade/Maillogg/logga ut; Inställningar de-scopad 6e → tråd T47, ADR-058-audit iv-1/Väg 1)
- `src/routes/_authenticated/mer/intresserade.tsx`, `.../maillogg.tsx` (route-konvention verifieras mot befintliga mer/-routes på disk)
- `supabase/functions/get-leads/index.ts`, `.../get-mail-log/index.ts` (deploy)
- `tests/e2e/mer.spec.ts`

**Not (6e Intresserade):** Intresserade är STRIKT — person som hämtat något men ALDRIG anmält sig (Antal anmälningar totalt = 0). Avbokade-som-aldrig-deltog exkluderas medvetet — de är ett identifierat framtida segment (winback/återaktivering), ej i 6e. Se tråd T35 (tasks/threads/README.md) — winback/återaktivering.

**6f (Skapa nytt event):**

- `src/routes/_authenticated/mer/skapa-event.tsx`
- `supabase/functions/create-event/index.ts` (write, deploy)
- `field-allowlists.ts` (utvidgas)
- `tests/e2e/skapa-event.spec.ts`

**6g (Segment-yta):**

- `src/routes/_authenticated/mer/segment/` (bygg/se/spara/exportera-vyer; route-konvention verifieras mot disk)
- segment-motor (källfråga mot Deltaganden, beräknat medlemskap) + ev. beräknings-EF (definieras vid 6g-design)
- snapshot/export-handling (nedladdningsbar e-postlista för SKOOL-import + ev. frusen utskickslista)
- kurs→modul-config (SKOOL-modulbehörighet, union per kurs×modalitet)
- `tests/e2e/segment.spec.ts`
- Styrande: ADR-062

**6h (Mail-handling — bulk-utskick):**

- mail-handling PÅ ett segment (mottagare löses av 6g:s segment-motor)
- `supabase/functions/send-email/index.ts` (deploy; direct-Resend + Idempotency-Key)
- `field-allowlists.ts` (send-email post-send-PATCH-fält för mail-prick-timestamp)
- `tests/e2e/mail-handling.spec.ts`
- Styrande: ADR-015 + ADR-062

#### DoD (per sub-fas)

1. Vyer passerar 11/10/10 mot `KVALITETSDEFINITIONER-11-REACT.md` (Tillgänglighet 11, Teknik 10, Återanvändbarhet 10 — vyer är produktspecifika så Återanvändbarhet/Teknik kan acceptera produktbundna val)
2. Vy renderar mot live-data (eller Airtable-mockad fixture i CI)
3. Mutation registrerad i `field-allowlists.ts` med 1 deny + 1 allow-test grön
4. Vy-Playwright baseline grön
5. axe-core 0 violations
6. EF deployad till staging + verifierad mot Airtable-bas
7. TanStack Query cache + invalidation fungerar (verifiera med devtools)

#### ADR-krav (Fas 6)

- **ADR-014 — `createRegistration`-idempotency** (per A5, Fas 6c): dokumenterar idempotency-nyckel-strategin (mot dubbletter vid retry/dubbel-klick) — adresserar `data-model.md §F.4`-buggen.
- **ADR-015 — `sendEmail` direct-Resend-skuld** (per A5, Fas 6h — omsekvenserad ut ur 6e per ADR-062): när sendEmail deployas i 6h (bulk-mail PÅ ett segment), dokumenterar varför direct-Resend-anrop används och planen för migration till mail-event-pattern (+ Idempotency-Key-header; ev. additiv ADR-015-uppdatering avgörs vid 6h:s send-email-bygge).
- **ADR-017 — Polling-vs-Realtime + migrations-vägen post-Fas E** (per B1, Fas 6d): dokumenterar 60s + pull-to-refresh + visibility-trigger som interimslösning + Supabase Realtime-omläggning som Fas E-uppgift.
- **ADR-krav 6f — `create-event` write-mall:** dokumenteras vid 6f-start (egen ADR, jfr ADR-014/016). TBD.
- **ADR-062 — Segment-ytans arkitektur** (Fas 6g): beräknat medlemskap från källan (Deltaganden), dynamisk regel + snapshot, strukturerad include/exclude-definition över taxonomin (kurs×modalitet). Skriven 2026-06-25; styr 6g-bygget.

#### Korsreferens

- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 3 (A5-tabellen) + Del 4 (A3 + A2 + B1)
- `docs/research/datamodell-research/07-migration-plan.md` §A2 (strangler-fig-ordningen)
- `STATE-STRATEGY.md` §2 (per-vy state-plan med strangler-fig-not), §5b (polling-pattern)

---

### Fas 6.5 — Aktivitetslogg (xAPI)

✅ Slutförd 2026-08-14 över Session 105 (grillning → PRD `task-201` + 18
underkort → bygge → prod-driftsättning 2026-08-13 (Marcus körde runbooken
guidat) → exekveringsvåg + fas-avslut 2026-08-14). Levererat: Supabase
`activity_log` (staging + prod, RLS, append-only strukturellt bevisad),
`log-activity`/`get-activity-log`-EF:er under EF-ribban, xAPI-statements
Zod-validerade med `requestId` i `context.extensions` (ADR-111) och
personId-extension, katalog-invarianten "varje exporterad mutationshook
loggar" mekaniserad (16/16/0 efter död-kod-rivningen `TASK-201.18`;
hemvist-grinden `tests/api/mutation-hemvist-vakt.test.ts` +
`.mutation-hemvist-policy.conf` fäller komponent-lokala mutationer),
hem-spalten "Senaste aktivitet" (≥xl, facit-stämplad 2026-08-13,
cache-invalidering via `TASK-210`), historikvy med filterrad via Mer
(disambiguerade event-etiketter `TASK-201.17`), e2e-skarv
`tests/e2e/aktivitetslogg-skarv.staging.test.ts` (konventionsformen
`.staging.test.ts` ersätter Filer-listans planerade `.spec.ts`-namn).
Lagringsvalet Supabase i stället för Airtable: ADR-110 (v1.15-amenderingen).
Full trail: `tasks/sessions/2026-08-11-session-105.md` + PRD-kortets DoD.

#### Mål

Implementera xAPI-baserad aktivitetslogg för spårning av Lottas operativa åtgärder (markera betalning, bekräfta anmälan, etc.) — för observability + framtida adaptiv lärning i Passionslyftet.

#### Scope

- xAPI-statement-shape definierad och Zod-validerad
- `src/data/activityLog/recordActivity.ts` med `requestId`-propagering från Fas A M7
- 5–10 aktivitetstyper definierade (markera-betald, bekräfta-anmälan, lägga-till-person, etc.)
- Lagring: Supabase `activity_log`-tabell (staging + prod), RLS aktiv, write endast via `service_role` i EF — **AMENDERAT 2026-08-11 (S105/`TASK-201.1`, öppen ändring, ej tyst):** ersätter ovanstående ursprungsrad ("Airtable `Activity Log`-tabell per `data-model.md` eller separat target-tabell post-Fas E") per [ADR-110](decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md) — se § 6. Versionshistorik v1.15.
- `[GA]` Open Badges-kompatibel struktur (defer:as till Passionslyftet men shape förbereds)

#### Inte scope

- Adaptiv lärning-engine — Passionslyftet
- LiveKit / Cal.com-integration — Passionslyftet
- Real-time activity-stream-visning — Fas E

#### Beroenden

- Fas A M7 (`requestId`-propagering)
- Fas 6 (5–10 aktivitetstyper kommer från reella vy-events)

#### Estimat

1 session.

#### Filer som skapas/uppdateras

- `src/data/activityLog/recordActivity.ts`
- `src/domain/schemas/ActivityStatement.schema.ts` (xAPI-statement-shape + Zod-schema — **rättat 2026-08-14 mot disk-verkligheten:** `src/data/activityLog/types.ts` byggdes ALDRIG, schemat landade i `src/domain/schemas/` i stället, TASK-201.1)
- `src/data/activityLog/activityTypes.ts` (5–10 typer, t.ex. `markera-betald`, `bekräfta-anmälan`, `lägga-till-person`)
- `src/data/mutations/*.ts` (befintliga mutationer från Fas 6 utökas med `onSuccess`-callback som loggar aktivitet)
- Ev. `supabase/functions/log-activity/index.ts` om server-side-aggregering krävs
- `tests/e2e/activityLog.spec.ts` (**ÄNNU EJ BYGGD 2026-08-14** — byggs i `TASK-201.16`, skiva under PRD `task-201`, mintad 2026-08-14, PR #1286; dagens blockerande skydd är `tests/acceptance/` + staging-api-testerna)

#### DoD

1. Varje mutation från Fas 6 producerar ett xAPI-statement
2. Statement-shape valideras runtime via Zod
3. `requestId` propageras från klient → server → activity-log
4. Activity-log läsbar för debug i devtools
5. Bonus-ADR (utöver de 10 i ADR-index ovan) skriven om `trace_id` vs `requestId`-relationen — distinkta korrelerade IDs eller sammanslagna. Beslut tas vid sessionsstart. **INLÖST 2026-08-11:** [ADR-111](decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md) — sammanslagna, `requestId` är enda korrelations-ID:t. Amenderat öppet 2026-08-14 (v1.16), tredje av tre stale-ställen (se § Versionshistorik).

#### ADR-krav

**Bonus-ADR (utöver P3a:s 10) — `trace_id` vs `requestId`-relationen**: distinkta korrelerade IDs eller sammanslagna. Per P0-inventory Fas 6.5 öppen fråga. Skrivs när Fas 6.5 implementeras, inte i P3a. **INLÖST 2026-08-11:** [ADR-111](decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md) — sammanslagna, `requestId` är enda korrelations-ID:t. Amenderat öppet 2026-08-14 (v1.16), tredje av tre stale-ställen (se § Versionshistorik).

#### Korsreferens

- `FEATURE-ACTIVITY-LOG.md` (uppdateras i Fas 6.5 efter ADR-beslut)
- `data-model.md` (Activity Log-tabell-shape)

---

### Milstolpe — Airtable-bas-maximering (post-Fas-6, ADR-063)

> **Detta är en MILSTOLPE, inte en fas.** Egen kommande pass-kedja, placerad EFTER Fas 6.5 — då hela app↔Airtable-interaktions-ytan är byggd av **Fas 6:s EF ensamt**. Fas 7 tillför inga nya Airtable-interaktioner, så interaktions-registret är moget vid denna slot.
>
> **AMENDERAT 2026-08-11 (S105/`TASK-201.1`, öppen ändring, ej tyst):** ovanstående ersätter den ursprungliga premissen "Fas 6:s EF + Fas 6.5:s `Activity Log`-write" — Fas 6.5:s aktivitetslogg lagras i Supabase, inte Airtable ([ADR-110](decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)), och tillför därmed INGEN app↔Airtable-interaktion att audita. Fas 6.5 kvarstår som TEMPORAL föregångare till denna milstolpe (se § Beroenden nedan), men bidrar ingen interaktions-registerpost.
>
> **AMENDERAT 2026-08-14 (Marcus GO, öppen ändring, ej tyst — [ADR-063](decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) § Updates 2026-08-14):** milstolpen är INTE längre bas-maximeringens resolutions-hem. Defekter och förbättringspotential i basen åtgärdas KONTINUERLIGT när de avtäcks — i basen, eget kontrollerat pass, egen verifiering per ändring — i stället för att samlas och väntas ut. Milstolpen är nu en dedikerad SLUTGENOMLYSNING: "en gång till", för att hitta ytterligare förbättringspotential utöver vad det kontinuerliga arbetet redan fångat, plus auditen av registrens korrekthet ((a)+(b) nedan, oförändrade).

#### Mål

Slutgenomlysning av Airtable-basen: en dedikerad "en gång till"-titt (ADR-063 § Updates 2026-08-14) för att hitta KVARVARANDE förbättringspotential utöver vad den löpande kontinuerliga bas-maxningen redan åtgärdat, plus audit att registren är korrekta och kompletta. Basen maxas till 11/10 / branschledarmässig / mall-redo — som förstklassig leverabel, ej ersättas (ADR-063). Resolution sker fortsatt I BASEN — kontinuerligt, inte bara här.

#### Scope

- **(a)** Audita att ALLA app↔Airtable-interaktioner är registrerade KORREKT — mot `docs/reference/airtable-interaction.md` + app↔Airtable-interaktions-registret.
- **(b)** Audita att HELA Airtable-skatten (`data-model.md` §Kända fällor) är registrerad KORREKT + KOMPLETT.
- **(c)** Slutgenomlysning: hitta KVARVARANDE förbättringspotential utöver vad den löpande kontinuerliga bas-maxningen (ADR-063 § Updates 2026-08-14) redan åtgärdat, och lösa ut det i basen själv — ej lappa provisoriskt, ej designa-bort i en efterträdare.

#### Inte scope

- Supabase-migration (Fas E) — separat senare spår, ej ersättning av Airtable (ADR-063).
- Att FIXA basen i denna React-bygg-session — milstolpen är en egen pass-kedja.

#### Beroenden

- Fas 6 (alla app↔Airtable-interaktioner byggda — inklusive den sista, sedan Fas 6.5 amenderades bort från Airtable).
- Fas 6.5 (temporal ordning kvarstår — men tillför INGEN app↔Airtable-interaktion att registrera, sedan lagringsvalet flyttades till Supabase, **amenderat 2026-08-11 S105/`TASK-201.1`** per [ADR-110](decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md); se § Fas 6.5-lagringsraden ovan).

#### Estimat

(estimat sätts vid milstolpens dekomponering, ADR-063) — **osatt, ej inräknad i grand-totalen** (§2).

#### Styrande

- [ADR-063](decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md) — Airtable-basen som förstklassig leverabel.
- Defekt-registret (`data-model.md` §Kända fällor + T16 + app↔Airtable-interaktions-registret) = KRAVSPEC för bas-maximeringen.

#### Blast-radius-not

Airtable-basen är delad prod (Psionautics gäst) och bär automationer A1–A11. Bas-maximeringen sker med samma försiktighet — eget pass med egen verifiering, ej sidoeffekt.

---

### Fas 7 — Konsolidering

#### Mål

Säkra appen för production: CSP-plugin (defer:ad från Fas 0), prestandamätning, deploy-pipeline, chaos testing, samt de [GA]-tillägg som flyttades hit från Fas 5 per B3.

#### Scope

- CSP-nonce-plugin i `vite.config.ts` (defer:ad från Fas 0)
- Trusted Types
- Säkerhetsheaders (HSTS, X-Frame-Options, etc.)
- web-vitals-mätning (CLS, LCP, FID, INP, TTFB)
- View Transitions API (per B3 — flyttad från Fas 5)
- Speculation Rules (per B3 — flyttad från Fas 5)
- Widget-error-boundary (per B3 — mer granulär än sektion-nivå från Fas 5)
- DataTable-komponent (om event-detalj behöver det; annars eliminera)
- `@axe-core/playwright` integrerad i deploy-pipeline
- Manuell VoiceOver-test
- Chaos testing (medveten EF-failures + offline-toggling)
- Deploy-pipeline (staging → production, smoke-tester)
- Golden Master-testdag
- Supply chain audit
- React 19 CVE-granskning
- PostCSS audit-fix
- Design audit (skill) på Hem, Mer, AppShell

#### Inte scope

- Background Sync (defer:ad till Fas 8 per B2)
- Passkeys, push-notifications — Fas 8 eller senare
- Lighthouse-perfekt på alla routes — endast på kritiska (Hem, Event-detalj, Personer-detalj)

#### Beroenden

- Fas 6 (alla flikar byggda — det finns något att deploya)
- Fas 6.5 (aktivitetslogg etablerad — chaos-testing ger användbar data)

#### Estimat

3 sessioner.

#### Filer som skapas/uppdateras

- `vite.config.ts` (CSP-plugin aktiveras)
- `src/main.tsx` (web-vitals + Speculation Rules)
- `src/components/ErrorBoundary/WidgetError.tsx`
- `.github/workflows/deploy.yml` (eller motsvarande)
- `tests/chaos/*.spec.ts`
- `tests/e2e/visual/*` (Golden Master)

#### DoD

1. CSP-plugin aktiv i prod, ingen inline-script-violation i console
2. web-vitals-mätning rapporterar till Sentry/Faro
3. Speculation Rules aktivt på utvalda routes (verifierat via Lighthouse)
4. View Transitions: navigation mellan flikar har transition (med `prefers-reduced-motion`-respekt)
5. Widget-error-boundary fångar fel inom enskild card/widget utan att krascha sektion
6. axe-core-violations failar deploy
7. Chaos-test: medveten EF-500 → app fortsätter fungera, error rapporteras till Sentry med `requestId`
8. Deploy-pipeline: pull-request → staging-deploy → smoke-tests → manual approval → prod-deploy
9. Golden Master-tester gröna mot staging
10. PostCSS audit clean (`npm audit --audit-level=moderate` → 0)
11. React 19 CVE-genomgång committad i `docs/security-audits/2026-XX-react-19.md`
12. Design audit (skill) körd på Hem, Mer, AppShell — rapport committad

#### ADR-krav

- **Refererar ADR-011 — CSP-plugin-deferral** (per P0-inventory): ADR skrevs i P3a vid byggplan-skiftet, dokumenterar varför plugin defer:ats från Fas 0 till Fas 7. Inget *nytt* ADR krävs här — endast verifikation att ADR-011:s villkor uppfylls (CSP-plugin aktiv i prod, inga inline-script-violations).

#### Korsreferens

- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 5 (B3-beslutet — vilka [GA] som flyttats hit)
- `SECURITY-SPEC.md` §5 (OWASP-tabellen)

---

### Fas 8 — Background Sync (framtid)

#### Mål

Implementera Background Sync API för offline-mutationskö — defer:ad från Fas 7 per B2-beslutet. Aktualiseras när production-instrumentering från Fas 7 har samlat empirisk data om hur ofta Lotta hamnar i offline-läge med köade mutationer.

#### Scope (preliminärt — låses vid aktualisering)

- Background Sync API-integration i `public/sw.js`
- IndexedDB-baserad mutationskö
- Kö-status-UI i app-shell ("3 ändringar väntar på synk")
- Konflikt-hantering (server-state vs lokal kö)

#### Inte scope (denna revision)

- Passkeys (defer:ad)
- Push-notifications (defer:ad)

#### Beroenden

- Fas E klar (target-arkitektur låst)
- Fas 7 deploy klar (production-instrumentering finns för empirisk data)

#### Estimat

TBD — fastställs vid aktualisering.

#### ADR-krav

- **ADR-019 — Background Sync defer från Fas 7 till Fas 8** (per B2): dokumenterar arkitekturskuld + Fas 7-storlek + Lotta-flow-tolerans + plan för aktualisering. Skrivs vid Fas 7-start så det är tydligt att Fas 7 *inte glömde* — det var medvetet.

#### Korsreferens

- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 5 (B2-beslutet)
- `STATE-STRATEGY.md` (Background Sync-not när aktualiseras)

---

### Fas B — Airtable-hardening (parallell-spår)

#### Mål

Säkra Airtable-basen som single source of truth för Miranon Media Admin tills Fas E migreras: rensa drift, etablera redesign-konsistens, dokumentera operativa gränser. Roger/Lotta-arbete med Marcus-stöd.

#### Scope (preliminärt — fastställs av Roger/Lotta i samråd med Marcus)

- Drift-rensning per `docs/research/datamodell-research/06a-airtable-redesign.md` Del A–C
- Schema-kontrakt mellan Airtable-fält och `data-model.md`
- 11 automationer granskade (live-state per `docs/research/datamodell-research/02-live-state.md` §A)
- Synk-gates mot React-bygget per A4 (`tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Design-not): Synk-gate 1 (hard) — A1–A12-schemaändringar inventerade och kategoriserade som "redan applicerade" / "kommer appliceras före Fas 2.5" / "appliceras efter Fas 2.5" *innan* Fas 2.5 startar; Synk-gate 2 (handshake per operation) — vid varje Fas 5.5/6-leverans som registrerar ny operation i `field-allowlists.ts` kontrolleras fältnamn mot 06a-status

#### Beroenden

**Parallell-spår — inga beroenden mot Fas A.** Synk-gate 1 mot Fas 2.5-start + Synk-gate 2 mot Fas 5.5/6-operationerna (per A4).

#### Estimat

Separat estimat — fastställs av Roger/Lotta.

#### ADR-krav

Inget nytt ADR i React-byggets katalog. Airtable-side-beslut dokumenteras i Roger/Lottas eget spår.

#### Korsreferens

- `docs/research/datamodell-research/06a-airtable-redesign.md` Del A–C
- `tasks/sessions/archive/2026-04/datamodell-research/fas-4a-prompt.md` §3.4
- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 2 (A4-beslutet)

---

### Fas E — Supabase-migration (DEFER)

> **Övning 2:s namngivna SLUTFAS** ([ADR-068](decisions/ADR-068-ovnings-ramverket.md)) — sist av alla byggplans-delar; designas i egen ADR när fasen närmar sig (ADR-krav nedan).

#### Mål

Migrera Miranon Media Admin från Airtable som primär datakälla till Supabase (Postgres + RLS + Realtime), enligt strangler-fig-ordningen i `docs/research/datamodell-research/07-migration-plan.md` §A2.

#### Scope (preliminärt — låses vid aktualisering)

- Persons → Events → Registrations → Hem-aggregering enligt 07 §A2
- DataSourceAdapter-byte: AirtableAdapter → SupabaseAdapter (target-shape från 06b)
- Supabase Realtime ersätter polling (per B1) — anslutningar per tabell
- RLS-policies enligt 06b-targetmodellen
- Activity Log migrerad till `activity_log`-tabell med trigger-baserad statement-generering
- Datasynk under övergångsperiod (dual-write eller CDC)

#### Inte scope

- Hela appens omskrivning — DataSourceAdapter-pattern (etablerat i Fas 1) tar 90% av sticket
- Airtable-bortrivning omedelbart — kvar som backup tills Fas E är verifierad

#### Horisont (omankrad 2026-07-27, S91 premiss 4 — Marcus-beslut)

Fasen aktualiseras när **appens sidor är klara** — inte post-Fas 7 som tidigare stod här. Konkret betyder det efter att de fem facit-lösa ytorna gått genom hela kedjan (se Fas 6 § Överordnat förkrav) och CI-/grind-arkitekturen är klar (premiss 3).

**Två veckor är en ÖNSKAN, inte en deadline** — Marcus ordagrant: *"får bli som det blir"*. Ingen planering nedströms får behandla den som ett åtagande.

**Varför omankringen gjordes:** den tidigare formuleringen band Fas E till Fas 7:s deploy. Premiss 1 håller Fas 6 medvetet öppen tills sidorna är byggda som Marcus vill ha dem, vilket gör "post-Fas 7" till en horisont som inte längre säger något om NÄR — den pekar på en fas vars förkrav i sin tur flyttats. Ankaret flyttas därför till det som faktiskt styr.

#### 90/10-kravet på det som byggs FÖRE fasen (S91 premiss 5)

CI-/grind-arkitekturen som byggs nu ska vara **110 % toppdesignad med väl underbyggda Airtable-anpassningar**, men **~90 % ska överleva Supabase-bytet** oförändrat och lika förstklassigt. Snittet är fastlagt i [ADR-080](decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md): gränsen går **vid protokollet, inte vid läs/skriv** — testhandlers uttrycks mot EF-kontraktet, som är det som överlever datakällebytet.

Konsekvens för denna fas: acceptance-klassens testarkitektur ska INTE behöva byggas om vid migreringen. Faller det antagandet är det ett Fas E-fynd som hör hemma i fasens egen ADR.

**Omprövning inritad HÄR:** ADR-080 dokumenterar att hermetisk utbrytning är branschens *andrahandsval* och en medveten Airtable-kompromiss — branschens förstahandsval, efemär skarp backend, är stängt eftersom Airtable inte är självhostbar ([`airtable-constraints.md`](reference/airtable-constraints.md) P26/P27). När datakällan blir klonbar i denna fas ska topologin omprövas, inte ärvas.

#### Beroenden

- **Appens sidor klara** (se § Horisont ovan) — det styrande ankaret sedan 2026-07-27
- Fas 7 deploy klar (target för migration finns)
- Fas B avslutad (Airtable-side städat innan migration)
- Empirisk data från Fas 7-deploy om vilka tabeller som har högst läs/skriv-tryck (informerar migrationsordning inom Fas E)

> **ÖPPEN, MEDVETET EJ AVGJORD:** premiss 4 flyttade HORISONTEN — den sa ingenting om Fas 7:s roll. Fas 7-beroendet står därför kvar oförändrat, och förhållandet mellan det nya ankaret ("sidorna klara") och Fas 7:s deploy är **inte** löst av denna uppdatering. Frågan hör till Marcus när fasen aktualiseras; att tyst härleda ett svar ur premissen vore att besluta mer än premissen bär.

#### Estimat

Separat planering — fastställs vid aktualisering.

#### ADR-krav

ADR:er per migrationsbeslut — skrivs vid aktualisering.

#### Korsreferens

- `docs/research/datamodell-research/06b-supabase-target.md` (target-modellen)
- `docs/research/datamodell-research/07-migration-plan.md` §A2 (strangler-fig-sekvens)
- `docs/research/datamodell-research/08-odoo-validation.md` (sista valideringen av target)

---

## 5. ADR-index

10 ADR:er skrivna i P3a (2026-05-05) som ADR-011 till ADR-020 — tilldelade efter befintliga ADR-001 till ADR-010 (Fas 0 + Fas 1, Session 1, 2026-04-14). Fullständigt index i `docs/decisions/README.md`.

| ADR | Ämne | Fas där den skrivs/refereras | Källa |
|---|---|---|---|
| ADR-011 | CSP-plugin-deferral i `vite.config.ts` | Fas 0 (skrivs nu, refereras från Fas 7) | P0-inventory Fas 0.1 + 7.3 + direktiv §8.5.6 |
| ADR-012 | Conversion-plan → byggplan-skiftet | Meta (skrivs i P3a) | Direktiv §12 ("ramen 'konvertering' var efterlöpare") |
| ADR-013 | Fas 4-borttagningen (DataTable flyttad till Fas 7) | Meta (skrivs i P3a) | P0-inventory Fas 4.1 + direktiv §12 (Numreringsnot) |
| ADR-014 | `createRegistration`-idempotency | Fas 6c | P1-sessionsdok Del 3 (A5) + `data-model.md §F.4` |
| ADR-015 | `sendEmail` direct-Resend-skuld | Fas 6h (omsekv. ur 6e per ADR-062) | P1-sessionsdok Del 3 (A5) |
| ADR-016 | TanStack optimistic mutation-mönster med operations-baserat API | Fas 5.5 | P1-sessionsdok Del 4 (A2) |
| ADR-017 | Polling-vs-Realtime + migrations-vägen post-Fas E | Fas 6d | P1-sessionsdok Del 4 (B1) |
| ADR-018 | Fas 5-förenklingen (vilka [GA] flyttas till Fas 7) | Fas 5 | P1-sessionsdok Del 5 (B3) |
| ADR-019 | Background Sync defer från Fas 7 till Fas 8 | Fas 7-start | P1-sessionsdok Del 5 (B2) |
| ADR-020 | **Fas 3.5 = egen fas** (P2 A1-utfall) | Fas 3.5 | P2-sessionsdok Del 5 (A1-trigger-rapport) |

Bonus-ADR (utöver de 10 ovan): `trace_id` vs `requestId`-relationen — skrivs när Fas 6.5 implementeras (per P0-inventory Fas 6.5 öppen fråga). Numreras vid Fas 6.5-tidpunkt. **INLÖST 2026-08-11:** [ADR-111](decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md) — sammanslagna, `requestId` är enda korrelations-ID:t. Amenderat öppet 2026-08-14 (v1.16) — tredje stale-stället, missat av v1.15:s amendering (som stängde :826/:830 men inte denna rad), funnet 2026-08-14.

---

## 6. Versionshistorik

| Version | Datum | Förändring |
|---|---|---|
| 1.0 | 2026-05-05 | Initial (P3a K2) — ersätter `docs/conversion-plan.md`. Baserad på P0-inventory + P1 fas-sekvens-revision + P2 stödspec-synk. 13 fas-prompter + 10 ADR:er identifierade som ADR (#1)–ADR (#10). |
| 1.1 | 2026-05-05 | P3a K3 — 10 ADR:er skrivna och numrerade som ADR-011 till ADR-020 i `docs/decisions/`. ADR-referenser i fas-prompter + §5 ADR-index uppdaterade till slutgiltiga ADR-NNN-format. |
| **1.2** | **2026-05-13** | **Fas 2 markerad KLAR** efter Sessions 4+5+5b. Defense-in-depth tre-skikt-arkitektur levererad. ADR-026 (Runtime-validering), ADR-027 (KVALITETSDEFINITIONER stack-skifte), ADR-028 (Supply chain incident-respons-protokoll) tillkomna under K0åe/K0åf/K0åg. §2 fas-tabell uppdaterad (Fas 2 ✅ KLAR + estimat-summa Fas 2.5 → Fas 7 = 14,5 sessioner). §4 Fas 2-prompt utökad med "✅ Slutförd"-paragraf per Fas A-mallen. K5.9a drift-stängning av sanningskälla mot BUILD-LOG/todo/v3/CLAUDE.md (Kandidat 12-disciplin). |
| **1.4** | **2026-06-10** | **Fas 2.5 markerad KLAR** efter Session 13 (klunga 1–4). §2 fas-tabell uppdaterad (Fas 2.5 ✅ KLAR + estimat-summa Fas 3 → Fas 7 = 13,5 sessioner). §4 Fas 2.5-prompt utökad med "✅ Slutförd"-paragraf per Fas A-mallen. Schema-path-typo i §4.5 Filer rättad (`src/data/schemas` → `src/domain/schemas`, K2 DEL B). DoD-trail: Status.ts 4→6, noll enum-divergens, z.enum-hårdning, A5-debt-klassning, 0 EF-deploys, 113 tester gröna via CI. |
| **1.3** | **2026-06-10** | **Drift-korrigering av Fas B-synk-gates mot beslutat A4-innehåll.** Session 13-forensik fann inget beslutsspår för "Gate B1 (innan Fas 6c)"/"Gate B2 (innan Fas E)"-formuleringarna (införda vid dokumentets födelse `2ffede0`, P3a K2) — transkriptions-drift från A4-beslutet. Återställt per A4: Synk-gate 1 (hard) före Fas 2.5 + Synk-gate 2 (handshake per Fas 5.5/6-operation). §2 fas-tabell rad B, §4 Fas B Scope/Beroenden korrigerade; §4 Fas 2.5 Beroenden utökad med Synk-gate 1 som hård gate. Trail: `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` (A4) + `tasks/sessions/archive/2026-06/2026-06-10-session-13.md` (forensik). |
| 1.5 | 2026-06-11 | §4 Fas 3 scope-korrigering per [ADR-044](decisions/ADR-044-react-aria-components-demo-route.md) (Session 14 K1): react-aria-components som primitiv-bas (ersätter "React Aria-hooks som bas (`useButton`, `useTextField`, etc.)") + demo-route `/dev/primitives` vald över Storybook på byggplanens eget kostnadsvillkor. Beslutsspår i ADR:n; scope-texten och faktiskt bygge åter konsistenta. |
| 1.6 | 2026-06-11 | §4 Fas 3.5 mönsterlista omskriven i components-termer per [ADR-044](decisions/ADR-044-react-aria-components-demo-route.md) (Session 15 K1): komponentnamn ur react-aria-components ersätter hooks-parenteserna (`useOverlay` etc.); användningsfallen per rad oförändrade. A11y-runner-arkitektur etablerad i [ADR-045](decisions/ADR-045-a11y-runner-arkitektur.md): CI-måltavla `/dev/primitives` via webServer-dev-server, 0 violations kanonisk tolerans, `test:a11y` i Test+Build-sfären. ADR-020:s hooks-formulering i §Scope är historiskt beslutsdokument och redigeras inte — API-stil styrs av ADR-044. |
| **1.7** | **2026-06-11** | **Fas 3 + Fas 3.5 markerade KLARA** efter Session 15. §2 fas-tabell uppdaterad (båda ✅ KLAR + estimat-summa Fas 5 → Fas 7 = 10,5 sessioner). §4 Fas 3- och Fas 3.5-prompterna utökade med "✅ Slutförd"-paragrafer per Fas A-mallen — Fas 3-paragrafen noterar DoD 1+4 stängda mot 3.5-infran (ADR-020 sekvens-noten) + felmeddelande-wiring per [ADR-046](decisions/ADR-046-felmeddelande-wiring-describedby.md) + skärmläsar-defer (post-fix-omlyssning som öppen todo-tråd, ej blockerande). DoD-trail: runner 12/12 run 27343206661, gate-proof run 27337333679, "A11y-baseline godkänd"-gate i BUILD-LOG. |
| 1.8 | 2026-06-12 | §4 Fas 5 DoD 4-modernisering per [ADR-047](decisions/ADR-047-pwa-arkitektur-fas-5.md) (Session 16 K1): "Lighthouse PWA-score ≥ 90" ersatt — Lighthouse tog bort PWA-kategorin i v12 (april 2024, per Chromes uppdaterade installability-kriterier); ny lydelse = installability-kriterier (DevTools, 0 manifest-fel) + maskinell offline-verifiering via Playwright + kvarvarande Lighthouse-kategorier mot Fas 0-baselinen. ADR:n kodifierar även Fas 5:s PWA-arkitektur: `vite-plugin-pwa` `injectManifest` (sw.js → src/sw.ts), Workbox offline-fallback-mönster, plugin-genererat manifest + ikoner, TanStack `networkMode: 'online'` + persistQueryClient-defer till Fas 6/8. |
| 1.9 | 2026-06-12 | §4 Fas 5 Scope/Inte scope-justering (Session 16 K3, Marcus-kvitterat via Chat): runtime-caching av API-anrop (network-first, `networkTimeoutSeconds`) flyttad från Scope till Inte scope med defer till Fas 6 där API-konsumtionsmönstren byggs (ADR-017-polling) — autentiserade svar med persondata i Cache Storage kräver säkerhetsgenomgång, samma rationale som [ADR-047](decisions/ADR-047-pwa-arkitektur-fas-5.md) B5:s persistQueryClient-defer. Scope-raden för Workbox SW preciserad till "cache-first för statiska assets (precache), offline.html-fallback"; Inte scope-sektionen omstrukturerad med käll-markering per post (Fas 7 per B3 vs Session 16 K3-defer). K2-flaggan från transparens-rapporten stängd med detta beslutsspår. |
| **1.10** | **2026-06-12** | **Fas 5 markerad KLAR** efter Session 16. §2 fas-tabell uppdaterad (Fas 5 ✅ KLAR + estimat-summa Fas 5.5 → Fas 7 = 9,5 sessioner). §4 Fas 5-prompten utökad med "✅ Slutförd"-paragraf per Fas A-mallen — inkl. skal-på-`_authenticated`-avvikelsen från Filer-listan (STOPPA-utfall A), error-boundary-konsolideringen, DoD 4c-omklassningen per [ADR-047](decisions/ADR-047-pwa-arkitektur-fas-5.md)-korrigeringsnoten, DoD 5-/DoD 7-noterna och K5b–d-ikonrundorna. DoD-trail: shell-/pwa-testsviter + runs 27410118400→27412742687 + Marcus-momentens PASS-kvittens. |
| **1.11** | **2026-06-17** | **Fas 5.5 markerad KLAR** efter Session 22 (klient-UI K2; server-kontrakt + staging i Sessions 18/19). §2 fas-tabell uppdaterad (Fas 5.5 ✅ KLAR + estimat-summa Fas 6 → Fas 7 = 7,5 sessioner). §4 Fas 5.5-prompten utökad med "✅ Slutförd"-paragraf per Fas A-mallen — inkl. fält-valet `Anmälningsavgift` (ADR-049 supersederar DoD-radens exempel), router-context-DI ([ADR-055](decisions/ADR-055-datakalla-atkomst-router-context-di.md), första UI→data-wiringen), toast→MessageBox-avvikelsen (DoD 6) och mockad-e2e-noten (DoD 1/5/6/7/8 via `page.route`-gate). ADR-055 tillkommen (router-context-DI, README-räknare 54→55). DoD-trail: feature-CI run 27706856446. |
| **1.12** | **2026-06-25** | **Fas 6e omdefinierad + ny Fas 6g (Segment-yta) + ny Fas 6h (Mail-handling) + mail omsekvenserad** per [ADR-062](decisions/ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md). 6e slutar nu vid Maillogg — "Skicka mail (write)"-vertikalen + `send-email`-EF utflyttad. 6g = bygg/se/spara/exportera segment med beräknat medlemskap från källan (Deltaganden), dynamisk regel + snapshot-export, SKOOL-modulbehörighet (union per kurs×modalitet). 6h = bulk-mail PÅ ett segment (`send-email`, ADR-015), byggs efter 6g eftersom mottagar-upplösning kräver segment-motorn. §2 fas-tabell (Fas 6-raden: sex→åtta sub-faser) + §4 Mål + sub-fas-tabell + Beroenden + Estimat + Filer (6e nedbantad, 6g/6h tillagda) + ADR-krav + §5 ADR-index (ADR-015 Fas 6e→6h) uppdaterade. Estimat: 6e 1,5→1,0; +6g 2,0; +6h 0,5; Fas 6 5,5→7,5; grand-total Fas 6→7 9,5→11,5 (7,5+1+3). Lättläst-spegling v3 uppdaterad parallellt (sex→åtta delar, 5,5→7,5 pass, totalt-från-Fas-2 18,5→20,5). Estimat 6g/6h är Code-omdöme vid landningstillfället, revidérbart vid 6g-design. |
| 1.13 | 2026-07-05 | **Övnings-ramverket applicerat** per [ADR-068](decisions/ADR-068-ovnings-ramverket.md) (Session 51): prolog-ramrubrik "byggplanen är Övning 2:s karta" + Fas E märkt som Övning 2:s namngivna slutfas (§2-raden + §4-promptens gränsnot, additivt). Inga scope-/estimat-/sekvens-ändringar. |
| **1.14** | **2026-07-27** | **Fas E-horisonten omankrad + Fas 6:s stängning medvetet hållen** — Session 91, per Marcus premisser 1–5 (kanonisk lista: [`../tasks/s91-restlistan.md`](../tasks/s91-restlistan.md) § Beslutade premisser). **§2 fas-tabell rad E:** "Aktualiseras post-Fas 7" → aktualiseras när appens sidor är klara. **§2 Fas 6 closeout-blocket:** nytt ÖVERORDNAT förkrav — Fas 6 stängs INTE förrän de fem facit-lösa ytorna (Personer · Hem · Mer/Intresserade/Maillogg · Segment · Mail-handling) gått genom kedjan prototyp → Marcus väljer → facit → PRD → skivor; CI-/grind-arkitekturen först (premiss 3). **§4 Fas E:** nya sektioner § Horisont (med *"får bli som det blir"* — två veckor är önskan, ej deadline) och § 90/10-kravet (snittet vid protokollet, ej vid läs/skriv, per [ADR-080](decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md); omprövning av hermetik-topologin inritad i fasen eftersom [`airtable-constraints.md`](reference/airtable-constraints.md) P26/P27 stänger branschens förstahandsval). **Fas 7-beroendet står KVAR oförändrat** och förhållandet till det nya ankaret är öppet noterat som EJ avgjort — premiss 4 flyttade horisonten, inte Fas 7:s roll. Inga estimat-ändringar (ankaret är en horisont, inte en omsekvensering). |
| **1.15** | **2026-08-11** | **Fas 6.5:s lagringsval ändrat till Supabase — AT-Max-premissen amenderad** — Session 105 grillad samsyn (Del 2 Beslut 3) + `TASK-201.1`. Aktivitetsloggen lagras i Supabase `activity_log` (staging + prod, RLS, write via `service_role`-EF), **inte** Airtable som ursprungsplanen (P3a 2026-05-05) + `FEATURE-ACTIVITY-LOG.md` (2026-04-05) föreslog — [ADR-110](decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md). **§2 fas-tabell rad AT‑Max:** premissen "hela app↔Airtable-interaktions-ytan är byggd: Fas 6:s EF + Fas 6.5:s `Activity Log`-write" korrigerad till "byggd av Fas 6:s EF ensamt" — Fas 6.5 tillför nu noll Airtable-interaktioner. **§4 Fas 6.5 Scope (lagringsraden)** + **§4 Milstolpe — Airtable-bas-maximering (blockets inledning + Beroenden-listan)** amenderade öppet, samtliga tre förekomster av den gamla premissen. Ingen estimat-/sekvens-ändring (milstolpens plats i roadmapen står kvar; endast dess ingångsvillkors motivering korrigeras). Samtidigt: [ADR-111](decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md) löser in § Fas 6.5 DoD #5/§ ADR-krav-bonus-ADR:n (`trace_id` vs `requestId` — sammanslagna, `requestId` enda korrelations-ID:t); dessa två textställen lämnas ORÖRDA i denna landning (utanför `TASK-201.1` AC #3:s namngivna scope: lagringsraden + AT-Max-premissen) — registrerat öppet, inte tyst. |
| **1.16** | **2026-08-14** | **Docs-drift-rättelse — Fas 6.5-raden flippad + tredje bonus-ADR-stale-stället stängt + Filer-listan synkad mot disk.** **§2 fas-tabell rad 6.5:** "EJ ÄNDRAD" → **🟡 PÅGÅR** — fasen är byggd och LIVE i prod sedan 2026-08-13 ~18:30 (`tasks/sessions/2026-08-11-session-105.md` § Del 8 + Paushistorik; `activity_log`/`log-activity`/`get-activity-log` ACTIVE, 15/15 mutationshooks loggar); QA (`task-201.10`) + stängning återstår, ✅ KLAR sätts vid fas-avslutets phase-end-verify, inte i denna landning. **§ Fas 6.5 DoD #5 (:826) + § ADR-krav (:830) + P3a-listan (:1109) amenderade med [ADR-111](decisions/ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md)-inlösen** — v1.15 stängde :826/:830 öppet men missade :1109 (samma bonus-ADR-referens i § 5 ADR-index-listan); tredje stale-stället, funnet 2026-08-14. **§ Fas 6.5 Filer-listan rättad mot disk:** `src/data/activityLog/types.ts` (:814, byggdes aldrig) → `src/domain/schemas/ActivityStatement.schema.ts` (faktisk hemvist för Zod-schemat, `activityTypes.ts`-raden redan korrekt); `tests/e2e/activityLog.spec.ts` (:818) markerad ännu ej byggd — byggs i `TASK-201.16` (skiva under PRD `task-201`, mintad 2026-08-14, PR #1286). **`docs/features/FEATURE-ACTIVITY-LOG.md`** samtidigt uppdaterad från 2026-04-05-planeringsform till byggd form (Supabase/xAPI/ADR-110/ADR-111/ADR-102 B1 länkade, superseded `ActivityEntry`-Airtable-modell markerad öppet) — korsreferensen denna fils § Fas 6.5 alltid pekat mot (:834). |
| **1.17** | **2026-08-14** | **Fas 6.5 markerad KLAR** efter Session 105 (fas-avslut samma kväll som exekveringsvågen, Marcus GO + mandat). §2 fas-tabell rad 6.5 ✅ KLAR + trail; § Fas 6.5-prompten utökad med "✅ Slutförd"-paragraf. DoD-trail: DoD 1 via katalog-invarianten 16/16/0 + mekanisk hemvist-grind (`.mutation-hemvist-policy.conf` + `tests/api/mutation-hemvist-vakt.test.ts`, PR #1294/#1297); DoD 2 Zod-runtime (`ActivityStatement.schema.ts` + schema-sviter); DoD 3–4 requestId klient→EF→rad, live-läst i devtools (QA-vandringen, `task-201.10` final summary); DoD 5 inlöst av ADR-110/ADR-111. Facit-stämpel hem-spalten 2026-08-13; e2e-skarven byggd (`tests/e2e/aktivitetslogg-skarv.staging.test.ts`, PR #1292 — Filer-listans e2e-rad därmed uppfylld i faktisk konventionsform, `.staging.test.ts`). PRD `task-201` + samtliga 18 underkort Done. |

---

*Detta är slutprodukten för byggplan-revisionen som startade 2026-05-04. Vidare ändringar dokumenteras i versionshistoriken ovan + ADR per arkitekturbeslut.*
