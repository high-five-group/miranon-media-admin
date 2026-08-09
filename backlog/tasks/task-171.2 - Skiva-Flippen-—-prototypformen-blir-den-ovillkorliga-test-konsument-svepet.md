---
id: TASK-171.2
title: 'Skiva: Flippen — prototypformen blir den ovillkorliga + test-konsument-svepet'
status: To Do
assignee: []
created_date: '2026-08-09 08:22'
updated_date: '2026-08-09 09:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.1
parent_task_id: TASK-171
ordinal: 317000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: formvillkoren i routes + AtgardsSida flippas så prototypformen är den ovillkorliga på de skarpa URL:erna; datavägar/datakälla-grenar rörs inte. ariaSnapshot-paren bevisar identitet (variant före == promoverad efter, per läge). Test-konsument-svepet körs i SAMMA skiva: grep-svep över alla testfiler som konsumerar ytan/routerna, varje träff uppdaterad — 162.3-felet (fyra missade filer) får inte upprepas. Prototyp-railen står kvar som byggställning tills rivningsskivan. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 8, 13, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formvillkoren flippade; prototypformen ovillkorlig på skarpa URL:erna; datakälla-grenar orörda
- [x] #2 ariaSnapshot-paren gröna per läge: variant före == promoverad efter
- [x] #3 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i denna skiva
- [x] #4 Prototyp-railen kvar (rivs först i rivningsskivan)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS PRÖVAD (ADR-086), HÅLLER: uppdragets kritiska premiss — att åtgärds-/granskningsytan saknar variant-gren att flippa — verifierad på nytt mot koden (inte bara 171.1:s slutrapport). grep "useQueryState|validateSearch|useSearch|variantParam|PROTO_VARIANTS|isHallplatsVariant|protoDataMode" över AtgardsSida.tsx + båda routerna: enda träffen är PROTO_VARIANTS-arrayen med EN post (key: a) i respektive route; ingen kod läser variantParam. Formvillkoren är alltså strukturellt redan flippade — prototypformen är den enda och därmed ovillkorliga formen på /atgarder och /event/$eventId/atgarder. Flippen degenererar till NOLL-DIFF: git diff --stat visar att INGEN av de tre källfilerna (AtgardsSida.tsx, atgarder.tsx, event/$eventId/atgarder.tsx) rörs i denna skiva — enda ändringen är .facit-policy.conf.

AC #1 (formvillkor flippade, datakälla-grenar orörda): bockad på grund av noll-diff-degenerering, öppet bokförd — inget kodvillkor att flippa fanns. Datavägs-invarianten verifierad: grep "protoDataMode" i de tre filerna ger en enda träff, en KOMMENTAR (AtgardsSida.tsx:2606) som dokumenterar att flaggan MEDVETET är utelämnad (samma fynd som 171.1). Ingen datakälla-gren existerar att flippa. git diff bekräftar noll ändringar i alla tre källfiler.

AC #2 (ariaSnapshot-paren gröna, variant före == promoverad efter): degenererar till identitet (samma kod = samma rendering). tests/visual/atgardssida-promoverings-grind.spec.ts kört mot oförändrad yta: 12/12 grönt, två körningar i rad (PLAYWRIGHT_VISUAL_DEV_SERVER=1 npx playwright test --project=visual-desktop --project=visual-mobile tests/visual/atgardssida-promoverings-grind.spec.ts, båda 12 passed).

