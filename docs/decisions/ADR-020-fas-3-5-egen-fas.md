<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# ADR-020: Fas 3.5 = egen fas (a11y-baseline + test-infra + mönsterbibliotek)

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, refereras vid Fas 3.5-start)
- **Fas:** 3.5 (A11y-baseline)

## Kontext

Conversion-plan §D Fas 3 inkluderade tillgänglighetstestning som integrerad del av Fas 3 (UI-primitiver). Ramen var: bygg primitiver + axe-tester + a11y-checklist samtidigt.

Per A1-beslutet (P1-sessionsdok Del 2): A1 var ett **scenariobeslut** — "Fas 3.5 egen fas eller integrerad i Fas 3" skulle avgöras av P2:s första leverans i `ACCESSIBILITY-CHECKLIST.md`-omskrivningen. Trigger-tabell i P1 Del 2 specificerade fyra rader:

| Rad | Tröskel egen fas |
|---|---|
| 1 | Checklist-omskrivning ensam > 1 kväll (3-4 h) |
| 2 | Test-infrastruktur krävs (axe + Playwright a11y + fixture-mönster) |
| 3 | Mönsterbibliotek krävs (kodexempel + test-mall per pattern) |
| 4 | Egen kvalitetsgrind krävs |

Binär trigger-regel: **egen fas om minst en av rad 2 eller rad 3 är JA**.

P2-leveransen (`tasks/sessions/2026-05-04-stodspec-synk-p2.md` Del 5) producerade trigger-rapporten:

- **Rad 1:** Checklist-omskrivning ~3,5h ensam — under tröskeln, men inkl. test-infra och mönsterbibliotek estimerades 4,5h. Tie-breaker, inte primär drivare.
- **Rad 2:** **JA** — axe-core + `@axe-core/playwright` + Playwright a11y-runner-config + fixture-mönster (`renderWithA11y`) + CI-integration. Inte "bara importera jest-axe".
- **Rad 3:** **JA** — fem React Aria-mönster (Overlay, Listbox, Disclosure, MenuTrigger, ComboBox) med kodexempel + test-mall + a11y-acceptance-criteria per pattern.
- **Rad 4:** JA (följer av 2 + 3).

**Båda rad 2 och rad 3 är JA — uppfyller dubbelt.** Per binär trigger-regel: **Fas 3.5 = EGEN FAS.**

P2-sessionsdok Del 5 dokumenterade utfallet. Denna ADR konsoliderar beslutet + scope-låsning.

## Beslut

**Fas 3.5 är egen fas i `byggplan.md` fas-tabellen** (rad 3.5 — efter Fas 3, före Fas 5). Estimat: 1 session.

### Scope (per byggplan.md Fas 3.5)

- `axe-core` + `@axe-core/playwright` installerade
- Playwright a11y-runner-config (separat eller integrerad i `playwright.config.ts`)
- Fixture-mönster: `renderWithA11y(component)` eller motsvarande
- CI-integration: axe-violations failar bygget
- 5 React Aria-mönster med kodexempel + test-mall:
  1. Overlay (`useOverlay` + `useDialog` + `useModal`)
  2. Listbox (`useListBox` + `useOption`)
  3. Disclosure (`useDisclosure` + `useDisclosureGroup`)
  4. MenuTrigger (`useMenuTrigger` + `useMenu`)
  5. ComboBox (`useComboBox` + `useFilter`)

### Inte scope

- Komponentimplementation per primitiv — Fas 3
- A11y-fixar i befintlig kod — Fas 7 vid behov
- WCAG 2.2 AAA — målet är AA

### Beroenden

Ingen mot tidigare faser. Blockerar Fas 3:s formella DoD (Fas 3 kan inte 11/11/11-stämmas-av utan Fas 3.5:s test-infra).

### Sekvens-not

Fas 3 byggs som primär leverans, Fas 3.5 levererar test-infra parallellt eller direkt efter. Fas 3:s DoD-punkt "axe-core 0 violations + Playwright a11y-runner grön" avbockas först när Fas 3.5:s infra finns. Fas 5 startar inte förrän både Fas 3 och Fas 3.5 är klara.

