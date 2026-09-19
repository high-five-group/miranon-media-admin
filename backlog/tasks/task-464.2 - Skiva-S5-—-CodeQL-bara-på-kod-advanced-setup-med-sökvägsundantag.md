---
id: TASK-464.2
title: 'Skiva: S5 — CodeQL bara på kod (advanced setup med sökvägsundantag)'
status: Done
assignee: []
created_date: '2026-09-18 22:39'
updated_date: '2026-09-19 09:18'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-464
priority: high
ordinal: 805000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CodeQL står för 13 % av augustis minuter (≈ 11 300 min/mån i dagens form; ≈ 3 600 efter åtgärden enligt docs/research/actions-minutbudget-2026-09-18.md § C). Repot kör GitHubs "default setup" (mätt: gh api repos/high-five-group/miranon-media-admin/code-scanning/default-setup → state configured, runner_type standard, fyra språk), och i det läget går sökvägar inte att undanta — CodeQL kör alltså på varje ren markdown-ändring.

Byt till "advanced setup": en egen arbetsflödesfil med on.pull_request.paths-ignore (och motsvarande för push/merge_group där det gäller), så att HELA körningen hoppas vid en ren dokumentändring. Förstapartens begränsning är känd och acceptabel: paths-ignore avgör om körningen startar, inte vilka filer som analyseras när den väl kör (docs.github.com, customizing-your-advanced-setup-for-code-scanning, citerad i underlaget § S4/S5).

Priset är underhåll: default setup följer automatiskt med när GitHub uppdaterar frågesviterna; en egen fil är vår att sköta. Det priset ska bokföras öppet, inte gömmas.

ORDNING FÖR BYTET (inget skyddsglapp): den egna arbetsflödesfilen byggs och körs grönt MEDAN default setup fortfarande är på; larmlistan jämförs före/efter; först därefter stängs default setup av — och avstängningen är en repo-inställning som ORKESTRERAREN utför, inte bygg-agenten.

Fristående från ci.yml — ingen beroendekedja mot K1 (b) eller S4.

Täcker användarberättelser: 1, 2, 3 (TASK-464)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Egen CodeQL-arbetsflödesfil med samma språk och samma frågesvit som default setup bar (mätt före bytet och citerat i PR-kroppen); github/codeql-action SHA-pinnad och bevakad av Dependabot
- [x] #2 En ren D0-ändring startar ingen CodeQL-körning; en kodändring gör det — kontrastpar med run-ID:n. Sökvägslistan hålls mängd-lik med ci.yml:s D0-allowlist av en paritetsvakt (ingen obevakad handhållen kopia)
- [x] #3 Ny kunskap mot oförändrad kod fångas fortfarande: en schemalagd körning finns kvar, och push till main skannas enligt samma regel som i dag
- [x] #4 Före/efter-jämförelse av gh api .../code-scanning/alerts: inga larm tappade eller tyst stängda av bytet; default setup stängs av FÖRST efter grön egen körning, av orkestreraren
- [x] #5 Krävs CodeQL av rulesetet eller kö-ytan i dag? Mätt och redovisat; ett hoppat CodeQL-jobb får inte blockera en dokument-PR och inte öppna ett skipped-hål för kod-PR:er
- [x] #6 PR-kroppens sektion 'Kostnad i två mått' (minuter per månad före/efter, väntetid oförändrad eller redovisad) samt en rad i CONTRIBUTING om att frågesviternas uppdatering nu är vårt ansvar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som #2558 (`bf35cd41`, 2026-09-19 09:01Z, head `dc64aac5`, sex granskningsrundor; runda 6: 0 error, risk hög enbart pga kategorin, armerad på Marcus GO i klartext). CodeQL går nu via egen `.github/workflows/codeql.yml` (advanced setup) med samma språk och frågesvit som default setup bar, och hoppas på rena D0-ändringar på BÅDE pull_request- och push-ytan via ett gemensamt YAML-ankare (AC #3 skärpt på orkestrerarbeslut, S126 Del 12: push-ytan filtreras också; schemat veckovis kvar). BYTET, mätt (S126 Del 15): färsk baslinje efter default setups omskanning av `3c318da4` = ETT öppet larm (nr 13); default setup satt till not-configured; PR-körningen `35415282827` grön med SARIF accepterad; första hela körningen på main (`35433547437`) grön med identiska kategorier och regelantal (87/17), results=1, larm 13 kvar öppet med samma identitet, noll larm stängda av bytet — diff mot baslinjen tom. AC #4:s bokstav ('stängs av FÖRST efter grön egen körning') är mekaniskt omöjlig — GitHub avvisar advanced-setup-SARIF medan default setup är på (mätt, körning `35404550404`) — så ordningen vändes med baslinje före; rationale (inga larm tappade) håller. Ny kunskap: en PR-analys är diff-informerad, så före/efter kan aldrig slutföras före landning. Efterkontroll `35433547555` grön. Rollback står i CONTRIBUTING.md. Följd: larm 13 bärs av TASK-474.
<!-- SECTION:FINAL_SUMMARY:END -->
