# Byggplan — direktiv

> **Status:** Direktiv skapat 2026-05-04. Revisionsarbete inte påbörjat.
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md`
> **Föregångare:** `~/Repon/miranon-media-admin/docs/conversion-plan.md` (2026-04-14, ersätts av byggplanen)
> **Output (när revisionen är klar):** `~/Repon/miranon-media-admin/docs/byggplan.md`

---

## 1. Sammanfattning

Conversion-plan är skriven 2026-04-14 och tjänade Fas 0+1 av React-konverteringen. Sedan dess har scopet växt — säkerhetshardening, datamodell-research, Airtable-drift, Supabase-migration — och "konvertering" är inte längre rätt ram. Det enda som faktiskt var Vue→React-konvertering är klart. Det som återstår är att *bygga ett system*.

Detta dokument är direktivet för byggplanen som ersätter conversion-plan: vad ska göras, varför, i vilken ordning, och vad som är beslutat sedan tidigare och därför INTE är öppet för omprövning.

Revisionsarbetet är fyra fokussessioner Chat-arbete (P0–P3) som körs parallellt med Code:s Fas A — säkerhetshardening. Output är `docs/byggplan.md` plus uppdaterade stödspecs.

---

## 2. Bakgrund

Sedan conversion-plan skrevs har följande hänt, i kronologisk ordning:

| Datum | Händelse | Output |
|---|---|---|
| 2026-04-14 | Fas 0 + Fas 1 av conversion-plan genomförda | commits `fcc6de3` (Fas 0) + `c91bfa0` (Fas 1) |
| 2026-04-28 | dm-110-projektet — uttömmande dokumentation av befintlig Airtable-modell | `docs/data-model.md`, 9 UNIVERSAL-lärdomar |
| 2026-04-28 | Codex projektanalys efter Fas 1 | `docs/Codex-project-analysis-after-fas-1.md` |
| 2026-04-29 | Code:s verifiering av Codex-analysen mot HEAD `245422c` | `docs/Code-verification-of-codex-analysis.md` |
| 2026-04-28 → 30 | Datamodell-research-projektet (forwards-look, 7 faser, Gate 6 passerad) | `analys/04-research.md` → `analys/07-migration-plan.md`, K1–K10 lyfta till lessons |
| 2026-05-03 | Odoo-validering som sidospår, post-Gate 6 | `analys/08-odoo-validation.md`, 8 nya kandidater (E1–E8) |
| 2026-05-04 | Säkerhetshardening (Fas A) påbörjad av Code | Pågående mot HEAD |

Ingen av dessa händelser är reflekterad i conversion-plan. Det är därför vi måste skriva en byggplan innan Fas 2 startar.

---

## 3. Varför conversion-plan ersätts av en byggplan

Två skäl.

**Det första är konceptuellt: ramen "konvertering" är inte längre sann.** När conversion-plan skrevs var Vue källan och vi porterade fil för fil. Idag är knappt något i den föreslagna fasstrukturen genuin konvertering — Fas A är hardening, Fas 2.5 är schema-sync mot data-model.md, Fas 3 bygger React Aria-primitiver från scratch, Fas B är Airtable-drift, Fas E är Supabase-migration. Det enda som var Vue→React-konvertering var Fas 0+1, och de är redan klara. Resten är att bygga ett system. Därav: byggplan, inte conversion-plan v2.

**Det andra skälet är konkret: åtta luckor i conversion-plan som påverkar genomförandet** (inte stilfrågor):

### 3.1 Säkerhet ligger i Fas 7, men risken är aktiv NU

**Conversion-plan säger:** "CSP, chaos testing, deploy" landar i Fas 7.

**Verkligheten:** Code-verifieringen 2026-04-29 visar att Edge Functions är publikt skrivbara mot 18 produktionstabeller redan idag — wildcard CORS, ingen `requireUser`-gate, anon-key-fallback i klienten, formula-injektion i `get-registrations`/`get-persons`, `create-admin-user` utan caller-verifiering. Detta är inte hardening, det är aktiv exponering.

**Konsekvens i byggplanen:** En ny Fas A — Säkerhetshardening läggs in före Fas 2. Code är redan igång med den.

### 3.2 Datamodellen som conversion-plan utgår från finns inte längre

**Conversion-plan säger:** Airtable är datakällan. Supabase nämns som "Fas 8 framtid".

**Verkligheten:** Vi har nu:
- `analys/06a-airtable-redesign.md` — 12 Airtable hardening-åtgärder (A1–A12)
- `analys/06b-supabase-target.md` — 36 Supabase target-tabeller
- `analys/07-migration-plan.md` — strangler-fig-migrationssekvens i 10 steg, Future Code-prompt i Del H
- `analys/08-odoo-validation.md` — 8 ytterligare kandidater (E1–E8)

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

**Verkligheten:** Code-fynd D — `@sentry/react: ^10.48.0` finns i `package.json`, men `grep "Sentry" src/` ger noll träffar. Det är paid-for-but-unused.

**Konsekvens i byggplanen:** Sentry-init blir explicit del av Fas A (eller Fas 2 senast). DSN-strategi och PII-scrubbing dokumenterad.

### 3.8 ~20 nya UNIVERSAL-lärdomar inte integrerade

**Conversion-plan säger:** Refererar lessons.md generellt.

**Verkligheten:** dm-110 (9 poster), datamodell-research (K1–K10), Odoo-validering (3 nya). Flera är direkt relevanta för byggplanen — t.ex. K6 om config-as-data drift, lärdomen om att verifiera mot kod inte minne, Odoo-lärdomen om mogen open source som referens.

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
| Bottom tab bar, max-width 600px, FK-inspirerad app-shell | Conversion-plan §L | LÅST |
| 21st.dev component-strategi (testa builder, fall tillbaka till inspiration) | Conversion-plan öppna beslut #5 | OFÖRÄNDRAD |
| Kvalitetsribba: bibliotek 11/11/11, vyer 11/10/10 | CLAUDE.md | LÅST |
| Hub-and-spoke-arkitekturen för marcus-system | CLAUDE.md global | LÅST — utanför detta projekts scope |

Allt annat är öppet för omprövning under revisionen.

---

## 5. Föreslagen fasstruktur (preliminär — finslipas i P1)

| Fas | Namn | Status | Estimat | Anmärkning |
|---|---|---|---|---|
| 0 | Projektsetup + tokens | KLAR | – | Frusen |
| 1 | Domäntransplant | KLAR | – | Frusen |
| **A** | **Säkerhetshardening** | **PÅGÅR (Code)** | **1–2 v** | **NY** |
| 2 | Routing + Auth | NY scope | 1 session | Bygger på Fas A:s `requireUser` |
| **2.5** | **Schema-kontrakt-sync** | **EJ PÅB.** | **1 session** | **NY** |
| 3 | UI-primitiver | NY scope | 2–3 sessioner | Förutsätter ny a11y-baseline |
| **3.5** | **A11y-baseline (alt. integrerat i Fas 3)** | **EJ PÅB.** | **0,5–1 session** | **NY** |
| 5 | App-shell + tab bar | NY scope | 1–2 sessioner | Möjligen förenklad |
| **5.5** | **Första vertikala produktionsslice** | **EJ PÅB.** | **2 sessioner** | **NY** (Codex rec #4) |
| 6 | Hem + Event + Personer + Mer | NY scope | 3,5 sessioner | Sekvens följer 07 strangler-fig |
| 6.5 | Aktivitetslogg | OFÖRÄNDRAD | 2 sessioner | – |
| 7 | Konsolidering | NY scope | 2 sessioner | Renodlad — säkerhet redan i Fas A |
| **B** | **Airtable hardening (A1–A12)** | **EJ PÅB.** | **Parallell** | **NY** — Lotta/Roger-arbete |
| **E** | **Supabase migration (07 Del H)** | **DEFER** | **Senare** | **NY** — pekar på 07 Del H |

**Numreringsnot:** Byggplanen behåller conversion-plans siffror för Fas 0–7 för att undvika omdöpning av befintliga fas-prompter och lessons.md-poster. Det "saknas" en Fas 4 — den är medvetet borttagen i conversion-plan (DataTable flyttad till Fas 7). Nya faser får bokstavs- eller decimalsuffix (A, B, E, 2.5, 3.5, 5.5).

---

## 6. Revisionsplan — P0 → P3

Fyra fokussessioner Chat-arbete, körs parallellt med Code:s Fas A.

### P0 — Inventering (1 session)

**Mål:** Konkret lista över påståenden i conversion-plan som motsägs av nyare dokument.

**Output:** `docs/byggplan-revision-inventory.md` med tabellen "Påstående → Källa → Korrigering".

**Indata att gå igenom:**
- `docs/conversion-plan.md` (~1 800 rader) — sektion för sektion
- `docs/Codex-project-analysis-after-fas-1.md`
- `docs/Code-verification-of-codex-analysis.md`
- `analys/04-research.md` → `analys/08-odoo-validation.md`
- `marcus-system/tasks/lessons.md` (sektioner 2026-04-28 → 2026-05-03)

**Stop-test:** Inventering är klar när varje påstående i conversion-plan §D (fas-för-fas-plan) är klassad: oförändrad / behöver justering / behöver omformuleras / försvinner.

### P1 — Fas-sekvens-revision (1 session)

**Mål:** Slutgiltig fas-lista för byggplanen. Beslut på alla "NEW" och "modified scope"-faser ovan.

**Output:** Uppdaterat avsnitt 5 i detta direktiv + en kort design-not per ny fas (vad är scope, vad är inte scope, vilka beroenden, vilket estimat).

**Beslut som måste fattas i P1:**
- Är Fas 3.5 (a11y-baseline) en egen fas eller integrerad i Fas 3?
- Är Fas 5.5 (vertikal slice) "list-anmälningar" eller något annat?
- Sekvenseras Fas 6 enligt strangler-fig (Persons → Events → Registrations) eller enligt "Hem först"-prioritet?
- Är Fas B (Airtable hardening) helt parallell, eller har den beroenden mot Fas A?
- Vilka adapter-debt-metoder ska deployas i Fas 2.5 vs defer:as till senare faser?

### P2 — Stödspec-synkning (1 session)

**Mål:** Uppdatera de stödspecs som är direkta beroenden för byggplanens fasprompter.

**Filer att uppdatera (preliminär lista):**
- `docs/SECURITY-SPEC.md` — införliva Code-verifieringens fynd, Fas A-resultat
- `docs/ACCESSIBILITY-CHECKLIST.md` — skriv om för React Aria + WCAG 2.2 AA
- `docs/STATE-STRATEGY.md` — synk mot strangler-fig-ordningen i 07
- `docs/research/react-stack-research.md` — markera vad som är överspelat sedan 2026-04
- `docs/data-model.md` — kontrollera att den fortfarande är källan för status-typer (den ska vara det per dm-110)

**Filer som troligen INTE behöver uppdateras (kontrolleras kort):**
- DESIGN-MANIFESTO, DESIGN-OPERATING-SYSTEM, DESIGN-SYSTEM-SPEC — designprinciper är oförändrade
- KVALITETSDEFINITIONER-11.md — kvalitetsdefinitionerna är kärnstabila
- PERFORMANCE-BUDGET, URL-STATE-SPEC, ARIA-UPGRADE — kontrolleras kort men förväntas oförändrade
- FUTURE-COMPAT.md — uppdateras endast om Passionslyftet-tidsplanen ändrats

### P3 — Skriv byggplanen (1 session)

**Mål:** `docs/byggplan.md` är klar, granskad och committad.

**Output:**
- `docs/byggplan.md` (ny fil, ersätter conversion-plan som styrande dokument)
- `docs/archive/conversion-plan-2026-04-14.md` (arkiverad conversion-plan)
- ADR i `docs/decisions/` om varför conversion-plan ersattes av byggplan, inte uppdaterades till v2
- Uppdaterad `docs/decisions/README.md`
- Uppdaterad `CLAUDE.md` (sektionen "Fasordning" + alla referenser till conversion-plan)
- Uppdaterad `tasks/todo.md` (rensad från conversion-plan-fas-poster, ny lista enligt byggplanen)
- Lärdoms-commit i `marcus-system/tasks/lessons.md` om revisionsmönstret om något UNIVERSAL framkommer

---

## 7. Hela planen i sekvens (efter att byggplanen är skriven)

| Vecka från idag | Code | Marcus + Chat | Lotta/Roger |
|---|---|---|---|
| 1 (nu) | Fas A — säkerhetshardening, M1–M8 | P0 + P1 | – |
| 2 | Fas A fortsatt | P2 + P3 | (Eventuell start på Fas B) |
| 3 | Fas A klar, börja Fas 2 mot byggplanen | Granska Fas 2-output | Fas B om ej påbörjat |
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
3. **Vad är "Första vertikala slice" konkret?** "Lista anmälningar end-to-end" är förslag — finns bättre kandidater?
4. **Ska Fas B (Airtable hardening) ägas av Code eller Marcus + Lotta?** A1–A12 är drift på Airtable-basen. Code kan stödja men driver inte rutinarbete.
5. **Hur hanterar byggplanen conversion-plans "öppna beslut" som ännu inte är stängda?** Färgvariabler #8E5F07 vs #96680A, fokusring guld vs mörkblå, 21st.dev component_builder.
6. **Vad i adapter-debt-listan (Code-fynd F) ska deployas vs defer:as i Fas 2.5?**
7. **DSN-strategi för Sentry — klient eller backend? Hur lagras DSN?** (Också del av Fas A:s Gate A1.)
8. **Ska aktivitetsloggen (Fas 6.5) byggas mot Airtable eller direkt mot Supabase?** Påverkar timing relativt Fas E.

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
- `~/Repon/miranon-media-admin/docs/SECURITY-SPEC.md`
- `~/Repon/miranon-media-admin/docs/ACCESSIBILITY-CHECKLIST.md`
- `~/Repon/miranon-media-admin/docs/STATE-STRATEGY.md`
- `~/Repon/miranon-media-admin/docs/PERFORMANCE-BUDGET.md`
- `~/Repon/miranon-media-admin/docs/URL-STATE-SPEC.md`
- `~/Repon/miranon-media-admin/docs/ARIA-UPGRADE.md`
- `~/Repon/miranon-media-admin/docs/FUTURE-COMPAT.md`
- `~/Repon/miranon-media-admin/docs/SPA-ARCHITECTURE-DECISION.md`
- `~/Repon/miranon-media-admin/docs/DESIGN-MANIFESTO.md`
- `~/Repon/miranon-media-admin/docs/DESIGN-OPERATING-SYSTEM.md`
- `~/Repon/miranon-media-admin/docs/DESIGN-SYSTEM-SPEC.md`
- `~/Repon/miranon-media-admin/docs/KVALITETSDEFINITIONER-11.md`
- `~/Repon/miranon-media-admin/docs/gap-analysis.md`

**Externa analyser:**
- `~/Repon/miranon-media-admin/docs/Codex-project-analysis-after-fas-1.md`
- `~/Repon/miranon-media-admin/docs/Code-verification-of-codex-analysis.md`

**Datamodell-leverans:**
- `~/Repon/miranon-media-admin/docs/data-model.md`
- `~/Repon/miranon-media-admin/docs/hur-systemet-funkar.md`
- `~/Repon/miranon-media-admin/analys/01-extraction.md` → `08-odoo-validation.md` (åtta filer)
- `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
- `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md`
- `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` (FRUSEN)

