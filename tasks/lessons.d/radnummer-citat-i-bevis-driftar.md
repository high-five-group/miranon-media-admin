# Radnummer-citat i skriven dokumentation driftar — citera ankare, inte radnummer, i bevis som ska överleva

**Ett radnummer som citeras i ett ADR, ett kort eller en notering pekar
på en position som förskjuts varje gång filen ändras ovanför den raden.
Ett bevis eller en referens som citerar `rad N` är därför en
tidsstämplad sanning, inte en beständig — citera i stället ett ANKARE
(jobbnamn, stegnamn, funktionsnamn, en unik textsträng) som förblir
sant oavsett hur filen växer eller krymper ovanför.**

**[UNIVERSAL]**

Instans (S112, Del 4 § Handoff-verifikat + orkestrerarens trail,
2026-08-26): **två** instanser fångade av review-agenten samma dag.
(1) `ADR-127` citerade "rad 417" i `nightly.yml` — den faktiska raden
var **421** vid granskningstillfället (review-agenten mot `#1932`,
Sonnet 5, schema-giltigt utlåtande, risk `lag`, noterat som
info-nivå-fynd, ej error/warning). (2) `TASK-198`s notes citerade
radnummer **446/798** som drivit till **450/802** (review-agenten mot `#1978`,
Sonnet 5, klassat `warning`/`auto-fix`; rättat via `npm run bl -- task
edit 198 --notes` i commit `f41235ee` innan armering).

**Det generella:** ett radnummer är korrekt EXAKT vid det ögonblick det
skrivs och kan bli fel av vilken redigering som helst ovanför raden,
gjord av vem som helst, av vilket skäl som helst — inklusive
ORELATERADE ändringar långt från det citerade innehållet. Ett ankare
(en sökbar sträng, ett namngivet block) är stabilt mot exakt den
klassen av drift. Regeln gäller starkast för bevis som är avsedda att
ÖVERLEVA — en engångsreferens i en chattkommentar är inte samma
riskklass som ett radcitat inbakat i en ADR eller ett kort som ska
kunna verifieras månader senare.
