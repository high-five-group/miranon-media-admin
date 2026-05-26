# ADR-034: Skill-arkitektur — hub/projekt-skills + Agent Skills-standard

- Status: Accepted (Session 6.7 K-sista 2026-05-26 — plugin-wiring- + K8-utfall inbakade)
- Datum: 2026-05-24 (beslut); Accepterad: 2026-05-26
- Fas: Session 6.7 — CLAUDE.md-audit + skills-extraktion (process-mognad mellan Fas 2 och Fas 2.5)

## Kontext

Session 6.7 K2 och K3 poängsatte hub- och spoke-CLAUDE.md mot den låsta audit-rubriken: hub 37/100, spoke 31/100 — båda i bandet "refactor brådskande". Kärnfyndet i båda auditerna var detsamma: en frisk konstitution (D3 19/25 respektive 17/25) begravd under flera hundra rader operativ procedur, volatil referens och växande listor. Anti-bloat-konsensus är empiriskt entydig (prep §1.6): CLAUDE.md-instruktioner följs till ~70 % och stora block ignoreras bortom ~200 rader. En konstitution som innehåller sin egen kokbok degraderar alltså efterlevnaden av just de regler den finns till för att upprätthålla.

K2/K3 fattade åtta klassningsbeslut (T1–T4 hub, TS1–TS4 spoke) vars gemensamma princip är att en regel bor på exakt ett ställe, och stället avgörs av om regeln måste vara alltid-på (→ konstitution) eller bara ibland-relevant (→ skill eller lessons.md). Operativa procedurer — sessionsstart, sessionsavslut, fas-avslut, lessons-skörd, hub-sync, web-research-disciplin — är ibland-relevanta. De hör inte i konstitutionen.

Agent Skills är en öppen standard sedan mars 2026 och tillhandahåller exakt rätt mekanism: progressive disclosure. Endast `name` + `description` (~100 tokens per skill) laddas vid sessionsstart; skill-kroppen laddas först när `description` matchar en uppgift. En procedur som behövs ibland belastar därmed inte varje sessions kontextbudget. Standarden fungerar identiskt över Claude.ai, Claude Code och API — portabilitet är en kärnegenskap.

Skills är dock bara en av fyra mekanismer för persistent kontext, och ADR:n avgränsar dem mot de övriga: CLAUDE.md är alltid-på Code-konstitution; skills är ibland-relevant operativ procedur (Code och Chat); Profile Preferences är universell Chat-disciplin (Marcus-personlig, bor i Claude.ai-settings); Project Instructions är projekt-specifik Chat-disciplin (Chat-side, per spoke). De två sistnämnda är inte skill-filer och ligger inte i repo.

## Beslut

1. **Skill-format följer Agent Skills-standarden.** En skill är en katalog med en `SKILL.md`-fil. Obligatorisk frontmatter är endast `name` (≤64 tecken, kebab-case, identiskt med katalognamnet) och `description` (≤1024 tecken). `description` skrivs i tredje person med "Använd när…"-formuleringar och konkreta trigger-ord, på svenska — konsekvent med befintlig skill-samling (`guide-builder`) och med den svenskspråkiga hub-konstitutionen. `description` är hela triggern: Claude avgör enbart på den om skillen laddas.

2. **Hub-skills paketeras som ett Claude Code-plugin distribuerat via git-baserad marketplace.** Pluginet bor i `marcus-system/plugins/marcus-system/` (`.claude-plugin/plugin.json` + `skills/`); hub-repots rot är marketplace `marcus-hub` (`.claude-plugin/marketplace.json`). Pluginet versionshanteras i hub-repot och konsumeras i varje spoke genom att marketplacen registreras i spokens `.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`, github-källa `marcus803/marcus-system`, spårar `main` — ingen SHA-pin medan hubben är under aktiv utveckling). `--plugin-dir` är dev-override, inte produktions-wiring. Plugin-skills är namespace-isolerade (`plugin-namn:skill-namn`) och kan inte kollidera. Marketplacen ligger i hub-repots rot, inte i ett separat plugin-repo, eftersom hub-repot redan är enda källan för universell Code-kontext. (Plugin-wiring steg B/C, web-research-grundat per L25 — det ursprungliga `--plugin-dir`-alias-antagandet falsifierades mot branschpraxis.)

