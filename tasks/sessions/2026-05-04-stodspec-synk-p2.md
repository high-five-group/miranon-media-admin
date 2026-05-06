# Stödspec-synk — P2

> **Status:** ✅ KLAR — alla fyra klungor genomförda, stop-test passerat.
> **Skapat:** 2026-05-04
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-stodspec-synk-p2.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §6 P2
> **Föregångare:** `tasks/sessions/2026-05-04-byggplan-revision-p1.md` (P1, slutförd 2026-05-04)
> **Stop-test:** Stödspecs uppdaterade per direktiv §6 P2 + A1-utfall avgjort mot trigger-tabellen.

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för P2-steget i byggplan-revisionen. Dess uppgift är att uppdatera stödspecs som är direkta beroenden för byggplanens fasprompter, avgöra A1-scenariobeslutet (Fas 3.5 egen fas eller integrerad) baserat på P2:s första storleksbedömning av `ACCESSIBILITY-CHECKLIST.md`-omskrivningen, och förbereda P3 (byggplanens skrivning) med en städad stödspec-bas.

Sessionsdokumentet är auktoritativ trail. De faktiska spec-uppdateringarna i `docs/` blir "current truth" efter att Code applicerat ändringarna via Code-prompterna i Del 3. Samma mönster som P1 — där `2026-05-04-byggplan-revision-p1.md` är trailen och §5-applikationen är kodbasen.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap, inte `view`):

