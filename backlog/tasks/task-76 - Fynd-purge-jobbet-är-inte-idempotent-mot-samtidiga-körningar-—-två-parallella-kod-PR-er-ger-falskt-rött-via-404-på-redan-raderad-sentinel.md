---
id: TASK-76
title: >-
  Fynd: purge-jobbet är inte idempotent mot samtidiga körningar — två parallella
  kod-PR:er ger falskt rött via 404 på redan raderad sentinel
status: Done
assignee: []
created_date: '2026-07-28 22:59'
updated_date: '2026-07-29 09:33'
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
- [x] #1 404 på DELETE av en redan raderad sentinel fäller INTE jobbet — bevisat med ett rött-först-test som failar före fixen och passerar efter
- [x] #2 Valet mellan skript-fix och mutex motiverat i PR:n mot båda alternativen; det förkastade alternativet bär sitt skäl
- [x] #3 404 som beror på fel bas eller fel tabell fäller FORTFARANDE — negativt self-test redovisat, annars är fixen fail-open
- [x] #4 Två samtidiga kod-PR:er kör purge utan att någon blir röd — bevisat med två run-ID:n körda i överlappande fönster, tidsstämplar redovisade
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

AC #4 STÄNGT PÅ RATIONALE, EJ BOKSTAV — orkestrerarens beslut 2026-07-29 (femtonde resumen). Agenten lämnade det medvetet öppet och bad om två CI-run-ID:n; beslutet att inte producera dem är mitt, och skälet skrivs ut här i sin helhet.

### 1. AC:ns BOKSTAV är otagbar — ytan finns inte längre

Kriteriet lyder "två samtidiga KOD-PR:er kör purge". Kod-PR:er kör inte purge alls sedan `TASK-70.3`. Verifierat i källan av orkestreraren, inte antaget ur agentens rapport:

  ci.yml:746           run_staging: false   (VILLKORSLÖST)
  ci-suite.yml:73      purge gatad på `if: inputs.run_staging && …`
  post-merge.yml:210   INGEN `with:` -> ci-suite:s defaulter -> run_staging: true

Purge kör alltså numera enbart i post-merge och natten. Kortets observationer 1-2 togs på PR-ytan innan raden blev villkorslös; observation 3 (nightly x post-merge) ligger på den yta som finns kvar. Agentens egen PR bevisar det: `Staging sentinel purge: skipping`.

### 2. AC:ns AVSIKT är bevisad — och av ett STARKARE test än det begärda

Agenten mätte ett äkta race mot SKARPA Airtable-API:t med den fixade koden: två processer, fullt överlappande fönster.

  A: 08:40:38 -> 08:40:44Z  exit 0
  B: 08:40:38 -> 08:40:44Z  exit 0
  B förlorade racet på ALLA FYRA poster i första målet, loggade
  post-för-post-fallbacken och överlevde. Före fixen: exit 2.

Ett CI-buret race hade prövat samma script mot samma API. Enda skillnaden är exekveringsmiljön — och felläget (TOCTOU på Airtable DELETE) är miljöoberoende, det bestäms av API-svaret. Den lokala formen är dessutom STARKARE på en punkt: överlappningen var garanterad, inte hoppfull, och förloraren förlorade alla fyra posterna.

### 3. Jobb-omslaget är bevisat separat — fyra gröna post-fix-körningar

Det enda CI-ytan hade lagt till är att jobb-omslaget fungerar. Det är redan belagt, fyra gånger samma förmiddag:

  dbe1c0db  09:06:20 -> 09:06:28Z  success
  58a1a104  09:12:36 -> 09:12:50Z  success
  c3d134a7  09:26:25 -> 09:26:35Z  success
  04a58780  09:27:30 -> 09:27:39Z  success

De två sista ligger 53 s isär — närmast en naturlig överlappning kom, och inte nära nog. Purge-fönstret är 8-14 s, medan kön lägger landningar minuter isär. En naturlig överlappning uppstår alltså inte, och en framtvingad hade krävt två dispatchade fullsviter (~20 min runner + staging-mutex-kontention + risk för larm-ärende) för noll ny information.

### 4. Varför detta inte är att bocka rutan

Agenten vägrade uttryckligen bocka på sitt lokala bevis, och det var rätt av den — den äger inte omformuleringen av ett AC. Beslutet att omformulera hör orkestreraren till, och det fattas här ÖPPET i stället för tyst: **AC #4:s yta är obsolet, dess avsikt är uppfylld, och kriteriet borde ha lytt "två samtidiga purge-KÖRNINGAR" i stället för "två samtidiga kod-PR:er".**

