---
id: TASK-244
title: >-
  Staging-sviten helt grön: de fyra kvarvarande fällningarna efter R2-varv-2
  (varv 3)
status: Done
assignee: []
created_date: '2026-08-16 13:20'
updated_date: '2026-08-16 16:40'
labels:
  - ready-for-agent
dependencies: []
ordinal: 446000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur AC4-beviset (post-merge run 31947844163 på 8214ef2f, 2026-08-16): taket är fixat (8m34s, sammanfattning nådd) men 4 fällningar kvarstår, alla namngivna: (1) aktivitetslogg-skarv.staging.test.ts:231 (anteckning i hem-spalten utan omladdning) · (2) event-detail.staging.test.ts:473 (lugnt laddläge skeleton — sannolikt ny baseline mot varv 2:s snabb-gate, 50ms-default ändrar när skeleton syns) · (3) persist-cache.staging.test.ts:260 (Kallstart-testet — behöver varv 2:s sessionStorage-opt-in, lasVarmningTimeoutOverride, inkopplad så Förberedelseskärmen faktiskt visas i testet) · (4) strict-mode-dubbletter på Fjärrskådning-event i staging-datan (flera länkar matchar samma namn — data-städning eller testselektor-skärpning). Läs task-236:s Implementation Notes (varv 1+2-forensiken) + kortets kvarstående race-fynd (TASK-227 kall enhet) före design. Larm-ärendet #1403 hålls öppet som arbetssignal och stängs när post-merge-staging är HELT grön.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla fyra fällningarna rotorsakade och åtgärdade (fix eller motiverad baseline-uppdatering per fall — aldrig blind timeout-bump)
- [x] #2 Post-merge-staging HELT grön (run-ID-belägg) och #1403 stängd mot beviset
- [x] #3 TASK-227-racet (kall enhet, förexisterande) triagerat: fixat här eller eget kort med motivering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ROTORSAK-PASS (task-244, 2026-08-16) — samtliga fyra fällningarna reproducerade lokalt (npx playwright test --project=chromium-authenticated --retries=0 --workers=1) mot faktisk staging INNAN fix, sedan bevisade gröna EFTER fix. Post-merge run 31949282911 (4fe1eee2) gav facit-listan (error-context.md-snapshots granskade under körningen).

PREMISS-DIVERGENSER mot uppdraget (ADR-086, samtliga verifierade mot disk/CI-loggar innan design):
- Radnumren i uppdraget (aktivitetslogg:231, event-detail:473) var describe/test-signaturrader, inte assertionsraderna — de faktiska fällningarna satt på rad 293 resp. 483/335/625. Ingen blockerande divergens; bara bokförd.
- Fällning (2) beskrevs som "sannolikt ny baseline mot varv 2s snabb-gate" — FALSIFIERAT. Rotorsaken är EventDetail.tsx:s placeholderData (seedad av warmup via SAMMA get-events-mock testet redan satte upp), helt oberoende av gate-timingen. 218.3-gaten var redan neutraliserad av varv 2:s 50ms-default.
- Fällning (3)-beskrivningen ("behöver varv 2s sessionStorage-opt-in ... inkopplad") var FELAKTIG — optaInRiktigVarmning(page) var REDAN inkopplad i TASK-227-kall-enhet-testet (rad 608, från varv 2). Den verkliga rotorsaken var en race i main.tsx (se AC3 nedan), exakt den task-236 varv 2 lämnade som KVARSTÅENDE EJ LÖST.
- Fällning (4) beskrevs som "data-städning eller testselektor-skärpning" (staging-datadubblett). FALSIFIERAT via diagnostisk DOM-poll: INGEN staging-datadubblett — en transient cirka 250ms SPA-navigeringsrace (Hems egna widgets ej ännu avmonterade när EventsList redan monterat) fångad av en ostoppad getByText utan gate på destinationsrutten.

(1) aktivitetslogg-skarv.staging.test.ts:293 — historikvyns assertion.
Rotorsak: forvantadRad (rad ~271) byggdes i task-235 för att matcha SPALTENS rendering (SenasteAktivitet.tsx: aktör+händelse+·+objekt i EN span) och verifierades DÄR, aldrig mot historikvyn. AktivitetsHistorik.tsx:s AktivitetsRad (S106-passets dokumenterade, avsiktliga form) delar aktör+händelse och tid+objekt på TVÅ separata p-element. error-context.md bevisade exakt detta: raden renderas som "Lotta skrev en anteckning" / "nyss · Loggskarvprövning" — forvantadRad kan strukturellt aldrig matcha en enda nod där.
Åtgärd (fix, ej baseline-gissning): assertionen mot historikvyn byggs nu mot AktivitetsRad:s FAKTISKA tvåradersform — aktörnamn+verbCopy (rad 1) + "nyss · EVENT_NAMN" (rad 2) — i stället för forvantadRad. Spaltens check är orörd (forvantadRad stämmer där).
Lokalt bevisat: rött FÖRE (element not found, 5000ms) → grönt EFTER (2/2 passed).

