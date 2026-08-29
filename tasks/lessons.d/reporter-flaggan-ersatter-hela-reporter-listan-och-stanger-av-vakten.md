# `--reporter=…` ersätter hela reporter-listan — och stänger av fixturvärldens vakt

**Fixturvärldens oanvänd-handler-vakt är en Playwright-REPORTER
(`tests/support/fixturvarld/overskuggnings-rapport.ts`, registrerad i
`playwright.config.ts`), inte en fixtur: en lokal körning med
`--reporter=list` ersätter hela listan och tar bort vakten — grönt lokalt,
rött i CI.** Mätt 2026-08-29 (S113, `TASK-340.2`): 433 passed i CI men exit 1
på en handler (`get-attachment-download-url`) som registrerats men aldrig
anropats sedan URL-uppslaget rivits; bygg-agentens alla lokala körningar bar
`--reporter=list` och såg aldrig vakten. Regel: kör acceptance-klassen utan
`--reporter`-flagga när vakten ska gälla; vill du ha list-utdata, lägg till
reportern i config-listan i stället för att ersätta den.
