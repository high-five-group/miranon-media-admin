---
id: TASK-127.6
title: 'Skiva: Accept-sidan — lösenord enligt ASVS-golvet'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 15:54'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den nya publika sidan där inbjudan landar: e-postadressen förifylld och oredigerbar, mottagaren sätter lösenord enligt ASVS-golvet med snäll svensk vägledning, engångstoken hanteras korrekt (utgången eller redan använd länk ger ett vänligt läge som pekar mot omskick). Formen följer prototyp-facit.

Täcker användarberättelser: 2, 3, 4, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E-postfältet är förifyllt och låst — kan inte ändras via UI eller manipulerad request
- [ ] #2 Lösenordsgolvet upprätthålls: minst 8 tecken med 15 rekommenderat, kontroll mot läckta lösenord, pedagogisk svensk vägledning
- [ ] #3 Utgången eller förbrukad länk ger vänligt felläge med väg framåt — aldrig rå felkod
- [ ] #4 Acceptance- och a11y-sviterna gröna på sidans alla tillstånd
- [ ] #5 Prototyp-facit följt
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGKRAV UR PROTOTYP-PASSET (TASK-127.2 divergensfas, 2026-08-03) — variant-oberoende, gäller oavsett vilken variant Marcus väljer.

SKARP BUGG FÅNGAD OCH DIAGNOSTISERAD i prototypen: efter ett misslyckat inloggningsförsök kunde nästa försök med RÄTT lösenord aldrig slutföras — submit-handlern eldade aldrig, tyst och reproducerbart.

ROTORSAK: React Arias default validationBehavior="native" speglar isInvalid/errorMessage via input.setCustomValidity(...). Webbläsaren rensar den strängen ENDAST vid en lyckad native submit — inte för att värdet ändras. Nästa submit blockeras därför av webbläsarens EGEN constraint-validering INNAN onSubmit hinner köra; input.validity.customError är fortfarande true trots ett giltigt nytt värde.

ÅTGÄRD I PROTOTYPEN: validationBehavior="aria" på lösenordsfältet. Bevisat i båda riktningar — felet reproducerat två gånger, fixen applicerad, därefter verifierat skarpt (fel → felmeddelande → nytt lösenord → lyckad övergång) på BÅDA skärmarna, som delar samma lösenordsfält-komponent.

VARFÖR DETTA STÅR HÄR: prototypkod befordras aldrig (throwaway-kontraktets klausul iv) — den skarpa implementationen skrivs nyskriven i denna skiva. Utan denna not återintroduceras buggen med hög sannolikhet, eftersom den bara syns vid ANDRA försöket och inte fångas av ett test som prövar ett enda felaktigt försök.

TESTKRAV SOM FÖLJER: sviten ska pröva sekvensen fel → rätt, inte bara fel. Ett test som slutar vid det första felmeddelandet hade varit grönt genom hela buggen.

BYGGKRAV UR KONVERGENSFASEN (Marcus, 2026-08-03), verbatim: "Och i den skarpa versionen så ska man INTE behöva scrolla, ALLT ska synas på skärmen."

GÄLLER DEN SKARPA IMPLEMENTATIONEN, inte bara prototypen. Hela innehållet ska rymmas inom viewporten utan vertikal scroll.

VAD SOM GÖR KRAVET SVÅRT, och som måste mätas i stället för antas:
- Accept-sidan bär mest innehåll (rubrik, kontextstycke, tre punkter, fyra formulärfält, knapp) och spränger höjden först.
- På mobil staplas spalterna; bild + text + formulär i en kolumn ryms sannolikt inte utan att något ger vika.
- Med mjukt tangentbord uppe krymper synlig yta ofta till omkring halva viewporten. Ett falt som "syns" i tom viewport gor det inte nar anvandaren skriver. Detta ar det verkliga testfallet, inte den tomma sidan.

GRÄNSEN: kravet far ALDRIG uppfyllas genom att bryta ett annat golv - typsnitt under lasbarhetsgransen, borttagna fokusmarkeringar eller komprimerade traffytor under 44px. Ryms det inte: eskalera till Marcus med matt underlag om vad som sprangs, inte en tyst kompromiss.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
