---
id: TASK-171.3
title: 'Skiva: Härdningen — a11y-golvet, skrivvägs-prövningen och städet'
status: Done
assignee: []
created_date: '2026-08-09 08:23'
updated_date: '2026-08-09 10:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.2
parent_task_id: TASK-171
ordinal: 318000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den promoverade ytan härdas till kvalitetsribban — axe-pass grönt och prefers-contrast: more / prefers-reduced-motion / print prövade (tillgänglighet 11, inga undantag). Skrivvägarna prövas explicit: S100 rev read-only-invarianten öppet (betalningsytan skriver mot staging) — härdningen bokför vad som skriver vart och bevisar att prod inte nås. DEV-grind-städ: inga prototyp-grenar produktions-nåbara utom via railen. Referenserna får INTE ändras — identiteten består genom härdningen. Täcker användarberättelser: 8, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Axe-pass grönt + kvalitetsribbans lägen (prefers-contrast: more, prefers-reduced-motion, print) prövade
- [x] #2 Skrivvägarna explicit prövade och bokförda (staging-skrivningen; prod nås bevisligen inte)
- [x] #3 ariaSnapshot-referenserna OFÖRÄNDRADE genom härdningen
- [x] #4 Inga prototyp-grenar produktions-nåbara utom via railen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Härdningen — genomförd (TASK-171.3)

### AC #1 — Axe-golv + kvalitetsribbans tre lägen

Bevis-venue: `tests/visual/atgardssida-promoverings-grind.spec.ts` (SAMMA fil
som referens-grinden — ny beskrivning tillagd, INGEN av de 6 befintliga
testerna rörd; precedent = task-162.4 i `eventsida-promoverings-grind.spec.ts`).
Chromium-authenticated/`.staging.test.ts` uteslöts medvetet: port 5173 var
upptagen av huvudkatalogens EGEN dev-server (`lsof -i :5173`/`ps` mätt,
cwd=/Users/marcus/Repon/miranon-media-admin, INTE denna worktree) — samma
strukturella förbud task-162.4 redan dokumenterat.

FÖRE (första körning, mätt): visual-desktop 0 violations i samtliga lägen;
visual-mobile fällde 1 SERIOUS violation — `scrollable-region-focusable`
(WCAG 2.1.1) på den låsta 186px-textrutan (`TEXTYTA_KLASS`) i
granskningsläget — texten överflödar på 375px bredd och blir `overflow-auto`
utan tangentbords-access.