## Alternativ som övervägdes

**Alt 1 — Integrera i Fas 3 enligt conversion-plan.** Avvisat: trigger-rapport från P2 visade att test-infra + mönsterbibliotek tillsammans är 4,5h estimerat arbete. Att stoppa in i Fas 3 hade dubblat Fas 3-estimat (2 → 4 sessioner) eller komprometterat kvalitet på antingen primitiver eller a11y-infra.

**Alt 2 — Defer:a a11y-test till Fas 7 (post-deploy-konsolidering).** Avvisat: Fas 3:s DoD är 11/11/11 där Tillgänglighet *alltid* är 11. Utan test-infra kan vi inte verifiera 11. Defer:a till Fas 7 = skjuta upp kvalitetsgranskning av primitiver till efter Fas 6 har konsumerat dem → potential rework.

**Alt 3 — Egen fas men mindre scope (endast axe-runner, inte mönsterbibliotek).** Avvisat: trigger rad 3 (mönsterbibliotek) var explicit JA. Fas 6:s sub-faser kommer att konsumera de fem patterns (Overlay i modaler, Listbox i filter, Disclosure i menyer, MenuTrigger i åtgärdsmeny, ComboBox i sökfält). Utan dokumenterat mönsterbibliotek hade varje sub-fas återuppfunnit pattern → inkonsekvens + extra kostnad.

**Alt 4 — Skippa scenariobeslutet, integrera utan trigger.** Avvisat: P1:s scenariobeslut-mönster är medveten arkitektur (UNIVERSAL-lärdom "Trigger-beslut med självaktiverande indata", P2 2026-05-04). Att skippa triggern hade undergrävt mönstret för framtida liknande beslut.

## Konsekvenser

**Positiva:**

- Test-infra + mönsterbibliotek levereras med fokus och kvalitet.
- Fas 3:s primitiver verifieras mot Fas 3.5:s test-infra → 11/11/11-stämpling är meningsfull.
- Fem React Aria-pattern dokumenterade en gång → Fas 6:s sub-faser konsumerar dem utan att återuppfinna.
- Mönstret "trigger-beslut med självaktiverande indata" stärks som projekt-konvention — använd igen vid framtida scenariobeslut.

**Negativa:**

- 1 session extra i total estimat (16,5 sessioner istället för 15,5). Mitigation: kvaliteten + Fas 6-konsumtions-effektivitet kompenserar — sannolikt 1-2 sessioner sparade i Fas 6 genom etablerade mönster.
- Risk att Fas 3.5 startar för tidigt (innan Fas 3 har primitiver att testa). Mitigation: Fas 3.5 kan börja med test-infra-setup parallellt med Fas 3, mönsterbibliotek skrivs när Fas 3 har minst 2-3 primitiver levererade. Sekvens-pragmatism, inte sekvens-fundamentalism.

**Verifiering (Fas 3.5 DoD per byggplan.md):**

- `npm run test:a11y` kör Playwright a11y-runner — 0 violations på alla 5 patterns
- CI failar vid axe-violation (verifiera med medvetet brytande commit på branch)
- Fixture-mönstret återanvänds i Fas 3:s primitiv-tester
- 5 markdown-filer i `docs/aria-patterns/` har kodexempel + test-mall + acceptance-criteria
- ACCESSIBILITY-CHECKLIST §"Test-infrastruktur" + §"Mönsterbibliotek" markeras "✅ levererad i Fas 3.5"
- "A11y-baseline godkänd"-gate dokumenterad i `docs/BUILD-LOG.md` innan Fas 6 startar

**Spårbarhet:** Detta är andra exemplet av trigger-beslut-mönstret i samma projekt (första: Sentry-DSN i Fas A Gate A1). Mönstret fungerar — beslut faller ut av leveransen själv, inte av separat beslutsmöte. Dokumenterat i `tasks/lessons.md` UNIVERSAL "Trigger-beslut med självaktiverande indata" (2026-05-04).
