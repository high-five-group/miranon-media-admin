---
id: TASK-241.8
title: 'Skiva: Eventinfo-svepet — bevakningsraden bär handling'
status: To Do
assignee: []
created_date: '2026-08-18 10:57'
updated_date: '2026-08-18 11:30'
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
(`tasks/sessions/archive/2026-08/2026-08-10-session-102.md:726-727`).

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
- [x] #1 Bevakningsraden bär onPress som öppnar svepytan med SvepTyp 'eventinfo'; mottagarurvalet är utanEventinfo för det klickade eventet, hämtat ur samma härledning som radens läge (hem-derivations.ts:302) och aldrig härlett en andra gång
- [x] #2 Trygghetstriaden gäller oförändrat: adresslista grupperad per event, bläddringsbar förhandsvisning, testmail till sig själv, och SlideToConfirm-armering krävs före skarp sändning
- [x] #3 Sändningen går via befintliga send-action-email med actionType 'eventinfo' — ingen ny Edge Function byggs (samma stoppvillkor som TASK-241.3 AC #1 tillämpade)
- [x] #4 Efter genomfört svep speglar bevakningsraden det nya läget: raden försvinner när alla bekräftade bär stämpeln, annars kvarstår den i eftersalantrare-läget med korrekt kvarvarande antal
- [x] #5 Aktivitetsloggen får en post per FAKTISKT skickad mottagare, samma form som de två befintliga sveptyperna (svepSend.ts:100-120)
- [x] #6 Acceptance-täckning i send-klassen med samma skarv som bekräftelse- och påminnelsesvepen; ingen ny testskarv införs
- [ ] #7 Övergången hem↔sändyta är IDENTISK med de två befintliga sveptypernas (TASK-241.5, Hem.tsx:52-86) inklusive prefers-reduced-motion-respekten; resultatvyn redovisas per event-grupp och skickat-markörerna sätts på hemmets rader efteråt — Lotta ska inte kunna se att detta är en nyare sveptyp
- [x] #8 Bevakningsradens eftersalantrare-copy uttrycker informationen FULLT UT enligt grillningens beslut 4 (ordet nya åter); radens layout får utökas med en rad för att rymma den, och formen ska vara snygg, ren och strukturerad (Marcus 2026-08-18). Renderingen MÄTS mot faktisk geometri vid 375 px och 1440 px — aldrig avläst ur en fullPage-screenshot — och prövas mot värsta-falls-fixturen i demoData.ts (långt eventnamn + X=12)
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
STOPP-VILLKOR (AC #3) — UTFALL: räckte utan ny EF. `send-action-email` bar redan `eventinfo` som `actionType` (schema + `_shared/send-action-email.ts:366-367` stämplar `FALT_DELTAGARINFO_SKICKAD`), och `ATGARDER` (`atgardsmallar.ts`) bar redan en `eventinfo`-post med mall+ämne. Klient-plumbing enbart: `SvepTyp` utökad, `eventinfoSvepUrval` tillagd, `Bevakningsrad` fick `onOppna`, `Hem.tsx` ny state + tredje overlay-gren.

PREMISS-AVVIKELSER (ADR-086), mot uppdragets källmärkta påståenden:
- Bevakningsrad.tsx:100-103 — button låg på rad 103-106 vid granskning (offset ~3), oskyldig glidning.
- "Urvalet finns redan härlett" (hem-derivations.ts:302) — DELVIS FEL: `utanEventinfo` på rad 302 var en LOKAL variabel inuti `bevakningar()`, aldrig returnerad/exponerad — bara dess `.length` bevarades i `BevakningRad.antalUtanEventinfo`. Den FAKTISKA registrerings-listan fanns ingenstans att återanvända. Löst genom att extrahera predikatet till en ny exporterad `eventinfoMottagare(regs, eventId)` i hem-derivations.ts, konsumerad av BÅDE `bevakningar()` (ersätter den gamla inline-filtreringen) och `svep-urval.ts § eventinfoSvepUrval` — AC #1:s "aldrig härlett en andra gång" hålls, men mekaniken skiljer sig från vad uppdraget beskrev.
- Övriga sex premisser (send-action-email, atgardsmallar, svepSend/SvepOverlay-precedent, Hem.tsx-montering) stämde exakt mot fil:rad.

MITT-I-BYGGET-TILLÄGG FRÅN MARCUS (två meddelanden, 2026-08-18):
1) Paritetskrav: eventinfo-svepet ska vara OSKILJBART från de andra två (samma SvepOverlay-instans/tre lägen/SlideToConfirm/grön-regel/avbryt, samma WOW-övergång, samma resultatform, samma onSkickat-mönster). Löst genom att INTE bygga en parallell overlay — samma <SvepOverlay svepTyp="eventinfo"> som de andra två, alla WOW/transition/resultatform-mekanik ärvs gratis. `onSkickat` wiring: se öppen fråga nedan.
2) Gräns 4 (copy-strängen orörd) UPPHÄVDES: "nya" återinfört i eftersläntrare-formen (`bevakningStatusText`). Geometri MÄTT (inte skärmdump) mot permanenta värsta-fall-fixturen (91-tecken namn + X=12): 375px scrollHeight/clientHeight 24/24 (en rad), 1440px 48/48 (två rader, EXAKT fyllt, ingen marginal kvar — X=12 är gränsen denna form bär utan ny klippning, X≥100 overifierat). Ingen layoutändring behövdes — befintlig line-clamp-2 bar strängen. Ny geometri-test i hem.acceptance.test.ts (2 fall, 375/1440px).

