---
id: TASK-241.8
title: 'Skiva: Eventinfo-svepet — bevakningsraden bär handling'
status: To Do
assignee: []
created_date: '2026-08-18 10:57'
updated_date: '2026-08-18 11:11'
labels: []
dependencies:
  - TASK-241.3
parent_task_id: TASK-241
ordinal: 502000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bevakningsraden på hemvyn är idag en riktig `<button>` UTAN `onPress`
(`src/components/hem/Bevakningsrad.tsx:100-103`) — ett klick gör bokstavligen
ingenting, inte ens navigering. Denna skiva ger den den handling
S102-grillningens beslut 4 redan beslutade: *"klicket öppnar sändflödet
förifiltrerat på exakt de ostämplade"*
(`tasks/sessions/2026-08-10-session-102.md:726-727`).

**Arbetet är klient-plumbing, inte EF-bygge.** Motorn finns och är skarp:
`send-action-email` bär `eventinfo` som åtgärdstyp, och
`supabase/functions/_shared/send-action-email.ts:366-367` stämplar exakt det
fält bevakningsraden läser (`FALT_DELTAGARINFO_SKICKAD`). Mall och ämne finns
i `src/components/events/atgarder/atgardsmallar.ts:66-71`. Ytan är live på
`/atgarder` sedan `TASK-147.3`.

**Urvalet finns redan härlett.** `hem-derivations.ts:302` beräknar
`utanEventinfo` (bekräftade anmälningar som saknar Deltagarinfo-stämpeln) för
radens två lägen `ej-skickad` / `eftersalantrare`. Samma predikat bär svepets
mottagarurval — det ska inte härledas en andra gång.

**Precedent att följa:** `svepSend.ts:64` (`useSendSvep`) och `SvepOverlay.tsx`
bär redan hela kedjan för de två befintliga sveptyperna. `SVEP_RUBRIK` /
`ATGARD_NAMN` (`SvepOverlay.tsx:20-28`) är rena Record-utökningar.

### Öppen punkt som INTE ingår i denna skivas AC

Grillningens beslut 4 föreskrev copyn `"N **nya** deltagare saknar eventinfo"`
med uttrycklig motivering (*"ordet 'nya' friar Lotta från falsk
glömske-signal"*). Koden säger `"N deltagare saknar eventinfo"`
(`hem-derivations.ts:267`) — ordet försvann redan i prototypen och
promoverades vidare, utan bokförd motivering. **Marcus beslut om ordet ska
tillbaka är obesvarat (S107).** Faller beslutet att det ska tillbaka är det en
enradsändring som kan tas i denna landning; annars bokförs strykningen som
medveten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bevakningsraden bär onPress som öppnar svepytan med SvepTyp 'eventinfo'; mottagarurvalet är utanEventinfo för det klickade eventet, hämtat ur samma härledning som radens läge (hem-derivations.ts:302) och aldrig härlett en andra gång
- [ ] #2 Trygghetstriaden gäller oförändrat: adresslista grupperad per event, bläddringsbar förhandsvisning, testmail till sig själv, och SlideToConfirm-armering krävs före skarp sändning
- [ ] #3 Sändningen går via befintliga send-action-email med actionType 'eventinfo' — ingen ny Edge Function byggs (samma stoppvillkor som TASK-241.3 AC #1 tillämpade)
- [ ] #4 Efter genomfört svep speglar bevakningsraden det nya läget: raden försvinner när alla bekräftade bär stämpeln, annars kvarstår den i eftersalantrare-läget med korrekt kvarvarande antal
- [ ] #5 Aktivitetsloggen får en post per FAKTISKT skickad mottagare, samma form som de två befintliga sveptyperna (svepSend.ts:100-120)
- [ ] #6 Acceptance-täckning i send-klassen med samma skarv som bekräftelse- och påminnelsesvepen; ingen ny testskarv införs
- [ ] #7 Övergången hem↔sändyta är IDENTISK med de två befintliga sveptypernas (TASK-241.5, Hem.tsx:52-86) inklusive prefers-reduced-motion-respekten; resultatvyn redovisas per event-grupp och skickat-markörerna sätts på hemmets rader efteråt — Lotta ska inte kunna se att detta är en nyare sveptyp
- [ ] #8 Bevakningsradens eftersalantrare-copy uttrycker informationen FULLT UT enligt grillningens beslut 4 (ordet nya åter); radens layout får utökas med en rad för att rymma den, och formen ska vara snygg, ren och strukturerad (Marcus 2026-08-18). Renderingen MÄTS mot faktisk geometri vid 375 px och 1440 px — aldrig avläst ur en fullPage-screenshot — och prövas mot värsta-falls-fixturen i demoData.ts (långt eventnamn + X=12)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
