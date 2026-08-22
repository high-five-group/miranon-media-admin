---
id: TASK-290
title: >-
  Fynd: Fyra sökytor, tre beteenden — eventväljaren, dörrlistan och åtgärdssidan
  är diakritik-KÄNSLIGA i en svensk webbläsare, till skillnad från personsöket
status: To Do
assignee: []
created_date: '2026-08-22 10:46'
updated_date: '2026-08-22 10:50'
labels:
  - ready-for-human
dependencies: []
ordinal: 534000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur ett rent registerpass 2026-08-22, källa: TASK-286.7-agentens rapport + disk-verifiering av denna agent + `ADR-123` § Updates 2026-08-22 (TASK-286.7:s landade PR #1762, som landade UNDER detta registerpass — se Premiss-pass-noten nedan).

**Uppdaterad efter fynd på fynd:** `ADR-123` § Updates 2026-08-22 ("Följdfynd, bokfört öppet") registrerade REDAN, oberoende av denna agent, att eventväljaren är diakritik-OKÄNSLIG i en svensk webbläsare — med samma tekniska förklaring (I18nProvider saknas, `useLocale()` faller tillbaka på `navigator.language`) som denna agents egen körningsverifiering mot `node_modules/react-aria`-källkoden nedan bekräftar oberoende. `ADR-123` skriver uttryckligen "ingen åtgärd i detta kort" och "[a]tt pinna eventväljarens lokal är en egen, oberoende ändring av en produktionsyta och tas inte här" — alltså flaggat men aldrig gjort görbart. DETTA KORT finns för att göra den flaggade åtgärden till ett beslut NÅGON kan plocka, och för att bredda frågan till alla fyra sökytorna (ADR-123:s Följdfynd nämner bara personsöket och eventväljaren — inte dörrlistan eller åtgärdssidan).

Fyra ytor i appen söker/filtrerar fritext, med tre olika beteenden:

| Yta | Beteende | Belägg |
|---|---|---|
| Personsöket | pinnad svensk kollation (`Intl.Collator('sv')`, sortering — söksemantiken avgörs separat av TASK-286.7/TASK-286.5) | `src/lib/person-sok.ts` |
| Eventväljaren | `useFilter({sensitivity:'base'})` (react-aria-components) UTAN pinnad lokal | `src/components/events/EventValjare.tsx:177` |
| Dörrlistan (incheckning) | rå `.toLowerCase().includes()` | `src/components/events/EventCheckin.tsx:757` |
| Åtgärdssidan | rå `.toLowerCase().includes()` | `src/components/events/atgarder/AtgardsSida.tsx:778-779` |

**Eventväljarens diakritik-okänslighet, dubbelt källbelagd:**

1. `ADR-123` § Updates 2026-08-22, ordagrant: "`EventValjare` monteras inte under någon `I18nProvider` (`ManuellAnmalanForm`, `EventDetail`, `AtgardsSida`) — så den faller tillbaka på `navigator.language`. I en svensk webbläsare är eventväljaren alltså INTE å/ä/ö-tolerant."
2. Denna agents oberoende körningsverifiering (node, 2026-08-22, mot faktisk react-aria-källkod i `node_modules`): `useFilter` bygger sin matchning på `useCollator`, som läser lokal via `useLocale()` (`node_modules/react-aria/dist/private/i18n/useCollator.mjs`: `new Intl.Collator(locale, options)`); `useLocale()` faller tillbaka på `navigator.language` (`useDefaultLocale.mjs`) utan `I18nProvider`-context. Grep över hela `src/` bekräftar: `I18nProvider` finns bara i `EventsCalendar.tsx`, `ManuellAnmalanForm.tsx` (kring en `DatePicker`, EFTER de två `EventValjare`-instanserna på rad 160/336 — alltså UTANFÖR den providern), `Belaggning.tsx`, `OmEventet.tsx`, `CreateEventForm.tsx` — ingen omsluter `EventValjare`. Körningsbevis: `new Intl.Collator('sv', {sensitivity:'base'}).compare('asa','åsa')` ger `-1`, inte `0` — Å/Ä/Ö är egna bokstäver i svensk kollation, inte diakritik-varianter, så `sensitivity:'base'` ger NOLL tolerans för dem (samma resultat `ADR-123` rapporterar: `compare('asa','åsa') = -1`, `compare('o','ö') = -1`).

De två raka `.toLowerCase().includes()`-ytorna (dörrlistan, åtgärdssidan) är diakritik-KÄNSLIGA av ett tredje, enklare skäl som varken `ADR-123` eller TASK-286.7 berör: `toLowerCase()` case-foldar men normaliserar aldrig diakritik.

**Frågan kortet ska ställa, inte redan besvara:** ska de tre återstående ytorna (eventväljaren, dörrlistan, åtgärdssidan) breddas till samma diakritik-toleranta beteende som personsöket (nu landat via TASK-286.7)? Det är ett produktbeslut om konsekvens i sökupplevelsen över appen, inte en självklar bugfix — dörrlistan och åtgärdssidan används under tidspress vid incheckning, där en förutsägbar (om än strikt) matchning kan vara att föredra framför överraskande breddning, och eventväljarens `useFilter`-val i sig var en medveten ADR-078-precedent innan lokal-frågan upptäcktes.

**Premiss-pass-not:** TASK-286.7 (PR #1762) låg i merge-kön vid detta registerpassets start och landade på `main` UNDER passets körning — ADR-123 § Updates-texten citerad ovan är alltså verifierad mot den LANDADE versionen, inte en gissning om vad PR:en skulle innehålla.

Referenser: `ADR-123` § Updates 2026-08-22 ("Följdfynd, bokfört öppet"), TASK-286.7 (personsökets diakritik-tolerans, landad), TASK-286.5 (Marcus HITL-beslutet bakom 286.7).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus (eller grillning) har tagit ställning: ska eventväljaren, dörrlistan och åtgärdssidan breddas till diakritik-tolerant sök, likvärdigt med personsöket efter TASK-286.7 — för alla tre, en delmängd, eller ingen?
- [ ] #2 Om JA för eventväljaren specifikt: I18nProvider locale="sv-SE" läggs kring EventValjare (eller motsvarande lokal-pinning), så useFilters Intl.Collator faktiskt körs mot svensk kollation med avsedd tolerans — inte bara mot vad webbläsaren råkar rapportera.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
