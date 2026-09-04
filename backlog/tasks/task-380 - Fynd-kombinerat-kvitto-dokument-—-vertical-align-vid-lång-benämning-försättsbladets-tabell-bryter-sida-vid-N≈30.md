---
id: TASK-380
title: >-
  Fynd: kombinerat kvitto-dokument — vertical-align vid lång benämning +
  försättsbladets tabell bryter sida vid N≈30
status: To Do
assignee: []
created_date: '2026-09-03 11:50'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md
  - backlog/tasks/task-370.3
ordinal: 681000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom

Mätpunkt 3 ur research-passet (`docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md` § Vad som måste mätas) och en N≈30-mätning (TASK-370.3) avtäckte TVÅ separata layoutfynd i det kombinerade "Förhandsgranska alla N"-dokumentet. Ingen av mallens/kompositionens KOD ändrades för att bevisa dem — mätt mot verklig DocRaptor-rendering (test-nyckel), aldrig gissat.

**Fynd 1 — vertical-align-defekt i `kvitto.css` när `benämning` wrapar till flera rader.** `docs/mallar/bilagor/kvitto.css` sätter ALDRIG `vertical-align` på `.kvitto-post td`, så Prince (som webbläsare) faller tillbaka på HTML-tabellcellers UA-standard `vertical-align: middle`. Så länge `data.benamning` (Lottas fria bokföringstext + typ/datumspann, `kvittoBenamning()` i `receipt-content.ts`) ryms på EN rad märks det inte. Med en lång `bokforingstext` (400+ tecken, testat med en realistisk mening) wrapar `Benämning`-cellen till 5 rader, och `Antal`/`Enhet`/`A-pris`/`Summa`-cellernas EN-radiga innehåll centreras då vertikalt mot HELA radens höjd — värdena hamnar mitt i det uppradade brödtextstycket i stället för att linjera med första raden. Mätt precist via `pdftotext -bbox`: siffran "1" (Antal) ligger på yMin=309,2/yMax=320,2pt, mitt i intervallet för ordet "material" (yMin=303,8/yMax=314,8pt, tredje textraden av fem) — alltså en läsbarhets-/layoutdefekt, INTE bokstavlig glyf-överlappning (X-koordinaterna för de två orden delar inget intervall, de sitter i olika kolumner). Repro-PDF (lokal, ej committerad): mall-fixtur med `benamning: "Utbildning 2026-07-25/26, personlig utveckling, meditation, andningsteknik, kroppsmedvetenhet, gruppdynamik, reflektion och integrationsövningar under hela helgen inklusive förberedande material som skickades ut i förväg samt en uppföljande individuell avstämning två veckor efter kursens avslut för den som önskade det, plus tillgång till inspelat material i efterhand"`, kombinerad med försättsblad + ett normalt kvitto (3 sidor totalt), renderad mot DocRaptors testnyckel.

**Fynd 2 — försättsbladets EGEN tabell kan bryta till en andra fysisk sida redan vid N=30**, vilket motsäger `docs/mallar/bilagor/forsattsblad.html`s eget filhuvud-påstående: *"Taket (MAX_KOMBINERADE_KVITTON=30, `_shared/kvitto-kombination.ts`) gör att tabellen inte behöver bryta i praktiken idag"*. Mätt: en komposition med 30 syntetiska kvitto-rader (försättsblad + 30 kvitton, alla NORMALLÄNGDS-benämningar) renderade till **32 fysiska PDF-sidor**, inte de förväntade 31 (1 försättsblad + 30 kvitton) — `pdftotext` visar att raderna 1–24 hamnar på fysisk sida 1 och raderna 25–30 + summarad + notering på en FYSISK sida 2, med `<thead>` korrekt återupprepad (Prince paged-media-standard) och INGEN datan förlorad eller duplicerad. Brottet är GRACEFULT (ingen text klipps, ingen rad tappas), men det är en genuin avvikelse mot den dokumenterade förväntan och betyder att ett fullt (N=30) kombinerat dokument i praktiken blir 32 sidor, inte 31 — värt att bokföra innan någon bygger vidare på antagandet.

## Förväntat beteende

**Fynd 1:** `Antal`/`Enhet`/`A-pris`/`Summa`-cellerna i `.kvitto-post`-raden ska vara TOP-alignade mot `Benämning`-cellens första rad oavsett hur många rader `benämning` wrapar till (t.ex. `vertical-align: top` explicit på `.kvitto-post td`, eller motsvarande). Detta rör en redan skarp mall (`kvitto.html`/`kvitto.css`, ANVÄNDS av det befintliga sändflödet för enskilda kvitton också — inte bara "Förhandsgranska alla") och ska INTE fixas i TASK-370.3 (måttet, inte mallen).

**Fynd 2:** Antingen (a) filhuvud-kommentaren i `forsattsblad.html` rättas till att inte längre påstå att tabellen "inte behöver bryta i praktiken" vid N=30, eller (b) `MAX_KOMBINERADE_KVITTON` sänks/tabellayouten görs kompaktare så att 30 rader garanterat ryms på en sida — ett produktbeslut, inte kodrättelsens ägo i detta fynd-kort.

## Källa

TASK-370.3 (staging-skarpbevis + N≈30-mätning), mätt lokalt mot DocRaptors testnyckel 2026-09-03 (`scripts/mall-pdf.mjs`-mönstret, `_shared/kvitto-kombination.ts`s `kombineraFylldaKvittoSidor` importerad direkt i Node 24 — ren modul, Deno-fri). Research-underlaget: `docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md` § Vad som måste mätas, mätpunkt 3. PRD `TASK-370` § Implementationsbeslut.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
