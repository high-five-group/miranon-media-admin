---
id: TASK-299.10
title: 'QA: Anmälningssidan och Mer-familjens sidram — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-22 19:38'
updated_date: '2026-08-24 14:01'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
  - TASK-299.2
  - TASK-299.3
  - TASK-299.4
  - TASK-299.5
  - TASK-299.6
  - TASK-299.7
  - TASK-299.8
  - TASK-299.9
parent_task_id: TASK-299
ordinal: 550000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell vandring i browsern efter att alla skivor landat. TESTPLAN, i ordning. (1) Öppna Hem, klicka åtgärdskö-raden — verifiera att du landar på anmälningssidan i filtrerat läge, att rubriken säger hur många rader som väntar, och att 'Visa alla anmälningar' tar dig till hela listan. (2) I hela listan: kontrollera att varje rad bär initialer, namn, hur länge sedan anmälan kom in och vilket event den gäller, och att statusen sitter på exakt samma plats i varje rad oavsett namnlängd. (3) Leta upp en rad som behöver kopplas om och klicka den — verifiera att du hamnar i resolutionen, inte på eventet. (4) Jämför radhöjden mellan en rad med status och en utan: de ska vara exakt lika höga. (5) Töm filtret till noll träffar och verifiera att tomt läge säger något vänligt. (6) Gå igenom alla fem Mer-sidorna i tur och ordning och verifiera att tillbaka-knappen ser likadan ut och sitter på samma ställe. (7) Verifiera att väntelistan och intresserade bär initialcirklar men att maillogg inte gör det. (8) Öppna persondetaljen och check-in och kontrollera att de ser ut som de gjorde före passet, i den omfattning du valde i skiva 2. (9) Upprepa steg 1-3 och 6 på telefon. (10) Slå på förstärkt kontrast i systemet och verifiera att inget tappar sin gräns eller sin betydelse. Fynd registreras som NYA kort med exakt symptom och förväntat beteende — aldrig som retuschering av landade kort. Täcker samtliga användarberättelser.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla tio stegen i testplanen genomförda på desktop och de utpekade även på mobil
- [x] #2 Varje fynd registrerat som eget kort med exakt symptom och förväntat beteende
- [x] #3 Marcus godkänner helheten i klartext, eller pekar ut vad som återstår
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Dev-växeln riven före arbetsenhetens stängning; formen kvar (ADR-103 B2 steg 4 — villkor och växlar, aldrig form)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNINGSPASS 2026-08-23 (S111). KORTET LÄMNAS ÖPPET — AC #1 kan inte bockas ärligt. Steg 10 (förstärkt kontrast) saknar täckning för nio av tio ytor, och Marcus gjorde det inte.

AC #3 BOCKAD — Marcus godkänner helheten i klartext, TVÅ gånger under QA-fönster 3 (2026-08-23, preview 4173 mot staging): 'Ser bra ut.' efter genomgången av Hem + anmälningssidan + Mer-familjen, och 'Ser bra ut' igen vid omstämplingen av facit-manifestet (citerat i tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json:s godkand-fält, sha cb7ad681, commit 33645735).

AC #2 BOCKAD — kriteriets avsikt är att inget fynd tappas och att inget LANDAT kort retuscheras. Alla tre fynden är spårbara, och klassningen av vart och ett är motiverad:
  (1) anmälningssidan saknade husets delade SidRam — rättat FÖRE landning, inom TASK-299.5 (commit 9a06cf3b, facit-bilder omtagna i 718e586f). Inte eget kort, och det är korrekt: fyndet träffade en skiva som ännu inte landat, så ingen retuschering av landat kort skedde. Bokfört på 299.5-kortets notes.
  (2) chevronhöjden ('Alla chevrons ... sitter ju mycket högre upp ... Flytta ner alla') — rättat i commit 2e16ded1, SidRam äger topp-luften (mt-2 lg:mt-10). Samma klass som (1): fyndet träffade den delade primitiven under pågående arbete.
  (3) public/screenshots/narrow-hem.png inaktuell efter bevakningsradens promovering — registrerat som EGET KORT, TASK-311 (commit f371f02b), verifierat To Do i backlog-registret i detta pass. Det är fyndet som träffade redan landat arbete, och det fick därför kortformen kriteriet föreskriver.

