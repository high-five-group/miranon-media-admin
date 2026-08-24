---
id: TASK-213.12
title: >-
  Skiva: Rot-orsaks-fixen — Person-länka anmälningarna utan Deltaganden-rader +
  fälla-registrering
status: To Do
assignee: []
created_date: '2026-08-14 19:23'
updated_date: '2026-08-24 14:45'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-213
ordinal: 410000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rot-orsaks-läkningen bakom promoveringens CREATE-backup (S103 Del 15 F2/F6 — Marcus: symptom behandlas aldrig, rotorsaken läks). Prod-mätningen 2026-08-14 fann fyra aktiva anmälningar utan Deltaganden-rader på kommande event: tre på Event-55 (3–4 okt, record-ID:n i Del 15) och en på Event-25 (5–6 sep), samtliga utan Person-länk och utan Källa — fälla 16/21-klassen. Fälla 21:s live-fall visar att Person-länkning läker raderna via automationskedjan. HITL: prod-mutationer kräver Marcus GO per skiva-regeln i 213-familjen. Körs FÖRST i bas-vågen — oktober-eventet är närmast berört.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exakt mätning bilagd: per anmälan på samtliga kommande event — vilka aktiva anmälningar saknar Deltaganden-rader (utgångsdata: S103 Del 15-tabellen)
- [ ] #2 De identifierade anmälningarna Person-länkade i prod, en i taget på Marcus GO per mutation
- [ ] #3 A-kedjan verifierad efter varje länkning: Deltaganden-raderna finns och är korrekt sessionssatta
- [ ] #4 Fälla-instansen registrerad i defekt-registret med rot-orsak (anmälan utan Person-länk bryter A3/A11-kedjan) och mätdata
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112-förberedelse (2026-08-24) — PREMISSDIVERGENS FUNNEN (ADR-086): AC#1:s utgångsdata (S103 Del 15, mätt 2026-08-14) är STALE. Färsk read-only mätning i prod (app8uGPrVCVOm6LfD) 2026-08-24:
1) De tre citerade Event-55-posterna kontrollerade individuellt (get_record): rec1SD7i2467gPrJ9 (Lena Maria Olsson) — Person=rectj3ixgMylQYAGH, Deltaganden=[recOegRhShzHSAhVA, recdmtBXPLI31KFst]. rec3A0IJir34yoekd (maria lejdeby) — Person=recAZF4Y7Y0AyKFNq, Deltaganden=[rec7DqQxio6JHQz9f, recVeIvI9tXjQGZEj] (dessutom omlänkad till Event-64 2026-08-21 av annan orsak, S110, ej relaterat). recViNdItldmL6O8l (Ulrika Arvas) — Person=recT8y8DvaZz09gtW, Deltaganden=[recMWeqVjQQJOXw83, recWHBijU0uuV1l4w]. Samtliga TRE redan Person-länkade med Deltaganden-rader — fälla 16/21-läkningen har redan skett för dessa (troligen manuell Person-PATCH av Marcus/Code i en tidigare session, exakt så som kortet beskriver att kedjan läker).
2) Bas-brett sök (ej bara Event-55/25): filterByFormula AND({Är aktiv (1/0)}=1,{Deltaganden}="") mot HELA Anmälningar-tabellen i prod gav 0 träffar. Ingen aktiv anmälan saknar just nu Deltaganden-rader.
Konsekvens: oktober-eventets tidskänslighet (mission-bokförd "213.12 före oktober-eventet") är MOOT mot nuvarande data — de konkreta instanserna som motiverade brådskan är redan åtgärdade. Kvarstår ändå som MARCUS-MOMENT eftersom (a) roten kan återkomma (samma automationskedjebrott vid framtida Person-lösa anmälningar) och (b) själva mutationsmekanismen (Person-PATCH) är explicit HITL per kortets text — men konkret arbete i S113 krymper till: kör om mätningen (agent-säkert, samma filterByFormula) → sannolikt 0 träffar → hoppa Person-länkningen → gå direkt till AC#4 (registrera fälla-instansen i defekt-registret, dokumentation, agent-säkert). Endast om omkörningen hittar NYA instanser krävs Marcus GO per mutation.
<!-- SECTION:NOTES:END -->
