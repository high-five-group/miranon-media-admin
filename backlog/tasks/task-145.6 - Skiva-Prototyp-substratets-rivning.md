---
id: TASK-145.6
title: 'Skiva: Prototyp-substratets rivning'
status: Done
assignee: []
created_date: '2026-08-07 09:02'
updated_date: '2026-08-09 07:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
  - TASK-145.2
  - TASK-145.3
  - TASK-145.4
  - TASK-145.5
parent_task_id: TASK-145
ordinal: 238000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Flaggan/variant-maskineriet för hållplats-prototypen rivs — inte prototypen i sig: den är redan PROMOVERAD till skarpa formen (ADR-103 B2 steg 1, TASK-162.2 åtgärds-ytan + TASK-162.3 registret). Rivningen (ADR-103 B2 steg 4) sker EFTER Marcus godkänner den promoverade ytan (TASK-162.5) — aldrig före (ADR-102 B3:s spärr, oförändrad). Regressionslåsets visual-baslinje tas om på den godkända ytan i samma fönster (ADR-103 B4). Samma ordning som familje-rivningen i task-18.13: substratet rivs sist, när formen står.

Täcker användarberättelser: 22, 23
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga variant-grenar för hållplats-prototypen är rivna ur produktionskoden (utgångsläge: 104 förekomster över sex filer)
- [x] #2 Fixtur-grenarna och proto-datalägets kodvägar är rivna; gruppdynamikens och anteckningarnas proto-grenar likaså
- [x] #3 Prototyp-växlarens post för hållplatsen är borttagen; växlaren själv är ORÖRD (stående komponent, ADR-074)
- [x] #4 En stale variant-URL degraderar till den skarpa vyn utan krasch och utan halvbyggd yta
- [x] #5 Vestigiala grenar som blivit strukturellt onåbara av rivningen är antingen borttagna eller öppet bokförda som kvarleva med skäl
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EJ BYGGD. Analyserad och kartlagd av samma agent som byggde 145.3 och 145.5.
Arbetet påbörjades, återställdes medvetet och pushades aldrig — se § VARFÖR.

PREMISS-DIVERGENS PÅ AC #1:s TAL (ADR-086)
"utgångsläge: 104 förekomster över sex filer" går INTE att reproducera mot
koden. Mätt 2026-08-07 på origin/main + 145.3 + 145.5:
- branch-symbolerna (protoVariant|protoDataMode|protoAktiv|variantParam|
  HallplatsVariant|isHallplatsVariant|HALLPLATS_PROTO): 128 rader över SJU
  filer — EventDetail 7, Belaggning 10, Betalningar 44, hallplats-steg-prototyp
  4, Anteckningar 14, Deltagare 39, Gruppdynamik 10.
- markören "[PROTOTYPE] [S93]": 90 förekomster över TIO filer.
Ingen kombination ger 104/sex. Talet var obelagt i uppdraget och saknas i
repot (grep over backlog/, tasks/, docs/ ger bara kortets egen rad).
REGELN styr, inte talet: samtliga variant-grenar rivs; slutmätningen redovisas.

FÄLLA SOM MÅSTE VETAS FÖRE BYGGET
`BetalningsDetaljer.protoAktiv` DEFAULTAR TILL FALSE. Att bara ta bort
`protoAktiv`-propen ur `Deltagare.tsx`s anrop (naturligt när proto-flaggorna
rivs) FLIPPAR betalningsytan tillbaka till den GAMLA SKRIVBARA formen —
BetalningsLinje med RAC Checkbox, Input för notering, påminn-mutation och
mailto-länk. Det river tyst både TASK-145.4 och TASK-145.5 AC #1.
`Betalningar.tsx` MÅSTE därför rivas i SAMMA commit: protoAktiv-grenen görs
ovillkorlig och `!protoAktiv`-grenarna raderas.

EXEKVERINGSKARTA, fil för fil (verifierad mot koden)
1. Deltagare.tsx — variant-A-render-grenen, unifiedSorted, registerListaA,
   hallplatsMarkeFn, protoVariant/protoDataMode-props, useQueryState-wiringen
   och fixtur-grenen. Flik-togglens `protoVariant !== 'a'`-villkor blir
   ovillkorligt. GJORT och typecheck-grönt i det återställda försöket.