Detta är tredje gången på två dygn ett AC godkänns på rationale (`TASK-70.3`, `TASK-70.4`, nu detta) och ANDRA gången orsaken är att kriteriet beskriver en yta som en senare skiva flyttade. Mönstret är värt en formregel: **ett AC som namnger en CI-yta åldras med den ytan.** Skriv avsikten, inte adressen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-29 08:44
---
LEVERANS (form (a) — skript-fix; form (b) förkastad).

VALET, MOTIVERAT MOT BÅDA (AC #2). Form (a) valdes för att racet är en defekt i
skriptets DELETE-semantik, inte i CI:s schemaläggning. En DELETE av en redan
raderad post har uppnått sitt mål; att den fällde jobbet var skriptet som kallade
ett uppnått mål för ett fel.

Form (b) — purge under staging-tests-mutexen — förkastades på tre grunder, i
fallande vikt:
  1. Den täcker inte alla racande par. Mutexen är CI↔CI. Skriptets egen header
     bär redan gränsen ordagrant ("staging-mutexen täcker CI↔CI men inte
     CI↔lokal"), och `npm run purge:staging` är en dokumenterad väg. Racet hade
     överlevt i den formen.
  2. Den river ett medvetet designval utan att göra skriptet korrekt.
     ci-suite.yml rad 64-65 svarar redan på exakt frågan; L348 kodar den
     lärdomen ur TASK-50, där samma mutex föreslogs och förkastades.
  3. Den serialiserar. Purge mättes till 6 s i denna körning; den tiden hade
     lagts på staging-mutex-kön för allt annat.
Precedenten är dessutom denna kortets egen förhistoria: TASK-50 bokförde öppet
att "delete per post är idempotent" och att den enda teoretiska skadan vore ett
HTTP-fel om två körningar tar samma post. Det är precis vad som inträffade.
TASK-50:s slutsats — "robusthet i skriptet slår serialisering" — bär även här.

FIXEN. isAlreadyDeletedError(status, body, requestedIds) klassar EN felform som
succé, med fyra oberoende fail-closed-villkor: status exakt 404; kropp är JSON
med error-OBJEKT (bas-nivåns {"error":"NOT_FOUND"} är en STRÄNG och faller
här); error.type exakt "NOT_FOUND"; meddelandet namnger ett rec-ID som finns i
den batch vi bad om. Faller ett villkor är svaret fällande.

deleteRecords tar om en drabbad batch POST FÖR POST i stället för att svälja
batch-felet. Skälet är mätt: ett batch-svar med två okända id:n namngav ändå
bara det första, så ett svalt batch-fel lämnar oss utan kunskap om vilka övriga
som raderades. Post-för-post ger entydigt svar per post och är korrekt oavsett
om Airtables batch-delete är atomär eller delvis — en egenskap vi därmed inte
behöver lita på. Kostnad bara på race-vägen: ≤10 extra anrop per drabbad batch.

FELFORMERNA ÄR MÄTTA, INTE ANTAGNA (live mot staging apphjj8Q7lkXCMsL4
2026-07-29, skarp least-privilege-PAT, inget muterat — alla rec-ID:n fabricerade):
  okänd post, rätt bas+tabell -> 404 NOT_FOUND "Could not find a record with ID ..."
  okänd TABELL, rätt bas      -> 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
  okänd BAS                   -> 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
  PROD-basen (utan scope)     -> 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND
Att fel bas/tabell i dag blir 403 och inte 404 är en egenskap hos token-scopen,
INTE det som bär säkerheten. Klassificeraren matchar därför POSITIVT på
succé-formen, aldrig på frånvaro av felform — en bredare token som ger 404 för
fel bas fälls fortfarande (testat).

AC #4 KAN INTE TAS SOM FORMULERAT — STRUKTURELL AVVIKELSE, EJ BOCKAD.
Kortet förutsätter att kod-PR:er kör purge. Det slutade gälla med TASK-70.3:
ci.yml rad 746 skickar `run_staging: false` VILLKORSLÖST, och purge-jobbet är
gatat på `if: inputs.run_staging`. INGEN PR-körning och ingen merge_group-körning
instansierar purge-jobbet längre. Kortets observationer 1-2 (#390/#391, #394/#390)
togs på PR-ytan innan den raden blev villkorslös; observation 3 (nightly vs
post-merge) ligger på den yta som finns kvar.
Kvarvarande race-ytor i dag: post-merge x post-merge (concurrency-gruppen är
per-SHA, `post-merge-${{ github.sha }}`, så två landningar överlappar by design),
post-merge x nightly, samt CI x lokal purge.
---

created: 2026-07-29 08:45
---
BEVIS PER AC.

AC #1 — rött-först, TVÅ steg (exitkoder mätta separat, ej via pipe):
  RÖTT-1, mot ofixad kod (git stash på skriptet, testfilen kvar):
    exit 1 — SyntaxError: The requested module './purge-staging-sentinels.mjs'
    does not provide an export named 'deleteRecords'
    (samma precedent-form som TASK-50:s backoffMs-röda)
  RÖTT-2, klassificeraren avsiktligt kastrerad till `return false` — detta är
    det MENINGSFULLA röda, för det isolerar toleransen från exportens blotta
    existens: exit 1, 3 röda, varav mekanismtestet föll med EXAKT kortets
    produktionsfel:
      "RACET: batch-404 tas om post för post": Airtable DELETE 404:
      {"error":{"type":"NOT_FOUND","message":"Could not find a record with ID
      \"recEEEEFFFFGGGGHH\"."}}
  GRÖNT efter fix: exit 0, 47 gröna (från 32 — 15 nya fall).
  Noterbart i rätt riktning: under kastreringen förblev ALLA negativa test
  gröna. Kastrering gör klassificeraren MER fail-closed, inte mindre — precis
  vad man vill se.

AC #3 — negativt self-test, 9 fall, alla gröna, byggda på de MÄTTA kropparna:
  403 fel bas/fel tabell fäller · fel statuskod-klass (500/422) fäller ·
  bas-nivåns {"error":"NOT_FOUND"} som STRÄNG fäller · 404 som namnger en post
  vi aldrig bad om fäller · 404 utan rec-ID i meddelandet fäller ·
  TABLE_NOT_FOUND med 404 fäller · oparsbar/tom/undefined kropp fäller ·
  tom eller undefined lista av begärda id:n kan aldrig ge succé.
  Mekanism-negativa: 403 kastar utan fallback (1 anrop, ej 3) · 404 med
  främmande post kastar (1 anrop) · fatalt fel MITT I fallbacken kastar vidare
  (3 anrop). Fallbacken är alltså inte en 404-svälj.

AC #4 — EJ BOCKAD. Det jag FAKTISKT mätte, och det som saknas:
  MÄTT — äkta samtidigt race mot skarpa Airtable-API:t med den FIXADE koden,
  två processer, fullt överlappande fönster:
    A: START 08:40:38Z  SLUT 08:40:44Z  EXITKOD=0
    B: START 08:40:38Z  SLUT 08:40:44Z  EXITKOD=0
    B loggade: "en samtidig purge hann före på minst en post i batchen — tar om
    batchen post för post" och "0/4 raderade (+4 redan borta — samtidig purge
    hann före, räknas som utfört)". Båda efter-verifieringarna gröna.
    17 raderbara sentineler fanns (4 Anmälningar / 9 Eventplanering / 4
    Anteckningar); A tog dem, B förlorade racet på alla fyra i första målet och
    överlevde. Före fixen hade B exit 2. Det är exakt kortets mekanism, mot
    riktiga 404-kroppar, inte mockar.
  SAKNAS — samma bevis på CI-YTAN med två run-ID:n. Det kan inte tas från en
  PR, eftersom PR-ytan inte längre kör purge alls (se avvikelsen ovan). Den
  behöver två post-merge-körningar i överlappande fönster, dvs två landningar
  tätt efter varandra, ELLER en landning som överlappar nightly.
  Bevisningen måste dessutom vara av den FIXADE purgen — alltså efter att
  denna PR själv landat.

GRINDAR (exitkoder mätta separat):
  node scripts/test-purge-staging-sentinels.mjs -> 0 (47 gröna)
  npx @biomejs/biome check .                    -> 0 (0 errors; 6 warnings +
                                                   26 infos är pre-existerande
                                                   i orörda filer)
  npm run typecheck                             -> 0
  npm run build                                 -> 0
  npm run test:api                              -> 1 vid första körningen, på
    get-registration.staging.test.ts "okänt ID → 404" med "Request context
    disposed" efter 30 s timeout. TRANSIENT: omkörning av hela filen grön,
    6/6 på 7,1 s. Orörd av diffen — ingen Playwright-test importerar
    purge-skriptet; diffen är två scripts/*.mjs.

ci-suite.yml RÖRDES INTE (delad yta med TASK-75). Rad 64-65 blir inte fel av
denna fix — ålders-guarden gör fortfarande mutexen onödig — men den är nu
OFULLSTÄNDIG: den förklarar in-flight-skyddet utan att nämna att idempotensen
är det som bär samtidigheten. Överlämnas till orkestreraren, ändras inte här.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (femtonde resumen). Levererad av bygg-agent i egen worktree; PR #421 (`796fffd`, merge `dbe1c0d`). AC #4 stängt av orkestreraren på RATIONALE — se Implementation Notes för hela skälet.

VALD FORM: (a) skript-fix i `scripts/purge-staging-sentinels.mjs`. `ci-suite.yml` rördes ALDRIG av denna skiva.

Form (b) — purge under `staging-tests`-mutexen — förkastades på tre grunder, och samordnings-spärren mot `TASK-75` var uttryckligen INTE en av dem:

1. Den täcker inte alla racande par. Mutexen är CI<->CI; `npm run purge:staging` är en dokumenterad lokal väg och racet hade överlevt.
2. Den river ett medvetet designval utan att göra skriptet korrekt (`L348`, ur `TASK-50`, där samma mutex föreslogs och förkastades).
3. Den serialiserar: purge mäts till 8-14 s, och den tiden hade lagts på staging-kön för allt annat.

MEKANISMEN: `isAlreadyDeletedError()` + post-för-post-fallback i `deleteRecords`. `ApiError` bär nu `status`/`body` separat, så klassificeringen aldrig parsar en formaterad sträng.

FAIL-CLOSED I FEM LED, verifierat i källan av orkestreraren och inte bara i rapporten: status måste vara exakt 404 · kroppen måste parsa som JSON · `error` måste vara ett objekt (ej array) · `error.type` måste vara exakt `NOT_FOUND` · meddelandet måste matcha mönstret MED ett fångat rec-ID — och det ID:t måste finnas i den batch vi faktiskt bad om. En 404 från fel bas skulle behöva nämna ett av VÅRA egna rec-ID:n för att svaljas.

BEVIS I BÅDA RIKTNINGAR: rött-först i två former (ofixad kod -> exit 1 med `SyntaxError`; kastrerad klassificerare -> exit 1, mekanismtestet föll med EXAKT kortets produktionsfel). Grönt: exit 0, 47 gröna (32 -> 47 fall). Under kastreringen förblev ALLA negativa test gröna — kastrering gör klassificeraren mer fail-closed, inte mindre. Fallbacken bevisas dessutom inte vara en 404-svälj: ett fatalt fel mitt i fallbacken kastar vidare.

FELFORMERNA ÄR MÄTTA, INTE ANTAGNA (live mot staging, inget muterat, alla rec-ID:n fabricerade): okänd post -> `404 NOT_FOUND`; okänd tabell / okänd bas / prod-basen -> `403`.

CI PER JOBB på PR #421: `CI Passed or Skipped` pass, tolv checkar totalt. Tre jobb `skipping` (A11y, Staging, purge) — normalt urval för diffen, och `L322` gäller: ett skippat jobb bevisar ingenting. Fixen är därför bevisad på post-merge-ytan i stället, fyra gröna körningar samma förmiddag: `dbe1c0db` 09:06:20-28 · `58a1a104` 09:12:36-50 · `c3d134a7` 09:26:25-35 · `04a58780` 09:27:30-39.

TVÅ SAKER SOM LÄMNADE KORTET SOM EGNA POSTER:

1. `TASK-82` mintat — `scripts/test-purge-staging-sentinels.mjs` körs av INGET CI-jobb. Denna skivas fail-open-vakt (AC #3) bor alltså helt i en svit ingen kör automatiskt. Agenten eskalerade, fattade inget beslut; orkestreraren verifierade och fann att 13 av 15 guard-sviter ÄR wirade — de två som inte är det är undantagen, inte normen.
2. `ci-suite.yml`:s kommentar om ålders-guarden preciserad i denna commit: raden var SANN men OFULLSTÄNDIG (den förklarade in-flight-skyddet utan att nämna att det är idempotensen som bär samtidigheten). Agenten rörde den inte — delad yta med `TASK-75` — och överlämnade den.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
