---
id: TASK-201.14
title: 'Skiva: Den villkorliga luckan i useSendActionEmail — posten släpps aldrig tyst'
status: Done
assignee: []
created_date: '2026-08-13 19:26'
updated_date: '2026-08-14 18:38'
labels: []
dependencies: []
parent_task_id: TASK-201
ordinal: 384000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
useSendActionEmail (src/data/mutations/actionEmail.ts) gjorde 'if (!reg) continue' när uppslaget mot mottagare-listan missade, och SLÄPPTE då aktivitetsposten tyst — ett mail som faktiskt lämnade systemet fick inget spår i historiken. Till skillnad från useConfirmAll/useLogPaymentReminder (död kod) är detta LEVANDE kod på Åtgärds-sidan, dagens bulk-bekräftelseväg. Marcus order 2026-08-13: inte en enda lucka. Fallbacken följer TASK-201.13s precedent i useConfirmAll ordagrant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Luckan stängd: aktivitetsposten skrivs för VARJE id i result.completed, även när uppslaget mot mottagare-listan missar
- [x] #2 Fallbacken följer TASK-201.13s useConfirmAll-precedent ordagrant (namn 'Okänd anmälan'), ingen andra form i samma fil-familj
- [x] #3 Person-ID-kopplingens öde öppet redovisat i kod: går förlorad när raden saknas, nyckeln utelämnas hellre än gissas
- [x] #4 continue-frågan prövad mot EF-kontraktet och besvarad i kod: inget läge i completed saknar handling
- [x] #5 Tvåsidigt bevis genom den RIKTIGA hooken: post skapas vid cache-miss, INGEN post när mutationen faller — plus fällningsbevis att testet fäller om luckan återinförs
- [x] #6 Fire-and-forget-kontraktet orört: ingen loggning kan fälla mutationen; ingen fritext i statementet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT (egen worktree, agent-a2fddba7262ffc738), gren fix/task-201-14-cachemiss-lucka, commit 2eefa945.

PREMISS-PASS (ADR-086) — TVÅ DIVERGENSER MOT UPPDRAGET, byggt mot verkligheten:
 1. PR #1261 ÄR INTE LANDAD. Uppdraget kallade fyndet 'en avvikelse i redan landad kod' och pekade på '#1261, commit 30b137d2'. Mätt: gh pr view 1261 → state OPEN, mergeStateStatus BLOCKED, mergedAt null; git merge-base --is-ancestor 30b137d2 origin/main → EJ ancestor. Den LUCKA jag stänger är däremot äkta landad kod (finns i origin/main). Följden som betydde något: PRECEDENTEN (useConfirmAll-fallbacken) finns bara på #1261s gren, så formen lästes ur gh pr diff 1261 i stället för ur main — och #1261 rör SAMMA fil (actionEmail.ts, dess useSendActionTestEmail-hook, en annan hunk än min).
 2. 'CACHEN' ÄR INTE CACHEN. Uppdraget beskrev luckan som 'när cachen saknar anmälans rad'. Mätt i koden: byId byggs av mutationsVARIABELN mottagare (actionEmail.ts rad 78), inte av queryClient-cachen. Skillnaden är materiell för person-ID-frågan: useConfirmAll läser listcachen (hela listan), useSendActionEmail har bara URVALET. Rapporterat, ej blockerande.
Prövat och HÖLL: filen finns, raden 'if (!reg) continue' stod på rad 81, hooken anropas från levande UI (AtgardsSida.tsx rad 2212).

CONTINUE-FRÅGAN — PRÖVAD MOT EF-KONTRAKTET, SVARET ÄR NEJ. result.completed = mottagare som fick BÅDE mail och (om åtgärden har en) fält-skrivning (SendActionEmailResultSchema rad 48-54). Även grenen där stampFieldsFor ger null räknas som completed — och betyder enligt EF:ens egen kommentar 'mailet ENSAMT är hela handlingen' (_shared/send-action-email.ts rad 495-501). Det finns alltså INGET läge i completed där ingen handling skedde. continue vore aldrig rätt.

FALLBACK-VALET: 'Okänd anmälan', ORDAGRANT useConfirmAlls sträng. Motivering: objektets IDENTITET är i båda fallen en anmälan (registrationObjectId) — mail är objektets KATEGORI (ACTIVITY_OBJECT_TYPES.mail), inte dess identitet. 'Okänd mottagare' övervägdes och förkastades: den hade beskrivit kategorin i stället för entiteten och gett två platshållare för samma sak i samma fil-familj.

