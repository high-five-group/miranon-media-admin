---
id: TASK-127.3
title: 'Skiva: Login-omskrivningen till designsystemet'
status: Done
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-05 12:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Login-vyn — första skärmen Roger och Lotta ser — skrivs om till designsystemet enligt prototyp-facit: appens formprimitiver, enumeration-neutral felhantering och lugnt laddläge. Den gamla vyns ouppfyllda refaktor-löfte från Fas 3 infrias och tas bort. Koordination: ingen parallell session rör login-ytan under skivan (bokfört mot UI-spåret).

Täcker användarberättelse: 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Login-vyn använder designsystemets primitiver fullt ut — ingen rå Tailwind kvar
- [x] #2 Felmeddelanden är enumeration-neutrala: samma svar oavsett om adressen finns
- [x] #3 Befintlig autentiserad e2e och a11y-sviten gröna
- [x] #4 Prototyp-facit följt; varje avvikelse öppet bokförd
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-05 (S96, orkestrerarens CI-verifiering — tvåstegs-stängningen per ADR-071).

LEVERERAD via PR #776 (MERGED 2026-08-05). CI grön per jobb verifierad före Done-flippen: Pure+Build pass, Acceptance (hermetisk) pass 7m21s, Webblasarbeteende pass, Docs link check pass, CI Passed or Skipped pass. A11y/Staging/purge korrekt SKIPPING för denna diff-klass.

BYGG-AGENTENS PREMISS-PASS FÅNGADE ETT FEL I MITT UPPDRAG (ADR-086 i praktiken): uppdraget påstod att TASK-127.2 var Done. Agentens worktree såg To Do — korrekt, eftersom stängningen låg OCOMMITTAD i huvudkatalogen när worktreen grenades. Agenten byggde mot det verifierade facitet i stället för mot påståendet, och rörde aldrig 127.2:s kort. Samma fångst gjordes oberoende av 126.3-agenten.

LÄRDOM: en kortändring som inte är committad existerar inte för en agent-worktree. Stäng kort och COMMITTA i samma andetag innan agenter spawnas som beror på statusen — samma klass som CLAUDE.md:s kortnummer-regel om uppskjuten bokföring.

ÖPPNA POSTER, EJ BLOCKERANDE: (1) tests/e2e/pwa-offline.staging.test.ts källsynkad men ej körd lokalt (kräver byggd preview) — CI:s staging-jobb äger den. (2) Kontrast-fynd på text-caption visade sig vara en mätartefakt (0.2s mm-avsloj-reveal), men kombinationen färg+storlek är strukturellt sårbar för samma mätfälla hos framtida konsumenter av Input-primitivens description-prop. Registrerat, ej åtgärdat — token-nivå-ändring ligger utanför en login-skivas mandat.

AVBLOCKERAR: TASK-127.7 och TASK-127.8 (båda dep [TASK-127.3]).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
