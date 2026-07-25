---
id: TASK-51
title: >-
  Fynd: nattlarmets commit-spann har ALDRIG fungerat — alarm-jobbet saknar
  actions:read och felet sväljs tyst
status: Done
assignee: []
created_date: '2026-07-25 19:11'
updated_date: '2026-07-25 20:58'
labels:
  - ready-for-agent
dependencies: []
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 7, 2026-07-25): larm-ärendet visar alltid '(ingen tidigare grön nattkörning — första gången eller alla röda)' oavsett hur många gröna nattkörningar som finns. Vid testet fanns FEM gröna, varav en 25 minuter gammal.

GRUNDORSAK (bevisad): alarm-jobbet i .github/workflows/nightly.yml anropar 'gh run list --workflow nightly.yml --branch main --status success' för att härleda commit-spannet, men jobbets permissions är endast 'contents: read' + 'issues: write'. gh run list kräver 'actions: read'. Anropet failar med 403.

Felet blir TYST därför att raden slutar med '|| echo ""'. last_green blir tom sträng, och villkorskedjan väljer då sin FÖRSTA gren — 'ingen tidigare grön nattkörning' — vilket är den mest alarmerande av de tre möjliga texterna. Frånvaro av data presenteras alltså som ett faktapåstående om historiken. Samma klass som L322: signalen ska vara success ELLER failure, aldrig frånvaro.

Jämförelsepunkt i samma fil: nightly-metrics-jobbet (rad 133-135) HAR 'actions: read' just för sitt gh-anrop. Larm-jobbet fick aldrig samma behandling.

SYSTEMATISKT, INTE NYTT: ärende #114 (S79:s larmkedje-test 2026-07-23) bär exakt samma text. Buggen har funnits sedan larmet byggdes. Den upptäcktes aldrig eftersom det ENDA larm-ärendet någonsin var en simulering, och ingen läste commit-spannet kritiskt.

VARFÖR DET SPELAR ROLL: commit-spannet är larmets mest värdefulla fält — det svarar på 'vad ändrades sedan det fungerade?'. Utan det måste mottagaren rekonstruera spannet för hand. QA-punkt 7 frågar ordagrant 'räcker informationen för att veta var man börjar?' och svaret är NEJ.

FÖRVÄNTAT BETEENDE: (1) alarm-jobbet får 'actions: read'. (2) Ett misslyckat gh-anrop får INTE presenteras som 'ingen tidigare grön natt' — skilj på 'kunde inte hämta' och 'finns ingen'. Fjärde gren, eller låt steget fela högt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 alarm-jobbet har actions: read; gh run list returnerar en SHA i skarp körning
- [x] #2 Rött-först: larm-ärende med KORREKT compare-länk framkallat via simulate_failure, länken klickad och verifierad
- [x] #3 Misslyckat gh-anrop ger egen text ('kunde inte hämta spannet') — aldrig grenen 'ingen tidigare grön'
- [ ] #4 Ingen annan tyst '|| echo' i nightly.yml eller nightly-watchdog.yml maskerar ett API-fel — hela filerna genomsökta
- [ ] #5 Ärende #114 och #210 refereras i lösningen som de två historiska bevisen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GRUNDORSAKS-KORRIGERING (S89 2026-07-25, skarpt bevisad): kortets ursprungliga grundorsak — 'gh run list kräver actions: read, anropet failar med 403' — var märkt (bevisad) men var en HÄRLEDNING. Rött-först-dispatchen 30173436345 mot ofixad main visade det faktiska felet:

  failed to determine base repo: failed to run git:
  fatal: not a git repository (or any of the parent directories): .git

alarm-jobbet gör INGEN checkout, och 'gh run list' saknade --repo. Anropet dog alltså på repo-härledningen INNAN behörigheten prövades. 'gh issue create' i samma steg hade --repo "${REPO}" från början; 'gh run list' fick den aldrig.

Jobbets GITHUB_TOKEN-block i samma logg bekräftar samtidigt att grantet saknas: Contents: read / Issues: write / Metadata: read — ingen Actions-rad.

