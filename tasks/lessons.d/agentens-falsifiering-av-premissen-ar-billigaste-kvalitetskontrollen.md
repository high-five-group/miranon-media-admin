# En agents falsifiering av orkestrerarens premiss är arbetsproduktens billigaste kvalitetskontroll

**Ett uppdrag vars mottagare PRÖVAR premisserna mot disk innan bygge (ADR-086)
fångar orkestrerarens fel innan de blir kod. Källmärk varje faktapåstående i
uppdraget och BE om falsifiering — divergensrapporterna är inte friktion, de
är kvalitetskontrollen.** `[UNIVERSAL]`

Mätta instanser i S103: två av orkestrerarens påståenden föll redan i Del 11
(båda med belägg). Under promoveringsnatten 2026-08-14/15 föll ytterligare
fyra: (1) "17 operationer i allowlisten" — disk sade 18 (214.1); (2) "S90-
förarbetet täcker hela kortet" — det nämnde `create-attendance` noll gånger
(214.1, agenten designade själv mot PRD:t och RAPPORTERADE det); (3) husets
strängform angavs som "kortstreck" — den faktiska precedent-diffen
(`a4c0a641`) var OMFORMULERING, och agenten följde diffen i stället för
uppdragets sammanfattning (214.2); (4) komponentens radnummer hade driftat
~144 rader sedan mätningen (214.4 — lokaliserat via grep, bokfört, ej
blockerande).

**Instanser i S102 (2026-08-16/17) — och de visar att klassen även gäller
orkestrerarens GRANSKNINGS-observationer, inte bara uppdragets premisser:**

- Svep-prototypens skärpningsvarv (PR **#1438**, `b900601b`): **fem** av
  orkestrerarens egna granskningspremisser mätt-falsifierade av bygg-agenten —
  railen var delad och felkonfigurerad, inte egenbyggd; `SlideToConfirm` ÄR
  husets armeringsform (`AtgardsSida.tsx:2762`); primärknappen antracit, ej
  guld. Agenten följde intentionen över bokstaven och rapporterade
  divergenserna.
- `task-243.3` (PR **#1470**): orkestrerarens DATAhypotes falsifierad av
  agentens kodläsning (Signe Sparad-sentinelns status mot det nya
  Obekräftad-filtret).
- `task-233`: orkestrerarens ~250 ms-tal slaget av ORDLISTA-regeln.
- `task-266` (PR **#1537**): uppdrags-premissen "ADR-112-styrd" FALSIFIERAD —
  **0 träffar**; ankaret ägs i själva verket av `TASK-242`:s doc-block.
- Issue-svepet (Del 16, 19 ärenden): **fem** premisser falsifierade, bl.a. att
  `task-235` var b-gruppens facit (det var det inte) och en D0-skippad run som
  falskt räknats som post-merge-bevis.

**Det generella:** orkestrerarens kontext åldras medan kedjan landar —
premisser som var sanna vid uppdragsskrivningen är hypoteser vid
uppdragsmottagningen. Mottagare som behandlar dem som hypoteser (och
uppdragsgivare som källmärker så att prövningen är billig) gör felen till
rapportrader i stället för buggar. Kostnaden är minuter; alternativet är
kod byggd på fel grund.
