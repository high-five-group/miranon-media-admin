# En regel som felaktigt påstås mekaniserad granskas inte — det är värre än ingen mekanism

**En nedskriven regel utan mekanism efterlevs inkonsekvent. En regel som PÅSTÅR
sig ha en mekanism den saknar efterlevs kanske lika bra — men den granskas inte,
för filen säger att saken är löst. Falsk tillit är dyrare än erkänd svaghet.**
`[UNIVERSAL]`

**Empiri (S91, 2026-07-29):** hub-konstitutionen sade på två ställen
*"Mekaniserad som spärr — se `settings.json` `permissions.deny`"*. Sökt i spoken,
i user-scope och i båda `settings.local.json`: **noll `deny`-regler, noll
`ask`-regler, överallt.** Den enda spärr som faktiskt fungerade var byggd som en
`PreToolUse`-hook — alltså inte ens där konstitutionen sade att spärrar bor.

**Reglerna bröts aldrig.** STOPPA kördes som text hela sessionen, korten enbart
via CLI:t. Prosan fungerade. Det som gick sönder var att ingen letade — i
månader — eftersom filen redan svarade på frågan.

**Regeln som blev kvar är skarpare än "mekanisera mer":**

> Synden är inte prosa. Synden är **prosa som påstår sig vara mekanism**.

En regel får vara prosa. Ett påstående om att regeln är mekaniserad får det inte
— då ska mekanismen finnas, och något ska kunna kontrollera att den gör det.
Åtgärden blev därför en grind som verifierar att `permissions`-referenser i
styrande filer resolverar, inte en spärr till.

Besläktad: [[lardom-utan-grind-tillampas-inkonsekvent]] (regeln utan mekanism) ·
[[valideringsverktyg-som-inte-kors-ar-franvarande]] (verktyget som inte körs)
