
<!-- vale Vale.Terms = NO -->
# ADR-024: Publika professionalitetssignaler — LICENSE, package.json, .github/, top-level docs
<!-- vale Vale.Terms = YES -->

- Status: Accepted
- Datum: 2026-05-06
- Fas: Pre-Fas-2 (verifiering inför Fas 2 Routing+Auth)

## Kontext

Pre-Fas-2-verifieringen 2026-05-06 visade en strukturell asymmetri: repot är 11/10 internt (20 ADR:er, byggplan.md 832 rader, BUILD-LOG retrospektivt komplett, datamodell-research-pipeline, 3-lagers token-system, pre-commit-hook), men 4/10 publikt (ingen CI, ingen LICENSE, default-fält i package.json, ingen CODEOWNERS/SECURITY/CONTRIBUTING/CHANGELOG, ingen issue/PR-template, ingen Dependabot).

Code:s omdöme i K1.B Block 7.1: *"den ena halvan exceptionellt välbyggd — den andra halvan finns inte. Det är inte en gradskillnad, det är en kategoriskillnad."* En tredjepartsverifierare (Codex) ser publika signaler först — repot klassas lägre än det förtjänar givet det interna arbetet.

## Beslut

<!-- vale Vale.Terms = NO -->
Etablera publika professionalitetssignaler på senior-nivå även för privat-projekt. Implementeras i fyra sub-klungor (åa repo-root metadata, åb .github/-paketet, åc top-level professional docs, åd README-uppgradering). Alla fyra delar samma motivering — därför EN samlad ADR istället för splittade ADR-024a..d (per UNIVERSAL "Korsreferens > duplicering", lessons.md 2026-05-04).
<!-- vale Vale.Terms = YES -->

Konkret omfattning:

- **Repo-root metadata** — LICENSE (proprietary, "UNLICENSED" i package.json), package.json kompletterad (description, author, license, repository, homepage, keywords, engines, "private": true), .editorconfig, .nvmrc, .vscode/extensions.json
<!-- vale Vale.Terms = NO -->
- **.github/-paketet** — workflows/ci.yml (Biome+tsc+test:api+build på PR till main), dependabot.yml (npm + github-actions), CODEOWNERS, ISSUE_TEMPLATE/{bug.md, feature.md}, PULL_REQUEST_TEMPLATE.md
<!-- vale Vale.Terms = YES -->
- **Top-level professional docs** — CHANGELOG.md (Keep-a-Changelog 1.1.0, retroaktiv), SECURITY.md (privat-rapportering, scope-definition), CONTRIBUTING.md (aktör-rollfördelning, sessions-disciplin, transcript-disciplin, DoD)
- **README-uppgradering** — badges (CI, license, node, Biome, Vite, react, TypeScript), Documentation-map-sektion som pekar på CLAUDE/byggplan/decisions/CHANGELOG/SECURITY/CONTRIBUTING

## Alternativ som övervägdes

1. **Status quo** — bevara internt 11/10, acceptera publik kategori-svaghet. Avvisat: Codex-verifieringen kommer hamna i kategori-2 ("ok men inget WOW") när repo-substansen förtjänar kategori-1.
2. **Minimal publik set** — endast LICENSE + CI + package.json (5-punkts-listan från Code 7.4). Avvisat: löser hygien-luckan men missar SECURITY/CONTRIBUTING/CHANGELOG som är seniorvärlds-default. MAXAT-direktivet från Marcus 2026-05-06 specificerar att alla publika signaler ska finnas.
3. **Splittade ADR-024a..d** — separat ADR per artefakt-grupp. Avvisat: alla fyra delar samma motivering (kategori-asymmetri-elimination), splitting hade duplicerat motivering 4 ggr.
4. **Open-source-licens (MIT/Apache)** istället för proprietary. Avvisat: privat-projekt utan distributionsplan; UNLICENSED + "private": true matchar avsikten.

## Konsekvenser

**Positivt:**

- Kategori-asymmetrin elimineras innan Codex-verifiering — repot klassas på sin substans, inte på sin publika fasad.
- CI ersätter pre-commit-hookens manuell-disciplin med automatiserad verifiering på PR.
- Dependabot fångar säkerhets-uppdateringar utan manuell övervakning (defer-poster H.2 PostCSS audit kan hanteras i automatiska PR:er).
- CHANGELOG ger versionshistorik utanför commit-historiken — läsbar för icke-tekniska intressenter.
- CONTRIBUTING formaliserar aktör-rollfördelningen (Marcus + Chat + Code) som hittills levde implicit i CLAUDE.md.

**Negativt:**

<!-- vale Vale.Terms = NO -->
- 5 nya filer i .github/ + 4 nya filer i repo-rot + 5 nya metadata-filer = 14 nya artefakter att hålla aktuella. Lindras av att de flesta är "set-and-forget" (LICENSE, .editorconfig, .nvmrc).
<!-- vale Vale.Terms = YES -->
- CHANGELOG kräver disciplin per release — defer:as till första taggade version (0.2.0 efter Fas 2).

**Spårbarhet:**

- ADR-024 refereras i commit-meddelanden för åa, åb, åc, åd
- README:s Documentation-map-sektion länkar tillbaka till denna ADR via decisions/README.md
