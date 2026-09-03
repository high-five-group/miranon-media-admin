---
id: TASK-374.2
title: >-
  Skiva: Flippen — konvergensformen blir den enda Intresserade-vyn, rename med
  git-historik, acceptance-sviten omskriven, ariaSnapshot EFTER grön
status: To Do
assignee: []
created_date: '2026-09-03 09:20'
updated_date: '2026-09-03 11:51'
labels:
  - ready-for-agent
dependencies:
  - TASK-374.1
parent_task_id: TASK-374
ordinal: 677000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta öppnar Intresserade i appen och ser den stämplade formen utan någon URL-parameter — sök, sortering, primär/sekundär rad, aktivitetsrad, jämnbred pill och exakt lika höga rader — med samma verkliga data som förut (alla intresserade via cursorloopen). Den gamla K0-vyn finns inte längre; den gamla komponentens namn och plats bärs nu av den promoverade formen. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 21
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Utan query-parametrar renderar /mer/intresserade den promoverade formen; ariaSnapshot EFTER flippen är identisk med referenserna FÖRE (B4-paret grönt i båda vyporterna, lägena fylld och tom)
- [x] #2 Filflytten är en git-rename till den skarpa komponentens namn och plats så historiken följer formen; datavägen är oförändrad (samma query-nyckel, cursorloopen över get-leads, retry-predikatet som inte retryar 4xx, startvärmningens prefetch) — API- och cursorloop-testerna gröna utan ändring
- [x] #3 Acceptance-sviten för Intresserade omskriven till den nya anatomin: primär och sekundär rad, aktivitetsrad, hämtnings-pill, sökning, sortering, namnlös med e-post ger e-posten som primär rad och 'Namnlös intresserad' som sekundär, tom lista, 4xx ger alert utan retry, laddläge med aria-busy; axe noll fynd på tom, fylld och fel-läge
- [x] #4 Stale-URL-testet grönt: ?variant=a renderar identiskt med ingen parameter
- [x] #5 Dataläget ?data=fyll finns kvar enbart bakom import.meta.env.DEV fram till rivningen (för Marcus granskning i 374.3) och är strukturellt onåbart i produktionsbygget
- [x] #6 Ytan är identisk med facit tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista i läge fylld och tom
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [x] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [x] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Flippen (ADR-103 B2 steg 1): commit 166ee59b (PR, gren feat/task-374-2-flippen-b3), foregangen av tva forberedande commits i samma gren (0646f0cb ta bort K0, 6c0fdb1e ren git-mv-rename).

AC #1 - gront, bada vyportarna, bada lagena. /mer/intresserade utan query renderar den promoverade formen ovillkorligt (routens variant-branschning riven). intresserade-promoverings-grind.spec.ts FAS 2: 16/16 grona (8 testfall x 2 vyportar) mot ORORDA __aria__/*.aria.yml-referenser fran 374.1.

AC #2 - git-rename verifierad, en falsifierad premiss dokumenterad i commit-meddelandet. Uppdraget citerade PersonsListPrototyp.tsx till PersonsList.tsx (commit 4aad0111) som precedent for att git bar filflytten som rename.

Matt: git show -M 4aad0111 visar INGEN rename (destinationsfilen fanns redan i samma commit, klassas modified, inte add/delete-par), och git log --follow pa den nya PersonsList.tsx sparar in i K0-filens EGEN historik, inte prototypens - precedentens commit-text stamde alltsa inte mot verktyget.

Lost med en TVA-COMMITS-sekvens i denna gren (git rm av K0 ensam, sedan git mv mot den tomma platsen), vilket ger en REN delete+add-pargivning. Verifierat: git log --follow -- src/components/intresserade/Intresserade.tsx sparar korrekt genom alla tre TASK-374.2-commits och vidare in i 374.1 (27a7e2dc) och S114-prototyppasset (a3a3e235, 90fffb56, 52b37135).

Datavagen orord: cursor-walk.test.ts 5/5 gront, queryKeys.intresserade.all och useDataSource().fetchIntresserade() oforandrade.

AC #3 - acceptance-sviten omskriven, 11/11 gront (isolerat och i den fulla acceptance-klassen). Ny anatomi: primar/sekundar rad, aktivitetsrad (N dagar sedan - interaktion), hamtnings-pill (singular 1 hamtning + plural 2 hamtningar), sokning med live-region (aria-live/aria-atomic, ingen role=status).