2. EventDetail.tsx — HALLPLATS_PROTO_VARIANTS (AC #3), PrototypeSwitcher-
   monteringen, variantParam, AtgarderKort/SkrivUtKort-grenen. GJORT i försöket.
3. Betalningar.tsx — STÖRST (44 refs över fem komponenter). BetalningsLinje
   blir strukturellt onåbar när protoAktiv är ovillkorligt (BetalningsPersonRad
   rad 671 early-returnar före den) och ska raderas HELT, inklusive
   registrationPayments-mutationerna och mailto-länken (rad 513).
   `Betalningar`/`BetalningsInnehall` är redan overkallade sedan 145.4 — AC #5.
4. Belaggning.tsx / Anteckningar.tsx / Gruppdynamik.tsx — var sin oberoende
   `useQueryState`+`isHallplatsVariant`-läsning som byter datakälla till
   HALLPLATS_PROTO_FIXTURES. DE ÄR SJÄLVSTÄNDIGA: rivs de inte samtidigt som
   Deltagare.tsx försätter en stale `?variant=a&data=proto` sidan i BLANDLÄGE
   (fixturer i tre block, riktig data i registret) — exakt den halvbyggda yta
   AC #4 förbjuder. Alla tre måste in i samma commit.
5. DetaljGrupp.tsx (1 ref) och Atgarder.tsx (AtgarderKort/SkrivUtKort).
6. DeltagareHallplatsPrototyp.tsx — `RegisterFilterRad` blir onåbar och rivs;
   `HallplatsMarke`/`HallplatsToppA` är PRODUKTIONSKOD sedan 145.1/145.2 och
   måste överleva.
7. hallplats-steg-prototyp.ts — `HALLPLATS_PROTO_FIXTURES`, `HallplatsVariant`,
   `isHallplatsVariant` rivs. `hallplatsSteg`/`registerOrdning`/`stegTest`/
   `betalningsSplit`/`RegisterFilter`/`TOMT_REGISTER_FILTER`/`REGISTER_STEG_LABEL`
   är produktionskod och överlever. `vagInTest`/`VAG_IN_LABEL`/`VagInFilter`
   tappar sin enda konsument med RegisterFilterRad — AC #5-kandidater.
8. FILNAMNEN: båda filerna heter fortfarande *Prototyp*/*-prototyp trots att
   innehållet till största delen är produktionskod. Antingen `git mv` med
   import-uppdatering, eller öppet bokförd kvarleva per AC #5.

AC #3 — VÄXLAREN SJÄLV: `src/components/dev/PrototypeSwitcher.tsx` rörs ALDRIG.
Den bärs av andra prototyper (personer, check-in, dokument, och Åtgärds-sidans
pågående S100-pass). Det som rivs är eventsidans POST i den.

AC #4 — DEGRADERINGEN blir trivial när ingen fil längre läser `?variant`:
URL:en ignoreras och den skarpa vyn renderas. Kräver ett test.

VARFÖR DEN INTE BYGGDES
Skivan togs sist, som kortet föreskriver. Punkt 1 och 2 var gjorda och
typecheck-gröna när bedömningen gjordes att punkt 3–7 inte kunde färdigställas
OCH verifieras (mark-paid 22 test, event-detail 71 test, event-deltagare 15,
event-bekraftelse 16) med marginal. En halvriven substrat-rivning är bevisligen
sämre än ingen: punkt 4:s blandläge uppstår i just det mellantillståndet.
Arbetet återställdes därför i sin helhet (grenen raderad, aldrig pushad) och
kartan ovan skrevs i stället.

[TASK-162.4, ADR-103-bokföringssynk, 2026-08-08] Description omskriven: "riv prototypen" → "riv flaggan/variant-maskineriet EFTER Marcus godkänner den promoverade ytan (TASK-162.5)" (ADR-103 Konsekvenser + B2 steg 4). DoD #6 omskriven till "Baslinje omtagen EFTER godkänd promovering (ADR-103 B4)" av samma skäl som TASK-145.3/145.5. Kortet FÖRBLIR blocked (label oförändrad) — godkännandet (TASK-162.5) är den faktiska gaten, inte en dependency-kant i detta pass (STOPPA-vid-scope-tvekan: en cross-PRD-beroendekant lades INTE till, ej efterfrågad av uppdraget).

VARNING TILL FRAMTIDA UTFÖRARE: § EXEKVERINGSKARTAN ovan skrevs FÖRE TASK-162.2/162.3:s landade promovering och beskriver Deltagare.tsx/EventDetail.tsx-stegen (punkt 1–2) mot ett kodläge som delvis inte längre finns i sin ursprungliga form — 162.3 har redan rivit protoVariant-tråden ur ArbetsKo på ett ANNAT sätt än kartan beskriver (protoVariant-propen, hallplatsMarkeFn, flik-statet är redan borta). Variant-villkorets UTANFÖR-maskineri (?variant=-läsningen i EventDetail.tsx, isHallplatsVariant, switchern, protoDataMode) är dock uttryckligen ORÖRT av 162.2/162.3 och återstår att riva. Punkt 3–8 (Betalningar.tsx, Belaggning/Anteckningar/Gruppdynamik, DeltagareHallplatsPrototyp.tsx, hallplats-steg-prototyp.ts) rör block 162.2/162.3 inte vidrörde och är sannolikt fortfarande giltiga — men mät om mot faktisk kod före exekvering (ADR-086), lita inte blint på kartan.

AVBLOCKERAD 2026-08-08: godkand-fältet stämplat av Marcus via !-kanalen (av: marcus, datum: 2026-08-08, sha: 590e600c, citat i manifestet) — ADR-102 B3-spärren är uppfylld, check-facit grön (0 ogodkända). Rivningen fri att plockas.

[BYGGD, 2026-08-08] Rivningen genomförd i sin helhet. ADR-086-omätning mot
faktisk kod (per VARNING-noten ovan) gav TVÅ verifierade divergenser mot
gamla EXEKVERINGSKARTAN:

1. AC #1:s tal (104/sex filer) förblir OBELAGT — repo-sökning gav samma
   nollträff som tidigare bokfört. Slutmätning: FÖRE rivning matchade
   `protoVariant|protoDataMode|protoAktiv|variantParam|HallplatsVariant|
   isHallplatsVariant|HALLPLATS_PROTO` 128 rader över 11 filer (varav 2 helt
   OBERÖRDA — PrototypeSwitcher.tsx: egen generisk `variantParam`-prop, inte
   hållplats-specifik; narvaro.tsx: S90 check-in-prototypens EGEN variant a/b/c,
   annan prototyp). EFTER rivning: 0 levande träffar (endast `[RIVEN, ...]`-
   kommenterad historik) i de 9 faktiskt berörda filerna.

2. Punkt 6:s påstående "RegisterFilterRad blir onåbar och rivs" var FEL mot
   faktisk kod — TASK-162.2/162.3:s promovering gjorde RegisterFilterRad till
   LIVE, PERMANENT UI (importerad och renderad i Deltagare.tsx:s register-
   filterpanel), inte onåbar. Punkt 7:s följdslutsats ("vagInTest/VAG_IN_LABEL/
   VagInFilter tappar sin konsument") var därmed också fel — samtliga tre
   används fortsatt av RegisterFilterRad. INGET av detta rördes.
   DeltagareHallplatsPrototyp.tsx krävde noll kodändringar (inga variant-
   grenar i filen själv, grep-verifierat) — bara docblock-uppdatering (AC #5).

FAKTISK RIVNINGSKARTA (avviker från gamla kartan i scope, inte i regel):
- EventDetail.tsx: HALLPLATS_PROTO_VARIANTS, variantParam-state,
  PrototypeSwitcher-monteringen rivna. AtgarderKort/SkrivUtKort-grenen var
  redan ovillkorlig sedan TASK-162.2 (oberörd av denna skiva).
- Deltagare.tsx: protoVariant/protoDataMode-beräkningen + fixtur-early-return
  i `Deltagare()`, protoDataMode-trådningen genom `ArbetsKo`/
  `BorOverKrysslage`/`BorOverRad` rivna.
- Betalningar.tsx (störst, 803 rader netto −642): `BetalningsLinje` (skrivbar
  kryss+notering+mailto-påminn-raden) raderad HELT inkl.
  registrationPayments-mutationerna (useSetPaymentStatus/
  useUpdatePaymentNote/useLogPaymentReminder) — DoD #7 håller mekaniskt
  (ingen kod kvar som kan skriva). `BetalningsPersonRad`s gamla (!protoAktiv)
  render-gren raderad, promoverade grenen (BetalningsLasRad ×2 + Tidslinje)
  görs OVILLKORLIG. AC #5: `Betalningar`/`BetalningsInnehall` — redan
  overkallade sedan TASK-145.4 (noll live-importer, grep-verifierat) och
  vars enda kod var protoAktiv-läsningen — RADERADE, inte bara bokförda
  (löser AC #1 och AC #5 i samma drag). Kaskaderande dead code som blev
  synligt EFTER dessa rivningar (arAktiv, SaknasDelta, paminnelseText,
  historik/utskick-beräkningen, harPaminnelse i hallplats-steg-prototyp.ts)
  raderat i samma commit — allt bekräftat 0 konsumenter via grep före
  radering.
- Belaggning.tsx/Anteckningar.tsx/Gruppdynamik.tsx: var sin
  protoDataMode-beräkning + fixtur-gren rivna (Gruppdynamik: `HALLPLATS_
  PROTO_FIXTURES`-branch; Belaggning: `protoBelaggningsDelar`-funktionen
  hel raderad; Anteckningar: `Composer`s protoDataMode-guards).
- hallplats-steg-prototyp.ts (366 rader netto −): `HallplatsVariant`,
  `isHallplatsVariant`, `HALLPLATS_PROTO_FIXTURES` + `bas()`-hjälparen +
  `harPaminnelse` raderade. `hallplatsSteg`/`registerOrdning`/`stegTest`/
  `vagInTest`/`betalningsSplit`/`kategoriPillText`/`RegisterFilter`-familjen
  ORÖRD (produktionskod, verifierat via faktiska importer i Deltagare.tsx +
  DeltagareHallplatsPrototyp.tsx, inte antaget).
- DeltagareHallplatsPrototyp.tsx / hallplats-steg-prototyp.ts: docblocken
  omskrivna (kastbar → produktionskod, filnamnet en öppet bokförd kvarleva,
  AC #5 punkt 8) — noll kodändringar i förstnämnda.
- Atgarder.tsx: en kommentar uppdaterad (pekade framåt mot denna skiva).

AC #4 (nytt test): två Playwright-tester i eventsida-promoverings-grind.spec.ts
— `?variant=a&data=proto` och okänd `?variant=z` renderar båda BYTE FÖR BYTE
samma ariaSnapshot som ingen-query-läget (atgarder-kort.aria.yml +
register-default.aria.yml). Gröna.

SPEC-OMSKRIVNING (uppdragets krav): eventsida-promoverings-grind.spec.ts
skrevs om från variant-mot-promoverad-PAR till REGRESSIONSLÅS — variant-halvan
(`gotoVariantA`, `?variant=a&data=verklig`) riven (maskineriet den förutsatte
finns inte längre); alla SEX ariaSnapshot-tester (åtgärds-kort ×2 +
register ×4) körs nu mot `gotoPromoverad` med DE OFÖRÄNDRADE incheckade
referensfilerna. 26/26 gröna (visual-desktop + visual-mobile), inklusive
axe-svit — bevisar mekaniskt att rivningen inte ändrat formen (DoD #5,
ariaSnapshot-halvan).

DoD #5 (facit-bilder): ariaSnapshot-grinden täcker INTE betalningsarbetsytan/
gruppdynamik/anteckningar (uttryckligen exkluderade ur den lokatorn, se
spec-docblocket). Verifierat separat med en TEMPORÄR debug-spec (skärmdump av
seedad eventsida, öppnad Betalningsdetaljer) jämförd manuellt mot
facit-betalningar-arbetsytan.png och facit-gruppdynamik.png — strukturellt
identisk (kort-yta, namn+status-pill, två läs-kryss-rader, notering, tom
utskickslogg-text ordagrant lika; talen skiljer sig eftersom facit använde
14-postersfixturen och min körning den 5-posters dev-fixturen — förväntat,
inte en avvikelse). Debug-specen + skärmdumpen raderade efter granskning,
ingår inte i diffen.

DoD #7 (skrivvägs-frånvaron): mekaniskt SANT (BetalningsLinje — enda platsen
som någonsin kunde skriva — är raderad, noll mutationer kvar i Betalningar.tsx
efter rivningen) men INTE avbockad här: det befintliga staging-e2e-beviset
(mark-paid.staging.test.ts, event-deltagare.staging.test.ts, redan gröna
sedan TASK-145.4) körs inte lokalt (5173-förbudet) och jag har inte
re-verifierat dem mot denna commit. Lämnas till post-merge-CI, i stället för
att påstå ett mätt-grönt jag inte mätt.

DoD #8 (Mottagen-datum-uppslagstabellen): `PROTO_MOTTAGEN_DATUM`
grep-verifierad ur src/ — noll levande träffar (bara historiska kommentarer).
Var redan riven sedan TASK-145.4; avbockad här som en ren verifiering.

DoD #3 (CI grön per jobb) och DoD #6 (baslinje omtagen) lämnas OAVBOCKADE per
uppdraget — CI-verifiering och baslinje-omtagning ägs av orkestreraren
post-merge.

Grindar körda lokalt, alla gröna: typecheck (tsr generate + tsc -b), biome
check . (0 fel, samma 6 varningar/27 infos som baslinjen — inga nya),
npm run build, npm run test:api (465/465), npm run test:visual mot
eventsida-promoverings-grind.spec.ts (26/26), acceptance-delmängd
event-anmalda + event-anteckningar (14/14). check-facit grön (0 ogodkända)
både före och efter rivningen.

KÄND, EJ ÅTGÄRDAD STALENESS (bokförd öppet, utanför scope): två filer
UTANFÖR denna rivnings direkta yta refererar hållplats-maskineriet i
historiska kommentarer utan att importera det — AtgardsSida.tsx rad
2577/2583 (en redan-reverterad VARV 12-historik som nämner Betalningar.tsx
radnummer, vilka nu kan ha flyttat) och mer/index.tsx rad 50 (en
design-precedent-kommentar för TASK-164:s dokument-prototyp som pekar på
EventDetail.tsx:349ff, en radreferens som inte längre existerar). Ingen av
filerna innehöll levande variant-kod (grep-verifierat) — att ändra dem hade
lagt orelaterade filer i diffen (DoD #4).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rivningen byggd och mergad som PR #1026 (5fc1cb59): variant-grenarna rivna (−1475 rader netto, 11 filer), växlaren orörd (ADR-074), stale-URL-degradering bevisad med två nya tester, regressionslåsets ariaSnapshot-tester gröna mot OFÖRÄNDRADE referenser (formen orörd av rivningen — ADR-103 B4). Rivningen skedde EFTER Marcus stämpel via ADR-104-kanalen (av/datum/citat/sha i manifestet, check-facit 0 ogodkända). DoD #3: post-merge på 5fc1cb59 HELT grön inkl. staging. DoD #6: visual-baslinjen omtagen post-merge (run 31279357710 → PR #1027, 2 bilder = eventsidan × 2 vyportar, Marcus-välsignad och mergad 3f716ee5). DoD #7: skrivvägs-frånvarons staging-bevis gröna i samma post-merge-körning. EVENTSIDAN ÄR DÄRMED KLAR: promoverad, godkänd, riven, regressionslåst.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 Baslinje omtagen EFTER godkänd promovering (ADR-103 B4)
- [x] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
