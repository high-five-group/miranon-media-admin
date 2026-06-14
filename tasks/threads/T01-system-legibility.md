---
owner: marcus803
updated: 2026-06-14
review_by: 2026-09-14
status: stable
lifecycle: active
---

# T01 — Systemets läsbarhet + hantering av det oväntade

> Tråd-kort (ADR-053). Föddes som ett tråd-frö vid pausen av session 19 (2026-06-14) —
> en oväntad utanför-scope-tråd som krävde en improviserad fil för att överleva, vilket
> var det första beviset på gapet den beskriver. Migrerad till registret i session 21
> via `git mv` (historiken bevarad). Tråden bevisar sin egen tes: registret föds genom
> att registrera sin egen skapelse-tråd.

- **Tråd-ID:** `T01-system-legibility`
- **Tillstånd:** se frontmatter `lifecycle`
- **Sessioner:** 19 (född/pausad som frö) → 21 (arkitektur beslutad + byggd)
- **Styrande beslut:** ADR-053 (tråd-arkitektur)
- **Commit-historik:** `git log --grep "\[T01\]"`

## Vad tråden löser (problemet i klartext)

Två krav som ser ut som två men är ett:

1. Systemets HISTORIA ska vara en förstaklass-artefakt — en utomstående ska kunna titta
   in i dokumentationen och exakt förstå vad som hänt, och logiskt + effektivt navigera
   händelsekedjan/tidslinjen.
2. Det OVÄNTADE (saker utanför scope) ska hanteras av en INKODAD process, inte av Marcus
   omdöme i stunden varje gång.

Forensisk läsbarhet som designad egenskap; triage av det oväntade som inkodad rutin.

## Rotorsaken

Organisationsenheten var SESSIONEN (en chatt-avgränsad behållare), men arbete flödar i
TRÅDAR som skär tvärs sessioner. Eftersom doken var organiserade efter behållaren, inte
efter tråden (den kausala enheten), hade det oväntade inget hem och tidslinjen gick inte
att navigera per tråd. ADR-053 gör tråden till förstaklass-enhet och löser båda.

## Lösningens form (beslutad i ADR-053)

MEDIUM-på-MINIMAL — event-sourcad ombyggnad förkastad (systemet har redan append-only-
loggen i git). Fyra delar: tråd-register (detta + indexet), tråd-ID + commit-tagg
`[T<NN>]` (git-härledbar historik), återanvänt `lifecycle`-fält för tråd-tillstånd,
alltid-på triage-mikroregel för det oväntade.

## Status och nästa steg

Session 21 bygger mekanismen i denna spoke: ADR-053 (K1, landat) → register + denna
dogfood-migration (K2) → `check-lifecycle.sh`-utvidgning till `tasks/threads/*.md` (K3)
→ triage-regel i PI + CLAUDE.md (K4) → commit-tagg/ref-konvention (K5). Hub-templatisering
(så andra spokes ärver mönstret) är `[UNIVERSAL]`-horisont, ej denna sessions scope.

## Forskningsgrund (sammanfattning; full i ADR-053)

Förstaparts (Anthropic long-running-agent-harness: handoff/progress-filer, "varför" tappas
i summeringar) + event sourcing (append-only logg + materialiserad vy) + distribuerad
tracing (tråd = trace, session = span, tråd-ID = trace-ID) + issue-tracking (Linear:
work-item-tillstånd, anti-svall) + Kanban Classes of Service (triage-taxonomi) +
ADR-praxis (navigerbar besluts-logg). Detaljer + källor i ADR-053 § Forskningsgrund.
