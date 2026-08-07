---
id: TASK-145.6
title: 'Skiva: Prototyp-substratets rivning'
status: To Do
assignee: []
created_date: '2026-08-07 09:02'
updated_date: '2026-08-07 17:16'
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
Prototypen har gjort sitt — den skarpa eventsidan ÄR nu den form Marcus låste. Substratet rivs sist, när formen står, aldrig före. Samma ordning som familje-rivningen i task-18.13.

Täcker användarberättelser: 22, 23
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga variant-grenar för hållplats-prototypen är rivna ur produktionskoden (utgångsläge: 104 förekomster över sex filer)
- [ ] #2 Fixtur-grenarna och proto-datalägets kodvägar är rivna; gruppdynamikens och anteckningarnas proto-grenar likaså
- [ ] #3 Prototyp-växlarens post för hållplatsen är borttagen; växlaren själv är ORÖRD (stående komponent, ADR-074)
- [ ] #4 En stale variant-URL degraderar till den skarpa vyn utan krasch och utan halvbyggd yta
- [ ] #5 Vestigiala grenar som blivit strukturellt onåbara av rivningen är antingen borttagna eller öppet bokförda som kvarleva med skäl
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