**Lärdomar:**
- `~/Repon/marcus-system/tasks/lessons.md` (sektioner 2026-04-28, 2026-04-29, 2026-04-30, 2026-05-03)
- `~/Repon/miranon-media-admin/tasks/lessons.md`

**Pågående arbete:**
- Code:s Fas A-arbetsdokument: `~/Repon/miranon-media-admin/tasks/sessions/2026-05-04-security-hardening.md` (skapas av Code i pågående session)

---

## 11. Status

| | |
|---|---|
| Skapat | 2026-05-04 |
| Påbörjat (P0) | – |
| Ägare | Marcus + Claude Chat |
| Code-medverkan | Endast vid kodbasverifiering och slutlig commit av byggplanen |
| Senast uppdaterat | 2026-05-04 |

---

## 12. Slutnot

När P3 är klar och `docs/byggplan.md` är committad:
- Detta direktiv markeras SLUTFÖRT i headern
- Conversion-plan flyttas till `docs/archive/conversion-plan-2026-04-14.md`
- ADR skrivs i `docs/decisions/` om varför conversion-plan ersattes av byggplan (ramen "konvertering" var efterlöpare)
- Fas 2 av React-arbetet kan starta mot byggplanen

Mellan nu och dess: detta direktiv är referensen som hindrar oss från att tappa kontext mellan sessioner.
