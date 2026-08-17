---
id: TASK-241.7
title: 'Skiva: Prototyp-rivningen — svep-substratet bort efter QA'
status: To Do
assignee: []
created_date: '2026-08-16 23:09'
updated_date: '2026-08-17 10:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.6
parent_task_id: TASK-241
ordinal: 461000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rivningen följer 243.4-till-243.5-prejudikatet: prototypen står kvar som körbar referens tills Marcus QA-vandring (241.6) är klar, sedan rivs flaggor och substrat — aldrig formen (ADR-103). Täcker användarberättelser: ingen (teknisk stängning per ADR-102 B3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dev-routen /dev/svep-prototyp och katalogen src/components/dev/svep-prototyp/ rivna; import-beroendena mot hem-prototypkatalogen (VariantRo, demoUniversum, InitialAvatar-bokföringen i 241.1-notes) därmed borta — 243.5 avblockeras från svep-hållet
- [ ] #2 B3-markören ([PROTOTYPE, TASK-241.1] Sändytans overlay — KONVERGENSVARV 2.) städad ur .facit-policy.conf i SAMMA landning som rivningen (TASK-192-regeln) med daterad removal-not
- [ ] #3 scripts/check-facit.sh grönt efter städningen; bygget bär noll referenser till svep-prototypkatalogen (grep-verifierat i dist)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-241.7 — RIVNINGEN EJ LANDAD. BLOCKERAD AV FACIT-MANIFESTETS kallor-EXISTENSKOLL, VARS ENDA FIX NEKAS MEKANISKT AV ADR-104-HOOKEN (bygg-agent, Opus 5, 2026-08-17). Ingen kod landad i detta pass; arbetstradet aterstallt och verifierat rent (git status --short tomt, bash scripts/check-facit.sh exit 0).

FORVILLKOREN HOLL. Facit-laset s102-svep-konvergens ar stamplat: "av": marcus, "datum": "2026-08-16", "sha": "10dff531c0aeea572f720483d217723f4aaef605". B3-sparren (ADR-102) ar alltsa slappt for denna yta. bash scripts/check-facit.sh gav exit 0 med slutraden "10 manifest, 22 ytor deklarerade, 0 ogodkanda (prototyp-substratet skyddat)" — dvs B3-sparren ar for narvarande INAKTIV globalt eftersom inget manifest langre bar stampel-faltet satt till null. Not: .facit-policy.conf rad 175-176 pastar fortfarande att hem-manifestet ar ostamplat; det ar foraldrad kommentarsprosa (243.4-stampeln landade 2026-08-17), inte ett fel i mekaniken.

RIVNINGEN AR TEKNISKT KORREKT OCH MATT — den stoppas av EN grind, inte av kodberoenden. Utford i arbetstradet (git rm av src/routes/dev/svep-prototyp.tsx + de fem filerna i src/components/dev/svep-prototyp/), darefter matt:
  npm run typecheck exit 0
243.5-AVBLOCKERINGEN AR BEVISAD, inte resonerad. Grep over src/ efter importer mot @/components/dev/hem-prototyp utanfor katalogen sjalv och utanfor dess egen route: NOLL traffar efter rivningen. Probe med samma metod som 243.5-agenten anvande (hem-prototypkatalogen + dess route temporart undanflyttade till scratchpad, darefter aterstallda): npm run typecheck exit 0 med BADA prototyperna borta. De tva TS2307-fel 243.5-agenten matte (svep-prototyp.tsx rad 6-7) ar darmed borta. 243.5 ar avblockerat fran svep-hallet.

BLOCKERINGEN, MATT VERBATIM. Efter rivningen: bash scripts/check-facit.sh exit 1 med SEX fel av formen "tasks/sessions/bilagor/s102-svep-konvergens/facit.json: ytan ... pekar pa kallan src/routes/dev/svep-prototyp.tsx som inte finns." — en per riven fil. Roten ar scripts/lib/facit-validera.mjs rad 164-168: varje post i manifestets kallor-lista existens-kollas med existsSync, och manifestets kallor-lista bar exakt de sex filer AC #1 kraver rivna. Grinden kors i CI (.github/workflows/ci.yml rad 751) och som grind 14 i scripts/check-docs.sh (rad 257), sa en rod grind blockerar landning. AC #1 (rivning) och AC #3 (check-facit gront) kan darmed INTE bada uppfyllas utan att manifestets kallor-lista pekas om.

DEN ENDA FIXEN NEKAS MEKANISKT. Ett forsok att peka om kallor-listan till den promoverade skarpa ytan avvisades av PreToolUse-hooken scripts/deny-facit-godkand-skrivning.sh, verbatim: "FACIT-GODKANNANDETS KANALSEPARATION (ADR-104): Edit mot ...s102-svep-konvergens/facit.json skulle satta stampel-faltet till ett icke-null-varde." Editen rorde ALDRIG det faltet — den bytte enbart kallor-listan. Orsaken ar last i scripts/lib/facit-godkand-skrivning.mjs: harIckeNullGodkandEfterEdit provar RESULTATET av editen, inte deltat. Eftersom faltet redan ar satt bar resultatet alltid ett icke-null-varde, sa VARJE Edit/Write mot ett redan stamplat manifest nekas oavsett vilket falt som ror. KONSEKVENS, ej tidigare bokford: ett stamplat facit-manifest ar EFFEKTIVT IMMUTABELT for agenter. Det ar samma falsk-positiva klass som TASK-168 stadade fem instanser av; denna sjatte klass (legitim edit av ett ANNAT falt i ett redan stamplat manifest) ar kvar. Ingen legitim agent-kanal for manifest-underhall finns — enda facit-skriptet i package.json ar stamplingskanalen sjalv.

PREJUDIKATET PEKAR AT ETT HALL. De tva manifest som star i post-promoverings-lage pekar bada sin kallor-lista pa SKARP yta, aldrig pa rivet prototyp-substrat: s93-atgardssida-promovering (src/routes/_authenticated/atgarder.tsx, src/components/events/atgarder/AtgardsSida.tsx) och s102-dokument-konvergens (src/components/dokument/DokumentYta.tsx m.fl.). Validatorns egen feltext definierar faltet som "vilken kod ytan ager" — efter promoveringen ags sandytan av src/components/svep/.

FORESLAGEN OMLAGGNING (kraver Marcus egen kanal eller ett beslut om hooken/validatorn). Manifestets kallor-lista byts till den promoverade ytan, verifierad pa disk: src/components/hem/Hem.tsx (monteringspunkten, motsvarar prototypens route), src/components/svep/SvepOverlay.tsx, src/components/svep/Adresslista.tsx, src/components/svep/Forhandsvisning.tsx, src/components/svep/ResultatVy.tsx (utbruten ur prototypens SvepOverlay resultat-del), src/components/svep/svep-urval.ts (ersatter prototypens data.ts) och src/components/svep/types.ts. Stampel-faltet, lasning, bilder och last-faltet lamnas oordda.

SAMMA VAGG VANTAR 243.5. tasks/sessions/bilagor/s102-hem-konvergens/facit.json bar en kallor-lista som pekar pa src/routes/dev/hem-prototyp.tsx plus fem filer i src/components/dev/hem-prototyp/ — exakt det substrat 243.5 ska riva, och dess manifest ar likasa stamplat. Blockeringen ar alltsa systematisk for hela rivningsklassen, inte en engangshandelse for detta kort.

BESLUTSRYMDEN (eskaleras, ej vald av agenten per ADR-053 "blockerar + kraver arkitekturbeslut"): (a) Marcus lagger om kallor-listan via sin egen kanal, varefter rivningen landar oforandrad; (b) hooken smalnas av till en delta-jamforelse av stampel-faltet fore/efter (TASK-168-monstret) sa legitima editer av andra falt slapps igenom; (c) validatorns kallor-existenskoll ges en historik-tolerans — river dock en invariant som fangar akta fel; (d) rivningen skjuts upp. Alternativ (a) och (b) bevarar bada grindens syfte.

AC-LAGE: #1 ej bockat (rivningen utford och matt i arbetstradet, aterstalld — ej landad). #2 ej bockat: markoren "[PROTOTYPE, TASK-241.1] Sandytans overlay — KONVERGENSVARV 2." star kvar i .facit-policy.conf FACIT_PROTO_MARKORER rad 203, eftersom TASK-192-regeln kraver att den stadas i SAMMA landning som rivningen. #3 ej bockat. Tvavagsbevis for grinden i AC #3 ar dock taget: exit 1 med rivningen applicerad (sex namngivna fel), exit 0 utan den.
<!-- SECTION:NOTES:END -->