AC #3 (test-konsument-svepets träffyta bilagd, alla träffar uppdaterade): grep-svep över hela tests/ (alla underkataloger: kontraktsvakt, manifest-screenshots, acceptance, support, visual, vale-regression, api, a11y, preview, webblasarbeteende, e2e) för "AtgardsSida" och för importvägen "components/events/atgarder/AtgardsSida" samt för navigering mot /atgarder-routerna. Träffyta:
  - tests/visual/atgardssida-promoverings-grind.spec.ts — DEN ENDA genuina konsumenten (importerar/navigerar mot ytan). Byggd i 171.1, ingen ändring krävs (noll-diff).
  - tests/e2e/event-bekraftelse.staging.test.ts, event-deltagare.staging.test.ts, event-detail.staging.test.ts, tests/visual/eventsida-promoverings-grind.spec.ts — matchade sökordet "atgarder" men verifierat att de INTE konsumerar AtgardsSida.tsx/atgarder-routerna: de testar AtgarderKort (data-testid="atgarder-kort", src/components/events/detail/Atgarder.tsx — ett annat kort på eventsidan, "Gå till åtgärder", vars hopkoppling mot åtgärds-sidan är task-171.6, VILLKORAD mot 147, inte denna skiva) respektive en fristående "Åtgärder"-disclosure på bekräftelsesidan (data-testid="atgarder-platshallare", en helt annan yta som säger "Åtgärds-sidan är inte byggd ännu" — stale text, hör till 171.6:s hopkoppling, inte till 171.2:s flipp). Ingen av dessa fyra filer importerar AtgardsSida eller navigerar mot /atgarder-routerna (verifierat: grep -n för mönstren goto.*atgarder samt /atgarder som strängliteral samt AtgardsSida över tests/e2e/*.staging.test.ts och tests/visual/eventsida-promoverings-grind.spec.ts — enda träffen är en negativ assertion, toHaveCount(0) på en länk, i event-bekraftelse.staging.test.ts:627, som testar att en ANNAN yta INTE länkar dit). Ingen fil i denna klass ändrad — de konsumerar inte den flippade ytan.
  - Inga träffar i src/**/*.test.ts(x) (inga unit-tester konsumerar ytan).
  162.3-mönstret (fyra missade filer) undveks genom att köra svepet över HELA tests/-trädet, inte bara en delmängd, och genom att läsa varje träff-fils faktiska kontext (inte bara sökordet) innan den klassades som "berörd" eller "oberörd".

AC #4 (prototyp-railen kvar): PrototypeSwitcher monteras oförändrat, DEV-grindad, i båda routerna (git diff bekräftar noll ändringar i dessa filer). Rivs först i 171.5 efter Marcus godkännande (ADR-102 B3).

MARKÖR-REGISTRERINGEN (skivans skarpaste moment, .facit-policy.conf): de befintliga FACIT_PROTO_MARKORER (isHallplatsVariant, protoAktiv) hör till hallplats-prototypen och skyddade INTE åtgärds-/granskningsytans substrat — B3-spärren stod alltså blind för denna ytas rivning trots att dess manifest (tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json) har "godkand": null. Tre nya markörer tillagda, en per källfil i manifestets "kallor", valda ur de redan existerande [PROTOTYPE][S100]-docblocken (ingen ny kod skriven för att skapa en markör):
  - "ÅTGÄRDS-SIDAN — konvergens-prototyp" (AtgardsSida.tsx:2)
  - "Åtgärds-sidan UTAN event — tomt läge" (atgarder.tsx:11)
  - "Åtgärds-sidan MED event — konvergens-prototyp" (event/$eventId/atgarder.tsx:11)
Uniknhet verifierad FÖRE tillägg: grep -rlF (fixed-string) mot varje sträng i src/ gav exakt EN träff-fil per sträng.

TVÅSIDIGT INVARIANT-BEVIS (revert-verifierat, ingen godkand-skrivning — hård regel #4):
  1. Baslinje: check-facit.sh grönt efter markör-tillägget (markörerna redan finns i koden): "Facit-manifest OK: 2 manifest, 8 ytor deklarerade, 1 ogodkända (prototyp-substratet skyddat)." exit=0.
  2. RÖTT (marker 1): docblock-raden i AtgardsSida.tsx temporärt muterad (texten TASK171PROBE ersatte markören). check-facit.sh: exit=1, felutdatan citerar markören ÅTGÄRDS-SIDAN — konvergens-prototyp som saknad i src/ och pekar på tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json med godkand-fältet null. Reverterad, check-facit.sh grönt igen, git diff --stat för filen = noll rader.
  3. RÖTT (marker 2+3, samtidigt): docblock-raderna i atgarder.tsx OCH event/$eventId/atgarder.tsx temporärt muterade. check-facit.sh: exit=1, BÅDA markörerna citerade separat i felutdatan, samma manifest-referens. Reverterade, check-facit.sh grönt igen, git diff --stat för båda filerna = noll rader.
  4. Regressionskontroll: scripts/test-check-facit.sh — 27/27 passerade, opåverkat av markör-tillägget.
Slutgiltig git diff --stat för hela arbetsträdet: ENDAST .facit-policy.conf (15 rader tillagda). Inga andra filer rörda — bekräftar AC #1/#4:s noll-diff-påstående oberoende av grep-analysen ovan.

DoD-status: #1 samtliga fyra AC avbockade via --check-ac. #2 lokala grindar gröna för rörd fil-klass (.facit-policy.conf, en sourced bash-config i shellcheck-strict-scopet): shellcheck --severity=style --enable=all (CIs exakta invokation, alla 26 filer inkl. .facit-policy.conf) exit=0; typecheck (tsr generate && tsc -b --noEmit) exit=0; biome check . exit=0 (6 warnings/27 infos, samtliga pre-existing — inga i .facit-policy.conf, som biome inte lintar); build exit=0; test:api 465/465 grönt; test:visual (atgardssida-promoverings-grind.spec.ts) 12/12 grönt två körningar; check-facit.sh + test-check-facit.sh gröna (se ovan). #3 (CI grön per jobb) EJ verifierbar av mig — orkestrerarens domän. #4 path-scopad add (git add .facit-policy.conf + kortfilen), verifierat inga orelaterade filer. #5 ariaSnapshot-paret grönt (identitet, se AC #2). #6 bevis-loopens spår: textform i denna notes-sektion (rött-med-diff-grönt, två separata mutationer + revert, ingen PNG eftersom facit är ariaSnapshot inte pixel — samma mönster som 171.1/162.1). #7 datavägs-invarianten verifierad (se AC #1). #8 test-konsument-svepets träffyta bilagd ovan, samtliga fem träffade filer klassade, en genuin konsument (redan levererad 171.1, ingen uppdatering krävs), fyra falska positiva (annan yta) dokumenterade med skäl.

DIVERGENS MOT UPPDRAGET: ingen ny divergens utöver den 171.1 redan bokförde (noll variant-gren). Uppdragets instruktion om vad som ska göras om premissen håller (referenser, markör-registrering, test-konsument-svep, datakälla-verifiering, rail-bevarande) följdes exakt.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [ ] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
