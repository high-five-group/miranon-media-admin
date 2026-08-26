# `--project=acceptance` utan miljöflaggan startar TYST fel webServer-gren

**`playwright.config.ts`s `webServer`-block är EN global inställning per
konfigurationsfil, avgjord av `process.env`-flaggor VID CONFIG-EVALUERING —
inte av `--project`. Ett `npx playwright test --project=acceptance`-anrop
utan `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1` startar den FÖRSTA matchande grenen
i webServer-ternarien (i detta repo: e2e-grenen, port 5173), inte
acceptance-projektets egen (port 22399-serien) — testerna kör då mot en
server projektets URL aldrig pekade på, och `page.goto()` fäller på
`ERR_CONNECTION_REFUSED` med ett felmeddelande som ser ut som en trasig
dev-server, inte som en saknad miljövariabel.**

Mätt i TASK-309.24 (runda 2, 2026-08-26): `npx playwright test
tests/acceptance/X.test.ts --project=acceptance` (utan
`PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1`) gav 716 ms till
`ERR_CONNECTION_REFUSED` mot `localhost:22399` — `DEBUG=pw:webserver`
avslöjade att den FAKTISKT startade servern var e2e-grenen på port 5173,
som blev "tillgänglig" på ~4 s men aldrig testades mot (fel URL). Lösningen
(`package.json`s `test:acceptance`-script) sätter flaggan; samma mönster
gäller `test:visual` (`PLAYWRIGHT_VISUAL_DEV_SERVER`), `test:webblasarbeteende`,
`test:a11y`.

**[UNIVERSAL]** Kör ALLTID testklassens egna `npm run`-script (eller kopiera
dess env-prefix exakt) i stället för ett rått `npx playwright test
--project=<namn>` när `playwright.config.ts` har ett `webServer`-block som
grenar på miljövariabler — `--project` väljer VILKA TESTER som körs, inte
VILKEN SERVER som startas åt dem. Ett `ERR_CONNECTION_REFUSED` eller en
oväntat snabb/långsam serverstart är signalen att kontrollera vilken gren
som faktiskt vann, med `DEBUG=pw:webserver` om det inte är uppenbart.
