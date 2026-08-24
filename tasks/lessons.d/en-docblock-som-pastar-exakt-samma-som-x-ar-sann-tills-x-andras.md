# En docblock som påstår "EXAKT samma som X" är sann när den skrivs och falsk vid X:s nästa ändring — den är en kopia, inte en koppling

**Ett kommentar-påstående om att två ytor är identiska skapar ingen mekanism
som håller dem identiska. Det gör motsatsen: det får kopian att se granskad
ut, så nästa ändring i originalet landar där utan att någon letar efter
följeslagaren. Behöver två ytor samma värde ska de DELA det — en konstant, en
komponent, en token. Skriv aldrig "samma som" när du menar "kopierad från".**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, `TASK-309.14`, commit `d9d973d5`):
`GenereringsVy.tsx` § `KromKnapp` var en rå `<button>` vars docblock påstod
*"EXAKT `DokumentYta`s klasser"*. Sant när den skrevs; **falskt från
2026-08-23**, då topp-luften `mt-2 lg:mt-10` lades till i `SidRam` (commit
`2e16ded1`, på Marcus order att alla undersidor ska ha samma grund) men inte i
kopian. Marcus såg driften i granskningen 2026-08-24 — *"bakåtchevronen sitter
för högt upp, jag har varit tydlig med att alla undersidor ska ha samma
sidkrom, samma 'grund'."* — samma observation som gav topp-luften från början.
`ADR-126` hade redan samlat **sex** sidkrom-instanser till en primitiv;
`KromKnapp` var den **sjunde** och smet undan på en teknikalitet: `SidRam` är
wrappad i TanStack Routers `createLink` och renderar ett riktigt `<a href>`,
medan genereringsvyn navigerar inom sin egen route via query-parameter. Fixen
blev inte att lappa in de saknade klasserna — Marcus: *"INGET lappande"* —
utan en andra GREN i primitiven (`SidRamKnapp`) som delar en utbruten
`CHEVRON_KLASS` med länk-grenen. Kopian revs.

**Det generella:** en kopia och en delad definition ser likadana ut den dag de
skapas och skiljer sig varje dag därefter. Skillnaden är vem som betalar när
originalet ändras: den delade definitionen kostar ingenting, kopian kostar en
granskningsrunda av den som råkar se den. En docblock som påstår identitet gör
saken sämre än ingen docblock alls, eftersom den utlovar en invariant som
ingenting upprätthåller och därmed inbjuder till att lita på den. Notera också
varför kopian överlevde en samlingsinsats som fångade sex syskon: den hade ett
GILTIGT tekniskt skäl att inte kunna använda primitiven som den då såg ut. Ett
sådant skäl motiverar en ny gren i den delade formen — det motiverar aldrig en
sjunde kopia.
