---
id: TASK-8
title: 'PRD: Lugnt laddläge — persist-cache + skeleton (app-bred princip, Hem först)'
status: To Do
assignee: []
created_date: '2026-07-11 22:42'
updated_date: '2026-07-12 20:31'
labels: []
dependencies: []
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

När Lotta öppnar appen kallt (första gången på en enhet, efter utloggning eller efter en uppdatering) visar Hem hopklappade kort med textrader ('Laddar…') som växer när datat landar — hela skärmen hoppar, och anmälningslistans yta saknas helt tills datat släpper. Granskningsfyndet S62 underkände detta: det ligger under repots eget spec-golv (tillgänglighets-checklistans loading-krav) och under branschstandard. Marcus-kravet (kvitterat S62): inget ska röra sig — helst inget synligt laddande alls, 'det ska bara vara där'. Samma 'Laddar…'-textmönster finns i ett tjugotal vyer — problemet är app-brett; Hem är den granskade ytan.

### Lösning

Tvådelad och designad ihop (grillad samsyn S63 Del 2). Del ett: query-cachen persistas på enheten (ADR-072) så att appen öppnar med senast kända data direkt — kallstarten upphör i praktiken; färskheten garanteras av den befintliga tysta bakgrundshämtningen (osynligheten B3, task-4.5). Del två: för de fall laddning ändå syns gäller Lugnt laddläge (ORDLISTA): skärmen har sin slutliga geometri från första bildrutan — riktiga kortrubriker och riktig kort-chrome renderas direkt, endast datakropparna får förenklade skeleton-block med långsam shimmer; rörelsen respekterar reduced-motion, blocken håller 3:1-kontrast, och laddningar under 1 sekund visar ingen indikation alls. En återanvändbar Skeleton-primitiv bär mönstret för framtida vyer och produkter; Hem är första implementationsyta.

### Användarberättelser

1. Som Lotta vill jag att Hem öppnar med senast kända data direkt, så att jag slipper se någon laddning alls vid mina dagliga besök.
2. Som Lotta vill jag att skärmen har sin slutliga form från första ögonblicket, så att ingenting hoppar eller växer när datat landar.
3. Som Lotta vill jag att kortens rubriker och ytor syns direkt även innan datat finns, så att jag känner igen mig från första bildrutan.
4. Som Lotta vill jag att visad data tyst byts mot färsk när hämtningen är klar, så att jag alltid ser aktuellt läge utan att uppleva en omladdning.
5. Som Lotta vill jag att allra första gången appen öppnas på en enhet se lugna platshållare i kortens slutstorlek i stället för texten 'Laddar…', så att väntan känns kort och kontrollerad.
6. Som Lotta vill jag att laddningar som går snabbare än en sekund inte visar någon indikation alls, så att gränssnittet aldrig blinkar i onödan.
7. Som Lotta vill jag att anmälningslistans yta är reserverad redan under laddning, så att listan inte trycker ner eller flyttar annat innehåll när den dyker upp.
8. Som Lotta vill jag att appen efter utloggning inte visar den tidigare inloggningens data, så att inga uppgifter ligger kvar till nästa person vid skärmen.
9. Som Lotta vill jag att appen efter en uppdatering aldrig startar på trasig gammal cache, så att en ny version alltid öppnar rent.
10. Som Lotta vill jag att appen öppnad utan uppkoppling visar senast kända läge, så att jag kan läsa anmälningar och event på eventplats.
11. Som skärmläsaranvändare vill jag att laddande ytor annonseras med tillgängligt laddbesked och att skelettblocken är dolda för uppläsning, så att jag hör vad som händer utan visuellt brus i talflödet.
12. Som användare med reducerad rörelse vill jag att skelettets animation ersätts av statiska block, så att gränssnittet respekterar min systeminställning.
13. Som användare med förstärkt kontrast vill jag att skelettblocken är urskiljbara även i kontrastläge, så att laddläget inte försvinner för mig.
14. Som utvecklare vill jag en återanvändbar Skeleton-primitiv med laddprincipen inbyggd, så att nästa vy får samma lugna laddläge utan ny design.
15. Som utvecklare vill jag att laddprincipen är dokumenterad som app-bred spec, så att kommande vyer och produkter ärver den utan nya beslut.
16. Som Lotta vill jag att skelettet liknar det innehåll som kommer (lika många listrader, samma proportioner), så att övergången till riktigt innehåll blir minimal.

### Implementationsbeslut