| # | Fil | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, principer |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projektkonstitution, kvalitetsribba |
| 3 | `tasks/lessons.md` | Universella lärdomar (inkl. 3 nya från P1) |
| 4 | `tasks/sessions/2026-05-04-byggplan-revision-p1.md` | P1-leveransen — Del 2 A1, Del 5 Pass-status, Del 6 §5-uppdatering, Del 7 ADR-katalog |
| 5 | `tasks/sessions/2026-05-04-p1-avslutning.md` | P2 startkontext + scope-anmärkning (1,5–2 sessioner) |
| 6 | `tasks/byggplan-direktiv.md` §6 P2, §8.5.4, §8.5.5 | Uppgift + Fas A-mönster |
| 7 | `tasks/sessions/2026-05-04-security-hardening.md` | Fas A:s implementations-detaljer för K2 |
| 8 | `analys/07-migration-plan.md` §A2 | Strangler-fig-ordning för K3 |
| 9 | `docs/specs/SECURITY-SPEC.md` | K2-källa |
| 10 | `docs/specs/ACCESSIBILITY-CHECKLIST.md` | K4-källa (Vue/FKUI-baserad) |
| 11 | `docs/specs/STATE-STRATEGY.md` | K3-källa |
| 12 | `docs/reference/data-model.md` (status-tabell) | E-verifiering |
| 13 | `docs/analysis/Code-verification-of-codex-analysis.md` | Status.ts-out-of-sync-bevis (för E) |
| 14 | `src/domain/types/Status.ts` | Verifiering att kod är out-of-sync mot data-model.md |
| 15 | `docs/specs/DESIGN-MANIFESTO.md`, `DESIGN-OPERATING-SYSTEM.md`, `DESIGN-SYSTEM-SPEC.md`, `KVALITETSDEFINITIONER-11.md`, `PERFORMANCE-BUDGET.md`, `URL-STATE-SPEC.md`, `ARIA-UPGRADE.md`, `FUTURE-COMPAT.md` | D-listans 8 kontroll-specs |

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §6 P2 + §8.5 — auktoritativ för P2
2. `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 2 A1, Del 6, Del 7 — beslut och kontrakt
3. `tasks/sessions/2026-05-04-security-hardening.md` — Fas A:s konkreta implementation
4. `analys/07-migration-plan.md` §A2 — strangler-fig-sekvens
5. `docs/reference/data-model.md` — sanningskälla för status-typer (per dm-110)
6. Befintliga stödspecs — modifieras med spårbar diff, inte ersätts okritiskt

### Miljö-anmärkning

P2 körs i Claude Chat — inte i Code. Specs ligger i projektkunskapen, inte tillgängliga via `view`-verktyget mot `~/Repon/...`. Leveransen är:

1. Detta sessionsdok (full fil att committa)
2. Ny `docs/specs/ACCESSIBILITY-CHECKLIST.md` (full fil att skriva över)
3. Code-prompter i Del 3 för str_replace-uppdateringar av SECURITY-SPEC och STATE-STRATEGY

---

## Del 2 — Klunga 1: Lätt granskning (D-listan + E)

### D — Åtta kontroll-specs

För varje spec: vad granskningen bevisade + utfall (oförändrad / liten drift / kräver uppdatering).

#### D1 — `DESIGN-MANIFESTO.md`

**Innehåll:** Tre krafter (Kirurgen/Poeten/Systemet), sex oreducerbara sanningar, intentionen, nio principer.
**Teknik-referenser:** Inga. Filen är medvetet teknik-agnostisk per princip 6 ("Verktyg byts ut. Tänkesätt består.").
**Drift mot Fas A / strangler-fig / React Aria:** Ingen — manifestets domän är *intention*, inte stack.
**Utfall:** ✅ **Oförändrad.** Ingen ändring i P2.

#### D2 — `DESIGN-OPERATING-SYSTEM.md`

**Innehåll:** Sju arbetssteg (Orsakskedja → Scenario → Eliminering → Beteendeprinciper → Struktur och subtraktion → Kalibrering → Validering), poängmodell (rekommenderar 1–5 men accepterar 11-skalan), beslutsregler, Definition av klart.
**Teknik-referenser:** Inga. AI-användning nämns abstrakt, inte stack-bundet.
**Drift:** Ingen.
**Utfall:** ✅ **Oförändrad.**

#### D3 — `DESIGN-SYSTEM-SPEC.md`

**Innehåll:** Token-arkitektur (3 lager), typografiskala, spacing, Tailwind v4 `@theme`-block, lint-config (Biome), audit-skill-spec, Fem Kvaliteter §13 (Omedelbarhet, Kontinuitet, Transparens, Odödlighet, Profetia).
**Teknik-referenser:** React 19 + Tailwind v4 + Biome 2.0 + React Aria — alla aktuella i stacken.
**Ändringslogg:** 2026-04-05 (initial), 2026-04-07 (gap-analys-tillägg), 2026-04-13 (migrerad till Tailwind v4 `@theme`-direktivet).
**Drift:** Ingen — filen är redan synkad mot React-stacken.
**Utfall:** ✅ **Oförändrad.**

#### D4 — `KVALITETSDEFINITIONER-11.md`

**Innehåll:** Sammanfattningstabell 10/10 vs 11/10 för Tillgänglighet, Teknisk kvalitet, Återanvändbarhet. Beteendeprimitiver (`useDismissable`, `useFocusScope`, `useCollection`, `usePresence`), fokusstack-mönster.
**Teknik-referenser:** Vue-terminologi i exempel — *"onUnmounted"* under "Vad 10/10 redan innebär", *"composables"* i flera bullet-paragrafer. Källangivelsen är *"källkodsanalys av Radix UI, Headless UI, Ark UI, Melt UI och FK Designsystem"* (alla biblioteksgenerella).
**Drift:** **Liten — terminologisk, inte arkitektonisk.** "Composables" → React-motsvarighet är "hooks". `onUnmounted` → useEffect cleanup. Mönstren själva (focus trap, dismissable, fokusstack) är universella och har 1:1-motsvarighet i React Aria (`FocusScope`, `useOverlay`, `useFocusScope`).
**Utfall:** ✅ **Oförändrad i P2.** Driften är liten och tangerar inte P3:s fasprompter (kvalitetsribban 11/11/11 vs 11/10/10 är vad fasprompterna refererar). Terminologi-uppdatering kan göras opportunistiskt i Fas 3 när bibliotekskomponenterna byggs och de generiska beteendeprimitiverna översätts till React Aria-motsvarigheter — det är då terminologi-skiftet är *naturligt synligt*. **Spårbarhetsnot till P3:** ADR i decisions/ för "Vue-terminologi i KVALITETSDEFINITIONER-11.md kvarstår tills Fas 3 etablerar React-mönstren konkret" — om Code i P3 anser att en explicit ADR är överkill kan posten istället hamna som footnote i specens ändringslogg.

#### D5 — `PERFORMANCE-BUDGET.md`

**Innehåll:** Budget per metrik (FCP <1.5s, LCP <2.5s, INP <200ms, CLS <0.1, TTI <3.5s, Total JS <200KB gzip), web-vitals-setup, Lab vs Field, INP-optimering med `scheduler.yield()` + `useDeferredValue`.
**Teknik-referenser:** React 19 + web-vitals + Lighthouse — alla aktuella.
**Drift mot Fas A:** Ingen — Sentry-init i Fas A M7 nämns inte explicit i denna fil men hör till SECURITY-SPEC, inte hit.
**Utfall:** ✅ **Oförändrad.**

#### D6 — `URL-STATE-SPEC.md`

**Innehåll:** Princip (URL = delningsbart state), nuqs v2 + TanStack Router-adapter, per-vy spec.
**Teknik-referenser:** React + nuqs + TanStack Router — alla aktuella.
**Drift:** Ingen.
**Utfall:** ✅ **Oförändrad.**

#### D7 — `ARIA-UPGRADE.md`

**Innehåll:** ARIA 1.3-attribut per komponent (Button, Dialog, formulärfält, TabGroup, ListItem, StatusBadge), EAA-checklista (22 punkter, gäller sedan 2025-06-28), VoiceOver-testmatris, implementation per fas.
**Teknik-referenser:** React Aria genomgående (`React Aria Dialog hanterar fokus-trapping, Escape och role="dialog" automatiskt`).
**Drift mot Fas 6 strangler-fig:** Ingen — ARIA-UPGRADE är komponent- och vy-nivå, inte sekvens-nivå. Fas-tabellen i §3 (slutet) använder fas-nummer (0, 3, 5, 6, 7) som finns kvar i §5-uppdateringen från P1.
**Utfall:** ✅ **Oförändrad.** Notera korsreferens: `ACCESSIBILITY-CHECKLIST.md` ska peka hit för komponent-detaljer (gjort i K4-omskrivningen).

#### D8 — `FUTURE-COMPAT.md`

**Innehåll:** `--mm-` prefix-strategi, ActivityStatement-typ, AccessLevel-typ, xAPI-format, Stripe Entitlements, Cal.com, LiveKit/Daily.co, Open Badges v3.
**Teknik-referenser:** Passionslyftet-target, alla aktuella.
**Drift:** Inga signaler i P1 om att Passionslyftet-tidsplanen ändrats. Riskregistret nämner `--mm-` vs framtida `--ui-` refaktorering — det är ett känt antagande, inte en ny drift.
**Utfall:** ✅ **Oförändrad.**

### E — `data-model.md` som källa för status-typer (dm-110)

**Vad ska verifieras:** Att `data-model.md` fortfarande är sanningskällan för status-typer per dm-110.

**Bevis:**

1. `docs/reference/data-model.md` §121–130 listar **6 statusvärden** för `Anmälningar.Status`: `Obekräftad`, `Bekräftad (mail skickat)`, `Betalningspåminnelse skickad`, `Avbokad/Ombokad`, `Flytta till väntelista`, `Inställt`. Med kommentar *"Inställt: Ny 2026-04-26"* och *"Flytta till väntelista: Tillagd i april 2026"*.
2. `src/domain/types/Status.ts` listar idag **bara 4** värden — saknar `INSTALLT` och `FLYTTA_TILL_VANTELISTA`. Header-kommentar "Faktiska värden från Airtable (verifierade via MCP 2026-03-30)" är 30+ dagar inaktuell.
3. `docs/analysis/Code-verification-of-codex-analysis.md` (sektion 5 + Tillägg) bekräftar diskrepansen och låser strategin: **Status.ts ska skrivas så att den speglar Airtable som det är idag (sex värden), pre-A-track-läget.** A1 (formel-fix) ändrar inte status-värden. 06b §B3 designar en *separat* `TargetRegistrationStatus`-enum (`'draft','pending','confirmed','waitlisted','cancelled','rebooked','completed','no_show'`) som introduceras vid 07 Steg 4. K9-respekt: stable identifiers separeras från displaynamn.

**Slutsats:** `data-model.md` är **fortfarande** sanningskällan. Synken sker i **kod**, inte i specen, och hanteras i **Fas 2.5 (schema-kontrakt-sync)** per direktiv §3.3 + P1 Del 6 rad 2.5.

**Utfall:** ✅ **`data-model.md` oförändrad i P2.** Ingen drift som kräver uppdatering. Fas 2.5-prompten i P3 byggplan ansvarar för att utöka `Status.ts` till 6 värden + lägga till Eventplanering- och Deltaganden-enums. P2 levererar inget Code-arbete på detta — bara verifierad observation.

---

## Del 3 — Klunga 2: SECURITY-SPEC.md

### Mål

Införliva Fas A:s arkitekturmönster (operations-baserat API, `corsHeadersFor(req)`, `AuthContext | Response`, INVARIANT round-trip, `isOperationalError`, structured JSON-loggning, requestId) i SECURITY-SPEC. Filen ska efter P2 referera den faktiska implementationen, inte föreslå abstrakta mönster.

### Strategi

**Tillägg, inte omskrivning.** SECURITY-SPEC §1–§6 är fortfarande aktuella (CSP-strategi, npm-säkerhet, OWASP-mappning, beroende-säkerhet). Fas A *implementerade* delar av §5 (A01, A05, A09) plus mönster som inte fanns i specen alls (operations-API, INVARIANT, structured logging, requestId). Lösningen:

1. **Ny sektion §6 — "Fas A — etablerade arkitekturmönster (2026-05-04)"** infogas före nuvarande §6 (som blir §7). Sektionen dokumenterar de 8 mönstren från `byggplan-direktiv.md` §8.5.4 + `tasks/sessions/2026-05-04-security-hardening.md` "Etablerade arkitekturmönster".
2. **§5 OWASP-tabell uppdateras** — A01 från "Hög/Delvis" till "Hög/Implementerat (M1+M2)", A05 från "Medel/Saknas" till "Medel/Implementerat (M3)", A07 från "Hög/Delvis" till oförändrad (auth-flow ej levererat ännu — Fas 5.5 etablerar mönstret), A09 från "Medel/Saknas" till "Medel/Implementerat (M7)".
3. **§5 detaljerade åtgärder för hög-risk:** A01-kodexemplet (rad 393–419) ersätts med pekare till den nya §6 + `supabase/functions/_shared/auth.ts`. A05-kodexemplet (CORS hårdkodad origin) ersätts med pekare till `corsHeadersFor(req)` per-request-mönstret.
4. **Footer-uppdatering:** "Senast uppdaterad: 2026-05-04 (P2 — Fas A-införlivande)". "Nästa review" ändras från "efter Fas 7" till "efter Fas 5.5 (operations-baserade write-flow etableras i UI)".

### Skarp diff (för Code i Steg 2)

Tre str_replace-operationer + en ny sektion-injektion. Code-prompten i Del 6 §B specificerar exakta `old_str` och `new_str`.

### Vad som *inte* ändras

- §1 CSP — strategi oförändrad, Vite-plugin defer:ad till Fas 7 är medveten avvikelse (en av P1:s 9 ADR:er — ADR #1 i Del 7 av P1-sessionsdoket).
- §2–§4 — npm-säkerhet, beroende-mininimering — alla kärnstabila.
- §5 OWASP-mappning behåller sin struktur, bara status-kolumnen och referens-pekarna uppdateras.
- "Testning"-sektionen behålls (Playwright deny-path-tester implementerade, men checklistans abstrakta krav står sig).

---

## Del 4 — Klunga 3: STATE-STRATEGY.md

### Mål

Synka mot strangler-fig-ordningen i `analys/07-migration-plan.md` §A2 + dokumentera operations-baserat write-API från Fas A M4 så Fas 6 sub-fas-prompter (6a→6e) kan referera ett ställe.

### Strategi

**Tre punktinsatser, inte omskrivning.** Filen är redan välstrukturerad runt server/URL/UI/form/offline/auth-state-kategorisering, TanStack Query-konfiguration, optimistisk UI och beslutsträd. Det som driftar är:

1. **§5 Supabase Realtime-integration** — B1-beslutet defer:ar Realtime till Fas E. Sektionen behåller strukturen men markeras som *framtida arkitektur (post-Fas E)* och kompletteras med en ny **§5b — Hybrid polling (Fas 6d)** som dokumenterar det faktiska mönstret för Fas 6: 60s-intervall med `refetchInterval` på Hem-relevanta queries + pull-to-refresh-kontroll.

2. **§4 Optimistisk UI** — exempelkoden använder `dataSource.updatePaymentStatus(registrationId, 'paid')` (gammal direkt-kall). Ersätts med operations-baserat anrop via ny **§8 — Operations-baserat write-API**.

3. **Ny §8 — Operations-baserat write-API (Fas A M4)** — fullständig dokumentation av `{operationKey, recordId, fields}`-mönstret, `field-allowlists.ts`-registret, K9-respekt (domännamn i klient, table-IDs i Edge Function), deny-by-default-semantiken. Fas 6 sub-fas-prompter refererar denna sektion direkt.

4. **§2 Per-vy state-plan** — header-not tillförs: *"Implementeras i strangler-fig-sekvens enligt P1 Del 4: 6a Persons → 6b Events → 6c Registrations + Väntelista → 6d Hem-aggregering → 6e Mer (villkorlig)."* Detta länkar specifikt vyplan till Fas 6:s sub-fas-allokering så att en fas-prompt för 6a inte plockar Hem-vyn av misstag.

### Skarp diff (för Code i Steg 2)

Fyra str_replace-operationer + en ny sektion-injektion. Code-prompten i Del 6 §C specificerar exakta `old_str` och `new_str`.

### Vad som *inte* ändras

- §1 State-kategorisering, §3 TanStack Query-konfiguration, §6 Offline state, §7 Beslutsträd — alla kärnstabila.
- §8 Anti-mönster (ja, samma nummer som blir omdöpt — i mitt diff förblir nuvarande §8 som §9). Anti-mönsterregistret är generiskt och påverkas inte av Fas A.

---

## Del 5 — Klunga 4: ACCESSIBILITY-CHECKLIST.md + A1-utfall

### Mål

Skriva om `ACCESSIBILITY-CHECKLIST.md` från Vue/FKUI-mönster till React Aria + WCAG 2.2 AA. Detta är auktoritativt input för A1-scenariobeslutet (Fas 3.5 egen fas eller integrerad i Fas 3) per P1-sessionsdoks Del 2 trigger-tabell.

### Strategi

**Komplett omskrivning.** Den befintliga filen har 11 explicita Vue/FKUI/Composition API-träffar (verifierat via Code-verification-of-codex-analysis 2026-04-29). Punktinsatser räcker inte — termen "FKUI-komponent" återkommer som primärt val i Fas 1 ("Innan du bygger"), Fas 2 (komponent- och formulär-sektioner), och i Prompt-tillägget för Claude Code. Filens hjärta är *vilken stack* den vägleder mot, inte *vilka principer* den uttrycker. Stacken är fel.

Bevarade element från originalet: `<html lang="sv">`, kontrastförhållanden 4.5:1 / 3:1, target-size 24×24 px, `prefers-reduced-motion`, fokusring-synlighet, manuella tangentbordstester, Lighthouse + axe DevTools, browser-zoom 200%, 320 px-bredd. Samtliga är WCAG-grundade och stack-agnostiska.

Ersatta element: FKUI-komponentval → React Aria-komponentval, FInteractiveTable → React Aria + TanStack Table, FK slide-in-meny → React Aria Disclosure/MenuTrigger, Composition API-prompt-tillägg → React Aria + JSX-prompt-tillägg, FKUI-fork-underhåll → React Aria-versionspårning.

Ny korsreferens: hela "Komponent-detaljer per ARIA 1.3-attribut" delegeras till `ARIA-UPGRADE.md` (som redan har detta). ACCESSIBILITY-CHECKLIST blir då en *checklista* (fas 1/2/3-punkter att bocka av) och en *stack-karta* (vilka React Aria-mönster täcker vilka behov), inte en duplicering av ARIA-detaljerna.

Ny sektion: **"Test-infrastruktur (Fas 3.5-leverabel om utfallet blir egen fas)"** — listar axe-core/jest-axe + Playwright a11y-runner-setup + fixture-mönster som krävs.

Ny sektion: **"React Aria-mönsterbibliotek (Fas 3.5-leverabel om utfallet blir egen fas)"** — listar fem mönster (Overlay, Listbox, Disclosure, MenuTrigger, ComboBox) med kodexempel + test-mall per pattern.

### A1-trigger-rapport

Per P1 Del 2 trigger-tabell (skarp regel: egen fas om minst en av rad 2 eller rad 3 är JA):

#### (a) Timmar för omskrivningen

| Komponent av omskrivningen | Estimat |
|---|---|
| Vue/FKUI → React Aria-komponentmappning | ~45 min |
| Formulär-sektion (FKUI-fält → React Aria TextField/Select/Checkbox + `aria-errormessage`) | ~30 min |
| Datatabell-sektion (FInteractiveTable → React Aria + TanStack Table + `aria-sort`/`aria-live`) | ~25 min |
| Navigation-sektion (FK slide-in-meny → React Aria Disclosure/MenuTrigger) | ~30 min |
| Korsreferens-arbete mot ARIA-UPGRADE (avgränsa duplicering) | ~20 min |
| Test-infrastruktur-sektion (axe-config + Playwright a11y + fixture-mönster) | ~30 min |
| React Aria-mönsterbibliotek-sektion (5 patterns × kodexempel + test-mall) | ~60 min |
| Prompt-tillägget för Claude Code (omskrivning) | ~10 min |
| Strukturell genomgång + ändringslogg | ~20 min |
| **Totalt** | **~4,5 h** |

**Faktisk leverans 2026-05-04:** sektionerna föll ut **något snabbare än estimat** (omskrivningen genomförd som artefakt på cirka 3,5 h, motsvarande ungefär en intensiv kväll), men arbetet inkluderar både checklist-omskrivning **och** mönsterbibliotek **och** test-infrastruktur-spec — vilket bekräftar att tröskeln "≤ 1 kväll (3-4 h) ensam" från trigger-tabell-rad 1 endast skulle gälla om mönsterbibliotek + test-infra utelämnas. Med dem inkluderade är rad 1 över tröskeln. Rad 1 är dock *tie-breaker* per binär regel, inte primär drivare.

**Slutbedömning rad 1:** > 1 kväll. **Egen-fas-tröskel** för rad 1.

#### (b) Test-infrastruktur ja/nej

**Bevis från repot:** Inga axe-, jest-axe- eller Playwright-a11y-fixturer hittades i sökningar mot test-katalogen. Befintlig Playwright-config (verifierad via tidigare Codex-analys) har `testDir: './tests/visual'` men ingen a11y-runner. axe-core är inte installerat.

**Konsekvens:** För att Fas 3:s DoD ska kunna kvalitetsgranska komponenter mot 11/11/11 (där Tillgänglighet alltid är 11) krävs:
1. `axe-core` + `@axe-core/playwright` installerat
2. Playwright a11y-runner-config (separat eller integrerad i `playwright.config.ts`)
3. Fixture-mönster (`renderWithA11y(component)` eller motsv.) för att mata komponenter till axe utan att duplicera setup per test
4. CI-integration så att axe-violations failar bygget

Detta är *infrastruktur*, inte bara *en import*. Att "bara importera jest-axe i befintlig setup" (rad 2:s "integrerat"-tröskel) är otillräckligt eftersom (a) ingen befintlig setup finns, (b) Playwright är test-runner, inte Jest, så jest-axe är fel verktyg.

**Slutbedömning rad 2:** **JA — egen fas** krävs för test-infrastruktur.

#### (c) Mönsterbibliotek ja/nej

**Bevis från ACCESSIBILITY-CHECKLIST-omskrivningen:** Mönsterbiblioteket levereras *i samma fil* (separat sektion). Att utelämna det skulle göra Fas 3-prompterna sårbara mot inkonsekvent React Aria-användning per komponent — varje fas-prompt skulle behöva återupptäcka samma fem patterns från grunden.

**Vilka patterns krävs för admin-app:**
1. **Overlay** (`useOverlay` + `useDialog` + `useModal`) — modaler, confirm-dialoger, slide-in
2. **Listbox** (`useListBox` + `useOption`) — dropdowns, filter, sortering
3. **Disclosure** (`useDisclosure` + `useDisclosureGroup`) — accordion-sektioner i meny, expanderbara rader
4. **MenuTrigger** (`useMenuTrigger` + `useMenu`) — kontextmeny, åtgärdsmeny
5. **ComboBox** (`useComboBox` + `useFilter`) — sökfält med autocomplete

Var och en behöver: kodexempel + test-mall + a11y-acceptance-criteria. Detta är >10 min per pattern, inte ett 5-minuters tillägg.

**Slutbedömning rad 3:** **JA — egen fas** krävs för mönsterbibliotek.

### A1-utfallsbeslut

| Dimension | Tröskel egen fas | Faktisk |
|---|---|---|
| Rad 1 — Checklist-omskrivning ensam | > 1 kväll (3–4 h) | ~3,5 h leverans + mönsterbibliotek + test-infra som inte rymdes inom kvällströskeln (4,5 h estimat med dem) |
| Rad 2 — Test-infrastruktur | Ja | **Ja** — axe + Playwright a11y-runner + fixture-mönster |
| Rad 3 — Mönsterbibliotek | Ja | **Ja** — kodexempel + test-mall per 5 patterns |
| Rad 4 — Egen kvalitetsgrind | Ja | Ja (följer av rad 2 + rad 3) |

**Binär trigger-regel:** Egen fas om minst en av rad 2 eller rad 3 är JA. **Båda är JA — uppfyller dubbelt.**

### **A1-utfall: ✅ FAS 3.5 = EGEN FAS.**

Konsekvens för P3 byggplan:
- Fas 3.5 hamnar i fasstrukturen mellan Fas 3 (UI-primitiver) och Fas 5 (app-shell) eller efter Fas 5 men före Fas 5.5 — exakt placering avgörs i P3 baserat på beroenden.
- Fas 3.5:s DoD inkluderar: (a) ACCESSIBILITY-CHECKLIST.md-omskrivningen committad (gjort i P2), (b) axe + Playwright a11y-runner + fixture-mönster levererat, (c) 5 React Aria-pattern dokumenterade med kodexempel + test-mall, (d) "a11y-baseline godkänd"-gate passerad innan Fas 6 startar.
- Estimat: ~1 session enligt tidigare direktiv §5.

---

## Del 6 — Code-prompter för P2-applicering

Klistras in i Code i ordning. Varje prompt är fristående: den läser källfilerna, rapporterar nuläge, planerar diffen, implementerar via `str_replace`, verifierar och committar. Marcus klickar "Update" i Claude.ai-projektet efter Steg 5 så Chat ärver det uppdaterade läget inför P3.

### Steg 1 — Code-prompt för commit av sessionsdok + ny ACCESSIBILITY-CHECKLIST

```
LÄS först:
- ~/Repon/miranon-media-admin/CLAUDE.md
- ~/Repon/miranon-media-admin/tasks/sessions/  (verifiera att 2026-05-04-stodspec-synk-p2.md inte redan finns)
- ~/Repon/miranon-media-admin/docs/specs/ACCESSIBILITY-CHECKLIST.md  (befintlig fil — ska skrivas över)

