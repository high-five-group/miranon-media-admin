---
id: TASK-173.6
title: 'Skiva: Instrumenteringen'
status: To Do
assignee: []
created_date: '2026-08-09 13:16'
updated_date: '2026-08-28 04:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.1
  - TASK-173.5
parent_task_id: TASK-173
ordinal: 329000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: grindens mätdata (findings-per-runda · risk-kalibrering · grind-missar) skrivs strukturerat vid varje körning och kan läsas ut för de framtida beslut ADR-105 uttryckligen villkorar mot data: rundtakets storlek, D0-undantaget och flytten av Marcus gransknings-ribba (C.4-2-sekvensen — kontraktets hårdaste regel). Täcker användarberättelser: 4, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje granskningskörning skriver findings-per-runda till loggytan från första skarpa körningen
- [x] #2 Risk-kalibrerings-poster kan bokföras (Marcus-fångst på LÅG-stämplad PR = grind-miss) och läsas ut som underlag för omprövning av rundtak och D0-undantag
- [x] #3 Loggytan är läsbar/summerbar utan specialverktyg — en framtida session kan re-derivera fångstraten ur den
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [x] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation notes (TASK-173.6)

**Mekanism:** `scripts/lib/review-metrics.mjs` (rena funktioner: byggKorningRad,
byggKalibreringRad, parsaLoggRader fail-soft, summera, renderaSummeringMarkdown)
+ `scripts/review-metrics.mjs` (npm run review:metrics — summerar loggen till
markdown/JSON) + `scripts/review-metrics-kalibrering.mjs` (npm run
review:kalibrering — bokför en Marcus-fångst). Loggen skrivs via ETT tillägg i
`scripts/review-loop-beslut.mjs`s main() (append EN "korning"-rad per LYCKAT
beslut, till docs/reference/review-instrumentering.jsonl) — samma befintliga
körpunkt orkestreraren redan anropar efter varje runda (CLAUDE.md § Review-
grinden), så AC #1/#2 kräver ingen ny orkestrerar-handling.

**Rätt-först-form bevisad genom mutation:** `--metrik-fil` append-anropet i
review-loop-beslut.mjs stängdes av manuellt (if(false)) och test-review-metrics.mjs
I1/I4 gick RÖDA (46 gröna, 2 röda); återställt gav 48/48 gröna igen. Positivt
bevis (I1-I4, 48 fall) + negativt self-test i samma pass.

**Research citerad i koden** (scripts/lib/review-metrics.mjs filhuvud): CodeRabbit/
Danger/reviewdog-mönstret "measure the gate, not the gatekeeper" (SRE-praxis) för
findings-loggning; precedent i repot: .claude/hook-fallningar.jsonl (jq-summerbar
JSONL) och scripts/flake-matserie.mjs (resultat.jsonl-formen, samma
en-rad-per-händelse-disciplin).

**AC #2 (D0-omprövning):** kalibreringsposter tillåter `stampladRisk: null` — det
är signalen för "PR:en granskades aldrig" (t.ex. D0-undantagen), skild från en
LÅG-stämplad grind-miss. summera() räknar båda separat
(grindMissPerNiva/kalibreringarUtanKorning).

**Backfyll: INTE gjord, ärligt.** Sökte hela repot + tasks/sessions/2026-08-24-
session-112.md efter utlatande-pr*.json — noll träffar (källa: `find . -iname
"*utlatande*"`, kommando kört 2026-08-28). De 14 skarpa review-agent-körningarna
från S112 (2026-08-26, Del 6) finns bara som aggregerad PROSA i sessionsdoket
("14 körningar; fem fann något; två gick runda 2") — utlåtande-JSON:en låg i
agenternas scratchpad och är borta. Loggen gäller från och med denna skiva, inte
retroaktivt (dokumenterat i renderaSummeringMarkdown:s tom-logg-meddelande och i
CLAUDE.md § Review-grinden).

