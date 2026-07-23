---
id: TASK-36.8
title: 'QA: Manuell testplan — riskanpassad CI mot verkligt arbetsflöde'
status: To Do
assignee: []
created_date: '2026-07-23 17:15'
labels:
  - ready-for-human
dependencies:
  - TASK-36.1
  - TASK-36.2
  - TASK-36.3
  - TASK-36.4
  - TASK-36.5
  - TASK-36.6
  - TASK-36.7
parent_task_id: TASK-36
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell prövning av att vågen gör vad den lovar i verkligt arbete, inte bara i sina egna bevis. Utförs av Marcus efter att samtliga skivor landat.

TESTPLAN

1. Snabbfilen i skarpt bruk. Gör en ren stiländring (t.ex. justera ett färgtoken), öppna PR. Förväntat: svar på ett par minuter i stället för tio plus kö; staging-jobbet skippat; lint, snabbtester och a11y körda. Notera faktisk tid från push till grönt.

2. Snabbfilen får inte gälla för mycket. Gör en ändring som rör BÅDE en stilmall och en komponentfil i samma commit. Förväntat: full svit. Kontrollera särskilt att stilmallen inte "drog ned" risken.

3. Infrastruktur kan aldrig bli lågrisk. Ändra en rad i CI-konfigurationen tillsammans med en CSS-rad. Förväntat: full svit.

4. Dedupen i verkligt merge-flöde. Låt en PR bli grön och mergas med auto-merge. Förväntat: main-körningen hoppar över de tunga jobben och blir grön ändå; nästa PR i kön kommer igång märkbart snabbare. Jämför mutex-väntan mot tidigare.

5. Dedupen vågar inte gissa. Gör en merge där något skiljer (t.ex. en branch som inte var up-to-date, eller en manuellt justerad merge). Förväntat: full svit — dedupen ska hellre köra i onödan.

6. Nattnätet i praktiken. Avfyra nattkörningen manuellt. Förväntat: hela sviten körs; grön körning ger inget ärende och inget skräp.

7. Larmkedjan när något faktiskt går sönder. Avfyra nattkörningen mot ett läge där något är rött. Förväntat: ett tilldelat ärende dyker upp med länk till körningen och rätt commit-spann. Läs ärendet som om du vaknat till det: räcker informationen för att veta var man börjar?

8. Grinden stoppar faktiskt en merge. Avfyra gate-proof-workflowen. Förväntat: paraply-checken blir failure, inte skipped. Detta är beviset på att S77:s incident inte kan upprepas.

9. Rött-först i nytt bärarskick. Gör en liten TDD-ändring enligt det nya kontraktet. Förväntat: det röda varvet syns som citerat lokalt körutdrag; ingen röd körning i den delade kön; det känns inte krångligare än förut. Om det gör det — säg det, för då är kontraktet fel skrivet.

10. Siffrorna. Kör mätskriptet. Förväntat: ledtid, kötid och dedup-träffkvot går att läsa och jämföra mot utgångsvärdet. Blev det mätbart bättre?

11. Visuell regression. Gör en avsiktlig liten stilförskjutning. Förväntat: visual-jobbet blir rött med en läsbar bild-diff. Återställ och verifiera grönt.

12. Helhetskänslan. Efter en veckas normalt arbete: känns flödet snabbare? Har rött CI blivit sällsynt nog att det åter är värt att reagera på? Det är den egentliga frågan hela vågen ställdes för.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga sju skivor levererade och deras bevis-ID:n citerade
- [ ] #2 Testplanen nedan genomförd av Marcus med utfall noterat per punkt
- [ ] #3 Eventuella fynd har blivit EGNA kort med exakt symptom och förväntat beteende — planen retuscheras aldrig i efterhand
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
