---
id: TASK-8.1
title: 'Skiva: Mätprotokollet — kallstartsfönstret låser framträdande-formen'
status: Done
assignee: []
created_date: '2026-07-11 22:54'
updated_date: '2026-07-12 11:53'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mät det faktiska kallstartsfönstret och lås skelettets framträdande-form INNAN Hem-skivan byggs (grillad samsyn S63 Del 2 beslut 4 — mät-först, empiriskt i stället för antaget). Beteende ände-till-ände: mot deployade läs-EF:er görs hård omladdning med tom cache under prod-lika förhållanden; tiden från första render till data-släpp mäts (≥5 mätningar per dashboard-query, kallstart + varm EF separerade); utfallet prövas mot den käll-verifierade 1 s-tröskeln (NN/g 0,1/1/10 s + FK FLoader 1 s) och formen låses per samsynens regel: typiskt fönster KLART över 1 s → skeleton från första bildrutan; ofta under 1 s → framträdande-fördröjning ~1 s. Beslutet + metod + råvärden dokumenteras i skivans implementation notes OCH som kommentar på Hem-skivan (task-8.4) — substrat-buren kunskapsöverföring till nästa utförare (L266). Ingen produktkod ändras (read-only mätskiva). Täcker användarberättelser: 6 (underlag för 2, 5).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kallstartsfönstret mätt prod-lika (tom cache, hård omladdning, ≥5 mätningar per dashboard-query) med metod + råvärden dokumenterade i skivans notes
- [x] #2 Framträdande-formen låst per samsynens 1 s-regel och beslutet + motivering skrivet som kommentar på Hem-skivan (task-8.4)
- [x] #3 Ingen produktkodsändring i diffen (mätskiva)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Mätprotokoll — kallstartsfönstret (2026-07-12, T76-pilot A1)

### Metod

- Prod-lika bygge: `npm run build -- --mode staging` (production-minifierad bundle; `.env.staging` pekar bygget mot staging-instansens deployade läs-EF:er — samma miljö som e2e-sviten). OBS: `npm run build` utan mode-flagga bygger mot PROD-instansen och får aldrig användas för mätning/test. Servering: `vite preview` på port 5173 — EF:ernas CORS-origin-allowlist (cors.ts, env-driven) tillåter inte preview-defaultporten 4173 (se metodnot 1).
- Runner: Playwright headless Chromium (repots pinnade version), viewport 1440x900, sv-SE, Europe/Stockholm. Throwaway-mätskript i scratchpad — inget i repot.
- Hård omladdning + tom cache: varje mätrunda kör i en NY browser-context (tom HTTP-cache, ingen SW-registrering, tom in-memory query-cache; ingen cache-persist finns i appen före task-8.3) med storageState (session) från EN föregående login.
- Login gjordes EN gång FÖRE serien med läs-EF:erna blockerade (route.abort på `/functions/v1/get-*`) så att EF-värmen inte förstördes före runda 1.
- Mätpunkter per runda, i sidans egen klocka (performance.now/Resource Timing — ingen IPC-latens): FCP; EF-anropens fetchStart→responseEnd (duration); pending-ytans uppträdande/försvinnande per card via MutationObserver injicerad före app-koden (`[role="status"][aria-busy="true"]` — DashboardCards pending-yta). Fönster = pending-försvann minus pending-syntes per card = tiden laddläget faktiskt är synligt (första render → data-släpp, inklusive React-rendern av datat).
- 8 rundor x 2 dashboard-queries (`dashboard.events` → get-events; `dashboard.registrations` → get-registrations, delad av Obetalda + Nya anmälningar). Runda 1 = kallstartskandidat (första datavägs-exekveringen), rundor 2–8 = varm EF. Datakvalitet: exakt 1 anrop per query per runda (ingen retry-kontaminering), samtliga HTTP 200, 3 status-övergångar per runda.

### Råvärden (ms)