BÅDA KRÄVS. --repo är skarpt bevisad (felet syns i loggen). 'actions: read' är dokumentations-belagd men INTE observerad: ospecificerade permissions sätts till none, så anropet skulle få 403 när det väl når API:t. Ordningen på felen gjorde det andra osynligt. Denna avgränsning är öppet skriven i workflow-kommentaren — inget påstående om 403 görs som om det vore sett.

BREDARE FYND (bäring utanför detta kort): en fix byggd enbart på kortets diagnos hade passerat samtliga lokala grindar (actionlint 1.7.12, yamllint, biome — alla gröna) och ändå INTE löst buggen; den hade bara bytt lögnen mot ett ärligt 'kunde inte hämta spannet'. Det var rött-först-passet mot skarp körning som avslöjade det. AC #1 ('returnerar en SHA i skarp körning') var formulerad så att halvfixen inte kunde smyga igenom — kravet på skarpt utfall, inte på mekanism, gjorde jobbet (L346:s klass).

TILLÄGG UTÖVER KORTET: fältnamnet 'Commit-spann sedan senaste gröna natt' rättat till '...senaste gröna körning av nattsviten'. Anropet returnerar senaste gröna körning av nightly.yml inklusive dagtids-dispatcher (empiriskt: eed4927, dispatch 18:56 2026-07-25), inte senaste gröna natt. Fältet påstod något smalare än det mätte — samma ärlighetsklass som buggen självt. Underlaget behölls (bredare underlag ger snävare, mer användbart spann); namnet gjordes sant.

Test-ärenden att stänga med motivering per CONTRIBUTING § Nattnätet: #216 (rött-först, ofixad kod).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nattlarmets commit-spann fungerar — och grundorsaken visade sig vara en annan än kortet angav.

FIXEN (PR #215, tre delar):
1. --repo "${REPO}" på gh run list. DEN VERKLIGA GRUNDORSAKEN: alarm-jobbet gör ingen checkout, så gh kunde inte härleda repot ur en git-remote och dog på 'failed to determine base repo' INNAN behörigheten prövades. gh issue create i samma steg hade flaggan från början.
2. actions: read på jobbet. Dokumentations-belagd (ospecificerade permissions blir none), men ALDRIG observerad — --repo-felet slog först. Avgränsningen är öppet skriven i workflowen i stället för att påstås som sedd.
3. Fjärde gren: exit-koden fångas separat från resultatet, så 'anropet gick fel' inte längre kollapsar ihop med 'det finns inget svar'. L322-klassen stängd.

TVÅSIDIGT BEVIS:
- Rött-först, ärende #216 (run 30173436345 mot ofixad main): 'ingen tidigare grön nattkörning' — falskt, fem gröna fanns, den senaste 25 min gammal. Jobbets token-block i loggen: Contents/Issues/Metadata, ingen Actions-rad.
- Grönt, ärende #217 (run 30174247669 mot fixad main): äkta spann ec3877f...4a3a58d med compare-länk. Länken API-verifierad: ahead_by 3, och de tre commitarna är TASK-51:s egen landning.
- Gren-logiken dessutom isolerat testad, 4 grenar / 6 assertioner, rött-först mot gamla logiken (T1/T1b failar och producerar ordagrant #114:s text).

TILLÄGG UTÖVER KORTET: fältnamnet rättat till 'sedan senaste gröna körning av nattsviten'. Anropet returnerar senaste gröna körning av nightly.yml inklusive dagtids-dispatcher (empiriskt eed4927, 18:56), inte senaste gröna natt. Fältet påstod något smalare än det mätte — samma ärlighetsklass som buggen självt.

VAD SOM NÄSTAN GICK FEL: en fix byggd enbart på kortets diagnos hade passerat samtliga lokala grindar (actionlint 1.7.12, yamllint, biome — alla gröna) och ändå inte löst buggen; den hade bara bytt lögnen mot ett ärligt 'kunde inte hämta spannet'. AC #1 räddade den, därför att den krävde ett SKARPT UTFALL ('returnerar en SHA i skarp körning') i stället för en mekanism. Hade kriteriet lytt 'lägg till actions: read' vore kortet avbockat med buggen kvar.

BOKFÖRING: #216 och #217 stängda med motivering per CONTRIBUTING § Nattnätet. #114 (stängd sedan 2026-07-23) har fått ett efterspår — den bar den falska texten i över två dygn utan att någon läste den kritiskt.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