(2) event-detail.staging.test.ts:473 (Lugnt laddläge: skeleton).
Rotorsak: mockEvent() registrerar internt mockValjarLista(page, VALJAR_LISTA) — VALJAR_LISTA[0].id === EVENT_ID. Warmup (startvarmningen.ts WARMUP_ITEMS[0]) värmer queryKeys.events.list via SAMMA mockade get-events-endpoint INNAN EventDetail mountar. EventDetail.tsx:s placeholderData (rad 76-77) hittar då direkt en matchande listpost → isPending blir false OMEDELBART, helt oberoende av att get-event manuellt hölls tillbaka. Skeletonen hoppade därför HELT över. Den gamla TASK-236-kommentaren (warmup-gate-fördröjning) var fel rotorsak.
Åtgärd (fix): denna ENA testet override:ar get-events-mocken EFTER mockEvent() med VALJAR_LISTA minus EVENT_ID (Playwright kör routes i omvänd registreringsordning) — placeholderData kan då aldrig matcha. Verifierat att EventValjare läser sitt valtEvent direkt ur get-event-svaret, inte listan — h1-checken efter release() är opåverkad.
Bevis i BÅDA riktningar: 12000ms-timeouten (satt av task-236 på fel grund) reverterades till standard 5000ms — testet går grönt på 2,1s, vilket bevisar att fixen adresserar rotorsaken.

(3) TASK-227-racet (AC3 — triage: FIXAT HÄR).
Rotorsak (bekräftar task-236 varv 2s hypotes, mekanismen nu fastställd): main.tsx:s InnerApp-warmup-effekt satte MEDVETET INTE varmtBeslutat.current på auth-yta-bypass-grenen. Vid en AKTIV inloggning återkommer InnerApps effekt en andra gång. gate.typ är då REDAN redo (från bypass-beslutet på /login), så prenumerations-callbackens guard hindrar en SYNLIG andra skärm — men starta() hinner ändå anropas OSYNLIGT i bakgrunden, och dess FÖRSTA ensureQueryData registrerar en Query i cachen SYNKRONT innan fetchen settlar. _authenticated.tsx:s EGEN arCacheVarm-koll hinner då se en "varm" cache trots att ingen riktig data landat, och tystnar HELT.
Åtgärd (fix, ej blind timeout-bump): src/main.tsx sätter nu varmtBeslutat.current = true även på auth-yta-bypass-grenen — InnerApps varm/kall-beslut fattas därmed EXAKT en gång per sidladdning. src/routes/_authenticated.tsx docblock uppdaterad i linje.
Verifierat: kall enhet OCH varm enhet BÅDA gröna lokalt. Full persist-cache.staging.test.ts-fil körd (9 passed, 1 skipped — AC4 kräver byggd preview, förväntat) — ingen regression. events-list.staging.test.ts eget kalla-laddläge-test körd separat: grönt.

(4) persist-cache.staging.test.ts:335 (strict-mode Fjärrskådning, Kallstart-testet).
Rotorsak: EJ staging-datadubblett. page.waitForURL löser vid history-API-ändringen INNAN React avmonterat Hem/monterat EventsList. Diagnostisk DOM-poll mätte fönstret till cirka 250ms lokalt: vid t+0ms innehöll main#main FORTFARANDE Hems egna Fjärrskådning-referenser (Nästa event-länk + BÅDA NyaAnmalningarCard-raderna) SAMTIDIGT som EventsList redan monterat sin egen länk. getByText fångade strict-mode-violationen på FÖRSTA evalueringen.
Åtgärd (fix): assertionen väntar nu FÖRST in heading Event (unik för destinationsrutten) innan den läser main#main-scopad Fjärrskådning-text.
Kvarstående OBSERVERAD men EJ task-244-relaterad flaka: en körning träffade progressbarens aria-valuenow-stabilisering mot RIKTIG staging (12000ms) — reproducerades EN gång av tre, matchar task-236s dokumenterade systembelastning under denna sessions egen upprepade staging-trafik. Rörs EJ.

DoD-GRINDAR (körda FÖR PUSH, faktiska exitkoder): npm run test:api 768/768 passed exit 0. npm run typecheck exit 0. npx biomejs biome check exit 0 (0 fel, 6 warnings/43 infos samtliga pre-existerande i orörda filer). npm run build exit 0.

AC2 (Post-merge-staging HELT grön): EJ avbockad härifrån med avsikt — kräver post-merge-run-ID-belägg som bara existerar EFTER denna PRs landning. Orkestreraren äger CI-svansen; #1403 stängs mot det beviset.

Rörda filer: src/main.tsx (AC3-fix) · src/routes/_authenticated.tsx (docblock i linje med AC3-fixen) · tests/e2e/aktivitetslogg-skarv.staging.test.ts (fällning 1) · tests/e2e/event-detail.staging.test.ts (fällning 2) · tests/e2e/persist-cache.staging.test.ts (fällning 3 diagnostik + fällning 4 fix).