| Runda | Klass | FCP | get-events dur | get-registrations dur | Fönster Nästa event | Fönster Obetalda | Fönster Nya anm. |
|---|---|---|---|---|---|---|---|
| 1 | kall dataväg | 460 | 7599 | 7903 | 7634 | 7942 | 7942 |
| 2 | varm | 540 | 1342 | 1658 | 1381 | 1696 | 1696 |
| 3 | varm | 452 | 1428 | 1543 | 1467 | 1581 | 1581 |
| 4 | varm | 464 | 1438 | 1517 | 1473 | 1556 | 1556 |
| 5 | varm | 452 | 1274 | 1609 | 1311 | 1648 | 1648 |
| 6 | varm | 448 | 1329 | 1412 | 1368 | 1451 | 1451 |
| 7 | varm | 464 | 1399 | 1529 | 1438 | 1566 | 1566 |
| 8 | varm | 468 | 1484 | 1528 | 1524 | 1567 | 1567 |

Aggregat varm EF (n=7; min/median/max): fönster Nästa event 1311/1438/1524 · Obetalda 1451/1567/1696 · Nya anmälningar 1451/1567/1696. EF-durationer: get-events 1274/1399/1484 · get-registrations 1412/1529/1658.

### Metodnoter (öppet bokförda)

1. CORS-fällan 4173: en första serie kördes mot vite preview:s defaultport 4173 och är OGILTIG — EF:ernas origin-allowlist tillåter inte 4173, varje anrop föll i fetch-reject (16 anrop/query per laddning = fetchWithRetry 4 försök x React Query 4 försök) och de skenbara fönstren (~10 s) mätte tiden till FELLÄGE, inte data-släpp. Preflight-403:orna bootade dock EF-isolaterna (påverkar not 2).
2. Kallstartsklassen n=1, och isolate-värmen: runda 1:s isolater var redan bootade (av 403:orna i not 1); 7,6–7,9 s är alltså den kalla DATAVÄGEN (Airtable-proxyn; ingen EF-intern cache finns — verifierat i `_shared/airtable-client.ts`), inte isolate-boot. En helt kall produktion (isolate + dataväg) är ≥ denna klass. Fler kallstartsprover hade krävt ~8 min EF-idle per prov inom staging-semaforen och kan inte ändra beslutet (den varma klassen ligger redan klart över tröskeln) — medvetet avstått, öppet bokfört.
3. Lokal bundle-servering (localhost-preview) gör de uppmätta fönstren till en NEDRE gräns för verklig drift — beslutet står stadigare av det.
4. Nätverk: lokal lina; EF+Airtable-latensen (server-side) dominerar fönstret och är nät-oberoende.

### Utfall mot 1 s-regeln

Typiskt fönster är KLART över 1 s i BÅDA klasserna (varm: samtliga 21 kort-fönster 1311–1696 ms; kall dataväg: 7634–7942 ms) → framträdande-formen låses till SKELETON FRÅN FÖRSTA BILDRUTAN (ingen framträdande-fördröjning). Beslut + motivering: kommentar på task-8.4 (AC 2).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 8f4b7b1 (merge a50cce7, PR #48) · CI-run 29191268155 (PR) + 29191469255 (main) gröna per jobb · CI-grön-första-pass: ja · defekter under körning: 2 (ogiltiga mätserier — prod-mode-bygge resp. CORS-blockerad preview-port 4173; kasserade + omkörda av agenten, inget nådde diffen) · TDD: ej tillämplig (read-only mätskiva; ersatt med mätdata-kvalitetskontroller: 1 anrop/query/runda, alla HTTP 200) · DoD 5/6 EJ TILLÄMPLIGA (read-only mätskiva utan UI-yta/diff — Marcus-kvitterat A i S65 design-STOPPA, bockade med denna bokföring) · AFK-proveniens: T76-piloten S65 pipeline A agent A1, fas 1 exklusivt fönster, orkestrerad stängning
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [x] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
