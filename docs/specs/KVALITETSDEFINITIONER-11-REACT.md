---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->

# Kvalitetsdefinitioner — 11/10 (React)

> **Levande dokument** — skapad 2026-05-11 (K0åf) | **Status just nu:** §1 Teknisk kvalitet + §2 Återanvändbarhet ifyllda (Session 14 K3); §3–§5 deferrade (se ## Status nedan) | **Föregångare:** [Vue-versionen 2026-04-03](../archive/KVALITETSDEFINITIONER-11-vue-2026-04-03.md) (arkiverad per ADR-027)
>
> **Äger:** §1 Teknisk kvalitet + §2 Återanvändbarhet — de ifyllda delarna
> av 11/11/11-ribban. **Kartlägger:** Vue-arkivet, ACCESSIBILITY-CHECKLIST.md,
> ARIA-UPGRADE.md, DESIGN-SYSTEM-SPEC.md (triangulerande referenser för
> §3–§5, ännu ofyllda). **Vid konflikt vinner — ÖPPEN INVERTERING:** idag är
> `CLAUDE.md` § Kvalitetsribba fortsatt bärare av HELA ribban tills §3–§5 här
> fylls (`ADR-100` § Updates 2026-08-08, öppen deferral, `CLAUDE.md`:s egen
> rad citerar denna deferral) — denna fil vinner bara för §1–§2:s
> detaljnivå. Denna deklaration ändrar inte den deferralen.

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

Etablerad: Session 14 K3 (Fas 3), per ADR-044 (react-aria-components som bas).
Mappning från Vue-eran:

| Vue-mönster (arkiv) | React-motsvarighet (etablerad) |
|---|---|
| Composables (useDismissable, useFocusScope, useCollection, usePresence) | react-aria-components inbyggt: Modal/Dialog/Popover bär dismiss, fokushantering och collections internt. Animation vid mount/unmount: React Arias `data-entering`/`data-exiting`-attribut + CSS-transitions — inga animationsbibliotek (framer-motion EJ installerat, EJ infört; omprövas endast vid behov Fas 3.5+ med eget beslut). Hook-nedstigning per komponent är reservutgång (ADR-044), inte default. |
| Fokusstack (pushFocus/popFocus från FKUI) | Inbyggt i `<Modal>`/`<Dialog>`: fokus-trap, inert bakgrund och fokus-retur till trigger sköts av react-aria-components. Ingen egen stackhantering. |
| data-attribut för state | Bevaras direkt och förstärks: all state-styling sker via React Arias `data-hovered`/`data-pressed`/`data-focus-visible`/`data-selected`/`data-invalid` — aldrig `:hover`/`:active` (K1-etablerat Button-mönster). |
| alertScreenReader() | `announce()` ur `@react-aria/live-announcer` för imperativa annonseringar; deklarativa fall via `aria-live`-regioner (demo-routens statusrad är referens). Paketet verifieras/installeras först när första konsumenten byggs (Fas 5/6) — ingen förtida dependency. |
| Defensiva gränser (props-validering) | TypeScript strikt compile-time + Zod vid datagränser (ADR-026). Primitiver är props-drivna utan runtime-validering — de tar typade props, inte rå extern data. |

---

## 2. Återanvändbarhet — 11/10

Etablerad: Session 14 K3 (Fas 3). Mappning från Vue-eran:

| Vue-mönster (arkiv) | React-motsvarighet (etablerad) |
|---|---|
| Controlled/uncontrolled (v-model dual-mode) | `value`/`defaultValue` + `onChange`-paret — inbyggt i react-aria-components för alla fältkomponenter; egna primitiver exponerar samma dubbla läge rakt igenom. |
| Scoped slots (`<template #item="{ active }">`) | Render props per react-aria-components-konvention: `children`/`className` som funktion med render-states (t.ex. `({ isSelected }) => ...`). Inget Radix-`<Slot>` — en konvention, bibliotekets egen. |
| State interception (onOpenChange curr/next) | Callback-props: `onOpenChange`, `onSelectionChange`, `onChange` — interception sker i konsumentens callback före egen state-uppdatering. |
| i18n-ready (svenska defaults via props) | Bevaras direkt: svenska default-strängar som props med override-möjlighet (jfr Input/Select label-krav). |
| Anatomy-dokumentation | JSDoc med usage-exempel per primitiv (K1-etablerad konvention) + /dev/primitives-routen som levande anatomi-referens. Ingen README per komponent — JSDoc är kanonisk plats. |
| Shared composables-tabellen | `src/hooks/`-tabell etableras VID FÖRSTA BEHOV (Fas 5/6) — Fas 3-primitiverna har hittills inte krävt någon delad hook; tom katalog skapas inte i förväg. |

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
| 1.1 | 2026-06-11 | §1 Teknisk kvalitet + §2 Återanvändbarhet fyllda — React-mappning etablerad mot react-aria-components-bas per ADR-044 (Session 14 K3). §3–§5 kvarstår TBD (Fas 3.5 resp. Fas 6 per status-sektionen). |

---

*Detta dokument är levande. Uppdateras vid Fas 3 K0, Fas 3.5 och Fas 6 enligt status-sektionen.*
