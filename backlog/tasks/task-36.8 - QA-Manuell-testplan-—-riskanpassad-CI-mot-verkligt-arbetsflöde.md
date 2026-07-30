---
id: TASK-36.8
title: 'QA: Manuell testplan — riskanpassad CI mot verkligt arbetsflöde'
status: Done
assignee: []
created_date: '2026-07-23 17:15'
updated_date: '2026-07-30 16:51'
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
- [x] #1 Samtliga sju skivor levererade och deras bevis-ID:n citerade
- [x] #2 Testplanen nedan genomförd av Marcus med utfall noterat per punkt
- [x] #3 Eventuella fynd har blivit EGNA kort med exakt symptom och förväntat beteende — planen retuscheras aldrig i efterhand
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRD 2026-07-25 (S88) av Code på Marcus uttryckliga delegation ("utför C åt mig som om du vore mig"). Punkt 11 kördes lokalt per Marcus beslut C i T85:s beslutsfråga 2, eftersom visual-grinden är parkerad (T87).

UTFALL PER PUNKT

1. Snabbfilen i skarpt bruk — GRÖN. PR #207 (ren stiländring): D1-klass bekräftad. Staging sentinel purge + Staging (API+E2E) SKIPPADE; Lint+Audit+TypeCheck, A11y, Pure+Build körda. Run 30170296882.
2. Snabbfilen får inte gälla för mycket — GRÖN. PR #208 (stilmall + komponentfil i samma commit): FULL SVIT. Stilmallen drog inte ned risken. Run 30170303950.
3. Infrastruktur kan aldrig bli lågrisk — TESTET GRÖNT, körningen röd av annan orsak. PR #209 (ci.yml + CSS): full svit kördes, alltså korrekt klassning. Körningen föll på Staging sentinel purge (fetch failed) → se TASK-50. Run 30170306759.
4. Dedupen i verkligt merge-flöde — GRÖN. Samtliga fyra kod-/config-landningar denna session (PR #201/#202/#203/#205) visar markören "Dedup-TRÄFF" i changed-jobbets logg och Test suite=skipped på main-push. Mätskriptet: 21 träff / 0 miss.
5. Dedupen vågar inte gissa — EJ UTFÖRD, öppet bokförd. Punkten kräver en icke-up-to-date merge, men strict_required_status_checks_policy + merge-only (Marcus-beslut S88) gör den situationen omöjlig att framkalla utan att tillfälligt försvaga merge-grinden. Det priset togs inte. Skivans egna kontrastbevis kvarstår som grund: MISS 30047428027 / HIT 30047936570 (task-36.4, S79).
6. Nattnätet i praktiken — GRÖN. Manuell dispatch 30170198960: alla sju jobb success, larm-jobbet korrekt SKIPPAT, inget ärende, inget skräp.
7. Larmkedjan när något går sönder — LARMET FUNGERAR, INFORMATIONEN INTE. Dispatch 30170606995 (simulate_failure) skapade ärende #210, tilldelat marcus803, etikett ci-natt, med körningslänk + HEAD + stängningsregel. MEN commit-spannet sade "ingen tidigare grön nattkörning" trots FEM gröna, varav en 25 min gammal. Grundorsak bevisad: alarm-jobbet saknar actions:read, gh run list failar 403, och "|| echo" sväljer felet så den mest alarmerande grenen väljs. Systematiskt sedan larmet byggdes — ärende #114 (2026-07-23) bär samma text. → TASK-51.
8. Grinden stoppar faktiskt en merge — GRÖN. gate-proof 30170205149: assert-jobbet rapporterar UMBRELLA_FIRED=failure, alltså blev paraply-checken failure och inte skipped. S77:s incident kan inte upprepas.
9. Rött-först i nytt bärarskick — GRÖN, utförd skarpt i denna session. Mätardefinitions-fixen (PR #201): 8 test(er) RÖDA → alla gröna, citerat som lokalt körutdrag i commit-body. Ingen röd körning i den delade kön. Kontraktet kändes inte krångligare — bäraren är ett kommando och en klistrad utskrift.
10. Siffrorna — GRÖN, läsbara. PR-ledtid median 1,2 / p95 15,7 min (n=21) · skapad→staging-start median 0,5 / p95 6,1 min (n=17) · instabilitet 0,0 % bevisad, 0 overifierade · dedup 100 % (21/0). Röd-orsaker inkluderar nu "Docs link check: 1" — Codes egen Vale-miss i PR #202, korrekt fångad av de S88-korrigerade mätardefinitionerna.
11. Visuell regression — RÖTT FYND. Lokalt: app-bred ändring av brödtextfärg fångades av 4 av 6 MOBILA vyer och av NOLL desktop-vyer. Grundorsak bevisad: maxDiffPixelRatio 0.01 är en andel, och desktop har 4,26x större yta (5 184 000 px mot 1 218 000 px). Med ratio sänkt till 0.001 failade alla 12 inkl. samtliga desktop. → TASK-49. Diff-artefakten granskad visuellt och bedömd läsbar, men en global vertikal förskjutning "smittar" hela bilden och kan dölja ytterligare ändringar. Återställning verifierad: 12/12 gröna.
12. Helhetskänslan — EJ UTFÖRBAR I SESSION. Punkten frågar hur flödet känns efter en veckas normalt arbete. Genuint Marcus-fråga, kräver kalendertid. Bärare: denna notes-post.

FYND SOM BLEV EGNA KORT (AC #3): TASK-49 (visual-tröskelns vyport-asymmetri) · TASK-50 (purge utan mutex) · TASK-51 (larmets commit-spann har aldrig fungerat).

Ingen punkt retuscherades i efterhand. Två av tolv punkter är öppet oavklarade med skäl.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGD 2026-07-30 på noteringarna. Vandringen GENOMFÖRD 2026-07-25 (S88) av Code på Marcus delegation — "utför C åt mig som om du vore mig" — med utfall per punkt. Marcus bekräftade delegationen i S91 Del 27.4: "Det står ju i anteckningarna att jag delegerat till dig att utföra vandringen."

TRE FYND BLEV EGNA KORT: TASK-49, TASK-50, TASK-51. Planen retuscherades aldrig i efterhand (AC #3).

TVÅ PUNKTER ÖPPET OAVKLARADE MED SKÄL — bokförda, inte bortstädade:
- Punkt 5 kräver en icke-up-to-date merge, vilket är omöjligt utan att försvaga merge-grinden. Priset togs inte.
- Punkt 12 ("känns flödet snabbare efter en veckas normalt arbete") är en genuin Marcus-fråga som kräver kalendertid, inte en körning.

Stängningen var beslutad och dokumenterad i S91 Del 27.5 steg 0 ("TASK-36.8 stängd på noteringarna — backlog-grindens enda fällning borta") men VERKSTÄLLDES ALDRIG. Kortet stod därför kvar som registrets enda inkonsistenta post i tre dygn, och rapporterades felaktigt som "väntar på Marcus" i fyra transparens-rapporter 2026-07-30 av en orkestrerare som läst PAUSLÄGE men inte Del 27.4.

DoD #2-#4: kortet ändrar ingen kod; grindarna gäller stängnings-commiten och verifieras på den.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
