# En stackad PR som auto-retargetas till main kan bli BLOCKED för evigt utan att någon CI-körning någonsin startar

**`ci.yml`s `pull_request`-trigger lyssnar på `branches: [main]` med
default-eventtyperna (`opened`/`synchronize`/`reopened`). En PR som
öppnas mot en FEATURE-gren (stackad) och sedan auto-retargetas till
`main` via GitHubs `AutomaticBaseChangeSucceededEvent` triggar INGEN av
dessa tre händelser mot `main` — PR:en fortsätter existera, blir
`ready`, kan armeras för auto-merge, men required-checken ("CI Passed
or Skipped") saknas för evigt och `mergeStateStatus` blir `BLOCKED`.
Auto-merge väntar på en check som aldrig kommer att köras. Boten: en
commit på grenen (triggar `synchronize`) eller stäng/öppna PR:en om.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): `#1932` (ADR-127).
Rotorsak belagd ur tidslinjen: öppnad 15:17 mot basen `feat/task-281…`
(stackad; Marcus lämnade en draft-kommentar 15:19),
`AutomaticBaseChangeSucceededEvent` utlöstes när `#1930` landade,
`ready` 15:43:58, auto-merge armerad 15:44:01. Verifierat: **noll**
CI-körningar på head-SHA `cb249085` (`actions/runs?head_sha` = 0,
`check-runs` = 0, endast en Vercel-status). Detta hade tidigare
(Paushistorik 1) räknats som "konsumerad armering ×2" — en feldiagnos,
se den separata lärdomen
`konsumerad-armering-i-tat-kotrafik-ar-aterkommande.md`. Tidslinjen bar
i själva verket EN `AutoMergeEnabledEvent` och INGA kö-händelser.
Åtgärden (resumen, 2026-08-26): en commit på PR-grenen (rättade ett
radcitat, se lärdomen `radnummer-citat-i-bevis-driftar.md`) triggade
`synchronize`, vilket gav CI, vilket lät den redan befintliga
armeringen ta PR:en utan close/reopen.

**Det generella:** GitHubs merge-kö-mekanik (se CLAUDE.md § Landning
sker via MERGE QUEUE) förutsätter att required-checks faktiskt körs mot
`main`-branchen — men ett workflow-triggervillkor som filtrerar på
`branches` ser bara PR:er som VARIT öppna mot den branchen sedan en av
de tre default-händelserna, inte en PR som ANLÄNDER dit via en
bas-ändringshändelse. En stackad PR-strategi (öppna mot en syskon-gren,
låt GitHub retargeta vid landning) är därför strukturellt
inkompatibel med en `pull_request: branches: [main]`-trigger utan
extra hantering av `AutomaticBaseChangeSucceededEvent` — och symptomet
(PR:en rör sig inte, `BLOCKED`) är identiskt med flera andra
felklasser (konsumerad armering, väntande review), vilket gör
rotorsaks-verifiering mot faktisk check-run-historik obligatorisk innan
en åtgärd väljs.
