---
id: TASK-76
title: >-
  Fynd: purge-jobbet är inte idempotent mot samtidiga körningar — två parallella
  kod-PR:er ger falskt rött via 404 på redan raderad sentinel
status: To Do
assignee: []
created_date: '2026-07-28 22:59'
updated_date: '2026-07-28 23:00'
labels:
  - ready-for-agent
dependencies: []
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två samtidiga kod-PR:er (#390 och #391, mät-PR:er för TASK-70.3) gav ett RÖTT Staging sentinel purge på #390:

  ❌ create-event-sentineler: Airtable DELETE 404:
     {"error":{"type":"NOT_FOUND","message":"Could not find a record with ID \"rec1FKMdVs2VnlM0M\"."}}
  ##[error]Process completed with exit code 2

Följden: Staging (API + E2E) SKIPPADES på #390 (needs föll) och CI Passed or Skipped FAILADE. En PR blev röd utan att något i dess diff var fel.

### ROTORSAKEN — VERIFIERAD MOT KÄLLKOD, INTE ANTAGEN

ci-suite.yml rad 64-65 säger uttryckligen att jobbet inte behöver mutexen:

  # Ålders-guarden (60 min, .purge-staging-policy.json) skyddar in-flight-
  # körningar — därför behöver jobbet INTE staging-tests-mutexen.

Ålders-guarden skyddar mot att radera FÖR TIDIGT — den skyddar INTE mot att två purge-jobb konkurrerar om SAMMA post. Det är ett TOCTOU-race mellan skriptets två faser:

1. listSentinels() läser posterna som matchar filtret
2. deleteSentinels() raderar dem i batchar

Kör två purge-jobb samtidigt ser båda samma sentinel (äldre än 60 min), båda kör DELETE, den ena vinner och den andra får 404.

scripts/purge-staging-sentinels.mjs rad 225-228 gör 404 till ett hårt fel:

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 300)}`);
  }

Det finns retry för 429 (rad 219-224) och för transienta nätverksfel (fetchWithNetworkRetry), men INGEN hantering av 404 på DELETE. En DELETE av en redan raderad post har uppnått sitt mål — den ska räknas som succé, inte som fel.

### VARFÖR DET HASTAR

Detta träffar A7:s målbild rakt: fler parallella agenter ⇒ fler samtidiga PR:er ⇒ fler samtidiga purge-jobb ⇒ fler falskt röda körningar. Felet blir vanligare precis i takt med att arbetsflödet blir det vi bygger mot.

Det förorenar dessutom mätningar: TASK-70.3:s FÖRE-mätning av två samtidiga kod-PR:er kunde inte tas rent, eftersom den ena PR:en aldrig körde staging.

### AVGRÄNSNING

Airtables plattformsvägg P26/P27 (ingen per-run-isolering, delad bas) är premissen och ska INTE lösas här — se docs/reference/airtable-constraints.md. Detta kort gör purge robust UNDER den premissen.

Två former är möjliga och ska vägas mot varandra, inte antas: (a) behandla 404 på DELETE som succé i skriptet, (b) lägga purge under staging-tests-mutexen. Form (b) kostar serialisering som rad 64-65 medvetet undviker; form (a) är billigare men måste skilja 'redan raderad' från 'fel bas/fel tabell'. Rekommendationen ska motiveras mot båda.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 404 på DELETE av en redan raderad sentinel fäller INTE jobbet — bevisat med ett rött-först-test som failar före fixen och passerar efter
- [ ] #2 Valet mellan skript-fix och mutex motiverat i PR:n mot båda alternativen; det förkastade alternativet bär sitt skäl
- [ ] #3 404 som beror på fel bas eller fel tabell fäller FORTFARANDE — negativt self-test redovisat, annars är fixen fail-open
- [ ] #4 Två samtidiga kod-PR:er kör purge utan att någon blir röd — bevisat med två run-ID:n körda i överlappande fönster, tidsstämplar redovisade
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SKÄRPT 2026-07-29 med TASK-70.3-agentens observationer (den fann racet i sina egna mät-PR:er).

TRE OBSERVATIONER, INTE EN — varje gång med en överlappande purge:

  1. 22:39:25-34  #391:s purge     vs #390:s 22:39:09-35   -> #390 föll (rec qjIqIUN3xunX5K)
  2. 22:48:38-51  #394:s purge     vs #390:s 22:48:37-51   -> #390 föll (rec 1FKMdVs2VnlM0M)
  3. 22:56:30-39  nightly-purge    vs post-merge 22:56:21-34 -> post-merge föll (rec idhmfxau0lPUUt)

I varje par faller exakt EN — den som DELETE:ar sist. Mekanismen är därmed låst, inte hypotetisk.

PAGINERINGEN FÖRVÄRRAR MEN ORSAKAR INTE: listSentinels() är offset-paginerad (rad 236-245) och körs klart FÖRE delete-fasen (rad 249-254), så fönstret mellan list och delete är brett. Icke-idempotent DELETE är fortfarande den fix som räcker.

RACET BLIR DYRARE EFTER TASK-70.3, INTE BILLIGARE — agentens fynd, och det som gör kortet brådskande. Efter A7:5 är post-merge den PRIMÄRA staging-bäraren. Ett purge-race där ger inte längre en röd PR utan en RÖD POST-MERGE, vilket automatiskt öppnar ett tilldelat ärende med REVERT-FÖRSLAG på ett träd som redan ligger i main. Observation 3 ovan är exakt det fallet och har alltså redan inträffat en gång.

Konsekvens för prioriteringen: kortet bör tas i nära anslutning till att TASK-70.3 landar, inte skjutas till en senare våg.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