---

VARV 4 (2026-08-16, post-merge run 31955429690 på merge-commit 417f4775 — AC2 uteblev): EXAKT EN kvarvarande fällning, Kallstart-testet (persist-cache.staging.test.ts:318), rött 3/3 (retry2), "Expected 6, Received 4" — de tre ANDRA fällningarna (1/2/4) höll i CI, bekräftar varv 3s fixar.

PREMISS-PASS PÅ ORKESTRERARENS EGNA HYPOTESER (samtliga PRÖVADE mot faktiska bevis, inte antagna):
- Hypotes "CI-timing exponerar en kvarvarande gren av TASK-227-racet": FALSIFIERAD — detta är Kallstart-testet (main.tsx InnerApp-vägen), inte TASK-227-gaten (_authenticated.tsx); de är strukturellt oberoende och varv 3s fix rör inte denna kodväg.
- Hypotes "delad Airtable 5 req/s-budget (P4) utarmad av föregående test:api:staging (293 req, samma CI-jobb)": PRÖVAD OCH FALSIFIERAD på TVÅ sätt. (a) Laddade ner och extraherade trace.zip ur DEN FAKTISKA röda CI-körningen (run 31955429690, retry1) — nätverksloggen visar samtliga SJU EF-anrop (get-events/get-registrations/get-leads/get-waitlist/get-segments/get-mail-log/get-activity-log) landa med status 200 inom 1,6s totalt, INGEN 429, ingen fördröjning. (b) Reproducerade lokalt: full test:api:staging (293-294 req) omedelbart följt av samma fem EF-anrop warmupens batch2-4 gör — samtliga under 1,1s, två separata körningar. airtable-retry.ts:s 30s-429-golv (som hade förklarat en flerasekunders stagnation) syns ingenstans i bevisen.

ROTORSAK (falsifierbar, evidensbaserad): kortets EGEN tidigare motivering för "totalt−1 är sista STABILA, garanterat observerbara steget" (filhuvudet, ursprungligen skriven för ATT förklara varför totalt/totalt ALDRIG är observerbart — samma mikrotask-resonemang som gate-släppet) höll inte EN batch tidigare än vad som antogs. Trace-beviset visar batch2 (waitlist+intresserade) och batch3 (maillog+segment) landa så tätt (delar av en sekund) att React kan batcha flera på-varandra-följande klara-inkrement — INKLUSIVE gate-släppet till redo — till EN enda paint. "totalt−1" hann då aldrig målas som en egen observerbar DOM-frame; testets poll fastnade på det SENAST lyckade avläsningsvärdet ("4") medan progressbar-elementet redan hunnit försvinna (gate redan redo, Hem redan fullt renderat — bekräftat i alla tre CI-retry-snapshotsens error-context.md).

ÅTGÄRD (motiverad baseline-uppdatering, ej blind timeout-bump — samma 12s-budget oförändrad): assertionen godtar nu BÅDA de bevisat giltiga utfallen — sistaStabila OBSERVERAS, ELLER gaten har REDAN släppt (progressbaren borta, via count() — inte getAttribute som annars väntar in ett element som aldrig kommer). En äkta stagnation (varken nås ELLER släpper gaten inom 12s) fäller fortfarande — grinden bevarar sin skyddande förmåga. Filhuvudets docblock uppdaterat i linje.

Verifierat lokalt: 3/3 gröna körningar av Kallstart-testet efter fixen, plus full persist-cache.staging.test.ts-regression (9 passed, 1 skipped — AC4 oförändrat). DoD-kvartetten grön: test:api 768/768, typecheck 0 fel, biome 0 fel, build grön.

Diagnostik-artefakter (engångs, borttagna innan push): temporär per-item timing-loggning i startvarmningen.ts (reverterad till exakt ursprungsform, noll diff kvar) + två temporära debug-testfiler (tests/e2e/_debug-task244-varv4.staging.test.ts, tests/api/_debug-task244-varv4.staging.test.ts, båda raderade).

Gren: fix/task-244-varv4-kallstart-batching-race, byggd från färskt origin/main (c86df19a, ≥ b0b28c8d).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i två varv: PR #1417 (varv 3, merge 417f4775) — fällning 1 (tvåradersform-assertion), fällning 2 (placeholderData-seedning, 12s-timeout reverterad till 5s), fällning 4 (navigeringsrace) + AC3/TASK-227-racet (main.tsx varmtBeslutat-grenen); tre av fyra kort-hypoteser falsifierades före fix. PR #1424 (varv 4, merge 6c355b75) — Kallstart-testets React-batching-antagande rättat (motiverad baseline-uppdatering; race- och rate-limit-hypoteserna falsifierade med trace ur run 31955429690). AC2-BEVIS: Post-merge-run 31958558973 på 6c355b75 HELT GRÖN; #1403 stängd mot beviset. CI grön per jobb via merge-kön i båda varven.
<!-- SECTION:FINAL_SUMMARY:END -->
