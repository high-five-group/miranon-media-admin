# finally-restore i staging-muterande test överlever inte avbrott — och driften fäller ANDRA test

**Ett staging-test som muterar delad fixtur-data och restaurerar i
`finally` är bara atomärt inom en FULLBORDAD körning. Avbryts processen
(mutex-timeout, SIGKILL, avbruten CI-runda) mellan mutationen och
restore-blocket står sentinel-värdet kvar i basen — och fixtur-driften
fäller sedan ett HELT ANNAT test deterministiskt, i varje körning, tills
någon städar för hand.**

Mätt 2026-08-17 (S104): `update-record.staging.test.ts` sätter
`Flagga = 'ZZ-S103-flagga-sentinel'` på `ZZ-History Person 01` och
restaurerar i finally. En tidigare avbruten körning lämnade sentineln;
`get-person.staging.test.ts:173` (`expect(person.flagga).toBeNull()`)
föll därefter deterministiskt — differentialmätt av 259-agenten mot ren
`origin/main` (fäller identiskt utan diff), rotorsakad av orkestreraren
via MCP-läsning av posten, städad med exakt restore-formen (tom
singleLineText → null vid läsning).

Motmedels-kandidater (design-fråga, inte gjort här): (a) sentinel-städ i
staging-CI:ns setup-purge (`ZZ-*-sentinel`-mönster i muterbara fält),
(b) självläkande fixtur-kontroll i de test som LÄSER fixturen (assert +
återställ i stället för bara assert), (c) sentinel-värden med tidsstämpel
så ålder kan skilja pågående körning från kvarlämning. Baren: (a) är
billigast och följer purge-svepets befintliga mönster.

Instanser: S104 sessionsdok Del 10 § Incidenter; 259-agentens
slutrapport § Grindarnas utfall (differentialmätningen).