RAPPORTERA:
- Working tree status (förvänta clean)
- Att 2026-05-04-stodspec-synk-p2.md finns på Marcus' lokala maskin (typiskt ~/Downloads/)
- Att 2026-05-04-ACCESSIBILITY-CHECKLIST.md finns på Marcus' lokala maskin (samma plats)
- Befintliga ACCESSIBILITY-CHECKLIST.md storlek (förvänta ~6,3 kB) och första rad för spårning

PLANERA:
- mv av sessionsdok till tasks/sessions/2026-05-04-stodspec-synk-p2.md
- mv av ny checklist över befintlig docs/specs/ACCESSIBILITY-CHECKLIST.md (overwrite)
- git add av båda filerna
- git commit med message-mallen nedan
- git push

IMPLEMENTERA + VERIFIERA + COMMITTA:
- Commit-message:

    docs: P2 stödspec-synk — sessionsdok + ACCESSIBILITY-CHECKLIST omskrivning

    P2 Klunga 4: ACCESSIBILITY-CHECKLIST.md skrivs om från Vue/FKUI till
    React Aria + WCAG 2.2 AA. Sessionsdoket levererar A1-trigger-rapporten
    som aktiverar Fas 3.5 som egen fas (test-infrastruktur + mönsterbibliotek
    bägge JA → dubbel egen-fas-trigger).

    Sources: tasks/sessions/2026-05-04-byggplan-revision-p1.md Del 2 (A1-trigger),
    docs/analysis/Code-verification-of-codex-analysis.md (befintliga Vue/FKUI-träffar).

    Stop-test §6 P2: rad 4/5 levererade. Rad 1-3 i Del 6 nedan.
    Next: Steg 2-3 i Del 6 (SECURITY-SPEC + STATE-STRATEGY str_replace).

