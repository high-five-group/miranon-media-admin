# ADR-023: tasks/sessions/-arkivering med datum-baserad strategi

- Status: Accepted
- Datum: 2026-05-06
- Fas: Pre-Fas-2

## Kontext

`tasks/sessions/` innehöll 16 filer i platt struktur — 8 sessionslogg-filer (P0/P1/P2/P3a/P3b, security-hardening, datamodell-110, datamodell-research) + 7 fas-N-prompts (datamodell-research) + 1 aktiv (pre-Fas-2-verifiering, K1.A). Code:s K1.B Block 4.3: "16 filer är över den gräns där platt blir läsbar. Tröskelregel jag rekommenderar: arkivera vid ≥8 filer, behåll platt vid <8."

Arkivering måste klara två krav:
1. **Aktiv session ska vara omedelbart synlig** — inte begravd i arkiv-mapp.
2. **Frysta artefakter (fas-prompts) ska markeras som sådana** — inte blandas med sessionslogg-filer.

## Beslut

Strukturera enligt:

```
tasks/sessions/
├── <aktiv-session>.md   (pre-Fas-2-verifiering 2026-05-06; bytas vid varje ny session)
└── archive/
    ├── 2026-04/   (2 sessionsloggar från 2026-04)
    ├── 2026-05/   (6 sessionsloggar från 2026-05)
    └── datamodell-research-2026-04-30/   (7 frysta fas-prompts + README)
```

Arkivering sker efter sessionsavslut: när `tasks/todo.md` inte längre refererar sessionsloggen och alla lärdomar är lyfta. Aktiv session är endast 1 fil i `tasks/sessions/`-roten.

Datamodell-research-prompts läggs i egen subarchive (`datamodell-research-2026-04-30/`) med README som förklarar att de är frysta. Detta separerar projekt-prompts från sessionsloggar.

## Alternativ som övervägdes

1. **Behåll platt** — alla 16 filer i `tasks/sessions/`-roten. Avvisat: över Codes ≥8-tröskel, läsbarhet sjunker.
2. **År-baserad arkivering** (`archive/2026/`). Avvisat: månader är finare granularitet och matchar hur Marcus arbetar i sprintar.
3. **Per-projekt-arkivering** (`archive/byggplan-revision/`, `archive/datamodell-research/`). Avvisat: vissa sessioner spänner över flera projekt-spår; månadsbaserat är entydigt.
4. **Behåll fas-prompts i projekt-katalog** (`tasks/sessions/fas-prompts/`). Avvisat: blandar aktiva fas-prompts (om sådana skapas i framtiden) med frysta historiska. Datum-suffix i archive-mappen är tydligare.

## Konsekvenser

**Positivt:**
- `tasks/sessions/`-roten har 1 aktiv fil + 1 archive/-mapp = entydig översikt.
- Aktiv session är omedelbart synlig.
- Månadsbaserad arkivering skalar — 2026-06/, 2026-07/ etc tillkommer naturligt.
- Frysta fas-prompts är markerade som sådana med README.

**Negativt:**
- Path-refs uppdateras i frysta zoner (~30 träffar) — mitigerat per ADR-022 fix-vs-skip-disciplin (kategori 2: källhänvisning, mekanisk fix säker).
- Aktiv-session-konvention kräver disciplin: när nästa session startar (Fas 2), ska pre-Fas-2-verifieringen flyttas till `archive/2026-05/` innan ny aktiv läggs in.

## Konvention för framtida sessions

1. Sessionsstart: ny `tasks/sessions/<datum>-<tema>.md` skapas i roten (K1).
2. Sessionsavslut: föregående aktiv flyttas till lämplig `archive/<år>-<månad>/`.
3. Tröskel: när någon `archive/<år>-<månad>/` växer till ≥12 filer, splittas i halvmånader.