ÖPPEN FRÅGA TILL MARCUS — onSkickat-parity vs Bevakningsradens låsta asymmetri: NyaAnmalningar/ForfallnaBetalningar visar ett PERSISTENT "skickat"-kvitto (nyligenSkickade/nyligenPaminda, egna listrader) efter sänt svep — Bevakningsradens EGEN docblock låser motsatsen ("HELT OSYNLIG vid noll träffar... inget kvitto... asymmetrin är Marcus-låst"). Jag har INTE byggt en ny kvitto-lista (hade motsagt den låsningen). Jag HAR wired onSkickat: Hem.tsx håller `nyligenEventinfoSkickade` (Set med server-bekräftade reg-ID:n ur onSkickat) och applicerar den LOKALT ovanpå registrationsQuery.data innan bevakningar() körs — deterministisk radspegling (AC #4: rad försvinner/uppdateras direkt vid stängning) UTAN att vänta in cache-refetchens kappspring. Detta är samma ARKITEKTUR (onSkickat → lokalt minne → derivation) men INTE samma SYNLIGA form (ingen ny receipt-rad). Om Marcus vill ha en synlig "Eventinfo skickad"-markör ändå: flagga tillbaka, det är en ren tilläggsändring ovanpå detta.

RÖRDA FILER:
- src/components/hem/hem-derivations.ts — eventinfoMottagare (ny, delad), bevakningStatusText ("nya"), bevakningar() konsumerar den nya funktionen.
- src/components/svep/types.ts — SvepTyp + 'eventinfo'.
- src/components/svep/svep-urval.ts — eventinfoSvepUrval (ny).
- src/components/svep/SvepOverlay.tsx — SVEP_RUBRIK/ATGARD_NAMN + eventinfo, tom-läge-text, SlideToConfirm-label, tre-vägs ternaries.
- src/components/hem/Bevakningsrad.tsx — onOppna-prop, <button> → react-aria <Button> (onPress), docblock uppdaterad + geometri-mätning bokförd.
- src/components/hem/Hem.tsx — eventinfoEvent-state, eventinfoGrupper, nyligenEventinfoSkickade + bevakningRegs-overlay, tredje SvepOverlay-gren, Modal onOpenChange nollställer båda.
- tests/acceptance/hem.acceptance.test.ts — copy-assertion uppdaterad ("nya"), ny geometri-svit (375/1440px).
- tests/acceptance/svep-eventinfo-send.acceptance.test.ts — NY, mirror av svep-bekraftelse-send/svep-paminnelse-send (AC #1-5 + avbryt), samma skarv, ingen ny testinfrastruktur.

VERIFIERAT: typecheck 0 fel, biome 0 fel (repo-brett, pre-existing warnings orörda av mig), build grön, test:api 920/920, test:acceptance för de tre svep-filerna + hem.acceptance.test.ts + reduced-motion-syskontest = 43/43 gröna (ingen regression i bekräftelse-/påminnelsesvepen).
<!-- SECTION:NOTES:END -->
