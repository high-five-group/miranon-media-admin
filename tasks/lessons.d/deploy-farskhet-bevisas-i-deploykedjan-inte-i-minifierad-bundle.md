# Deploy-färskhet bevisas i deploy-kedjan, inte i minifierad bundle

**[UNIVERSAL] Sträng-grep i minifierad bundle-utdata är fel instrument för
att avgöra om en deploy bär en viss kodändring — chunk-attribution och
strängars närvaro flyttar mellan byggen (code-splitting, tree-shaking,
inlining), så både positiva och negativa fynd är opålitliga. Rätt instrument
är plattformens egen deploy-kedja: källcommit → bygglogg → alias/domän.**

Mätt 2026-08-14 (S105): ett P1-larm ("prod-fronten saknar #1264") restes på
att `recordActivity`s minifierade anropsmönster inte hittades i den chunk där
en IRI-sträng lokaliserade modulen. Larmet var FALSKT: `vercel inspect`
visade att deployen byggts från en main-commit som git-bevisat innehöll
ändringen, med fullt bygge i loggen och aliaset på domänen. Samma kväll
misslyckades även den motsatta riktningen — en bevisat landad
strängmarkör ("Checka in") hittades inte i någon chunk, trots färskt bygge.

Tre lager av opålitlighet, alla observerade i samma mätserie:

1. **Lokalisering:** en delad konstant (IRI-strängen) kan bo i en annan
   chunk än funktionen som använder den — modulen "hittas" på fel ställe.
2. **Negativa fynd:** tree-shaking/dev-gating kan legitimt utesluta koden
   ur prod-bygget — frånvaro bevisar inte stale.
3. **Layout-drift:** chunk-gränser och namn byter mellan byggen, så en
   jämförelse gammal-mot-ny bundle jämför inte samma sak.

Formen som håller: (a) läs deployens källcommit ur plattformens inspect/API,
(b) verifiera med `git merge-base --is-ancestor` att ändringen är ancestor,
(c) verifiera att bygget faktiskt kördes (byggloggen) och att aliaset pekar
på deployen. Behavioral bevis i en miljö-tvilling (staging byggd från samma
källa) kompletterar. Bundle-grep får på sin höjd vara en snabb INDIKATOR —
aldrig grunden för ett larm eller ett friskintyg.

Relaterat: TASK-199 (stale-front-utredningen — kortets notes bär hela
mätserien), `docs/reference/prod-driftsattning-runbook.md` § Steg 6
(interimsformen bör ersättas med inspect-kedjan när TASK-199 stänger).
