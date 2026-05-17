
# ADR-027: KVALITETSDEFINITIONER-11.md stack-skifte (Vue → React)

- Status: Accepted
- Datum: 2026-05-11
- Fas: 2 (K0åf — "Direkt efter Fas 2"-fynd 3)

## Kontext

`docs/specs/KVALITETSDEFINITIONER-11.md` (skapad 2026-04-03 i Vue-projektets fas) är styrande kvalitetsribba för 11/11/11-anchorn. Filen kodifierar tekniska och återanvändbarhetsmönster från fem komponentbibliotek (Radix UI, Headless UI, Ark UI, Melt UI, FK Designsystem) — men gör det genom Vue-specifika konstruktioner: composables (`useDismissable`/`useFocusScope`/`useCollection`/`usePresence`), `v-model:value`-mönstret, scoped slots (`<template #item="{ active }">`), `pushFocus`/`popFocus`-stacken från FKUI, och `<MmDialog>`-Vue-template-exempel.

Codex' Fas-2-readiness-analys 2026-05-07 (`docs/analysis/Codex-project-analysis-2026-05-07.md` Blocker 3) identifierade detta som "ett nytt styrdokumentationsgap" — ACCESSIBILITY-CHECKLIST.md skrevs om till React Aria + WCAG 2.2 AA i P2 (2026-05-04), men KVALITETSDEFINITIONER-11.md missades. Pre-Fas-2-verifieringen 2026-05-06 klassade fyndet som "Direkt efter Fas 2"-fynd 3 (kategori 2).

K0åf övervägde två strategier:

- **Alt A — Komplett omskrivning in-place** (samma mönster som ACCESSIBILITY-CHECKLIST.md fick i P2). Avvisat: ACCESSIBILITY-CHECKLIST.md hade **principer + checklista**-struktur där WCAG-kärnan kunde bevaras stack-agnostiskt och bara checklist-punkter byttes. KVALITETSDEFINITIONER-11.md har **arkitektur-mönster**-struktur där hela diskursen (composables, slots, v-model) är Vue-formulerad. Composables blir hooks med olika namn och API, scoped slots har ingen 1:1-mappning i React, `pushFocus`-stacken ersätts av `<FocusScope contain>`-komponent i React Aria. ~80% av filen skulle skrivas om — diff:en blir 90% delete + 90% insert, git-historiken blir oläsbar, och risk att en omskrivning glömmer en träff och lämnar drift.

- **Alt B — Arkivera Vue-versionen + skapa ny React-version** (samma mönster som ADR-012 conversion-plan → byggplan, ADR-021 BYGGPLAN-LÄTTLÄST v1→v2, ADR-025 v2→v3). Vald.

## Beslut

1. **`docs/specs/KVALITETSDEFINITIONER-11.md` arkiveras** till `docs/archive/KVALITETSDEFINITIONER-11-vue-2026-04-03.md` med ARKIVERAD-header som pekar mot ny React-version. Arkivnamnet inkluderar `vue` + skapelsedatum (2026-04-03) per ADR-021-mönstret. `git mv` används så historik bevaras.

2. **Ny styrande spec skapas:** `docs/specs/KVALITETSDEFINITIONER-11-REACT.md`. Filen får skelett-struktur med samma fem-sektioners-uppdelning (Teknisk kvalitet / Återanvändbarhet / Komplett checklista / Källor / Vad vi INTE tar med) men innehåll är **explicit TBD** med pekare till Vue-arkivet som historisk referens.

3. **Innehållsfyllning defereras till Fas 3 K0** (när första React-komponenten byggs). Då finns konkreta React Aria-mönster + shadcn-stil-konventioner + faktiska use cases att kodifiera kvalitetsribban mot. Förtida ifyllning utan komponentbygge är spekulation.

4. **Path-refs i andra dokument uppdateras**: filer som hänvisar till KVALITETSDEFINITIONER-11.md som *styrande* spec uppdateras till `KVALITETSDEFINITIONER-11-REACT.md`. Refs i frysta zoner (docs/archive/, tasks/sessions/archive/) bevaras som historiska per ADR-022 kategori 2.

## Alternativ som övervägdes

1. **Alt A — Komplett omskrivning in-place.** Avvisat per Kontext-sektionen ovan (strukturell Vue-rot, inte ytlig).