PERSON-ID-KOPPLINGEN GÅR FÖRLORAD — ÖPPET REDOVISAT I KOD OCH LÅST AV TEST. mottagare är hookens enda källa till personId; saknas raden utelämnas PERSON_ID_EXTENSION_IRI HELT (recordActivity.ts rad 106: nyckeln skrivs bara när personId är truthy) i stället för att bära ett gissat ID. Följd: posten syns i eventets historik men INTE på personens tidslinje. Ett listcache-uppslag som andra källa övervägdes och FÖRKASTADES: den levande vägen skickar registrationIds: mottagare.map(r => r.id), så listorna är alltid parade — komplexiteten hade löst ett läge som strukturellt inte kan uppstå i UI:t, och avvikit från precedentens form. Testet asserterar frånvaron, så ett påhittat person-ID fäller.

TVÅSIDIGT BEVIS — tests/acceptance/atgarder-cachemiss-logg.acceptance.test.ts (NY fil; #1261s testfiler medvetet ORÖRDA för att undvika konflikt), genom den RIKTIGA hooken på Åtgärds-sidans verkliga sändväg:
 · POSITIVT: servern svarar completed [ANNA, recServernsEgna01] där det andra ID:t saknas i urvalet → 2 aktivitetsposter, namnen ['Anna Andersson (Utbildning Skövde)', 'Okänd anmälan']. Annas post bär personId recVisualPers00001; den okända bär ingen person-extension.
 · NEGATIVT: send-action-email svarar 500 → felytan 'Kunde inte skicka utskicket' renderas (ankaret som gör frånvaro-assertionen fällbar) → 0 poster. recordActivity sitter i onSuccess och nås aldrig.
 · FÄLLNINGSBEVIS (tvåriktat): 'if (!reg) continue' injicerades tillbaka → testet FÖLL med exakt 'Expected: 2, Received: 1' (den släppta posten), medan det negativa testet förblev grönt. Injektionen återställd BIT-IDENTISKT (git checkout --; git diff HEAD gav 0 filer).
 · INTEGRITETEN: onSuccess destrukturerar fortfarande bara { actionType, mottagare } — amne/mailtext finns aldrig som binding i scopet. Testet asserterar dessutom mot HELA serialiserade payloaden att 'Din plats är bekräftad', 'Varmt välkommen' och '{förnamn}' inte når statementet.
 · FIRE-AND-FORGET ORÖRT: anropet är fortfarande void recordActivity(...) i onSuccess; ingen await, ingen ny felväg. Ändringen tog BORT en gren, lade inte till någon.

GRINDAR (exitkoder fångade separat, aldrig via pipe):
 · npm run typecheck             exit 0
 · npx @biomejs/biome check .    exit 0 (6 varningar, samtliga pre-existerande i orörda filer)
 · npm run build                 exit 0
 · npm run test:api              exit 0 — 715 passed (staging var ledig; ingen preflight-blockering)
 · acceptance (nya filen)        exit 0 — 2/2

INGA MAIL SKICKADE. send-action-email överskuggas i varje test och ligger medvetet utanför normalläget; all verifiering mot fixturvärld (MSW). Inga supabase-kommandon kördes. Prod orörd.

DOD-VERIFIERING (orkestrerar-agent, ADR-086, 2026-08-14): PR #1263 MERGED 2026-08-13T19:56:18Z, merge-commit 2de189db1c4cd739af66c5ee1b216454085ac1eb — bekräftat ancestor av origin/main (git merge-base --is-ancestor). Merge-queue-körningen (event merge_group, run 31737551230, gren gh-readonly-queue/main/pr-1263-...) är GRÖN PER JOBB: Lint+Audit+TypeCheck success, Docs link check success, Acceptance (hermetisk) success, Webblasarbeteende success, Pure+Build success, A11y/Staging(API+E2E)/Staging sentinel purge skipped (förväntat), gate 'CI Passed or Skipped' success. DoD #4: gh pr diff 1263 --name-only — tre filer, samtliga inom scope (backlog-kortet, actionEmail.ts, den nya acceptance-testfilen). Noll orelaterade filer. DoD #2 vilar på kortets egna mätta grindutfall (typecheck/biome/build/test:api/acceptance, alla exit 0, se ovan).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
useSendActionEmails villkorliga lucka (if (!reg) continue) stängd: aktivitetsposten skrivs nu för VARJE id i result.completed, med fallback-namn 'Okänd anmälan' (ordagrant TASK-201.13s useConfirmAll-precedent) när uppslaget mot mutationsvariabeln mottagare missar. Person-ID-kopplingen går medvetet förlorad i det läget (öppet redovisat i kod, asserterat i test) snarare än gissad. Tvåsidigt bevis genom den riktiga hooken (positiv/negativ/fällningstest) i tests/acceptance/atgarder-cachemiss-logg.acceptance.test.ts. Landat via PR #1263, MERGED 2026-08-13T19:56:18Z. Merge-queue-körningen (run 31737551230) grön per jobb, inga orelaterade filer i diffen.
<!-- SECTION:FINAL_SUMMARY:END -->