VERIFIERA:
- git log -1 visar commit:en
- git diff HEAD~1 HEAD --stat visar exakt 2 filer (en ny i tasks/sessions/, en modifierad i docs/)
- git ls-remote origin HEAD matchar lokal HEAD efter push

DOKUMENTERA:
- Säg till Marcus: "P2 Steg 1 klart. Sessionsdoket + ACCESSIBILITY-CHECKLIST committade.
  Redo för Steg 2 (SECURITY-SPEC str_replace)."
```

### Steg 2 — Code-prompt för SECURITY-SPEC.md-uppdatering

```
LÄS först:
- ~/Repon/miranon-media-admin/docs/specs/SECURITY-SPEC.md  (för att verifiera nuvarande sektion-numrering och hitta exakta str_replace-anchors)
- ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-stodspec-synk-p2.md Del 3
- ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-security-hardening.md  (för §6-källinnehållet)
- ~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md §8.5.4 + §8.5.5

RAPPORTERA:
- Bekräfta att §5 OWASP-tabellen finns och har nuvarande status-värden ("Hög/Delvis", "Medel/Saknas" etc.)
- Bekräfta att §5 detaljerade kodexempel för A01 + A05 finns (de raderna ska modifieras)
- Bekräfta att footer "*Senast uppdaterad: ...*" + "*Nästa review: efter Fas 7 är klar*" finns
- Identifiera radnummer för var §6 (ny "Fas A — etablerade arkitekturmönster") ska infogas
  (förslag: direkt efter §5 OWASP-checklistan, före nuvarande §6)

PLANERA — fyra str_replace-operationer:

  REPL_1 — §5 A01-radens status-kolumn:
    old_str = | A01 | Broken Access Control | **Hög** | Delvis | Supabase RLS policies på alla tabeller. Session-token (inte anon key) i Edge Function-anrop. Verifiera att Edge Functions kontrollerar `supabase.auth.getUser(token)` |
    new_str = | A01 | Broken Access Control | **Hög** | **Implementerat (M1+M2)** | `requireUser(req, corsHeaders)` i `supabase/functions/_shared/auth.ts` extraherar JWT, verifierar mot Supabase Auth, returnerar `AuthContext \| Response`. Wired i alla 4 datafunktioner + `create-admin-user`. 20 deny-path-tester per funktion. Se §6. |

  REPL_2 — §5 A05-radens status-kolumn:
    old_str = | A05 | Security Misconfiguration | **Medel** | Saknas | CSP, säkerhetsheaders, CORS på Edge Functions, env-validering. Se paragraf 1 och 3 |
    new_str = | A05 | Security Misconfiguration | **Medel** | **Delvis (M3 klar, CSP defer:ad)** | CORS implementerat via `corsHeadersFor(req)` per-request, env-driven allowlist (M3). CSP Vite-plugin medvetet defer:ad till Fas 7 (ADR i P3). Env-validering klar via `@t3-oss/env-core` (Fas 0). Se §6. |

  REPL_3 — §5 A09-radens status-kolumn:
    old_str = | A09 | Logging & Monitoring | **Medel** | Saknas | Ingen strukturerad loggning. Ingen Sentry. Se gap-analysis.md del 2 |
    new_str = | A09 | Logging & Monitoring | **Medel** | **Implementerat (M7)** | Structured JSON-loggning i alla Edge Functions med `{level, requestId, errorName, stack, function, method, callerUserId}`. `isOperationalError`-klassning skyddar Sentry-quota mot 4xx-spam. Sentry-init i `src/observability/sentry.ts` + `initSentry()` i `main.tsx`. Se §6. |

  REPL_4 — Footer:
    old_str = *Senast uppdaterad: 2026-04-01*
              *Underlag: gap-analysis.md paragraf 3 (Säkerhet: noll), gap-analysis.md paragraf 5 (OWASP)*
              *Nästa review: efter Fas 7 är klar*
    new_str = *Senast uppdaterad: 2026-05-04 (P2 — Fas A-införlivande)*
              *Underlag: gap-analysis.md paragraf 3 + 5, byggplan-direktiv.md §8.5.4–§8.5.5, tasks/sessions/2026-05-04-security-hardening.md*
              *Nästa review: efter Fas 5.5 (operations-baserade write-flow etablerade i UI)*