3. **Spoke-skills är native projekt-skills.** Domän-specifika skills bor som riktiga kataloger i `miranon-media-admin/.claude/skills/`, git-committade med spoke-repot och upptäckta via Claude Codes inbyggda projekt-scope. Ingen symlänk är inblandad. Det finns ingen "wrapper" — konceptet utgår (se Alternativ).

4. **Nivå-arkitektur styrs av 500-radersregeln.** En `SKILL.md`-kropp ska vara under 500 rader; överskjutande innehåll bryts ut till syskon-referensfiler som laddas on demand. Per-skill-domen platt kontra tre-nivåers villkoras av faktisk extraherad längd och fattas i K5 — den kan inte mätas innan innehållet flyttats. Skript som buntas i en skill refererar sin sökväg via `${CLAUDE_SKILL_DIR}` så att de resolvar oavsett installationsnivå.

5. **Hela katalogen designas nu; kärnan implementeras i K5.** Sex kärnskills — `session-start`, `session-end`, `phase-end-verify`, `lessons-hub-sync`, `web-research-discipline`, `chat-self-review` — extraheras i K5. (Två av dessa — `web-research-discipline` + `chat-self-review` — flyttades senare ut ur pluginet till alltid-på konstitution efter K8:s discovery-utfall; se p.8.) Fem skills deferras som namngiven prioriterad lista: `workflow` (hög), `code-stoppa-format` (medel), `session-handoff` (medel), `airtable` (låg–medel), `pre-commit-biome` (låg–medel; spoke-projekt-skill).

6. **Två kandidater är inte skills — och en tredje routas bort från hub-pluginet.** Briefing-preferenserna (hub 42-46) är en personlig Chat-preferens utan procedursteg och hör i Profile Preferences. Vale-mönstren (prep §1.5) är template-artefakter och hör i `marcus-system/templates/`. Inget av dem ingår i skill-katalogen. backfill-skillen, före Session 6.7 placerad i `marcus-system/skills/`, är en destillerad kapabilitet — en lång inlärnings-session kondenserad till något återkörbart — inte operativ sessions-disciplin. Den flyttas till kapabilitets-biblioteket `claude-skills/` per K4.0:s taxonomi. Skälet att hålla den utanför hub-pluginet är konkret: `plugin.json` gör `skills/` helt auto-upptäckt, vilket skulle lasta artefakten i varje Code-sessions kontext trots att den vilar — i strid med 6.7:s anti-bloat-syfte. `claude-skills/` använder en `skills-lock.json` som registrerar enbart externt hämtade skills (`sourceType: github`) för drift-detektering mot upstream; lokalt skapade skills, backfill inräknad, står utanför lockfilen eftersom de saknar upstream att låsa mot.

7. **Versionering och test.** Skills får valfritt `version`-fält i frontmatter; ändringar spåras via git i respektive repo, och en avvecklad skill dokumenteras med ADR-trail snarare än att tas bort tyst. Skill-descriptionerna var hypoteser tills K8:s discovery-test validerat dem — en kall Chat-context fick en realistisk uppgiftsformulering och skulle träffa rätt skill enbart via `description`.

8. **Skill-mekanismen gäller kommando-utlösta operativa rutiner; meta-disciplin levereras alltid-på.** K8:s discovery-test gav 4/6: de kommando-utlösta rutinerna (`session-start`, `session-end`, `phase-end-verify`, `lessons-hub-sync`) upptäcktes rent via `description`, medan meta-disciplinerna `chat-self-review` + `web-research-discipline` missade i båda lägen — de görs nativt från konstitutionen och saknar ett kommando-ögonblick att upptäckas på. Beslut, verkställt i K-sista steg 2: de två flyttas ut ur pluginet till alltid-på regler — hub-CLAUDE.md (`## Self-review-disciplin` + research-mandatet i `## Instruktioner`) för Code-sidan. Pluginet blir **4 skills**. En description-revidering vinner inte mot beteende modellen redan utför nativt; leveransmekanism väljs mot beteende-klass, inte mot trigger-ordval.

