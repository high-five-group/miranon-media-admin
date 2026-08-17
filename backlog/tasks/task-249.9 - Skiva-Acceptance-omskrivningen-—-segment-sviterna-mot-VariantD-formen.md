---
id: TASK-249.9
title: 'Skiva: Acceptance-omskrivningen — segment-sviterna mot VariantD-formen'
status: To Do
assignee: []
created_date: '2026-08-17 05:33'
updated_date: '2026-08-17 08:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.5
  - TASK-249.6
parent_task_id: TASK-249
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segment-ytans acceptance-skydd skrivs om så den promoverade VariantD-formen bär samma testtäckning som den gamla SegmentBuilder-ytan hade. TASK-249.5 flippade /mer/segment till VariantD (ADR-103 B2 steg 1); de fyra befintliga sviterna (mer-segment.acceptance.test.ts, mer-segment-send.acceptance.test.ts, mer-segment-send-aktivitetslogg.acceptance.test.ts, mer-segment-spara-aktivitetslogg.acceptance.test.ts, 17 tester totalt) testade alla SegmentBuilder-UI:t ("Bygg segment"-rubriken, RadioGroup Inkludera/Exkludera/Ignorera) som inte längre renderas på den route.

KORRIGERAT UNDER TASK-249.5:s BYGGE (2026-08-17, CI-rundan 31999164757 fällde först): test.skip visade sig vara STRUKTURELLT OTILLÅTET i acceptance-klassen — hermetik-självtestet (scripts/hermetik-sjalvtest.mjs) kräver att VARJE test fälls med OmockadRequestError när fixturvärlden töms, och ett skippat test rapporterar skipped i stället för unexpected, vilket räknas som en avvikelse (redan dokumenterat: tasks/lessons.d/acceptance-klassens-sjalvtest-tillater-ingen-parkering.md, TASK-214.4-precedentet). Fixen: de tre filerna (send/send-aktivitetslogg/spara-aktivitetslogg, 7 tester) RADERADE helt (git rm); mer-segment.acceptance.test.ts skrevs om till att bara innehålla ett nytt, LIVE axe-smoke-test mot den promoverade formen (de nio SegmentBuilder-specifika testerna borttagna, inte skippade). Innehållet finns kvar i git-historien (commit före denna rättning) om det behövs som referens vid omskrivningen.

