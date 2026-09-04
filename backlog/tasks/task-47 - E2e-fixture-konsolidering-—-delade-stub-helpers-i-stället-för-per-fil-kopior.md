---
id: TASK-47
title: E2e-fixture-konsolidering — delade stub-helpers i stället för per-fil-kopior
status: Done
assignee: []
created_date: '2026-07-25 06:51'
updated_date: '2026-08-26 07:05'
labels:
  - ready-for-agent
dependencies: []
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur task-18.19:s review-pilot (utanför-scope, 2026-07-25): e2e-sviterna duplicerar stub-helpers per fil (mockNotes, eventDetail-fabriker, get-registrations-stubbar m.fl.) — samma shotgun surgery-klass som get-events-stubben uppvisade när eventväljaren landade i sidhuvudet (en komponent-tillägg krävde ändring i 8 filer). tests/e2e/helpers/valjar-lista.ts (18.19) är första lyftet; resterande stub-familjer bor kvar lokalt.

Förväntat: gemensam fixture-modul under tests/e2e/helpers/ (EF-stubbar + rad-fabriker) som sviterna konsumerar med egna rader vid behov — en grammatik, inte N kopior. Även noterat: stub-sviternas default-väljarlista innehåller inte sidornas egna event-ID:n (selectedKey pekar utanför kollektionen; ofarligt i dag — triggern renderar via valtEvent — men blir städat på köpet).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Utfört (S112 fix-våg 4, bunt H) — DELVIS FIXAT, avgränsat med avsikt. Kortet saknar egna acceptanskriterier ("No acceptance criteria defined" vid läsning) — DoD#1 är därmed vakuöst uppfyllt (inget att bocka).

INVENTERING FÖRE (grep -rn "GET_EVENT_NOTES" -A6 tests/e2e/*.staging.test.ts, 2026-08-26): byte-identisk tom-stub för get-event-notes duplicerad i SEX filer, SJU anropsställen — event-detail.staging.test.ts (som en lokal funktion mockNotes(), 8 anropsställen), event-bekraftelse, event-bor-over, event-deltagare (två anropsställen), mark-paid, aktivitetslogg-skarv. Samtliga fulfillade identiskt: status 200, application/json, { notes: [] }. Detta är den konkreta shotgun surgery-instansen kortets beskrivning namnger ("mockNotes ... samma shotgun surgery-klass som get-events-stubben").

FIXAT (rotorsak): ny delad modul tests/e2e/helpers/tomma-anteckningar.ts (samma etablerade mönster som task-18.19:s helpers/valjar-lista.ts — Playwrights egen rekommendation, förstapartsdoc: "Merge Playwright Test Fixtures from Multiple Modules", mergeTests-mönstret som redan bär tests/support/test-bas.ts + tests/acceptance/acceptance-bas.ts) exporterar mockTommaAnteckningar(page). Alla sex filer migrerade: lokal const GET_EVENT_NOTES + inline page.route-block borttaget, ersatt med import + ett anrop. event-detail.staging.test.ts:s lokala mockNotes()-funktion (som bar en biome-ignore lint/suspicious/noExplicitAny-kommentar för page:any) är BORTA — den delade helpern typar page: Page korrekt, så en pre-existerande lint-eftergift försvann på köpet. Historiska kod-kommentarer som förklarade VARFÖR stubben behövs (TASK-205 nätverks-race, TASK-212 per-testfall-behov) bevarade, bara mekaniken bytt ut.

INVENTERING EFTER: 1 gemensam modul, 0 kvarvarande dubbletter (grep -rn "GET_EVENT_NOTES\b" tests/e2e/*.staging.test.ts → 0 träffar; grep -rn "mockNotes" → 0 träffar utanför en (avsiktligt uppdaterad) historisk kommentar i event-bekraftelse.staging.test.ts).

AVGRÄNSAT MED AVSIKT, INTE FIXAT (dubbelriktad över-engineering-vakt, ~.claude/CLAUDE.md § Instruktioner):

1. "eventDetail-fabriker" (kortets egen text) — funktionerna eventDetail()/registrering()/reg() i event-bor-over/event-bekraftelse/event-deltagare/event-detail/mark-paid är LIKARTAT NAMNGIVNA men INTE byte-identiska (verifierat: jämförde eventDetail() i event-bor-over vs event-bekraftelse — olika antalAnmalda/platserKvar/eventKey-defaultvärden, olika fältmängd). En generalisering till en delad rad-fabrik à la valjarRad() är görbar men är en STÖRRE, mer riskfylld refaktor (måste bära N filers olika domändata korrekt) än vad ett kort utan AC och med bunt-budget motiverar i detta pass.

2. "get-registrations-stubbar" (kortets egen text) — wiring-formen (page.route(GET_REGISTRATIONS, ...JSON.stringify({registrations: X}))) är gemensam men X (datat) varierar per fil, och några anropsställen har extra logik (URL-param-fångst i event-detail:1826, sammansatt Promise.all i persist-cache, eventId-stämpling i mark-paid). En grammatik här (analogt mockValjarLista(page, rows)) är fullt möjlig men bär samma risk/nytta-kalkyl som (1).

3. Kortets egen bifynd — default-väljarlistans event-ID pekar utanför kollektionen ("selectedKey pekar utanför kollektionen ... blir städat på köpet"). VERIFIERAT KVARSTÅENDE: fyra filer anropar mockValjarLista(page) UTAN egna rader (event-bor-over:163, event-deltagare:163, mark-paid:167, event-narvaro-register:99) och får DEFAULT_RADER (id: recVALJARDEFAULT) medan sidans EGET EVENT_ID skiljer sig (recBOROVER000001/recDELTAGARE0001/recBETALNING0001/recNARVREG0000001). Detta är EN FUNKTIONELL fixturvärde-fråga, inte en kod-duplicerings-fråga — att ändra DEFAULT_RADER eller ge var och en av de fyra filerna en egen rad är en beteendeändrande justering av vad EventValjare renderar, inte en "samma test, samma fixtur, färre platser"-konsolidering. Lämnas ORÖRD i detta pass; "ofarligt i dag" enligt kortets egen bedömning (triggern renderar via valtEvent, inte via listträffen) håller fortfarande — verifierat att inget av de fyra testfallen assertar på väljarlistans INNEHÅLL när default-läget används.

Punkt 1–3 bokförs här öppet snarare än att stängas tyst (ADR-053-andan, § Triage). Rekommenderas som egna, framtida kort om värdet bedöms motivera risken.

Branschmönster citerat (task-instruktionens krav): Playwrights egen dokumentation rekommenderar delade fixtur-moduler komponerade via mergeTests — exakt formen redan etablerad i repot (test-bas.ts + acceptance-bas.ts) och nu återanvänd rakt av för denna helper.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2000 (merge-commit f90fef04, mergad 2026-08-26T06:16:01Z; merge_group pr-2000: 2 röda körningar 05:27/05:32 (CLS-flake TASK-307 + TASK-123-uppföljningens importfel, se dess kort) följt av grönt 06:05). Inga AC på kortet — DoD #1 vakuöst uppfyllt. DoD #2-4 bockade: typecheck/biome/build/test:api gröna, 61 filer i diffen delade med syskonkortet TASK-123 (bunt H), inga orelaterade. Done-flipp S112 resume 1, 2026-08-26, post-merge f90fef04 grönt.
<!-- SECTION:FINAL_SUMMARY:END -->
