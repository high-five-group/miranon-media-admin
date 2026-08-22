# Läs tillbaka det du INTE rörde — en additivt klingande flagga kan ha ersatt hela sektionen

**[UNIVERSAL] En skriv-flagga vars namn låter additivt (`--notes`, `--tag`,
`--description`) kan ERSÄTTA hela den sektion den namnger. Läs-tillbaka-passet
efter en CLI-skrivning måste därför pröva det du INTE skrev. Ser du ditt eget
värde på plats är det inget bevis för att grannarna finns kvar — det är exakt
den observation en destruktiv skrivning också producerar.**

Instans (S109 resume 3, 2026-08-22): `npm run bl -- task edit TASK-283.4
--notes '<rättelse>'` skulle rätta en felmätt mening i en överlämningsnot.
Flaggan ersatte hela `SECTION:NOTES`-blocket. Med det försvann `TASK-285.11`:s
överlämning av visual-baslinjen och dess förkrav — att *"Allow GitHub Actions
to create and approve pull requests"* är en tre-nivåers kedja som måste mätas
FÖRE dispatchen, med två empiriska run-ID:n som belägg. Commit `26ec953a`
(−9/+13 rader); återställd ur `8ebfab2c` i `54577365`.

**Förlusten fångades inte av läs-tillbaka-passet.** Den upptäcktes flera turer
senare, av en `grep` efter den citerade texten som gav noll träffar. Det är
felklassens kärna: efter skrivningen stod den nya noten där, korrekt, precis
som väntat. En läsning som frågar *"landade det jag skrev?"* får ja. Bara en
läsning som frågar *"finns det jag inte rörde kvar?"* hade fångat det.

**Andra instansen av `L239`:s klass** — samma verktyg, samma flagga, 2026-07-06,
redan `[UNIVERSAL]`-märkt: *"`--notes "keep"` → Implementation Notes TYST
ÖVERSKRIVNA"*. `L239`:s regel (läs tillbaka objektet omedelbart efter varje
CLI-skrivning) var nedskriven och otillräcklig som formulerad: den riktar
läsningen mot skrivningen, inte mot det oskrivna. Två instanser av samma flagga
på samma verktyg gör detta till en kandidat för uppgradering till Kritisk
regel, inte en ny sidopost.

**Formen som håller:** läs ut sektionen FÖRE skrivningen, skicka in den
kompletta texten med din ändring inarbetad, och diffa efteråt mot det du läste.
Behandla varje sektions-flagga som destruktiv tills verktygets egen
dokumentation säger annat — antagandet åt det hållet kostar en extra läsning,
antagandet åt andra hållet kostar en artefakt.

**Bokföringen av instansen bär själv ett mätfel värt att notera.**
`54577365`:s commit-meddelande säger att ÄVEN `TASK-283.2`:s kortkommentar
raderades. Diff-mätt höll det inte: kortets innehåll vid `8ebfab2c` och vid
`26ec953a^` (`2ad0703d`) är byte-identiskt, och sektionen bar ETT sammanhängande
block. Felräkningen färdades sedan vidare in i nästa uppdrags premisser. En
förlust som bokförs i efterhand tenderar att bokföras större än den var — mät
den mot diffen, räkna den inte ur minnet.
