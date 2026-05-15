---
owner: marcus803
updated: 2026-05-15
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# Kvalitetsdefinitioner — 11/10 (React)

> **Levande dokument** — skapad 2026-05-11 (K0åf) | **Status just nu:** SKELETT — innehållsfyllning defereras till Fas 3 K0 när första React-komponenten byggs | **Föregångare:** [Vue-versionen 2026-04-03](../archive/KVALITETSDEFINITIONER-11-vue-2026-04-03.md) (arkiverad per ADR-027)

*Baserad på källkodsanalys av Radix UI, Headless UI, Ark UI, Melt UI och FK Designsystem (Vue-eran) + React Aria + shadcn/ui (kommer från Fas 3+).*

---

## Status

Denna spec ersätter `KVALITETSDEFINITIONER-11.md` (Vue-eran) som styrande kvalitetsribba för 11/11/11-anchorn i React-projektet. Vue-versionen är arkiverad och bevarad som referens.

**Innehållsfyllning per sektion sker progressivt:**

- **Fas 3 K0** — Sektion 1 Teknisk kvalitet + Sektion 2 Återanvändbarhet (när första React-komponent bygggs, etableras hooks-namn och primitiva mönster mot React Aria).
- **Fas 3.5** — Sektion 3 Komplett 11/10-checklista (när a11y-baseline-mönster konkretiseras per ADR-020).
- **Fas 6** — Sektion 4 Källor + Sektion 5 Vad vi INTE tar med (när stack-bibliotek-valen är låsta).

Tills dess: använd Vue-arkivet + ACCESSIBILITY-CHECKLIST.md + ARIA-UPGRADE.md + DESIGN-SYSTEM-SPEC.md som triangulerande referenser för kvalitetsbeslut.

---

## Sammanfattning

| Kategori | 10/10 | 11/10 |
|----------|-------|-------|
| **Tillgänglighet** | WCAG 2.2 AA komplett | + prefers-contrast, prefers-reduced-motion, print, type-ahead, aria-live announcer |
| **Teknisk kvalitet** | Ren kod, typat, inga !important, BEM/Tailwind, tokens | + beteendeprimitiver, fokus-stack, data-attribut för state, defensiva gränser |
| **Återanvändbarhet** | Props typade, CSS custom properties, dokumentation | + controlled/uncontrolled, render delegation, state interception, i18n-ready |

(Tabellens innehåll är portat verbatim från Vue-eran — principerna är stack-agnostiska. Den stack-specifika översättningen sker per sektion nedan.)

---

## 1. Teknisk kvalitet — 11/10

**TBD** — fylls i Fas 3 K0. Mappning från Vue-eran:

| Vue-mönster (arkiv) | React-motsvarighet (TBD) |
|---|---|
| Composables (useDismissable, useFocusScope, useCollection, usePresence) | React Aria hooks + framer-motion AnimatePresence — exakt namn etableras i Fas 3 K0 |
| Fokusstack (pushFocus/popFocus från FKUI) | React Aria `<FocusScope contain restoreFocus>` — stackhantering inbyggd |
| data-attribut för state | Bevaras direkt — stack-agnostiskt mönster |
| alertScreenReader() | `@react-aria/live-announcer` `announce()` — direkt motsvarighet |
| Defensiva gränser (props-validering) | Zod runtime + TypeScript compile-time (jfr ADR-026 datagräns-validering) |

---

## 2. Återanvändbarhet — 11/10

**TBD** — fylls i Fas 3 K0. Mappning från Vue-eran:

| Vue-mönster (arkiv) | React-motsvarighet (TBD) |
|---|---|
| Controlled/uncontrolled (v-model dual-mode) | `value`/`defaultValue` + `onChange`-mönstret (Radix-stil) — etableras i Fas 3 K0 |
| Scoped slots (`<template #item="{ active }">`) | Render props eller `<Slot>` (Radix-stil) eller `children as function` — designval per komponent i Fas 3 K0 |
| State interception (onOpenChange curr/next) | Bevaras konceptuellt — implementation via callback-props i React |
| i18n-ready (svenska defaults via props) | Bevaras direkt — stack-agnostiskt mönster |
| Anatomy-dokumentation | Bevaras direkt — README-konvention per komponent |
| Shared composables-tabellen | Översätts till `src/hooks/`-tabell i Fas 3 K0 |

---

## 3. Komplett 11/10-checklista

**TBD** — fylls i Fas 3.5 (a11y-baseline-mönster per ADR-020).

---

## 4. Källor

**TBD** — fylls i Fas 6 (när stack-bibliotek-val är låsta). Förväntade källor: React Aria (huvudreferens), shadcn/ui, Radix UI primitives (där relevant), framer-motion. Vue-erans källor (Headless UI, Melt UI Svelte-version) refereras som mönsterhistoria.

---

## 5. Vad vi INTE tar med (och varför)

**TBD** — fylls i Fas 6 (när stack-bibliotek-val är låsta).

---

## Versionshistorik

| Version | Datum | Förändring |
|---|---|---|
| 1.0 (skelett) | 2026-05-11 | Initial — skapad i K0åf per ADR-027 stack-skifte. Vue-versionen (2026-04-03) arkiverad till `docs/archive/KVALITETSDEFINITIONER-11-vue-2026-04-03.md`. |

---

*Detta dokument är levande. Uppdateras vid Fas 3 K0, Fas 3.5 och Fas 6 enligt status-sektionen.*