9. **Leveransyte-modell: repot är enda sanningskällan; disciplin levereras per yta.** Code-sidan får disciplin via plugin/marketplace (kommando-utlösta skills) + hub-CLAUDE.md (alltid-på regler). Chat-sidan får meta-disciplinen via Project Instructions, källad från en versionshanterad repo-fil per spoke (`project-instructions/<spoke>.md`) som klistras in manuellt i claude.ai:s projektinställningar — repot ändras, inte inställningsrutan. Claude-apparnas `Customize > Skills`-yta finns men används **medvetet inte** för disciplin-skills: disciplin ska vara ovillkorlig/alltid-på, inte beroende av upptäckt. Den operativa HUR-detaljen (klassificering, konsistens, forensisk pre-pass, research-domän-checklista) bor i `marcus-system/templates/chat-prompt-design-checklist.md`; CLAUDE.md/Project Instructions bär principen, checklistan stegen.

## Alternativ som övervägdes

**Symlänk-kedja** — hub-skills i `marcus-system/skills/` symlänkade in i `~/.claude/skills/`. Detta var det implicit beslutade alternativet ("tunn projekt-wrapper" byggde på det). Förkastat efter K4.0-web-research: Claude Codes skill-discovery-scanning följer inte symlänkar tillförlitligt (öppna buggar #25367, #14836, #36659, #37590 i `anthropics/claude-code`; `.claude/rules/` stöder symlänkar explicit medan `.claude/skills/` inte gör det). Researchen falsifierade en låst premiss — mönsterförstärkning av L25.

**Separat plugin-repo** — `marcus-skills` som eget repo. Förkastat: skapar en ny "vilket repo?"-söm vid varje skill, rakt emot Session 6.7:s konsolideringstes.

**Allt-i-spoke** — samtliga skills i varje spokes `.claude/skills/`. Förkastat: hub-skills skulle dupliceras per spoke och bryta hub-spoke-principen om en sanningskälla.

**Status quo** — behåll operativ procedur i CLAUDE.md. Förkastat: K2/K3-baslinjerna (37/100, 31/100) och anti-bloat-konsensus gör icke-handling till den dyraste vägen.

## Konsekvenser

CLAUDE.md kan krympa mot <100-radersmålet i K6; operativ procedur laddas bara vid relevant trigger; varje procedur får en sanningskälla, portabel över Claude.ai, Code och API; hub-skills blir universella över alla spokes via ett enda plugin.

Kostnaden: marketplace-registreringen blir ett nytt per-spoke-beroende i `.claude/settings.json` (ej, som ursprungligen antaget, ett `--plugin-dir`-shell-alias). `description`-kvalitet blir en kritisk felkälla — en vag `description` gör att skillen aldrig triggas. K8 visade att mitigeringen för meta-disciplin inte är bättre `description` utan flytt till alltid-på regel (p.8); för de 4 kvarvarande kommando-utlösta skillsen räcker `description`. Defer-listans fem skills är kvarstående skuld tills implementerad.

Löst vid K-sista (denna bake-in): descriptionerna validerade i K8 (4/6; de 2 meta-disciplinerna flyttade per p.8); per-skill nivå-arkitektur fattad i K5 (alla 4 kvarvarande platta, < 500 rader). Kvarstående skuld: `pre-commit-biome` blir spokens första native projekt-skill och därmed mönster-precedent (deferrad); Vale-mönstren (prep §1.5) noteras som ett angränsande men separat spår mot `marcus-system/templates/`.