**Fynd utanför scope, ORELATERAT till denna skiva:** `npm run test:api` gav
1241 passed / 3 failed — samtliga tre i tests/api/airtable-filter.staging.test.ts
(NOT-injection-fuzz, fick 500 i stället för 200/400) och
tests/api/get-document-sources.staging.test.ts (två conformance-assertions mot
den permanenta DOKUMENTUNDERLAG_EVENT_ID-fixturen: brödtext saknar förväntad
markdown-fri sträng, dag2.standard.length 16 ⧧ förväntat 10). Rör Airtable-
innehåll/EF-kod som ingen fil i denna PR:s diff vidrör — flaggas för triage, inte
åtgärdat här (path-scopad diff, DoD #4).

**Divergens i premiss-passet:** worktreen startade på en LOKAL commit (a4f2ed41,
"arkivera S93/S94/S95") som ALDRIG nådde origin/main under det SHA:t — samma
netto-innehåll landade separat via PR #2033 (S112-resume-2, SHA 10ae24f3+).
Branchad om från origin/main direkt (`git checkout -b … origin/main`) i stället
för att bygga vidare på den divergerade lokala committen. Ingen kod-konsekvens,
bokfört öppet per ADR-086.

## DoD-status: #3/#6/#7 medvetet lämnade obockade

- **#3 (CI grön per jobb):** obockad tills orkestreraren verifierat mot pushad
  commit — jag kan inte se CI-resultat härifrån.
- **#6 ("CI-backstoppens grind-verkan"):** ordagrant 173.4:s mekanism, inte
  min. Lämnad obockad för att inte göra ett missvisande påstående om en
  mekanism jag inte byggt. Motsvarande bevisform för MIN egen deterministiska
  yta (append-logiken i review-loop-beslut.mjs + dess testsvit) ÄR gjord —
  se anteckningen ovan om mutationstestet (I1/I4 röda vid avstängt append,
  gröna återställt).
- **#7 (bevisat skrivande från FÖRSTA SKARPA körningen):** kunde inte
  skarpbevisas mot en verklig, pågående review-agent-körning under
  byggsessionen (ingen sådan var i luften). Mekanismen är i stället bevisad
  genom CLI-nivå-integrationstest mot den RIKTIGA `review-loop-beslut.mjs`
  med schema-giltiga utlåtande-fixturer (sektion I, test-review-metrics.mjs)
  — närmaste möjliga "skarpt" bevis utan en levande PR att haka in på. Den
  bokförs därför som ÖPPEN SKULD per DoD #8 (checkad), inte som klar: den
  FÖRSTA raden i den verkliga docs/reference/review-instrumentering.jsonl
  skrivs av nästa faktiska review-loop-beslut.mjs-körning efter denna PR
  landat — filen finns INTE i denna PR:s diff.

## Runda 2 (PR #2052) — review-agentens tre fynd, åtgärdade

**FYND 1 (warning, ask-user — orkestrerarens BESLUT, ej mitt eget val):**
docs/reference/review-instrumentering.jsonl är versionerad (bekräftat:
`git check-ignore -v` gav exit 1, ingen träff i .gitignore) men saknade en
commit-mekanism. Löst enligt orkestrerarens instruktion: (a) CLAUDE.md §
Review-grinden utökad med att orkestreraren committar loggen i sina
stängningsbatchar och att en ospårad logg vid session-paus/-end är en SKULD,
inte tyst förlust; (b) review-loop-beslut.mjs skriver nu en stderr-påminnelse
efter varje lyckad append ("instrumenterings-rad appendad till <sökväg> —
ospårad tills committad"); (c) explicit noterat att ingen nightly-vakt kan se
en lokal ospårad fil — mekanismen är ett orkestrerar-åtagande, aldrig påstådd
som spärr (ADR-083).

**FYND 2 (warning, auto-fix):** test-review-metrics.mjs I5 tillagd —
`--metrik-fil` mot en sökväg vars förälder är en FIL (ENOTDIR) → exitkod
IDENTISK med kontrollkörning (båda 0, konvergerad) + "VARNING (TASK-173.6)"
+ "ENOTDIR" på stderr. Negativt motprov utfört: try/catch:en runt
appendMetrikRad togs tillfälligt bort → I5 gick RÖD (48 gröna/1 röd,
återstoden opåverkad); återställt → 49/49 gröna. Backup + mutation +
återställning gjord via cp (ej git stash, per AFK-regel).

**FYND 3 (info) — RÄTTELSE av min egen tidigare rapport:** "hängde 13 min
utan output" var en FELAKTIG beskrivning. Granskaren hittade min kvarlämnade
capture-fil (task-173.6-ci-parity-fast.txt, delat scratchpad) och visade att
körningen FAKTISKT producerade omfattande verklig output, inklusive en
FULLSTÄNDIG grön körning av test-review-loop.mjs (103/103) och
test-review-metrics.mjs (48/48) — bekräftat av mig genom
`grep -c "gröna, 0 röda" <fil>` (7 träffar) och `tail -5` som visade filens
sista rad var "69 gröna, 0 röda." (test-verify-ci-parity.mjs). Stallet
inträffade EFTER dessa tre sviter, i ett senare steg (sannolikt
test-docraptor-sjalvbarande.mjs, TASK-301, orört av denna PR) — inte i något
test-review-*.mjs. Korrekt beskrivning: "output kom, stallet låg senare i
samma run:-block." Capture-filen raderad ur scratchpad
(`rm task-173.6-ci-parity-fast.txt`) per instruktion. Policyfrågan var redan
statiskt avgjord av granskaren: ingen .ci-parity-policy.json-uppdatering
krävs (raden ligger i lint-jobbets BEFINTLIGA steg).

Rebasad mot origin/main (90edf82b-linjen) och pushad på samma gren efter
dessa ändringar — se PR #2052 för ny HEAD-SHA.
<!-- SECTION:NOTES:END -->