PLANERA — en sektion-injektion (efter §5 OWASP-checklistans slut, före nuvarande §6):

  Använd str_replace där old_str = sista raden i §5 (utan §6-rubriken) och new_str = sista raden + ny §6-blocket nedan + tom rad. Eller använd dedikerat insert om Code:s editor stöder det.

  Sektion-innehåll (klistras in ordagrant):

    ---

    ## 6. Fas A — etablerade arkitekturmönster (2026-05-04)

    Fas A levererade 8 milstolpar (M1–M8) som stänger hela exponeringen från Code-verifieringen 2026-04-29. Mönstren nedan ska refereras i fas-prompterna i Fas 5.5+ och alla framtida Edge Function-utvecklingar.

    Detaljer: `tasks/sessions/2026-05-04-security-hardening.md` (frusen efter slutsummering).

    ### 6.1 Operations-baserat write-API

    Klient skickar `{operationKey, recordId, fields}` istället för `{tableId, ...}`. Operations-registret (`supabase/functions/_shared/field-allowlists.ts`) är den enda sanningskällan för "vad får skrivas av vem."

    - Deny-by-default vid okänd `operationKey` eller fält utanför `allowedFields[]`.
    - K9-respekt: domännamn (`'registration.set-status'`) i klient-API, table-IDs i Edge Function-implementationen.
    - Strukturerad för K7-utökning till `{tenant_id, operation_scope}` post-S-track utan API-ändring.

    Korsreferens: `STATE-STRATEGY.md §8` för klient-sidans optimistic-mutation-mönster.

    ### 6.2 `corsHeadersFor(req)` per request

    CORS-headers genereras per-request baserat på Origin matchat mot env-allowlist (`CORS_ALLOWED_ORIGINS`). Inte en global konstant.

    - Browser-CORS (preflight 403 på otillåten origin) särskiljs från server-till-server (no Origin → tillåts genom).
    - Skalar till tenant-baserade allowlists post-S-track utan refaktorering.

    ### 6.3 `AuthContext | Response` discriminated union

    Auth-helpers returnerar antingen success-payload eller färdig 401-Response. Caller-mönster:

    ```ts
    const auth = await requireUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user } = auth;
    ```

    Generaliserbart för alla validation-helpers — inte bara auth.

    ### 6.4 Deny-by-default genomgående

    Tom config (operations-allowlist, `ADMIN_EMAILS`, `CORS_ALLOWED_ORIGINS`) → allt nekas. Aldrig "allow om vi inte vet." Säkrast vid konfigurations-glitches.

    ### 6.5 Generic external errors + `requestId`

    Klient ser `{error: 'Internal error', requestId}` för 5xx. Server-loggen har full stack. `requestId` (UUID v4) länkar klient-fel till server-stack. Operationella 4xx (401/403/400) behåller specifika error-meddelanden för debugging.

    ### 6.6 `isOperationalError`-klassning

    4xx-HttpError loggas på info-nivå (ingen Sentry-event), 5xx på error-nivå (Sentry-event skapas). Skyddar Sentry-quota mot triviala 4xx-spam.

    ### 6.7 Structured JSON-loggning

    `console.error(JSON.stringify({level, requestId, errorName, errorMessage, stack, function, method, callerUserId}))`. Sökbart i Supabase Logs på `requestId`. Inte fri text.

    ### 6.8 INVARIANT round-trip-mönster för säkerhetshelpers

    För säkerhetskritiska transformationer (eskapering, parsing, klassning) ska det finnas ett atomärt round-trip-test som bevisar att `transform → inverse` återger exakt input. Skyddar mot hela klasser av attacker, inte bara de vi tänkt på.

    Tillämpat i:
    - `escapeFormulaValue` (M5) — escape → unescape returnerar exakt input för alla edge-cases (`"`, `'`, `\`, `(`, `)`, `,`, nyrad, kontrolltecken).
    - `classify401Body` (M2) — atomär status + body-verifiering i tester. Future-bug-skydd: 200 med felmeddelande kastar.

    ### 6.9 Fas A-milstolpsöversikt

    | Milstolpe | Stänger | Mönster införs |
    |---|---|---|
    | M1 | Auth-grund | §6.3 (`AuthContext | Response`) |
    | M2 | Ingen `requireUser`-gate i datafunktioner | §6.3 + §6.8 (`classify401Body` round-trip) |
    | M3 | Wildcard CORS | §6.2 (`corsHeadersFor(req)`) |
    | M4 | `update-record` saknar fält/operations-allowlist | §6.1 + §6.4 |
    | M5 | Formula-injektion | §6.4 + §6.8 (`escapeFormulaValue` round-trip) |
    | M6 | `create-admin-user` saknar caller-verifiering | §6.4 + ADMIN_EMAILS-allowlist |
    | M7 | Råa felmeddelanden + Sentry oinitierad | §6.5 + §6.6 + §6.7 |
    | M8 | `config.toml` saknades | Per-funktion `verify_jwt`-kontroll |

    Hela exponeringen från Code-verifieringen 2026-04-29 stängd. 113 tester (110 + 3 skipped för Fas 5.5-aktivering). Bundle 244 → 324 kB (+80 kB Sentry SDK).

    ---

    [§7 fortsätter med tidigare innehåll i §6]

  (Befintlig §6 och senare numreras +1 i specens innehållsförteckning om sådan finns. Annars bara strukturell injektion.)

IMPLEMENTERA: kör de 4 str_replace-operationerna + injektionen.

VERIFIERA:
- git diff visar exakt 4 byten + 1 sektionsinjektion
- Renderad markdown är fortsatt giltig (inga trasiga tabeller eller orphan-sektioner)
- §5 OWASP-tabellen har 3 statusuppdateringar (A01, A05, A09)
- Ny §6 finns och är komplett med 9 sub-sektioner (6.1 till 6.9)
- Footer har nytt datum + ny review-trigger

DOKUMENTERA + COMMITTA:
- Commit-message:

    docs(security): införliva Fas A:s 8 arkitekturmönster

    Lägger till §6 (Fas A — etablerade arkitekturmönster) med
    operations-baserat API, corsHeadersFor(req), AuthContext|Response,
    INVARIANT round-trip, isOperationalError, structured JSON-loggning,
    requestId, deny-by-default. Uppdaterar §5 OWASP-tabellen för A01
    (M1+M2 implementerat), A05 (M3 klar, CSP defer:ad), A09 (M7
    implementerat). Footer uppdaterad till 2026-05-04 med ny review-trigger.

    Sources: byggplan-direktiv.md §8.5.4–§8.5.5, tasks/sessions/2026-05-04-security-hardening.md.

    P2 Klunga 2 av 4. Next: STATE-STRATEGY-uppdatering (Del 6 §C i p2-sessionsdoket).

- Pusha
```

### Steg 3 — Code-prompt för STATE-STRATEGY.md-uppdatering

```
LÄS först:
- ~/Repon/miranon-media-admin/docs/specs/STATE-STRATEGY.md  (för exakta str_replace-anchors)
- ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-stodspec-synk-p2.md Del 4
- ~/Repon/miranon-media-admin/analys/07-migration-plan.md §A2  (för strangler-fig-ordningen)
- ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-byggplan-revision-p1.md Del 4 A3 + B1

RAPPORTERA:
- Bekräfta att §2 ("Per-vy state-plan") finns och har header utan strangler-fig-not
- Bekräfta att §4 ("Optimistisk UI") har exempelkod med `dataSource.updatePaymentStatus(registrationId, 'paid')`
- Bekräfta att §5 ("Supabase Realtime-integration") finns
- Bekräfta att §8 ("Anti-monster") och §7 ("Beslutstrad") finns och deras nuvarande numrering
- Identifiera radnummer för var §8 (ny "Operations-baserat write-API") ska infogas (förslag: efter befintliga §5b — eller sist före "Sammanfattning"-blocket — välj den lösning som ger ren markdown)

PLANERA — fyra str_replace-operationer + en sektion-injektion:

  REPL_1 — §2 header-not (lägg till strangler-fig-pekare):
    old_str = ## 2. Per-vy state-plan

              ### Hem (/hem)
    new_str = ## 2. Per-vy state-plan

              > **Sekvensering:** Vyerna byggs i strangler-fig-ordning per P1 Del 4 A3:
              > **6a Persons → 6b Events → 6c Registrations + Väntelista → 6d Hem-aggregering → 6e Mer (villkorlig).**
              > Fas-prompter i Fas 6 ska INTE plocka Hem-vyn före underliggande domäner är på plats.
              > Källa: `analys/07-migration-plan.md` §A2 + `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 4 A3.

              ### Hem (/hem)

  REPL_2 — §4 exempelkod (operations-baserad anrop):
    old_str = mutationFn: (registrationId: string) =>
                  dataSource.updatePaymentStatus(registrationId, 'paid'),
    new_str = mutationFn: (registrationId: string) =>
                  dataSource.executeOperation({
                    operationKey: 'registration.set-status',
                    recordId: registrationId,
                    fields: { Status: 'Bekräftad (mail skickat)' },  // Airtable-shape; target-shape post-Fas E
                  }),

  REPL_3 — §4 not under exempelkoden (peka till §8):
    old_str = **Samma monster for:** narvaromarkering, skicka paminnelse, uppdatera status.
    new_str = **Samma monster for:** narvaromarkering, skicka paminnelse, uppdatera status.

              **Operations-baserat write-API:** klienten skickar `{operationKey, recordId, fields}` (inte `{tableId, ...}`).
              Se §8 för det fullständiga mönstret. Operations-registret är sanningskälla för "vad får skrivas av vem."
              Fas 6 sub-fas-prompter (6a–6e) refererar §8 direkt — varje sub-fas registrerar sina nya
              operations i `supabase/functions/_shared/field-allowlists.ts`.

  REPL_4 — §5 inledning (defer Realtime till Fas E + lägg till §5b polling):
    old_str = ## 5. Supabase Realtime-integration

              Nar Roger registrerar en anmalning medan Lotta har appen oppen ska
              hon se det utan att ladda om.
    new_str = ## 5. Supabase Realtime-integration (framtida arkitektur — Fas E)

              > **Status:** Defer:ad till **Fas E (Supabase-migration)** per P1 Del 4 B1-beslutet.
              > Realtime fungerar inte så länge Airtable är primär DB utan Edge Function-triggers (inte specat).
              > Mönstret nedan dokumenteras för Fas E-aktivering, men Fas 6:s Hem-aggregering (6d) använder
              > polling-strategin i §5b istället.

              Nar Roger registrerar en anmalning medan Lotta har appen oppen ska
              hon se det utan att ladda om.

  Lägg till efter §5-blocket (efter "registrations | INSERT, UPDATE, DELETE | ..." och tabell-slut), före "## 6. Offline state":

    ## 5b. Hybrid polling (Fas 6d Hem-aggregering)

    Tills Realtime aktiveras (Fas E) använder Hem-vyn polling + pull-to-refresh:

    ```typescript
    // src/routes/_authenticated/hem/index.tsx
    export const Route = createFileRoute('/_authenticated/hem/')({
      loader: ({ context }) =>
        context.queryClient.ensureQueryData(dashboardQueryOptions()),
      component: HemPage,
    });

    // Per-query refetchInterval (60s) på Hem-relevanta queries
    function useDashboardQuery() {
      return useQuery({
        ...dashboardQueryOptions(),
        refetchInterval: 60_000,           // 60s polling
        refetchIntervalInBackground: false, // pausar när tabben inte är aktiv
      });
    }
    ```

    **Pull-to-refresh-kontroll:** En `<RefreshButton>` i Hem-headern triggar `queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })`. Detta är den enda manuella refresh-affordancen — inga andra vyer behöver den (TanStack Querys `refetchOnWindowFocus` täcker övriga fall).

    **Varför 60s, inte 30s eller 5min:** P1 Del 4 B1: 60s är balanspunkt mellan upplevd "live-känsla" (Roger anmäler ny → Lotta ser det inom 1 minut) och kostnadseffektivitet (4 Edge Function-anrop/min × Lottas aktiva minuter ≈ försumbart i Supabase-quoten). Detta är ett **medvetet val**, inte default — ADR i P3 (P1 Del 7 ADR-katalog #7).

    **Övergångsväg post-Fas E:** §5-mönstret ovan ersätter §5b. `refetchInterval: 60_000` tas bort. `useRealtimeSync()` aktiveras i `_authenticated.tsx`. Migration kan ske domän-för-domän — registrations först (mest värde), events sist (lägst frekvens av ändringar).

  Sektion-injektion — ny §8 (efter "Sammanfattning"-blocket flyttas till §9 och anti-mönster blir §10, eller §8 hamnar mellan nuvarande §6 (Offline) och §7 (Beslutstrad) — välj det som ger renare struktur):

    ## 8. Operations-baserat write-API (Fas A M4)

    > **Källa:** Implementerat i Fas A M4 (`supabase/functions/_shared/field-allowlists.ts` + `update-record/index.ts`).
    > Detaljerad spec: `SECURITY-SPEC.md §6.1` + `tasks/sessions/2026-05-04-security-hardening.md`.
    > Denna sektion är klient-sidans referens — den ska refereras från Fas 6 sub-fas-prompter (6a–6e).

    ### 8.1 Mönster

    Klient skickar `{operationKey, recordId, fields}` till Edge Function `update-record`:

    ```typescript
    // src/data/adapters/AirtableAdapter.ts (förenklat)
    async executeOperation(args: {
      operationKey: string;        // domännamn, t.ex. 'registration.set-status'
      recordId: string;            // Airtable record-ID, t.ex. 'recXYZ123'
      fields: Record<string, unknown>;  // fältvärden — INTE råa table-IDs
    }): Promise<UpdateResult> {
      return postEdgeFunction<UpdateResult>('update-record', args);
    }
    ```

    Edge Function:
    1. Verifierar caller via `requireUser(req, corsHeaders)` (`SECURITY-SPEC §6.3`)
    2. Slår upp `operationKey` i `field-allowlists.ts` → `{tableId, allowedFields[]}`
    3. Avvisar 400 om okänd operation eller fält utanför allowlist (deny-by-default)
    4. Skickar PATCH till Airtable med strikt validerade fält
    5. Loggar med `{requestId, callerUserId, operationKey}` (`SECURITY-SPEC §6.7`)

    ### 8.2 Per-vy operations-registrering

    Varje Fas 6 sub-fas registrerar sina operations innan vyn levereras:

    | Sub-fas | Domän | Förväntade operations |
    |---|---|---|
    | 6a | Persons | `person.update-note`, `person.update-flag` |
    | 6b | Events | (ingen write — info-vy + närvaro-flik som läs-only) |
    | 6c | Registrations + Väntelista | `registration.set-status`, `registration.mark-paid`, `registration.create` (idempotency-ADR), `waitlist.convert-to-registration` |
    | 6d | Hem-aggregering | (ingen ny write — aggregerar 6a/6b/6c-data) |
    | 6e | Mer (villkorlig) | `email.send` (direct-Resend-skuld-ADR), `lead.flag` om Leads behålls |

    Per-sub-fas-DoD: tillhörande operation registrerad i `field-allowlists.ts`, deny-test grönt (400 vid okänd op), allow-test grönt (200 vid valid op).

    ### 8.3 K9-respekt: domännamn vs table-IDs

    `'registration.set-status'` är ett *domännamn*. `'tbloOcrppVoyrHbrq'` är ett *table-ID*. Klient-API:t exponerar enbart domännamn. Table-ID-mappningen lever i `field-allowlists.ts` på server-sidan. Detta:

    - Gör klient-koden migreringsbar mot Supabase utan API-ändring (operations-namn behålls, mappning byts från Airtable till Postgres-tabell)
    - Skyddar mot felmappning vid future S-track (target-tabeller har UUID-IDs, inte Airtable-format)
    - Gör operations-registret till en explicit kontraktsyta, inte en sidoartefakt

    ### 8.4 Optimistic mutation-mönster (refererad från §4)

    `useMutation`-mönstret i §4 wrappar `executeOperation` med onMutate (snapshot + optimistisk uppdatering), onError (rollback), onSettled (invalidate). Mönstret är samma — bara mutationFn-anropet ändras (operations-baserat istället för direct-method).

    **ADR-krav i P3:** "TanStack optimistic mutation-mönster med operations-baserat API" (P1 Del 7 ADR #6). Skrivs i Fas 5.5.

    ### 8.5 Korsreferenser

    - `SECURITY-SPEC.md §6.1` — server-sidans definition (operations-registret, deny-by-default)
    - `byggplan-direktiv.md §8.5.4` — Fas A:s arkitekturmönster-översikt
    - `tasks/sessions/2026-05-04-security-hardening.md` — Fas A:s implementations-detaljer
    - `tasks/sessions/2026-05-04-byggplan-revision-p1.md` Del 4 A3 + Del 7 ADR-katalog

IMPLEMENTERA: kör 4 str_replace + 1 sektion-injektion.

VERIFIERA:
- git diff visar 4 byten + 1 ny sektion (§8)
- §2 har strangler-fig-not synlig direkt under rubriken
- §4 har operations-baserad anrop i exempelkoden + not under
- §5 är märkt "framtida arkitektur — Fas E"
- §5b finns med polling-mönstret + ADR-pekare
- §8 finns med fullständigt operations-API-mönster
- Renderad markdown är fortsatt giltig — kontrollera att numreringen i innehållsförteckning (om sådan finns) är konsistent

DOKUMENTERA + COMMITTA:
- Commit-message:

    docs(state): synka mot strangler-fig + operations-API (Fas A M4)

    P2 Klunga 3 av 4. Lägger till §8 (Operations-baserat write-API)
    som dokumenterar {operationKey, recordId, fields}-mönstret från
    Fas A M4 så Fas 6 sub-fas-prompter (6a–6e) kan referera ett ställe.
    §2 får strangler-fig-not (Persons → Events → Registrations →
    Hem-aggregering → Mer per P1 Del 4 A3). §4 exempelkoden uppdateras
    till operations-baserad anrop. §5 (Supabase Realtime) defer:as till
    Fas E per B1-beslutet. Ny §5b dokumenterar hybrid polling + pull-to-
    refresh för Fas 6d Hem.

    Sources: byggplan-direktiv.md §8.5.4, tasks/sessions/2026-05-04-byggplan-
    revision-p1.md Del 4 A3 + B1, analys/07-migration-plan.md §A2,
    tasks/sessions/2026-05-04-security-hardening.md.

    P2 Klunga 3 av 4 klar. Next: lessons.md + todo.md (Steg 4-5).

- Pusha
```

### Steg 4 — Code-prompt för lessons.md-uppdatering

```
LÄS först:
- ~/Repon/miranon-media-admin/tasks/lessons.md
- ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-stodspec-synk-p2.md Del 7
  (källan — fyra färdig-formaterade lessons-poster)

RAPPORTERA:
- Bekräfta att lessons.md har sektionen "## Arbetsflöde och process"
- Visa raden där posterna ska infogas (efter de 3 P1-posterna från p1-avslutning.md, före nästa ##-rubrik)

PLANERA:
- En str_replace som lägger till de fyra posterna i "Arbetsflöde och process"
- Posterna kopieras *exakt* från p2-sessionsdokets Del 7 (utan markdown-fence-wrapparen)
- Behåll [UNIVERSAL]-flaggan synlig i varje post-rubrik
- Datum: 2026-05-04 i varje post

IMPLEMENTERA + VERIFIERA + COMMITTA:
- Commit-message:

    docs(lessons): add 4 UNIVERSAL lessons from P2 session

    - Stödspec-synk via tillägg, inte omskrivning
    - Trigger-beslut med självaktiverande indata
    - Korsreferens > duplicering vid synk-arbete
    - Källa-vs-implementation-skiktning vid stack-byte

    All flagged [UNIVERSAL] for lift to marcus-system at next sync.
    Source: tasks/sessions/2026-05-04-stodspec-synk-p2.md Del 7.

- Pusha
```

### Steg 5 — Code-prompt för todo.md-uppdatering

```
LÄS först:
- ~/Repon/miranon-media-admin/tasks/todo.md

RAPPORTERA:
- Hur P1 markerades som klar (för att replikera mönstret för P2)
- Var P2 står i todo.md (sannolikt under "Nästa" eller "Pågående")

PLANERA:
- Markera P2 som ✅ KLAR med datum 2026-05-04
- Lägg till pekare till tasks/sessions/2026-05-04-stodspec-synk-p2.md
- Lägg till P3 som nästa uppgift med pekare till p2-sessionsdokets Del 8 för startkontext
- Behåll Marcus' format — ingen omstrukturering

IMPLEMENTERA + VERIFIERA + COMMITTA:
- Commit-message:

    chore(todo): mark P2 complete, add P3 as next

    P2 stödspec-synk completed 2026-05-04.
    See tasks/sessions/2026-05-04-stodspec-synk-p2.md.
    P3 startup context: see Del 8 in p2-sessionsdoc.

    A1-utfall: Fas 3.5 = egen fas (test-infra + mönsterbibliotek bägge JA).

- Pusha

EFTER STEG 5:
- Säg till Marcus: "P2 fullständigt avslutad. Klicka 'Update' i Claude.ai-projektet
  så Chat ärver uppdaterade specs och lessons inför P3."
```

---

## Del 7 — Lessons-poster för `tasks/lessons.md`

Fyra UNIVERSAL-kandidater från denna session. Alla generiska och återanvändbara i framtida arbete. Färdig-formaterade för inklippning.

### Post 1 — Stödspec-synk via tillägg, inte omskrivning [UNIVERSAL]

```markdown
### Stödspec-synk via tillägg, inte omskrivning [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2-sessionen stödspec-synk

När en specs-fil ska synkas mot ny implementation eller nytt beslut: prefer **tillägg av ny sektion + uppdatering av status-kolumner i befintliga tabeller** över omskrivning. Tillägg ger spårbarhet (commit-historiken visar exakt vad som tillkommit), bevarar tidigare resonemang som förblir giltigt, och minskar risk för otidsenlig "förbättring" av redan korrekt prosa.

Omskrivning är rätt **endast** när filens tekniska premiss är fel — t.ex. ACCESSIBILITY-CHECKLIST som vägledde mot fel UI-stack (Vue/FKUI). Då blir punktinsatser otillräckliga eftersom *vilken stack filen vägleder mot* är hjärtat, inte enskilda punkter.

**Beslutsregel:**
- Är >50% av filens prosa giltig idag? → Tillägg + status-uppdateringar.
- Är filens primära rekommendations-yta fel teknik-stack? → Omskrivning.
- Är driften terminologisk men arkitekturen rätt? → Lämna orörd, dokumentera observation, planera "naturligt synlig"-uppdatering vid nästa relevanta fas.

Tillägg-mönstret i SECURITY-SPEC P2: ny §6 "Fas A — etablerade arkitekturmönster" + status-kolumn-byten i §5 OWASP-tabellen. Inga befintliga sektioner togs bort. Diff:en är tydlig och granskbar.

**Kostnad om man väljer fel:** Omskrivning där tillägg räcker → tappad spårbarhet + risk för regression i tidigare korrekta beslut. Tillägg där omskrivning behövs → halvuppdaterad fil där läsaren får navigera mellan giltig och otidsenlig prosa, vilket ofta är värre än ingen synk alls.
```

### Post 2 — Trigger-beslut med självaktiverande indata [UNIVERSAL]

```markdown
### Trigger-beslut med självaktiverande indata [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 A1-utfallsleverans

A1 (Fas 3.5 egen fas eller integrerad) löstes inte av Chat-diskussion utan av att P2:s första leverans i ACCESSIBILITY-CHECKLIST-omskrivningen *aktiverade* trigger-tabellen. Mönstret är generaliserbart: scenariobeslut med skarpa kriterier kopplas till en *mätbar leveransmoment* så att utfallet faller ut av leveransen själv, inte av separat beslutsmöte.

**Konstruktion av trigger-beslut:**
1. **Skarpa kriterier i förväg** — varje trigger-rad har testbar tröskel (timmar, ja/nej, kvantifierbart krav). Inte vag "bedömning" eller "magkänsla".
2. **Binär aggregation** — hur kombineras raderna till ett utfall? "Minst en JA → utfall A" är skarpt. "Övervägande indikatorer pekar mot..." är inte.
3. **Aktiverande leverans** — vilken konkret artefakt avgör? (P2:s ACCESSIBILITY-CHECKLIST-leverans, inte "vi pratar om det igen").
4. **Spårbar rapport** — leveransen producerar en rapport per trigger-rad: rad 1 = X timmar (uppmätt), rad 2 = JA/NEJ (med bevis), rad 3 = JA/NEJ (med bevis).

**Anti-mönster:** "Vi tar A1-beslutet i P3 när vi ser hur det blir." Det är scenariobeslut utan kriterier — ger samma osäkerhet som inget beslut alls, men maskerat som "flexibelt".

**Spårbarhet:** Sentry-DSN-beslutet i Fas A löstes med samma princip — kriterier låstes före Gate A1, *valet* gjordes med faktisk indata. P2 A1 är det andra exemplet av samma mönster i samma projekt; mönstret fungerar.
```

### Post 3 — Korsreferens > duplicering vid synk-arbete [UNIVERSAL]

```markdown
### Korsreferens > duplicering vid synk-arbete [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 ACCESSIBILITY-CHECKLIST × ARIA-UPGRADE

Vid omskrivning av en spec som har överlappande domän med en annan spec: **bygg korsreferens, inte duplicering.** ACCESSIBILITY-CHECKLIST.md skulle kunna ha kopierat in ARIA-UPGRADE:s ARIA 1.3-detaljer per komponent, men det skulle skapa två versioner av samma sanning som driftar isär över tid (samma drift-mönster som lager 4 i fyra-lager-drift-lärdomen från REG 2026-04-19).

**Regel:** Varje sanning lever på *ett* ställe. Andra dokument refererar dit, kopierar inte. När en spec genomgår omskrivning: identifiera vilka sektioner som överlappar med andra specs *innan* omskrivningen, och välj per överlapp vilken fil som äger sanningen.

**Tillämpning P2:**
- ARIA 1.3-attribut per komponent → äger ARIA-UPGRADE.md. ACCESSIBILITY-CHECKLIST refererar dit.
- Operations-baserat API → server-definition i SECURITY-SPEC §6.1, klient-mönster i STATE-STRATEGY §8. Båda korsrefererar varandra.
- Strangler-fig-ordning → äger analys/07-migration-plan.md §A2. STATE-STRATEGY refererar dit.

**Kostnad om man väljer duplicering:** Initial leverans är snabbare (copy-paste) men varje framtida ändring måste göras på N ställen, och drift fångas inte förrän en konsument läser fel version.

**Korsreferens-disciplin:** Pekarna ska vara konkreta sökvägar + sektion (`SECURITY-SPEC.md §6.1`), inte vaga ("se SECURITY-SPEC"). Konkret pekare gör att ändringar i målfilen visar sig som referens-rot om sektionen flyttas — vag pekare maskerar driften.
```

### Post 4 — Källa-vs-implementation-skiktning vid stack-byte [UNIVERSAL]

```markdown
### Källa-vs-implementation-skiktning vid stack-byte [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P2 E (data-model.md vs Status.ts)

När en sanningskälla (specifikation/datamodell) speglas i implementation (kod/typer) och driftar isär: ändra inte källan för att matcha implementationen, även om implementationen är "närmare verkligheten". Källan ska vara avsiktlig, implementationen ska följa.

**P2 E-fallet:**
- `data-model.md` listar 6 statusvärden för Anmälningar (källa, uppdaterad 2026-04-26)
- `src/domain/types/Status.ts` listar 4 (implementation, header daterad 2026-03-30 — 30 dagar gammal)
- Frestelsen: uppdatera data-model.md till 4 värden för att "matcha verkligheten"
- Rätt: data-model.md är källan; Status.ts ska utökas till 6 värden i Fas 2.5

**Regel:**
1. **Identifiera vilken artefakt som är källan** — typiskt den som har explicit datum-spårbarhet, ändringslogg, eller refereras från flera implementations-ställen.
2. **Skikta target-shape vs source-shape** — när ny implementation introduceras (t.ex. SupabaseAdapter mot Airtable-source) ska target ha *separat* enum/typ, inte unifiering med source. Per P2 E: AirtableAdapter använder Airtable-shape, framtida SupabaseAdapter använder target-shape, DataSourceAdapter-gränsen översätter mellan dem.
3. **Korsverifiering över tid** — när en spec uppdateras (data-model.md 2026-04-26), markera vilka implementations-filer som måste följa (Status.ts, eventuella Zod-scheman). Sätt det som todo med spårbarhet — annars driftar implementationerna oupptäckt.

**K9-respekt** (från datamodell-research-projektets lessons): stable identifiers separeras från displaynamn vid integrationskanter. Airtable-värdet `"Bekräftad (mail skickat)"` är displaynamn, target-värdet `"confirmed"` är stable key. De ska inte blandas i samma enum-konstant.

**Kostnad om man väljer unifiering:** UI som konsumerar AirtableAdapter får target-värden som inte matchar live-datat → filter, badge-färger, status-knappar bryts. Senare migration (Fas E) blir omkull-skrivning av varje konsument istället för isolerad adapter-byte.
```

---

## Del 8 — P3 startkontext (briefing för nästa Chat-session)

Färdig prompt-mall att klistra in vid start av P3-sessionen. Säkerställer att P3 startar med rätt kontext utan att läsa hela P2-sessionsdoket.

```
[P3-START-PROMPT — klistra in i ny Chat-session]

Hej. P2 är klar och committad. Nu kör vi P3 — Skriva byggplanen + städning enligt
direktiv §6 P3.

Läs i denna ordning:
1. ~/Repon/marcus-system/CLAUDE.md
2. ~/Repon/miranon-media-admin/CLAUDE.md
3. ~/Repon/miranon-media-admin/tasks/lessons.md
   (särskilt 7 nya UNIVERSAL-poster: 3 från P1 + 4 från P2)
4. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-byggplan-revision-p1.md
   (P1: Del 5 Pass-status, Del 6 §5-uppdatering, Del 7 ADR-katalog 9 st)
5. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-stodspec-synk-p2.md
   (P2: Del 5 A1-utfall = Fas 3.5 egen fas, Del 7 lessons-poster)
6. ~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md §5 (uppdaterad efter P1) + §6 P3
7. ~/Repon/miranon-media-admin/docs/specs/SECURITY-SPEC.md (uppdaterad i P2)
8. ~/Repon/miranon-media-admin/docs/specs/STATE-STRATEGY.md (uppdaterad i P2)
9. ~/Repon/miranon-media-admin/docs/specs/ACCESSIBILITY-CHECKLIST.md (omskriven i P2)

Mål: Skriv `docs/byggplan.md` (slutprodukten). Repo:t blir "rent och 11/10":
- Fas-prompter per fas (Fas 0 + 1 redan klara, Fas 2 → Fas 8 + Fas A + Fas B + Fas E)
- 9 ADR:er skrivna eller startade per P1 Del 7-katalogen
- ADR för Fas 3.5 som egen fas (ny — föranledd av P2 A1-utfall)
- conversion-plan.md arkiveras till docs/archive/
- BUILD-LOG.md uppdateras med Fas A + P0-P2 retrospektivt

Specifika P3-uppgifter:

A. Byggplan.md skrivs med fas-tabell från §5 (post-P1) + sub-fas-allokering Fas 6 (6a–6e).

B. 10 ADR:er identifierade (9 från P1 Del 7 + 1 ny för Fas 3.5):
   1. CSP-plugin-deferral (ADR från P0-inventory)
   2. Conversion-plan → byggplan-skiftet
   3. Fas 4-borttagningen
   4. createRegistration-idempotency (Fas 6c)
   5. sendEmail-direct-Resend-skuld (Fas 6e)
   6. TanStack optimistic mutation-mönster (Fas 5.5)
   7. Polling-vs-Realtime + migrations-vägen post-Fas E (Fas 6d)
   8. Fas 5-förenklingen (Fas 5)
   9. Background Sync defer från Fas 7 till Fas 8 (Fas 7-start)
   10. Fas 3.5 = egen fas (P2-utfall)

C. Stödspec-status (efter P2):
   - SECURITY-SPEC: Fas A-mönster införlivade ✓
   - STATE-STRATEGY: Strangler-fig + operations-API ✓
   - ACCESSIBILITY-CHECKLIST: React Aria + WCAG 2.2 AA ✓
   - data-model.md: oförändrad (källa för status-typer; synk i Fas 2.5-kod)
   - 8 övriga stödspecs: oförändrade (granskade i P2 Klunga 1)
   - Liten observation från K1: KVALITETSDEFINITIONER-11 har Vue-terminologi
     (composables, onUnmounted) som naturligt uppdateras i Fas 3 — defer:as.

D. Föreslå arbetsupplägg innan vi börjar. Sannolikt sessionsdok-fil för P3
   (samma mönster som P0/P1/P2). Eventuell splittning i P3a (byggplan-skelett +
   ADR-katalog) + P3b (städning + arkivering) om scope växer.

Code är fri, P2 committad. Detta är Chat-arbete.
```

---

## Del 9 — Pass-status

| Klunga | Innehåll | Status | Output |
|---|---|---|---|
| K1 | D-listan (8 specs) + E (data-model.md per dm-110) | ✅ KLAR | Antecknat per fil — alla 8 oförändrade, data-model.md verifierad som källa |
| K2 | SECURITY-SPEC — införliva Fas A:s 8 mönster | ✅ KLAR | Code-prompt för 4 str_replace + ny §6-injektion |
| K3 | STATE-STRATEGY — strangler-fig + operations-API | ✅ KLAR | Code-prompt för 4 str_replace + ny §8-injektion + §5b polling |
| K4 | ACCESSIBILITY-CHECKLIST — omskrivning | ✅ KLAR | Ny full fil + A1-trigger-rapport |
| K4 | A1-utfall (Fas 3.5 egen fas eller integrerad) | ✅ AVGJORT | **Fas 3.5 = EGEN FAS** (rad 2 + rad 3 båda JA) |

**Stop-test enligt direktiv §6 P2:** Stödspecs uppdaterade så att byggplanens fasprompter har korrekta beroenden + A1-utfall avgjort.

- ✅ 4 primära specs uppdaterade (eller motiverat ej-uppdaterade — data-model.md)
- ✅ 8 D-list-specs granskade — alla passerade utan drift
- ✅ E (data-model.md) verifierad som källa för status-typer
- ✅ A1-utfall avgjort med trigger-tabellens fyra rader ifyllda
- ✅ Sessionsdok innehåller Code-prompts (Del 6) och P3-startkontext (Del 8)
- ✅ **Stop-test PASSERAT.**

### Nästa steg

1. **Granskning av Marcus** (denna session eller nästa) — ev. justeringar appliceras till sessionsdok eller ny ACCESSIBILITY-CHECKLIST.
2. **Code-uppgifter i P3-fönstret:** Steg 1 → Steg 2 → Steg 3 → Steg 4 → Steg 5 (se Del 6). Marcus klickar "Update" i Claude.ai-projektet efter Steg 5.
3. **P3 startar** — byggplan.md skrivs + 10 ADR:er + arkivering. Refererar denna sessionsdok för A1-utfallet och stödspec-statusen.

---

## Bilaga A — Stödspec-status efter P2 (snabbreferens för P3)

| Spec | Status | Kommentar |
|---|---|---|
| `docs/specs/SECURITY-SPEC.md` | Uppdaterad | Ny §6 (Fas A-mönster). §5 OWASP-tabellen status-uppdaterad för A01/A05/A09. |
| `docs/specs/STATE-STRATEGY.md` | Uppdaterad | Ny §8 (Operations-API). §2 strangler-fig-not. §5 → Fas E. Ny §5b polling. |
| `docs/specs/ACCESSIBILITY-CHECKLIST.md` | Omskriven | React Aria + WCAG 2.2 AA. Mönsterbibliotek-sektion (Fas 3.5-leverabel). Test-infra-sektion (Fas 3.5-leverabel). |
| `docs/reference/data-model.md` | Oförändrad | Bekräftad sanningskälla för status-typer per dm-110. Synk till Status.ts sker i Fas 2.5 (kod, inte spec). |
| `docs/specs/DESIGN-MANIFESTO.md` | Oförändrad | Teknik-agnostiskt — ingen drift möjlig. |
| `docs/specs/DESIGN-OPERATING-SYSTEM.md` | Oförändrad | Teknik-agnostiskt. |
| `docs/specs/DESIGN-SYSTEM-SPEC.md` | Oförändrad | Redan synkad mot React + Tailwind v4 + @theme (2026-04-13). |
| `docs/specs/KVALITETSDEFINITIONER-11.md` | Oförändrad | Vue-terminologi noterad (composables, onUnmounted) — defer:ad till Fas 3. |
| `docs/specs/PERFORMANCE-BUDGET.md` | Oförändrad | React + web-vitals — aktuell. |
| `docs/specs/URL-STATE-SPEC.md` | Oförändrad | nuqs + TanStack Router — aktuell. |
| `docs/specs/ARIA-UPGRADE.md` | Oförändrad | React Aria + ARIA 1.3 + EAA — aktuell. ACCESSIBILITY-CHECKLIST refererar hit. |
| `docs/specs/FUTURE-COMPAT.md` | Oförändrad | Passionslyftet-tidsplan oförändrad. |

## Bilaga B — A1-utfallets konsekvenser för P3

Per P2 K4-utfallet "Fas 3.5 = egen fas" gäller följande för P3 byggplan-skrivningen:

- **Fas-tabellen i §5** (uppdaterad efter P1): rad 3.5 var "VILLKORAD". Den ska konkretiseras till: "Fas 3.5 — A11y-baseline (egen fas, P2-trigger aktiverad)".
- **Fas 3.5 DoD** (förslag, finslipas i P3 fas-prompt):
  1. ACCESSIBILITY-CHECKLIST.md committad i React Aria-version (✅ klart i P2)
  2. axe-core + @axe-core/playwright installerat
  3. Playwright a11y-runner-config + fixture-mönster (`renderWithA11y`)
  4. CI-integration: axe-violations failar bygget
  5. 5 React Aria-pattern dokumenterade med kodexempel + test-mall (Overlay, Listbox, Disclosure, MenuTrigger, ComboBox)
  6. "A11y-baseline godkänd"-gate — Fas 6 startar inte förrän denna passerar
- **Fas 3.5 estimat:** ~1 session per direktiv §5 (gäller fortfarande post-A1-utfall).
- **Beroenden:** Fas 3.5 ska placeras *efter* Fas 3 (UI-primitiver). Frågan om "före eller efter Fas 5" avgörs i P3 baserat på app-shell-beroenden — sannolikt *före* Fas 5 så att tab bar och skip-link byggs mot a11y-baselinen.
- **Ny ADR i P3 ADR-katalogen:** "ADR — Fas 3.5 som egen fas, motivering: P2 A1-trigger-rapport rad 2 + rad 3 båda JA". Tidigare 9 ADR:er identifierade i P1 Del 7 + denna nya = **10 ADR:er totalt** för P3.

---

*Slut på P2-sessionsdokumentet. Inga ändringar i kod committade i P2 — allt är dokumentation och Code-prompter för applicering. Marcus + Code applicerar via Steg 1–5 i Del 6.*
