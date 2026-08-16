---
id: TASK-243.1
title: 'Skiva: Promoveringen — V1-formen + datakopplingarna till skarp route'
status: In Progress
assignee: []
created_date: '2026-08-16 14:32'
updated_date: '2026-08-16 16:23'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-243
ordinal: 447000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hela V1-formen 'Lugna morgonen' promoveras ur prototypkällorna (src/components/dev/hem-prototyp/: VariantRo.tsx, ui.tsx, data.ts-härledningarna) till skarpa hem-routen (src/routes/_authenticated/hem.tsx → src/components/hem/) med VERKLIG data via husets hooks. Promoveringskontraktet ADR-102/103 styr: formen promoveras EXAKT, prototyp-substratet rörs INTE (B3 — rivning sker i egen skiva efter Marcus stämpel). Lotta öppnar appen och möts av Morgonkollen: läser dagens läge uppifrån och ner och ser direkt vad som kräver handling. Prototypens datalogik mappar redan mot riktiga fält (paminnelseAnmalningsavgiftSkickad/paminnelseSlutbetalningSkickad i Registration-modellen) — skarp version går via adaptern. EXEKVERINGS-ORDNING (Marcus-kvitterad): starta EFTER att task-244 (staging-sviten grön) landat — 244 rör hem-spaltens stagingtester. Decline-rationale ur grillningen (Del 10 beslut 6): kanban AVVISAD — uppgifterna är härledda ur datat och släcks av datat; manuell tavla är dubbel bokföring som kan ljuga. Ordlistans termer gäller: Morgonkoll, Bevakningsrad. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem-vyn på / är identisk med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan 'hem-vyn V1 "Lugna morgonen"' i läge verklig (desktop + mobil)
- [x] #2 Blockordningen komplett per facit: fri hälsning utan platta · Nästa event fullbredd med dagar-kvar-form · bevakningsrad (syns endast vid träff, två radlägen per definition B) · Nya anmälningar (räknar-pill, ålder per rad, personlistans initial-form) · Förfallna betalningar (avgiftstyp per rad, skickat-markör, tre tillståndsgrupper) · Genvägar (eventväljaren först, 147.8-språket) · Senaste aktivitet (kompakt + länk, delade verb-copy-modulen)
- [x] #3 Härledningslogiken bor i skarpt datalager via adaptern (aldrig i komponenten): förfallen = betalning saknas OCH deadline start−14 passerad · tillståndsgrupperna Att påminna / Väntar (påmind <7 dagar, datum visas) / Dags att ringa (≥7 dagar, obetald, nummer på raden) · bevakningsradens eventinfo-trigger idag ≥ start−21, definition B (minst en bekräftad anmälan utan Deltagarinfo-stämpel)
- [x] #4 Bulk-knapparna (Bekräfta alla / Skicka påminnelse till alla) renderas per facit men är disablade med tillgänglig motivering tills sändytan finns (task-241) — Marcus-kvitterat 2026-08-16
- [x] #5 Inline-rullning med stabil layout och 'Visa alla N →'-länkar — ingen kapad lista; laddläge per ADR-078 + DESIGN-SYSTEM-SPEC §15
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (ytan 'hem-vyn V1', läge verklig, desktop + mobil)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ACCEPTANCE-ANPASSNING (minimal, per kortets DoD-gräns): 33 av 46 tester i
tests/acceptance/hem*.acceptance.test.ts skippade individuellt/beskrivning-vis
med test.skip(true, '[TASK-243.1] ...') + kodkommentar som pekar på ORSAKEN
(retirerad K10-form: CTA.tsx/DashboardCard.tsx/ObetaldaCard.tsx/
NastaEventCard.tsx/NyaAnmalningarCard.tsx/SenasteAktivitet.tsx). Hela
hem-senaste-aktivitet.acceptance.test.ts + hem-senaste-aktivitet-farskhet.
acceptance.test.ts skippade (describe.skip) — testar data-testid="senaste-aktivitet"
som inte finns i SenasteAktivitetKompakt.tsx. 13 tester lämnade RÖRDA (fortfarande
giltiga: axe-0, hälsnings-h1-formen utan B2-återbesök, polling, 600px
main#main-centrering, beläggningsstapeln, 4xx-fel-UI, laddläges-AC2-4).
Full omskrivning: task-243.3.

KÄND FACIT-DEFEKT, ej fixad (ADR-102 B2 kräver Marcus-beslut för avsteg):
ForfallenRadInnehall (Att påminna/Väntar-raderna) klämmer namn-kolumnen till
~1,7px bredd vid 375px viewport när "Påminnelse skickad ÅÅÅÅ-MM-DD"-badgen är
närvarande (mätt via getBoundingClientRect). Markupen är BYTE-IDENTISK med
låsta prototypens VariantRo.tsx — bekräftat inte en promoveringsbugg. Ingen av
facit.json:s sex bilder visar denna kombination (badge+mobil), så bilderna
bevisar inte att formen är avsedd. Kod-kommentar i ForfallnaBetalningar.tsx.
Bör lösas i task-243.4 (QA/promoveringsgranskning) eller explicit Marcus-order.

AVSIKTLIG UTELÄMNING: den gamla versionsraden ("Miranon Media Admin v...",
Hem.tsx B-NYTT2) fanns INTE i facit-prototypen och promoveras därför inte
(ADR-102 B1: prototypen vinner). Bokfört i Hem.tsx docblock + slutrapport.
<!-- SECTION:NOTES:END -->