1. Persist-lagret: TanStack Querys persistQueryClient-mekanism med synkron localStorage-persister; provider-formen ersätter dagens i app-bootstrappen. Styrs av ADR-072.
2. Skyddsräcken (ADR-072): utloggning tömmer cachen via queryClient.clear() (maintainer-mönstret — aldrig manuell nyckel-radering, den racear mot throttle-synken) · maxAge 24 h och gcTime ≥ maxAge för persistade queries (dokumenterad GC-fälla) · buster = den build-injicerade app-versionen (samma källa som versionsraden).
3. Restore-semantiken: restaurerad data är stale per gällande staleTime → omedelbar tyst bakgrundshämtning per osynlighets-mekaniken. Poll-lagrets kontrakt (ADR-017) ändras INTE.
4. Hela cachen persistas; selektiv persist (shouldDehydrateQuery) är den förberedda ratten om enskilda queries ska undantas — inte i bruk (ADR-072 beslut 6).
5. Skeleton-primitiven: ny biblioteks-primitiv (ribba 11/11/11) med förenklade block-former (textrad, tal, listrad); färger via tokensystemets komponentlager; långsam shimmer vänster→höger i CSS; animation endast under prefers-reduced-motion: no-preference (WCAG 2.2.2-noten: preload-animation, reduced-motion-vägen finns alltid); 3:1-kontrast (WCAG 1.4.11) + contrast-more- och print-stöd per primitiv-golvet.
6. A11y-markupen är Roselli-mönstret: aria-busy på innehålls-containern som laddar, aria-hidden på skelettelementen, skärmläsartext för laddbeskedet — aria-busy kompletteras ALLTID med textbeskedet (få skärmläsare honorerar busy ensam).
7. Hem-kortens pending-yta byts från textrad till skeleton-block i kortets slutgeometri; rubriker + chrome renderas alltid direkt (de är statiskt kända). Anmälningslistans yta dimensionsreserveras med listrads-block.
8. Framträdande-beteendet låses av mät-skivan (mät-först, samsyn beslut 4): typiskt kallstartsfönster klart över 1 s → skeleton från första bildrutan; ofta under 1 s → framträdande-fördröjning ~1 s (CSS-driven) så skelettet aldrig blinkar.
9. 'Laddar…'-textradsmönstret utgår ur Hem. Spinner-komponent införs inte — designen går medvetet över FK-golvet (FK saknar skeleton; spinner efter 1 s är deras mönster), öppet bokfört med research-stöd.
10. Layout-skift ≈ 0 är grindkravet: skelettet reserverar slutlayoutens dimensioner för kort och lista — bevisas med renderad mätning.
11. App-bred princip, Hem först: övriga vyer migreras via egna senare kort; principen skrivs in i design-system-specen som laddläges-sektion vid bygget.

### Testbeslut

Testa externt beteende, aldrig implementationsdetaljer. TVÅ befintliga skarvar (Marcus-kvitterade S63), inga nya: (a) e2e-/axe-sviten — tom cache → skeleton i slutlayoutens geometri utan layout-skift (boundingBox-mätning; task-4.5:s bevismönster i samma svit är förebilden), varm cache → senast kända data direkt utan synligt laddläge, utloggning → persistad cache tömd, reduced-motion → statiska block (emulateMedia-precedent finns i shell-sviten); (b) a11y-primitiv-sviten — Skeleton-sektion på primitiv-demo-sidan med axe 0 violations (ADR-045-mönstret, samma form som övriga primitiver). Ingen api-skarv (inga nya Edge Functions) och ingen unit-skarv (mät-AC:n är ett engångs-mätprotokoll som dokumenteras i sin skiva, inte ett permanent test).

### Utanför omfattningen

- Migrering av övriga vyer till Lugnt laddläge (egna senare kort per vy; principen och primitiven byggs här).
- Offline-skrivköer/Background Sync (Fas 8 per ADR-019) — persist är läs-cache, inte skriv-kö.
- Realtime-uppdateringar (Fas E per ADR-017).
- Kryptering av klient-cachen (hotmodellen i ADR-072; omprövas vid ändrad enhetsmodell).
- Spinner-/progressbar-komponenter.

### Estimat

5 skivor: S (mätprotokollet — kallstartsfönstret) · M (Skeleton-primitiven + demo-sektion + a11y-bevis) · M (persist-lagret med skyddsräcken) · M (Hem till Lugnt laddläge — kort + lista) · S (QA-planen, ready-for-human).

### ADR-koppling

ADR-072 (mintad S63 — styr persist-lagret; hotmodellen och omprövningsvillkoret bor där) · ADR-017 +erratum (poll-lagret orört) · ADR-047 (nätverkslägen — offline visar restaurerad data utan hämtningsförsök tills nätet återvänder) · ADR-055 (router-context-DI för datahooks) · ADR-045 (primitivers a11y-bevis) · ADR-019 (Background Sync = Fas 8).

### Ytterligare anteckningar

ORDLISTA-posten 'Lugnt laddläge' är principens definition; S63 Del 2 är kanonisk beslutstrail med käll-verifierad research (NN/g, Chung-empirin shimmer/långsam, Viget-nyansen, TanStack-dok + maintainer-svar, OWASP, Roselli, FK). 1 s-tröskeln är käll-verifierad; design-kortets ursprungliga 0,5 s-referens är öppet riven. task-7 är design-kortet som födde denna PRD. Migrerings-kandidater (senare kort): de ~19 vyer som idag bär 'Laddar…'-textmönstret.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #6 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #7 CI grön per jobb på pushad commit
- [ ] #8 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #9 Design-review: Marcus-granskning i webbläsaren av laddläget (kallstart tom cache + varm start + reduced-motion) godkänd (per skiva med UI-yta; L220/L269)
- [ ] #10 Layout-skift ≈ 0 bevisad med renderad mätning (boundingBox under/efter laddning) före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Vy-migrerings-instruktioner från task-8.4-leveransen (S66 batch 2) för NÄSTA vy till Lugnt laddläge: (1) återanvänd DashboardCard-mönstret — pendingBody speglar den laddade kroppens EXAKTA wrapper-anatomi (samma flex/gap/typografi-klasser, lh-block per textrad) så layout-skift ≈ 0 håller by construction; (2) dimensionsreservera listytor till sin max-h-klienthöjd; (3) sätt aldrig framträdande-fördröjning (mätlåst 8.1-beslut); (4) laddbesked-kontraktet: role=status behölls på laddcontainern och hem.staging.test.ts (4.5 AC 3) + persist-cache.staging.test.ts asserterar role=status-count och 'Laddar…'-texter — ändras beskeden i en vy måste båda sviterna uppdateras medvetet i samma commit.
<!-- SECTION:NOTES:END -->
