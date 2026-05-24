# ADR-034: Skill-arkitektur — hub/projekt-skills + Agent Skills-standard

- Status: Draft (Session 6.7 K4 2026-05-24 — substans ifylld; → Accepted vid K-sista)
- Datum: 2026-05-24
- Fas: Session 6.7 — CLAUDE.md-audit + skills-extraktion (process-mognad mellan Fas 2 och Fas 2.5)

## Kontext

Session 6.7 K2 och K3 poängsatte hub- och spoke-CLAUDE.md mot den låsta audit-rubriken: hub 37/100, spoke 31/100 — båda i bandet "refactor brådskande". Kärnfyndet i båda auditerna var detsamma: en frisk konstitution (D3 19/25 respektive 17/25) begravd under flera hundra rader operativ procedur, volatil referens och växande listor. Anti-bloat-konsensus är empiriskt entydig (prep §1.6): CLAUDE.md-instruktioner följs till ~70 % och stora block ignoreras bortom ~200 rader. En konstitution som innehåller sin egen kokbok degraderar alltså efterlevnaden av just de regler den finns till för att upprätthålla.

K2/K3 fattade åtta klassningsbeslut (T1–T4 hub, TS1–TS4 spoke) vars gemensamma princip är att en regel bor på exakt ett ställe, och stället avgörs av om regeln måste vara alltid-på (→ konstitution) eller bara ibland-relevant (→ skill eller lessons.md). Operativa procedurer — sessionsstart, sessionsavslut, fas-avslut, lessons-skörd, hub-sync, web-research-disciplin — är ibland-relevanta. De hör inte i konstitutionen.

Agent Skills är en öppen standard sedan mars 2026 och tillhandahåller exakt rätt mekanism: progressive disclosure. Endast `name` + `description` (~100 tokens per skill) laddas vid sessionsstart; skill-kroppen laddas först när `description` matchar en uppgift. En procedur som behövs ibland belastar därmed inte varje sessions kontextbudget. Standarden fungerar identiskt över Claude.ai, Claude Code och API — portabilitet är en kärnegenskap.

Skills är dock bara en av fyra mekanismer för persistent kontext, och ADR:n avgränsar dem mot de övriga: CLAUDE.md är alltid-på Code-konstitution; skills är ibland-relevant operativ procedur (Code och Chat); Profile Preferences är universell Chat-disciplin (Marcus-personlig, bor i Claude.ai-settings); Project Instructions är projekt-specifik Chat-disciplin (Chat-side, per spoke). De två sistnämnda är inte skill-filer och ligger inte i repo.

## Beslut

1. **Skill-format följer Agent Skills-standarden.** En skill är en katalog med en `SKILL.md`-fil. Obligatorisk frontmatter är endast `name` (≤64 tecken, kebab-case, identiskt med katalognamnet) och `description` (≤1024 tecken). `description` skrivs i tredje person med "Använd när…"-formuleringar och konkreta trigger-ord, på svenska — konsekvent med befintlig skill-samling (`guide-builder`) och med den svenskspråkiga hub-konstitutionen. `description` är hela triggern: Claude avgör enbart på den om skillen laddas.

2. **Hub-skills paketeras som ett Claude Code-plugin.** `marcus-system/`-roten får ett `.claude-plugin/plugin.json`-manifest och en `skills/`-katalog. Pluginet versionshanteras i hub-repot och laddas i alla spokes via ett `--plugin-dir`-alias. Plugin-skills är namespace-isolerade (`plugin-namn:skill-namn`) och kan inte kollidera. Manifestet ligger i hub-repots rot, inte i ett separat plugin-repo, eftersom hub-repot redan är enda källan för universell Code-kontext.

3. **Spoke-skills är native projekt-skills.** Domän-specifika skills bor som riktiga kataloger i `miranon-media-admin/.claude/skills/`, git-committade med spoke-repot och upptäckta via Claude Codes inbyggda projekt-scope. Ingen symlänk är inblandad. Det finns ingen "wrapper" — konceptet utgår (se Alternativ).