OBSERVERA: sändningen (send-email) och sparandet (save-segment) är fortfarande NO-OP/simulerade i VariantD (AC#1 i TASK-249.5: den promoverade formen är identisk med den körande prototypen i variant d-läge) — send-/spara-relaterade tester kan därför inte återskapas mot verkligt beteende förrän/om den skarpa mutations-wiringen byggs i ett separat kort. Detta korts scope är därför primärt mer-segment.acceptance.test.ts (läs-/räkne-vägen, som ÄR skarp efter TASK-249.5); send-/spara-testerna återskapas bara om mutations-wiringen byggs, eller arkiveras medvetet om PRD:n beslutar att no-op-formen är permanent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De skippade testerna i mer-segment.acceptance.test.ts (läs-/räkne-vägen) omskrivna mot VariantD:s faktiska DOM/flöden (mallvyn, verkstaden, segment-detaljvyn); beteendet de bevisade (taxonomi-rendering, klartext-spegling, tomt-resultat-neutralitet, export) bevaras
- [x] #2 mer-segment-send*.test.ts och mer-segment-spara-aktivitetslogg.acceptance.test.ts: antingen omskrivna (om skarp mutations-wiring byggts i ett separat kort dessförinnan) eller medvetet kvarlämnade skippade med uppdaterad motivering — aldrig tyst bortglömda
- [ ] #3 Samtliga sviter gröna lokalt och i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OMSKRIVNINGEN LANDAD (TASK-249.9). `tests/acceptance/mer-segment.acceptance.test.ts` skriven mot den promoverade VariantD-formen: 1 test (axe-smoke) → 6 tester. Ytorna kortet pekar ut är alla täckta — mallvyn, verkstaden, segment-detaljvyn — plus listan.

DE SEX TESTERNA, OCH VILKET RADERAT BEVIS VART OCH ETT BÄR:
1. `mallvyn: stegen grindar tomt val, färdigt val ger mening + antal` — ersätter "tom-regel-grind" (knapp disabled + ledtext). Grinden är nu stegvis ledtext ("Välj först vilka som räknas med." / "Gör valen ovan, så visas segmentet här.") och Skapa-knappen finns inte alls förrän valen är kompletta. Färdigt val ⇒ "Har gått minst en av RIM 1 och RIM 2." + "6 personer i det här segmentet."
2. `verkstaden: taxonomin renderas par för par, fälla-35-etiketten distinkt, okänd familj sägs rakt ut` — ersätter "taxonomi renderas (inkl. fälla-35-etikett distinkt)". `labelForPar` överlever i VillkorsKorts "Träffar 6 av 6 event: …"-rad; fälla-35-etiketten ("Resor i medvetandet - fristående föreläsning (ej del 1/2/3)") asserteras där. Fixturen bär dessutom en kurs UTAN Kursfamilj ⇒ `OkandaKurser` bevisas.
3. `verkstaden: klartexten och antalet följer både med- och utan-villkoret` — ersätter BÅDE "include/exclude uppdaterar klartext-speglingen" OCH "'Räkna antal' → count visas". Räkna-knappen är riven, så beviset är att talet FÖLJER regeln: "Har gått RIM." ⇒ 6 personer; + utan-villkor ⇒ "Har gått RIM. Utan: Har gått Fjärrskådning." ⇒ 5 personer (Greta dras bort). Bär också axe-scanet på den interagerade regelytan.
4. `detaljvyn: 0 träffar renderas neutralt, aldrig som ett fel` — ersätter "tomt resultat (count===0) → NEUTRAL text, ej role=alert". "RIM 1 + Psionautics" är en förskapad grupp vars exakta kombination ingen i fixturen har ⇒ tomläget uppstår ur REGELN. `role=alert` count 0.
5. `listan: sparad rad ur basen renderas med sin uppräknade regel; CI-fixturerna filtreras bort` — ersätter LÄS-halvan av "spara (L3) → syns i sparade-listan". Migrations-sömmen (arvdRegel/predikat===null) + `app-segment-test`-filtret.
6. `axe 0 violations på den promoverade segment-ytan` — behållen från 249.5, ny gemensam fixtur.

MEDVETET EJ ÅTERUPPSTÅTT (dokumenterat i filhuvudet, aldrig tyst bortglömt):
- SKOOL-EXPORTEN. `VariantD` bär ingen export-affordans; `src/lib/segment-export.ts` har efter rivningen EN konsument: `tests/api/segment-export.test.ts` (api-pure). CSV-innehåll/dedup/consent bevisas alltså fortfarande — UI-halvan (nedladdning, "N personer med e-post laddades ner", "M saknar e-post") har ingen yta att bevisas mot. DIVERGENS mot AC#1:s uppräkning, som listar "export" som bevarbart.
- SPARANDETS SKRIVVÄG. `saveSegment` är no-op (VariantD.tsx § READ-ONLY FÖRSTÄRKT) ⇒ inget invalidate/refetch-flöde finns.

AC#2 — DE TRE RADERADE SYSKONFILERNA (mer-segment-send, mer-segment-send-aktivitetslogg, mer-segment-spara-aktivitetslogg; 7 tester, raderade i 2650b42c): MEDVETET EJ ÅTERSKAPADE, motiveringen skriven i det nya filhuvudets § VAD SOM MEDVETET INTE ÅTERUPPSTOD punkt 3. AC-textens andra alternativ ("medvetet kvarlämnade skippade") är STRUKTURELLT OMÖJLIGT — hermetik-självtestet tillåter ingen `test.skip`, och filerna är dessutom raderade, inte skippade. De drev `SegmentMailCompose` respektive `useSaveSegment`/`useSendSegmentMail`; `SegmentMailCompose` har efter rivningen NOLL konsumenter under `src/routes/**` (verifierat med grep), och `VariantD`s utskicksvy simulerar utfallet i webbläsaren (`simulera`) utan att nå `send-email`. Det finns alltså varken payload-kontrakt, bekräftelse-grind eller aktivitetspost att observera. Återskapas i samma kort som bygger den skarpa mutations-wiringen.

AC#3 — lokala halvan MÄTT: 6/6 gröna (16,9 s, `npm run test:acceptance -- tests/acceptance/mer-segment.acceptance.test.ts`). CI-halvan ägs av orkestrerarens CI-verifiering; kriteriet lämnas obockat tills den signalen finns.

AVGRÄNSNING SOM HÖLLS: `tests/visual/segment-promoverings-grind.spec.ts` och dess 14 `.aria.yml`-referenser är ORÖRDA (verifierat 14/14 gröna, visual-desktop + visual-mobile).

GRINDARNAS UTFALL (lokalt, mätt 2026-08-17, exitkoder fångade separat — aldrig via pipe):
- `npm run typecheck` → exit 0
- `npm run typecheck:tests` → exit 0
- `npx @biomejs/biome check .` → exit 0 (542 filer, 0 fel; 7 warnings + 47 infos, samtliga preexisterande)
- `npm run build` → exit 0
- `npm run test:api` → exit 0, 874 passerade (1,2 min). FÖRSTA försöket gav exit 1 på api-setup: staging-preflighten (TASK-77) stoppade körningen därför att CI höll den delade basen (post-merge.yml, körning 32009520312). Det är vaktens avsedda beteende, inte ett testfel — api-pure-halvan var grön redan då (`npm run test:api:pure` → exit 0, 552 passerade). Omkörning efter att CI släppt: grön.
- `npm run test:acceptance -- tests/acceptance/mer-segment.acceptance.test.ts` → exit 0, 6/6 (16,9 s)
- `npm run test:acceptance` (HELA klassen) → exit 1, 221/222. Den enda röda är `hem.acceptance.test.ts:313 dagar-kvar-formens tre exakta texter` — ANNAN FIL, orörd av denna diff. Isolerad omkörning grön (exit 0, 3,6 s) ⇒ last-känslig flake av repots dokumenterade klass B, inte en regression. CI kör med retries: 2.
- `npm run test:acceptance:sjalvtest -- tests/acceptance/mer-segment.acceptance.test.ts` → exit 0. Slutrad: "6 tester · 6 fällda · 6 med OmockadRequestError som orsak".
- `npm run test:acceptance:sjalvtest` (HELA klassen) → exit 0. Slutrad: "222 tester · 222 fällda · 222 med OmockadRequestError som orsak".
- `npm run test:acceptance:sjalvtest:negativ` → exit 0 ("NEGATIV KONTROLL GRÖN") — bevis i andra riktningen: bedömningen faller utan självtestläget.
- `npm run test:visual -- tests/visual/segment-promoverings-grind.spec.ts` → exit 0, 14/14 (18,1 s). `git status` på `tests/visual/**` = 0 rader ⇒ referensfilerna orörda.
<!-- SECTION:NOTES:END -->
