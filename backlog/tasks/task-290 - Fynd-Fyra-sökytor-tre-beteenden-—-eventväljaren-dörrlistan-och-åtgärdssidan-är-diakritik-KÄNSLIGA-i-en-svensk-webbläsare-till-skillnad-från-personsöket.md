---
id: TASK-290
title: >-
  Fynd: Fyra sökytor, tre beteenden — eventväljaren, dörrlistan och åtgärdssidan
  är diakritik-KÄNSLIGA i en svensk webbläsare, till skillnad från personsöket
status: To Do
assignee: []
created_date: '2026-08-22 10:46'
updated_date: '2026-08-22 10:47'
labels:
  - ready-for-human
dependencies: []
ordinal: 534000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur ett rent registerpass 2026-08-22, källa: TASK-286.7-agentens rapport + disk-verifiering av denna agent.

Fyra ytor i appen söker/filtrerar fritext, med tre olika beteenden:

| Yta | Beteende | Belägg |
|---|---|---|
| Personsöket | pinnad svensk kollation (`Intl.Collator('sv')`, sortering — söksemantiken avgörs separat av TASK-286.7/TASK-286.5) | `src/lib/person-sok.ts` |
| Eventväljaren | `useFilter({sensitivity:'base'})` (react-aria-components) UTAN pinnad lokal | `src/components/events/EventValjare.tsx:177` |
| Dörrlistan (incheckning) | rå `.toLowerCase().includes()` | `src/components/events/EventCheckin.tsx:757` |
| Åtgärdssidan | rå `.toLowerCase().includes()` | `src/components/events/atgarder/AtgardsSida.tsx:778-779` |

**Kärnfyndet, verifierat mot react-aria-components källkod (node_modules, 2026-08-22):** `useFilter` bygger sin matchning på `useCollator`, som läser lokal via `useLocale()` (`node_modules/react-aria/dist/private/i18n/useCollator.mjs`: `new Intl.Collator(locale, options)`). `useLocale()` faller tillbaka på `navigator.language` (`useDefaultLocale.mjs`) om ingen `I18nProvider`-context finns ovanför i trädet. `EventValjare.tsx` monteras INTE under någon `I18nProvider` — grep över hela `src/` visar `I18nProvider` bara i `EventsCalendar.tsx`, `ManuellAnmalanForm.tsx` (kring en `DatePicker`, EFTER de två `EventValjare`-instanserna på rad 160/336 — alltså UTANFÖR den providern), `Belaggning.tsx`, `OmEventet.tsx`, `CreateEventForm.tsx` — ingen av dem omsluter `EventValjare`.

Konsekvens: i en webbläsare med svensk locale (`sv`/`sv-SE`) matchar eventväljarens `useFilter` med SVENSK kollation. Verifierat körningsmässigt (node, 2026-08-22): `new Intl.Collator('sv', {sensitivity:'base'}).compare('asa','åsa')` ger `-1`, inte `0` — alltså INGEN träff. Skälet: Å/Ä/Ö är EGNA bokstäver i svensk kollationsordning, inte diakritik-varianter av A/O — `sensitivity:'base'` (som ignorerar accenttecken i språk där de ÄR varianter, t.ex. franska é/e) ger därför NOLL tolerans för svenska specialtecken. `ADR-123` § Kontext (fynd 1/3, skrivet 2026-08-21) påstår UTAN förbehåll att "eventväljarens mönster (sensitivity: 'base') är diakritik-okänsligt" — det stämmer i en engelsk/amerikansk webbläsare men INTE i en svensk, vilket är appens faktiska driftmiljö. Se syskonfyndet i denna registerpass-batch om `ADR-123`-korrigeringen.

De två raka `.toLowerCase().includes()`-ytorna (dörrlistan, åtgärdssidan) är diakritik-KÄNSLIGA av ett annat, enklare skäl: `toLowerCase()` case-foldar men normaliserar aldrig diakritik — samma mekanism `person-sok.ts`s docstring själv beskriver för EF:ens `SEARCH()`-paritet (innan TASK-286.7/286.5:s breddning).

**Frågan kortet ska ställa, inte redan besvara:** ska de tre återstående ytorna (eventväljaren, dörrlistan, åtgärdssidan) breddas till samma diakritik-toleranta beteende som personsöket, efter att TASK-286.7 (asa hittar Åsa) landar där? Det är ett produktbeslut om konsekvens i sökupplevelsen över appen, inte en självklar bugfix — dörrlistan och åtgärdssidan används under tidspress vid incheckning, där en förutsägbar (om än strikt) matchning kan vara att föredra framför överraskande breddning, och eventväljarens `useFilter`-val i sig var en medveten ADR-078-precedent innan lokal-frågan upptäcktes.

Referenser: TASK-286.7 (personsökets diakritik-tolerans), TASK-286.5 (Marcus HITL-beslutet bakom 286.7), ADR-123 § Kontext fynd 1/3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus (eller grillning) har tagit ställning: ska eventväljaren, dörrlistan och åtgärdssidan breddas till diakritik-tolerant sök, likvärdigt med personsöket efter TASK-286.7 — för alla tre, en delmängd, eller ingen?
- [ ] #2 Om JA för eventväljaren specifikt: I18nProvider locale="sv-SE" läggs kring EventValjare (eller motsvarande lokal-pinning), så useFilters Intl.Collator faktiskt körs mot svensk kollation med avsedd tolerans — inte bara mot vad webbläsaren råkar rapportera.
- [ ] #3 ADR-123 § Kontext fynd 1/3 uppdateras (om det inte redan skett i en tidigare skiva) till att inte längre påstå eventväljarens mönster som diakritik-okänsligt utan förbehåll för svensk locale.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