4. **Nivå-arkitektur styrs av 500-radersregeln.** En `SKILL.md`-kropp ska vara under 500 rader; överskjutande innehåll bryts ut till syskon-referensfiler som laddas on demand. Per-skill-domen platt kontra tre-nivåers villkoras av faktisk extraherad längd och fattas i K5 — den kan inte mätas innan innehållet flyttats. Skript som buntas i en skill refererar sin sökväg via `${CLAUDE_SKILL_DIR}` så att de resolvar oavsett installationsnivå.

5. **Hela katalogen designas nu; kärnan implementeras i K5.** Sex kärnskills — `session-start`, `session-end`, `phase-end-verify`, `lessons-hub-sync`, `web-research-discipline`, `chat-self-review` — extraheras i K5. Fem skills deferras som namngiven prioriterad lista: `workflow` (hög), `code-stoppa-format` (medel), `session-handoff` (medel), `airtable` (låg–medel), `pre-commit-biome` (låg–medel; spoke-projekt-skill).

6. **Två kandidater är inte skills.** Briefing-preferenserna (hub 42-46) är en personlig Chat-preferens utan procedursteg och hör i Profile Preferences. Vale-mönstren (prep §1.5) är template-artefakter och hör i `marcus-system/templates/`. Inget av dem ingår i skill-katalogen.

7. **Versionering och test.** Skills får valfritt `version`-fält i frontmatter; ändringar spåras via git i respektive repo, och en avvecklad skill dokumenteras med ADR-trail snarare än att tas bort tyst. Skill-descriptionerna är hypoteser tills K8:s discovery-test validerat dem — en kall Chat-context får en realistisk uppgiftsformulering och ska träffa rätt skill enbart via `description`.

## Alternativ som övervägdes

**Symlänk-kedja** — hub-skills i `marcus-system/skills/` symlänkade in i `~/.claude/skills/`. Detta var det implicit beslutade alternativet ("tunn projekt-wrapper" byggde på det). Förkastat efter K4.0-web-research: Claude Codes skill-discovery-scanning följer inte symlänkar tillförlitligt (öppna buggar #25367, #14836, #36659, #37590 i `anthropics/claude-code`; `.claude/rules/` stöder symlänkar explicit medan `.claude/skills/` inte gör det). Researchen falsifierade en låst premiss — mönsterförstärkning av L25.

**Separat plugin-repo** — `marcus-skills` som eget repo. Förkastat: skapar en ny "vilket repo?"-söm vid varje skill, rakt emot Session 6.7:s konsolideringstes.

**Allt-i-spoke** — samtliga skills i varje spokes `.claude/skills/`. Förkastat: hub-skills skulle dupliceras per spoke och bryta hub-spoke-principen om en sanningskälla.

**Status quo** — behåll operativ procedur i CLAUDE.md. Förkastat: K2/K3-baslinjerna (37/100, 31/100) och anti-bloat-konsensus gör icke-handling till den dyraste vägen.

## Konsekvenser

CLAUDE.md kan krympa mot <100-radersmålet i K6; operativ procedur laddas bara vid relevant trigger; varje procedur får en sanningskälla, portabel över Claude.ai, Code och API; hub-skills blir universella över alla spokes via ett enda plugin.

Kostnaden: `--plugin-dir`-aliaset blir ett nytt miljöberoende som måste finnas i shell-konfigurationen. `description`-kvalitet blir en kritisk felkälla — en vag `description` gör att skillen aldrig triggas; K8 är mitigeringen. Defer-listans fem skills är kvarstående skuld tills implementerad.

Pending vid K-sista-bake-in: descriptionerna är hypoteser tills K8 validerat; per-skill nivå-arkitektur fattas i K5; `pre-commit-biome` blir spokens första native projekt-skill och därmed mönster-precedent. Vale-mönstren (prep §1.5) noteras som ett angränsande men separat spår mot `marcus-system/templates/`.
