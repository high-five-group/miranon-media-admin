---
owner: marcus803
updated: 2026-08-02
review_by: 2026-11-02
status: draft
---

# Modell- och effort-policy per processteg — beslutsunderlag (S94)

> **UTKAST v0.1 — ofullständigt per design.** Nuläges-kolumnerna är
> disk-/docs-verifierade; förslags-kolumnerna är HYPOTESER märkta (H) tills
> research-pass B (frontier-praxis) och T113:s första Sonnet-datapunkt
> landat. Detta dokument är grillnings-underlaget för S94:s policybeslut —
> inget här är beslutat.
>
> Källor: `docs/research/modell-tiering-anthropic-2026-08-02.md` (PR #588) ·
> `docs/research/modell-tiering-frontier-praxis-2026-08-02.md` (PR #589) ·
> Claude Code-docs verifierade 2026-08-02 via guide-agent (sub-agents.md +
> model-config.md, citat i S94-transkriptet) · disk-läsningar av
> `.claude/agents/*.md`, `~/.claude/settings.json` · T110–T113, T71, T67.

## Verifierad mekanik (det policyn kan byggas på)

- **Modell per subagent:** frontmatter `model:` med alias (`sonnet`/`opus`/
  `haiku`/`fable`), fullt ID, eller `inherit` (default). Alias följer
  senaste modellversionen per provider och pekas om över tid — pinning görs
  med fullt ID eller `ANTHROPIC_DEFAULT_*_MODEL`.
- **Resolutionsordning subagent-modell:** `CLAUDE_CODE_SUBAGENT_MODEL` →
  per-anrop → frontmatter → huvudsession.
- **Effort per subagent:** frontmatter `effort:` (`low`–`max`), default
  ärvs från sessionen. Även SKILLS kan bära `effort` i frontmatter —
  policyn kan alltså mekaniseras deklarativt per processteg. Per-anrops-
  override av effort är ODOKUMENTERAD (endast modell går per anrop).
- **Effort-skalan är kalibrerad per modell** — nivånamn är inte jämförbara
  mellan modeller. Default utan vår override vore `high`; vårt globala
  `effortLevel: "xhigh"` (satt S60) är ett aktivt lyft.
- **Känd riskyta:** ≥8 GitHub-issues (2026) om tyst ignorerad
  `model:`-frontmatter. Motmedel: agenten rapporterar sin egen
  modell-identitet i slutrapporten (sanity-check, se § Verkställande).

## Matrisen: processteg × modell × effort

Nuläge = mätt/verifierat. Förslag = (H) hypotes tills underlag komplett.

| # | Processteg / yta | Bärare | Nuläge modell@effort | Förslag (H) | Motiv (H) |
|---|---|---|---|---|---|
| 1 | Orkestrering, samordning, landnings-svep | huvudloop | Fable@xhigh | Fable@xhigh · Opus-fallback vid kvottak | omdömestäta beslut, låg volym; Marcus-input 2026-08-02 om fallback |
| 2 | Grillning / design-samsyn / spec (grilling, to-prd, to-issues, prototype) | huvudloop (HITL) | Fable@xhigh | följer #1 | HITL-stegen ÄR orkestrerarens yta (T71: kan ej delegeras) |
| 3 | Implementation mot spec (do-work, work-batch → bygg-agent) | `.claude/agents/bygg-agent.md` | Sonnet@xhigh (ärvd effort) | Sonnet@xhigh ELLER @high — MÄTS | docs: xhigh för coding/agentic; men hårt speccade skivor + 13 CI-grindar kan göra high tillräcklig; T113-riggen kan jämföra |
| 4 | Research-pass | `.claude/agents/research-pass.md` | Sonnet@xhigh (ärvd) | Sonnet@high (H) | källäsning + destillat; grindad av check:docs; omdömesdjupet ligger i frågan, inte passet |
| 5 | Sök/lokalisera (Explore-klass) | harness-default | ärver Fable@xhigh | Haiku@low (H) | svaret är "var", inte "varför"; 10× billigare input; obs 200K kontext |
| 6 | Plan/general-purpose (default-agenter) | harness-default | ärver Fable@xhigh | Sonnet@high (H) | generalist-jobb; Explore-capen (aldrig dyrare än huvudloop) gäller inbyggda, override nedåt är fri |
| 7 | Svår felsökning (diagnosing-bugs) | skill, körs i huvudloop i dag | Fable@xhigh | Opus@xhigh som agent-form (H) | Marcus tiering-hypotes; "Opus is the expert"; kräver ny agent-definition eller skill-frontmatter |
| 8 | Arkitektur-audit (arch-audit) | skill i huvudloop | Fable@xhigh | Opus@xhigh (H) | som #7 — verifierare med eget kontrakt |
| 9 | Doc-frågor (claude-code-guide) | harness-agent | ej verifierat | Sonnet (H) | uppslagsjobb med källkrav |
| 10 | Eskalering vid fällning | Agent-anropets model-param | 2× fälld → `fable` (beslut 2026-08-01) | 2× fälld → högre tier: Opus default, Fable vid behov (H) — ÖPPEN OMPRÖVNING | Marcus-input 2026-08-02: hårdkoda inte Fable; Opus obligatorisk fallback vid Fable-kvottak; Anthropic-linjen är svårighets-baserad eskalering |

## Öppna frågor till grillningen

1. **Bygg-agentens effort:** xhigh (docs-linjen) eller high (grind-buren
   form)? Mätbar — form: T113-riggens axel 1 på en jämförelsevåg.
2. **Eskalationsstegen:** Sonnet → Opus → Fable, eller Sonnet → (Opus|Fable)
   situationsbaserat? River öppet beslutet 2026-08-01 (fable-regeln).
   Frontier-läget (PR #589): eskalering-vid-kämpande är etablerat mönster
   (Cognition, Factory.ai) men trösklarna publiceras inte; "2 fällningar"
   har bara en mindre tredjepartskälla, och CodeRescue (arxiv 2607.19338)
   visar empiriskt att budget-kalibrerad trigger slår naiv alltid-eskalera
   (71,7 % lösningsgrad till 35 % av kostnaden). Vår befintliga
   2-fällnings-regel är alltså försvarbar som enkel form, men inte
   branschbelagd som optimum — deklareras öppet vid beslutet.
3. **Policyns hemvist:** ADR i spoken + frontmatter-värden, eller
   SYSTEMET-sektion i hubben + frontmatter? ADR-bar-prövning krävs.
4. **Orkestrerar-rollen i session-start/resume:** exakt formulering +
   T111:s läsdisciplin (fråga 3: vilka ytor läser orkestreraren själv).
5. **T67:s design-steg:** sessions-parallellitetens mekanisering
   (detektionssteg i session-start → auto-worktree för senare session).
6. **Default-agenternas styrning:** kan harness-defaults (Explore/Plan)
   ges modell/effort deklarativt per repo, eller endast per anrop?
   (Ej verifierat — verkställande-fråga.)
7. **Sanity-check-raden:** agenter rapporterar egen modell-identitet i
   slutrapport (motmedel mot frontmatter-ignorerings-bugklassen).

## Research-pass B: landad (PR #589) — kärninput till matrisen

- **Tiering per processteg är etablerad praxis:** 6 namngivna produkter
  (Cognition/Devin Fusion, Sourcegraph Amp, Factory.ai/Droid, Aider,
  Cursor, GitHub Copilot) + 2 ramverk (OpenAI Agents SDK, CrewAI) +
  akademisk LLM-cascade-linje. Precedent-kravet (3+) är uppfyllt med god
  marginal för själva tieringen.
- **Statisk per-roll-mappning dominerar produktion** (vår nuvarande form);
  automatisk klassificerar-routing finns men är framväxande. Belägget
  vilar på EN vendor-källa — öppet deklarerat.
- **Kvot-/fallback-kedjor** är etablerad LLM-infrastrukturpraxis
  (OpenRouter, LiteLLM) men generisk, ej kodningsagent-specifik —
  stödjer Opus-som-orkestrerarfallback utan att specificera formen.
- Eskalationströskel-nyansen: se § Öppna frågor punkt 2.

## T113 körning #3: landad (PR #590) — första Sonnet-datapunkten

Full rapport: `docs/research/uppdragsrevision-korning-3-2026-08-02.md`.
Data, inga effektslutsatser (T110-regeln, n=1 för Sonnet-eran):

- **16 uppdrag, 88 prövbara påståenden, 87 avgjorda: 4 hårda fel (4,60 %)**
  mot baslinjens 3,8 % och körning #2:s 6,25 % (båda pre-Sonnet) —
  Sonnet-punkten ligger INOM pre-Sonnet-bandets spännvidd. Källmärkning
  77,3 % (bästa hittills). Era-jämförelser förblir förbjudna tills n≥2.
- **Modell-kvalificeringen verifierad hårt:** 14/16 spawns (87,5 %) bevisade
  på `claude-sonnet-5` via subagent-transcripternas egna `message.model`-
  fält — en levande motmätning mot frontmatter-ignorerings-bugklassen
  (§ Verifierad mekanik), och metodfyndet att `input.model: null` bytte
  betydelse efter PR #557.
- **Fångst-observation:** 2 av 4 hårda fel var redan självrättade i vågen;
  agentens räkne-verifiering fångade dessutom en TREDJE instans av
  felklassen "delagentens sammanfattning motsäger sin egen tabell" —
  omräkning ur detaljtabeller är fortsatt obligatorisk.

**Underlaget är därmed komplett.** Nästa steg: grillning till samsyn
(Marcus startar `/grill-me`) → policybeslut → verkställande (hub-PR:
skill-texter + ev. SYSTEMET-sektion; spoke-PR: frontmatter-värden + ev.
ADR + sanity-check-raden i agent-kontrakten).
