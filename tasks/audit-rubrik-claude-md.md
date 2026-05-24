---
owner: marcus803
updated: 2026-05-24
review_by: 2026-11-24
status: stable
---

# CLAUDE.md konstitutions-audit-rubrik v1.0

Syfte: ett externt, fastställt mått som poängsätter en CLAUDE.md-fils
kvalitet 0-100 före refactor, så att förbättring blir mätbar, inte
påstådd. Diagnostisk, inte ett betyg — varje förlorad poäng pekar på
en namngiven rad. Portabel: poängsätter både hub- och spoke-CLAUDE.md,
inga hårdkodade projekt-namn.

Empirisk grund: Anthropics borttagnings-test (Claude Code-dokumentation),
anti-mönster-katalog (Claude Code best practices + optimizing-claude-md),
looks-bad-but-fine-kravet (tech-debt-audit-skill), viktnings-praxis
(Content Quality Assessment-rubrik + procurement-scoring). Researchad
2026-05-24, Session 6.7.

## Sex viktade dimensioner — 100 poäng

D1 — Bloat-disciplin (20 p). Radantal mot anti-bloat-målet: <100 rader,
optimum 60-100. 20/20 = under optimum. Avdrag skalar med hur långt över.

D2 — Borttagnings-test (20 p). Anthropics binära test per rad: "skulle
borttagning få Claude att göra fel?" Rad som är upptäckbar från kodbasen
(package.json/README) eller där Claude redan gör rätt utan den = avdrag.

D3 — Konstitutionell hälsa (25 p, tyngst). Finns det som ska bo i en
konstitution och är det välformulerat? Testbara regler, "Ristat i sten"-
bullets, pekare till skills/lessons/ADR, build/test/lint-kommandon.
Avdrag för LUCKOR + svag formulering, inte för överflöd. Notera:
build/test/lint-kommandon krävs för bygg-mål (spoke), nästan-N/A för
icke-bygg-mål (hub).

D4 — Fel-tier-placering (15 p). (a) svarsformaterings-regler i
CLAUDE.md, (b) enforce-bart som borde vara hook/linter, (c) operativ
procedur som borde vara skill.

D5 — Volatilitet (10 p). Linjärt växande listor, sessions-historik,
datum-stämplad trail.

D6 — Signal-styrka (10 p). "Om allt är CRITICAL är inget det" —
inflaterad emfas. Plus dubblering mellan hub och spoke.

Poängnivåer per dimension: full = inga fynd; ~75% = mindre namngivna
fynd; ~50% = systematiskt fynd; ~25% = genomgående; 0 = i grunden trasig.

## Leverans-gate — Forensisk integritet (icke-poängsatt, obligatorisk)

Auditen MÅSTE innehålla (a) en substantiell "ser strykbart ut men
behålls — och varför"-sektion, OCH (b) rad-citat + skäl för varje fynd
i D1-D6. Tom looks-bad-but-fine-sektion, eller fynd utan rad-citat →
auditen är ofullständig och underkänns oavsett totalpoäng. Detta är
L1-forensik som leverans-villkor.

## Tolkningsband

90-100 världsklass / 75-89 stark, riktade fixar / 60-74 funktionell men
bloat-drift / under 60 refactor brådskande. Totalen alltid nedbruten per
dimension med radnummer.

## Tillämpnings-historik

- K2 (2026-05-24): hub-CLAUDE.md = 37/100.
- K3 (2026-05-24): spoke-CLAUDE.md = 31/100.
- K-sista: lyft till ~/Repon/marcus-system/templates/ planerad.
