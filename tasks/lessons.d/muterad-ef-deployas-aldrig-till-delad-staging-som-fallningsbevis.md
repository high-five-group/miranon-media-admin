# En muterad EF deployas aldrig till delad staging som fällningsbevis

**Ska ett tvåsidigt bevis visa att en Edge Function FÄLLER när den ska, deploya
aldrig en medvetet trasig variant till staging för att mäta det. Staging är EN
delad bas, och varje parallell CI-körning och syskonagent ser din mutation.
Beviset bor i stället på den lägsta nivå där påståendet faktiskt är sant —
oftast en två-armad mätning av fältbyggaren eller predikatet, kört mot en egen
sentinelrad.** [UNIVERSAL]

Mätt 2026-08-29 (`TASK-338.4`). För att bevisa att `buildScopeUpdateFields`
RENSAR tomma axlar deployade jag en muterad `update-attachment-scope` där
rensningen ersatts av CREATE-formen, och tänkte köra staging-sviten mot den.
Staging-preflighten (`TASK-77`) stoppade körningen: CI höll basen
(`post-merge.yml`, körning `33251308685`). Preflighten gjorde alltså sitt jobb —
men den skyddade mot att jag LÄSTE en upptagen bas, inte mot att jag redan hade
SKRIVIT en trasig funktion till den. Under hela fönstret mellan deploy och
återställning bar delad staging en EF som med avsikt gjorde fel.

Frestelsen att köra vidare med `MM_STAGING_PREFLIGHT=off` är den farliga delen:
det hade gett ett falskt rött på det landade trädet, med tilldelat revert-ärende
som följd.

Rätt form, och den är dessutom BÄTTRE bevis: mät påståendet där det bor. Här var
påståendet Airtables egen PATCH-semantik, inte EF:ens kringkod. Två armar mot en
egen `ZZ-`sentinelrad, skapad och raderad i samma körning — ARM A (CREATE-formen,
utelämnar tomma axlar) LÄMNADE `Kursfamilj`/`Plats` kvar; ARM B (den byggda
UPDATE-formen med `null`/`[]`) RENSADE dem. Exit 0, ingen deploy, ingen delad yta
rörd, och beviset prövar exakt den rad som skulle bevisas i stället för hela
anropskedjan runt den.

Regeln generaliserar: **mutationsbevis hör hemma i den mest lokala körbara
enheten.** En ren funktion muteras i arbetsträdet och prövas med sin enhetssvit;
en klientkomponent muteras och prövas med acceptance. Bara när påståendet
genuint ÄR "den deployade artefakten beter sig så här" behövs en deploy — och då
är det den KORREKTA artefakten som ska deployas, aldrig en trasig.