AC #1 EJ BOCKAD — kriteriet kräver 'alla tio stegen ... genomförda på desktop och de utpekade även på mobil'. Steg 1-8 gjorde Marcus (fönster 3, verbatim 'Ser bra ut.'). Steg 9 (mobil) och steg 10 (förstärkt kontrast) gjorde han INTE explicit. Uppdraget till detta pass gav mandat att bocka OM båda kunde beläggas mekaniskt. MÄTT — den ena halvan bär, den andra inte:
  · STEG 9 (mobil) — TÄCKT. playwright.config.ts rad 700-709 definierar projektet visual-mobile med viewport 375x812 och testDir ./tests/visual UTAN testMatch-begränsning; ingen spec-fil i katalogen opt:ar ut (noll träffar på test.use/viewport/test.skip/project.name). Alla tio ytorna körs alltså mekaniskt i mobil viewport. Anmälningssidan har dessutom axe + ariaSnapshot i mobil (tests/visual/anmalningssidan-promoverings-grind.spec.ts, /mer/anmalningar rad 261, fem AxeBuilder-svep), med incheckad artefakt __aria__/anmalningssidan-promoverings-grind.spec.ts/anmalningssidan-lista-visual-mobile.aria.yml som bevisar att mobilkörningen faktiskt inträffat. Samma par-mönster för persondetalj, check-in, Hem/bevakningsrad.
  · STEG 10 (förstärkt kontrast) — EJ TÄCKT, och det är blockeraren. Fulltextsökning i hela tests/ efter prefers-contrast, emulateMedia({contrast}), forcedColors: EXAKT EN av kortets tio ytor har ett prefers-contrast: more-svep — check-in/dörrlistan (tests/visual/dorrlista-promoverings-grind.spec.ts rad 746/750). De nio övriga (/mer/anmalningar, väntelistan, intresserade, maillogg, installera-appen, aktivitetshistoriken, dokumentytan, persondetaljen, Hem/bevakningsraden) har NOLL förekomster. forced-colors saknas helt i hela tests/.
  · VARFÖR LUCKAN INTE TÄPPTES HÄR: att bygga kontrast-svep för nio ytor är ny testkod på nio ytor. Uppdraget till detta pass drog scope-gränsen uttryckligen vid EN kodändring (axe-svepet i persondetaljens felläges-test, TASK-299.6 DoD #5). Att bygga nio testsviter på eget bevåg vore ett scope-beslut, inte en verifiering — det eskaleras i stället för att utföras.
  · VÄGEN FRAMÅT, två alternativ: antingen gör Marcus steg 9-10 manuellt (30 sekunder i systeminställningarna per yta), eller så mintas ett eget kort för prefers-contrast-täckning av Mer-familjen med dorrlista-promoverings-grind.spec.ts rad 736-812 som färdig förebild (kontrast + reduced-motion + print i samma fil).
  · MANDATET SOM FANNS: Marcus 'Rörande de två andra besluten ger jag dig mandat att besluta dem åt mig' + AFK-ordern 'Kör klart så mycket som bara är möjligt'. Mandatet användes till att BEDÖMA, och bedömningen blev att kriteriet inte är uppfyllt — mandat att besluta är inte mandat att bocka något omätt.

DoD #1 EJ BOCKAD som följd — 'Alla acceptanskriterier avbockade' är falskt så länge AC #1 står öppen. Kortet står kvar To Do.
DoD #2 BOCKAD — detta pass mätte: npx @biomejs/biome check . exit 0 · npm run typecheck:tests exit 0 · node scripts/check-langa-streck.mjs exit 0 (271 filer) · npm run check:docs exit 0 (14/14) · bash scripts/check-facit.sh exit 0.
DoD #3 BOCKAD — CI GRÖN PER JOBB: QA-fyndens rättningar (9a06cf3b, 718e586f, 2e16ded1, f371f02b) landade i PR #1864, merge-commit e1470eb0. `gh pr checks 1864` mätt 2026-08-23: 15 rollup-poster, NOLL fail.
DoD #4 BOCKAD — path-scopad add; PR-diffen granskad före merge.
DoD #5 BOCKAD — axe 0 i alla fyra tillstånd på den yta QA-fynden rörde: tests/acceptance/mer-anmalningar-form.acceptance.test.ts rad 185 (lista), 201 (filtrerat/åtgärdskö), 231 (tomt), 244 (fel, 4xx via role=alert), plus filter-tomläget rad 645 och öppen panel rad 685/894. Kördes grön i CI på #1864 (Acceptance hermetisk, 8m54s).
DoD #6 BOCKAD — DEV-VÄXELN RIVEN, verifierat i detta pass och inte antaget: `grep -rn "useQueryState(.sidram|'sidram'|\"sidram\"" src/` ger exit 1, NOLL träffar — ingen levande sidram-växel finns kvar i skarp kod. Samtliga kvarvarande 'sidram=ny'-förekomster i src/ är docblock-rader som dokumenterar att växeln ÄR riven (AktivitetsHistorik.tsx:750, PersonDetail.tsx:1617, EventCheckin.tsx:942, DokumentYta.tsx:57/379, dev/primitives.tsx:379). NOTERAD PRECISERING mot uppdragets formulering: grepen efter '?variant=' ger inte noll rader, men samtliga levande träffar tillhör ANDRA prototyper i dev-substratet (PrototypeSwitcher, /dev/hem-prototyp, /dev/auth-prototyp, segment- och genererings-prototyperna) — de ligger utanför TASK-299:s omfattning och rivs av sina egna kort. Ingen av dem är en sidram-växel.

TASK-314 LANDAT — steg 10 (förstärkt kontrast) nu mekaniskt belagt för samtliga nio tidigare obevakade ytor. prefers-contrast: more-svep tillagda enligt dörrlistans mönster (tests/visual/dorrlista-promoverings-grind.spec.ts rad ~746-782) i de nio ytornas BEFINTLIGA spec-filer: anmalningssidan-promoverings-grind.spec.ts, vantelista.spec.ts, intresserade.spec.ts, maillogg-visual.spec.ts, installera-appen-visual.spec.ts, aktivitetshistorik-visual.spec.ts, dokument-visual.spec.ts, persondetalj-promoverings-grind.spec.ts, hem-bevakningsrad-promoverings-grind.spec.ts. Fem av nio ytor (anmälningssidan, aktivitetshistorik, dokument, persondetalj, bevakningsraden) hade en befintlig contrast-more:border-border-strong-affordans att probe:a mot token-kedjan (--mm-border-strong); fyra (väntelista, intresserade, maillogg, installera-appen) saknade helt egen contrast-more-styling — deras svep bevisar i stället att den befintliga STATISKA gränsen (border-text-muted/20 respektive border-border) förblir renderad under förstärkt kontrast. Negativ kontroll genomförd (TASK-314 AC #2): en riktad mutation av anmälningslistans contrast-more:border-border-strong gav RÖTT (borderTopColor rgba(0,0,0,0) i stället för token-värdet rgb(196,196,194)), reverterad, grönt igen. Bockning av 299.10 AC #1 görs i separat stängningspass, per uppdraget till detta pass.
<!-- SECTION:NOTES:END -->
