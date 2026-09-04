# npm retryar aldrig POST — `NPM_CONFIG_FETCH_RETRIES` är verkningslös för audit

**[UNIVERSAL] `make-fetch-happen` (npm:s HTTP-lager) retryar aldrig ett
POST-anrop, oavsett `NPM_CONFIG_FETCH_RETRIES`.** Källkoden
(`make-fetch-happen/lib/remote.js`) säger det rakt ut i en kommentar —
`// do not retry POST requests, or requests with a streaming body` — och
villkoret `isRetriable = req.method !== 'POST' && …` gör det mekaniskt: ett
POST-anrop kan aldrig klassas som retry-bart. `npm audit`s advisory-bulk-
endpoint (`registry.npmjs.org/-/npm/v1/security/advisories/bulk`) är just ett
POST. Mätt run `33858911410` (2026-09-04): `audit-ci`-steget kördes med
`NPM_CONFIG_FETCH_RETRIES: 4` satt i miljön, men loggen visar ETT enda försök
på 91 sekunder innan felet (`code undefined: Exiting...`) — ingen retry
inträffade, trots att flaggan var satt. Ett skript som vill överleva en
flaky/nere advisory-endpoint måste lägga om-försök på STEG- eller
skript-nivå (en egen loop runt hela `npx audit-ci`-anropet), aldrig förlita
sig på npm:s inbyggda retry-mekanism för just detta anrop.
