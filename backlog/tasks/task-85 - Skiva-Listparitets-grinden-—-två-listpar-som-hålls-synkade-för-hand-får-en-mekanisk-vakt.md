---
id: TASK-85
title: >-
  Skiva: Listparitets-grinden — två listpar som hålls synkade för hand får en
  mekanisk vakt
status: Done
assignee: []
created_date: '2026-07-29 17:35'
updated_date: '2026-07-31 06:38'
labels:
  - ready-for-agent
dependencies: []
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repot har TVÅ listpar som måste hållas i synk för hand, och båda har redan driftat.

**Par 1 — allowlist/klassning:** listorna som styr CI:s filklassning står på mer än ett ställe och synkas manuellt.

**Par 2 — lychee-globarna:** samma glob-lista står i BÅDA `.github/workflows/ci.yml` och `scripts/check-docs.sh`. ADR-081:s landning ökade duplikationen med en rad (`tasks/lessons.d/*.md`).

Domen från verktygsvals-prövningen var LAGA, inte lev-med. Formen är känd: ~20 rader skript plus en policy-fil, per husets config-driven-konvention (Lesson #6) — skriptets logik universell, värdena projektspecifika.

**Öppen fråga som skivan måste stänga:** `PARITY_PATHS` är inte härledd ännu. Vilka listpar som ska vaktas är en del av arbetet, inte en förutsättning.

Källa: restlistans § A3, posten "Listparitets-grinden (dom: LAGA)". Utvidgad räckvidd 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PARITY_PATHS är HÄRLEDD ur faktiska filer, inte antagen — redovisa hur listparen hittades och varför just de
- [x] #2 Grinden täcker BÅDA listparen, inte bara lychee-globarna
- [x] #3 Tvåsidigt bevis: grinden är GRÖN mot nuvarande träd, och RÖD mot ett träd där ett listpar medvetet desynkats
- [x] #4 Config-driven per Lesson #6 — logiken i skriptet, värdena i .<grind>-policy.conf; skriptet ska kunna dupliceras till annat spoke utan refactor
- [x] #5 Fail-closed: kan grinden inte läsa ett listpar är det exit≠0, aldrig tyst grönt
- [x] #6 Wirad i CI, eller så är skälet till att den inte är det utskrivet
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE LISTPARET FUNNET 2026-07-30 (S91 artonde resumen, ur TASK-87:s agentrapport) — kandidat, ej beslutad scope-utvidgning.

CONTRIBUTING.md rad 76-78 räknar upp sentinel-markörerna som .purge-staging-policy.json äger. Listan är ofullständig: den saknar ZZ-note-test+ sedan tidigare, och saknar nu app-segment-test+ som TASK-87 lade till. Två omissioner har alltså ackumulerat utan att någon mekanism sett dem.

Formen är exakt kortets: en invariant som står på två ställen och synkas för hand. Skillnaden mot par 1 och 2 är att CONTRIBUTING-listan är EXEMPLIFIERANDE och pekar på policyn som sanningskälla — det kan vara ett skäl att lämna den utanför PARITY_PATHS, eller ett skäl att kräva att den är komplett. Den avvägningen hör till AC #1, som redan kräver att paren HÄRLEDS ur faktiska filer och att förkastade kandidater bär sina skäl.

Noteras här i stället för att mintas som eget kort, eftersom AC #1 redan äger frågan. Bygg-agenten avgör — men ska redovisa utfallet även om domen blir att paret lämnas utanför.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Listparitets-grinden byggd: scripts/check-listparitet.sh (universell logik) + .listparitet-policy.conf (projektvärden) + 18 testfall + wirad i lint-jobbet, som kör ALLTID — inte docs-jobbet, som är villkorat på docs_changed. AC #1 HÄRLEDD, inte listad: grep över grind-ytan gav 50 rader i 19 filer som löste upp sig i 10 distinkta synk-plikter; 13 kandidater prövade, 5 intagna, 8 förkastade med skäl i conf:en. TVÅSIDIGT BEVIS skarpt mot verkliga trädet: alla fem par desynkade ETT I TAGET (exit 1 var gång), baslinjen 0 efter varje återställning, och återställningen verifierad BIT-IDENTISKT med sha256 före==efter. Nio fail-closed-vägar bevisade. TREDJE PARET TOGS IN på agentens eget avgörande: CONTRIBUTING-listan påstods exemplifierande, men parentesen läser som uttömmande och två läsare läste den så — sentinel-markörerna 2 av 4 hade drivit isär. Nu kompletta. TVÅ TYSTA-GRÖNA-FÄLLOR inträffade skarpt under bygget och fångades av fail-closed: ett uttryck som börjar med -- lästes som grep-flagga (tom==tom==grönt), och awk -v med flerradigt värde fäller med newline in string (tom differens==grönt). Båda hårdgjorda. Agenten självrättade dessutom ett tal den skrivit innan det räknats. PR #489, CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
