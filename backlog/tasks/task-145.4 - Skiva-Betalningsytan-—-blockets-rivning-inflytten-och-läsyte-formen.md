---
id: TASK-145.4
title: 'Skiva: Betalningsytan — blockets rivning, inflytten och läsyte-formen'
status: Done
assignee: []
created_date: '2026-08-07 09:00'
updated_date: '2026-08-07 15:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
parent_task_id: TASK-145
ordinal: 236000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta fäller ut betalningsytan under registret och läser en persons läge: vad som är betalt, vad som saknas, hennes egen notering i full bredd, och en tidslinje över vad som skickats och när. Ingenting går att skriva i — det hör till Åtgärds-sidan. En mottagen betalning visar sitt datum om basen känner det, annars bara att den är mottagen.

VÄG C (Marcus 2026-08-07): datumfälten och skrivvägen byggs i TASK-147. Denna skiva renderar bara det som finns. Att pillen står datumlös tills dess är korrekt, inte en brist.

Täcker användarberättelser: 15, 16, 17, 18, 19, 20, 21
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Betalningar som toppnivå-block är BORTA från eventsidan
- [x] #2 Arbetsytan är inflyttad under registret som LÄSYTA, fällbar, med deadline-badgen bevarad
- [x] #3 Formen följer anmälnings-detaljsidans grammatik: rubrik utanför, kort under, etikett dämpad vänster, värde primärt höger
- [x] #4 Personen bär en kortyta med namn och status utanför kortet
- [x] #5 Samtliga tomma inmatningsfält är rivna — ytan är för överblick
- [x] #6 Rött lämnar fältetiketten; fliknamnet bär redan den informationen
- [x] #7 Noteringen har egen rad i full bredd med symmetrisk luft, mätt i renderad DOM
- [x] #8 Utskickshistoriken renderas som tidslinje med klockslag, inte som klump i en värde-slot
- [x] #9 Höger-slotten (Saknas/Mottagen) är riven — krysset bar redan samma information
- [x] #10 Mottagen-pillen renderar datum NÄR domänmodellens fält bär värde, annars bara Mottagen; PROTO_MOTTAGEN_DATUM är riven ur kodbasen
- [x] #11 Rader som går att öppna har synlig hover
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [x] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