Live-region-havdandet ar inflyttat fran den nu rivna mer-intresserade-konvergens.acceptance.test.ts. Sortering via husets Select verifierad med en fixtur dar default-ordning och namn-ordning faktiskt skiljer sig (Zebra Larsson mot Anna Andersson). Tom lista, sokning utan traff, 4xx-alert utan retry, laddlage aria-busy, axe 0 pa tom/fylld/fel. Nappat-pa-havdandena togs bort, rollup-faltet i schemat orort.

AC #4 - gront. Ny stale-URL-describe i grind-specen (mall: personer- och anmalningssidan-promoverings-grind.spec.ts): variant=a OCH ett okant variant=z renderar bada byte-identiskt med ingen query, mot samma intresserade-fylld.aria.yml-referens.

AC #5 - gront, matt mot bundeln. npm run build plus grep -rl exempel.invalid dist/ gav 0 traffar; byggFyllnadsdata, FYLL_NAMN, FYLL_ERBJUDANDEN finns ingenstans i dist. PrototypeSwitcher-railen (PROTO_VARIANTS, PROTO_DATA_LAGEN) lamnades MEDVETET orord i routen.

Skalet: switcherns Datalage-knapp kraver en aktiv variant for att lasas upp, sa en tom variants-array hade stangt av data=fyll-vagen for Marcus 374.3-granskning - samma monster som personlistans och check-in-flippens precedent.

AC #6 - facit-granskning utford och bokford. Skarmdump tagen mot den promoverade routen (data=fyll) via en temporar, ALDRIG committad Playwright-spec (raderad efter korning) och jamford sida vid sida med facit-intresserade-lista.png: identisk rad-ordning och innehall.

Enda skillnaden var min ad hoc-skarmdumpens viewport och fullPage-val (fangst-verktyget, inte formen) - bottennaven upprepades i den fulla scrollande bilden, ett kant Playwright-artefakt for position:fixed-element, inte en regression (facit-bilden ar 1440x907, inte fullPage).

Facit-markorens grind (check-facit.sh invariant c) bevisad tvasidigt: gron med alias-exporten (Intresserade aliaserad som IntresseradeKonvergens i barreln), rod (exit 1) nar strangen strippades helt ur alla tre filer, aterstalld och gron igen. Facit.json sjalvt ORORT.

Grindar: typecheck exit 0. Biome check exit 0 (14 varningar, 81 infos, samtliga pre-existerande i base.css m.fl., inga i rorda filer). Build exit 0, dist-grep 0 traffar for fyllnadsstrangar. check-facit.sh exit 0 (15 manifest, 30 ytor, 2 ogodkanda, oforandrat). check-langa-streck.mjs exit 0 (299 filer skannade).

Acceptance-klassen isolerat (mer-intresserade.acceptance.test.ts): 11/11 gront. Acceptance-klassen fullt (463 tester): 462 gront, 1 rott i hem.acceptance.test.ts (dagar-kvar-formens tre exakta texter, datumberoende), ingen fil i denna diff ror Hem-ytan - pre-existerande, orelaterad.

Grind-specen (bada vyportar): 16/16 gront. Uppdragets premiss om 24 tester var fel - faktiskt antal ar 8 testfall ganger 2 vyportar, alltsa 16 (FAS 1 hade 12, FAS 2 lade till 4 nya stale-URL-tester). cursor-walk.test.ts (api-pure): 5/5 gront, oforandrat.

test:api (pure och staging, mutex-preflighten passerade): 1944/1945 gront, 1 rott i generate-event-attachment.staging.test.ts (hash-jamforelse mot delad staging-bas, helt annan domain), ingen fil i denna diff ror bilagegenerering.

Visuell baslinje tests/visual/intresserade.spec.ts: 4/4 rott som FORUTSETT och ACCEPTERAT (K0-formen ar borta; om-baselinjering sker i 374.4 efter Marcus godkannande, ADR-103 B4 - inte blockerande, test:visual kors inte i CI).

Premisser provade (ADR-086): 24 tester i grind-specen var falskt, faktiskt 16 (matt). PersonsListPrototyp till PersonsList buret av git som en rename (precedent-citat) - commit-meddelandet stammer inte mot verktyget (matt via git show och git log follow, ingen fungerande rename i den commiten). Byggde inte vidare pa det antagandet.

test:api mot staging kraver mutex - bekraftat sant, preflighten korde och passerade utan att falla. Bas origin/main vid bb793c86 - bekraftat exakt commit, 374.1 mergad dar. Inga andra divergenser funna.
<!-- SECTION:FINAL_SUMMARY:END -->