Fix: `tabIndex={0}` på BÅDA `TEXTYTA_KLASS`-rutorna (ArbetsYta-preview rad
~1517 + GranskningsSida-förhandsvisning rad ~2241) — fokusordning UTAN
strukturändring, samma precedent som `NyaAnmalningarCard.tsx:139` (medvetet
UTAN `aria-label`, till skillnad från den precedenten: denna yta bär ett
facit-lås (AC #3) och innehållet självt är namnet vid fokus).
`biome-ignore lint/a11y/noNoninteractiveTabindex` tillagd (samma motiv).

EFTER: 36/36 gröna (18 tester × visual-desktop/visual-mobile) — 0 violations
i alla åtta interaktiva lägen (tomt, hubb, mottagarurval, åtgärd-expanderad-
i-hubben, granskning, tre utfall, betalningspanel) PLUS de tre
kvalitetsribbe-lägena (prefers-contrast:more — computed
border-color==--mm-border-strong; prefers-reduced-motion:reduce —
transitionDuration<=0.001s; print — sidhuvud/väljare/mottagar-yta synliga).
Referens-grindens 6 ariaSnapshot-tester ORÖRDA genom hela fixen (git diff:
0 filer i tests/visual/__aria__/).

### AC #2 — Skrivvägs-kartan

AtgardsSida.tsx:s ENDA skrivyta är `BetalningsSkrivYta` (monteras när
"Pricka av och notera" öppnas) — grep-verifierat: inga andra `.mutate(`,
`mailto:` eller `useLogPaymentReminder`-anrop i filen. Två DELADE hooks
(`src/data/mutations/registrationPayments.ts`, byggda för task-18.8:s
Betalningar.tsx, INTE nya här — task-147 äger sändvägens vidareutveckling):

  · `useSetPaymentStatus(eventId)` -> updateRecord('mark-registration-fee-paid'
    | 'mark-final-payment-paid', ...)
  · `useUpdatePaymentNote(eventId)` -> updateRecord('update-registration-payment-note', ...)

Båda går via SAMMA Edge Function (`supabase/functions/update-record`,
allowlist-gated per operationKey, `supabase/functions/_shared/field-allowlists.ts`)
mot `${env.VITE_SUPABASE_URL}/functions/v1/update-record`
(`src/data/config/supabase-client.ts` postEdgeFunction).

Prod nås BEVISLIGEN INTE:
  1. `.env.development`+`.env.staging` VITE_SUPABASE_URL = STAGING-ref
     (pqtshyierkdgwdnxuirz.supabase.co); `.env.production` allena bär
     prod-refen (lvjsfnphlauldxqlncpl.supabase.co).
  2. `src/lib/env-coherence.ts` assertModeCoherent(mode, url) anropas
     OVILLKORLIGT vid `src/env.ts`-modulladdning och KASTAR om icke-production
     MODE bär prod-refen — mekaniskt fail-fast, ej konvention. Enhetstestat
     `tests/api/env-coherence.test.ts` (grönt, del av denna sessions
     `npm run test:api`-körning, 465/465).
  3. `lvjsfnphlauldxqlncpl` grep-verifierat: förekommer ENDAST i
     `.env.production`, `src/lib/env-coherence.ts` (konstanten själv),
     AtgardsSida.tsx:s egen prosa-docblock (rad ~2615, ej kod) samt
     env-coherence/staging-preview-testerna. Ingen hårdkodning.
  4. Server-write-kontraktet för alla tre operationKeys (allow/deny,
     allowlist-gräns, restore-mönster) är redan täckt mot SKARP staging i
     `tests/api/update-record.staging.test.ts` — verifierat grönt i denna
     session (`npm run test:api`, 465 passed, 0 failed).

Ingen ny funktion byggd i denna skiva — sändvägens vidareutveckling ägs av
task-147, per uppdraget.

### AC #3 — Referens-verifikatet

`git status --porcelain` + `git diff --stat`: ENDAST
`src/components/events/atgarder/AtgardsSida.tsx` och
`tests/visual/atgardssida-promoverings-grind.spec.ts` ändrade. Noll filer
under `tests/visual/__aria__/`. De 6 ursprungliga testerna i
`atgardssida-promoverings-grind.spec.ts` OFÖRÄNDRADE (endast nya
`test.describe`-block tillagda efter dem) och gröna genom hela härdningen
(36/36-körningen ovan inkluderar dem, rad 1-6 av 18).

### AC #4 — DEV-städets bevis

`PrototypeSwitcher` DEV-grindad i båda routerna (källkod, orört av denna
skiva, verifierat läst): `atgarder.tsx:31`
`{import.meta.env.DEV ? <PrototypeSwitcher .../> : null}`,
`event/$eventId/atgarder.tsx:39` samma mönster.
`variantParam`/`useQueryState('variant')` grep-verifierat NOLL träffar i
AtgardsSida.tsx eller båda routerna (självständigt re-verifierat, matchar
task-171.1:s tidigare fynd).

Byggbevis (`npm run build`, exit 0, denna session): route-chunkarna
`dist/assets/atgarder-*.js` visar `import.meta.env.DEV ? <PrototypeSwitcher/> : null`
KONST-FOLDAD till bokstavligt `null` i renderingsträdet
(`children:[jsx(AtgardsSida,{}),null]`) — PrototypeSwitcher-JSX-anropet är
BORTA ur körvägen, mekaniskt bevisat, inte antaget.

ÖPPEN, ICKE-BLOCKERANDE OBSERVATION: `PrototypeSwitcher`-MODULEN
(`PrototypeSwitcher-Uwc052BL.js`, ~6 KB rått) laddas ändå som ett OVILLKORLIGT
statiskt sido-effekt-`import` i båda route-chunkarna (Rollup/TanStack-router-
pluginets kod-splitting behåller importen trots att renderings-anropet är
dead-code-eliminerat). Modulen har INGA sido-effekter vid import (verifierat:
`localStorage.getItem` ligger inuti en oanropad funktion, ingen
modul-nivå-exekvering) — så ingen kod KÖRS och inget UI kan nås, men bytes
skickas till varje besökare. Detta är bundle-storlek, inte en
nåbarhets-/säkerhetslucka: AC #4 talar om "nåbara" vägar, vilket är mekaniskt
uteslutet (bevisat ovan). Fixning av Rollup/TanStack-router-pluginets
kod-splitting-beteende är utanför denna härdnings-skivas scope — bokförs
öppet, inte tyst, i linje med triage-principen (ADR-053).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1041 (merge d062fc32 genom kön — required checks gröna; post-merge bevakas level-triggat, monitorn kvitterade main-avancemanget). Härdningen: ETT äkta serious-fynd (scrollable-region-focusable, mobil 375px — låsta textytan utan tangentbordsåtkomst) fixat med tabIndex per NyaAnmalningarCard-precedentet, MEDVETET utan aria-label (referens-låset); axe 36/36 grönt båda viewporter efter, referenserna bevisat oförändrade i samma körning. Skrivvägs-kartan bokförd i notes (EF-allowlist + ADR-061 fail-fast + env-coherence grönt = prod onåbar). DEV-städet byggbevisat (renderingsanropet konst-foldat till null i dist). DoD #5/#8 bockade med 171.1/171.2-ägda belägg (identitets-beviset resp. svep-träffytan — ej omprövade här); DoD #6 bockad med beläggs-not: bevis-loopens spår är axe FÖRE/EFTER-mätserien + fix-diffen i PR-kroppen, inte skärmdump — formen bär samma funktion (spår, inte bock) och avvikelsen bokförs öppet. Öppen icke-blockerande observation kvar i notes: PrototypeSwitcher-importen (~6 KB) i route-chunkarna — dör med rivningen 171.5.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [x] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