2. **Behåll Vue-versionen aktiv parallellt med ny React-version.** Avvisat: drift mellan dokument är värsta scenariot (jfr ADR-025 Alt 3). Klar arkiv-status + en aktiv styrande version är ADR-021/025-etablerat mönster.

3. **Radera Vue-versionen utan arkivering.** Avvisat: informationsförlust. Vue-versionen kodifierar 12 mönster från 5 bibliotek (Radix, Headless UI, Ark, Melt, FK) — många av dessa mönster har React-motsvarigheter och Vue-formuleringen är konkret referens för HUR principerna kan översättas när Fas 3+ React-komponenter byggs.

4. **Skriv React-versionen fullt klar i K0åf** istället för skelett. Avvisat: K0åf-estimat 30 min (Codex' kategori 2). Full React-spec kräver konkreta React Aria-mönster + shadcn-stil-konventioner + use cases som inte finns förrän Fas 3 K0 + komponent-arbete. Förtida ifyllning är spekulation. Skelett + TBD-not + Fas 3 K0-trigger följer "preliminärt — låses vid aktualisering"-mönstret som P3a etablerade för Fas 8/B/E.

## Konsekvenser

**Positivt:**

- 11/11/11-anchorn återställs som React-relevant styrande dokument (inte stale Vue-formulering).
- Vue-eran bevaras som arkivvärd referens — när Fas 3+ React-komponenter byggs kan Vue-versionen användas som konkret jämförelse-källa (HUR motsvarande mönster löstes i Vue-projektet → direkt input till React-versionen).
- Arkivmönster konsistent med ADR-012/021/025 — git-historik tydlig, läsbarhet hög.
- Skelett + TBD-not signalerar tydligt att spec:en är under utveckling och förväntad att uppdateras vid Fas 3 K0.

**Negativt:**

- En ny ADR-rad i katalogen (ADR-027 → totalt 26 ADR:er).
- Path-refs i andra dokument måste uppdateras (~2-5 refs förväntat — verifieras av Code i RAPPORTERA Block 2).
- Styrnings-luckan vid sessioner mellan K0åf och Fas 3 K0 — om någon komponentdiskussion uppstår före Fas 3 saknas konkret kvalitetsribba. Lindras av att ACCESSIBILITY-CHECKLIST.md + ARIA-UPGRADE.md + DESIGN-SYSTEM-SPEC.md fortfarande är React-aktuella och täcker komponenters a11y + design.

## Konvention för framtida stack-skiften

När en styrande spec befinns vara strukturellt rotad i föregående stack (Vue→React, eller framtida React→nästa-stack):

1. **Klassificera först:** Är specen *principer + stack-checklista* eller *arkitektur-mönster*? Princip-baserad → omskrivning in-place (ADR-021-mönster på ACCESSIBILITY-CHECKLIST). Mönster-baserad → arkivera + ny version (denna ADR).
2. **Arkivnamn:** `<originalnamn>-<gammal-stack>-<skapelsedatum>.md` i `docs/archive/`.
3. **Ny versions placering:** Samma katalog som original (`docs/specs/`) med stack-suffix om relevant (`-REACT.md`).
4. **Innehållsfyllning:** Om stack-konkretion saknas (ingen komponent byggd än), skapa skelett + TBD-not + trigger-pekare till nästa relevanta fas. Förtida ifyllning är spekulation.
5. **Path-refs:** Uppdatera aktiva refs (CLAUDE.md, byggplan.md, README) till ny version. Bevara historiska refs (sessions-arkiv, gamla ADR:er) som de är per ADR-022 kategori 2.

## Spårbarhet

- **Föregångare-mönster:** ADR-012 (conversion-plan→byggplan), ADR-021 (BYGGPLAN-LÄTTLÄST v1→v2 + docs/-omstrukturering), ADR-025 (BYGGPLAN-LÄTTLÄST v2→v3).
- **Trigger:** Codex' Fas-2-readiness-analys 2026-05-07 (Blocker 3) + Pre-Fas-2-verifiering 2026-05-06 ("Direkt efter Fas 2"-fynd 3) + sessionsdok 2026-05-11 Del 3.6 K0åf-noten.
- **Implementation:** Denna commit (K0åf, 2026-05-11) — `git mv` Vue-versionen till archive + skapar React-skelett + uppdaterar path-refs.
- **Innehållsfyllning:** Defereras till Fas 3 K0 (första React-komponent-bygget).
