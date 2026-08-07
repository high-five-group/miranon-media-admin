# En ny conf-fil måste wiras in i grindens egen lista — annars fångas den bara av tur [UNIVERSAL]

**Mätt 2026-08-07 (S93 Del 11).** En agent byggde en config-driven grind
(`scripts/check-facit.sh` + `.facit-policy.conf`) enligt repots konvention:
universell logik i skriptet, projekt-specifika värden i conf-filen.

Conf-filen wirades **inte** in i `ci.yml`:s shellcheck-lista. Den fanns bara i
en prosakommentar (rad 747). Listan bär 22 andra conf-filer och dess egen
kommentar varnar ordagrant för precis detta:

> *"en sourced conf utanför scopet är samma lucka som de övriga redan stänger"*

## Varför den ändå fångades — och varför det inte är ett skyddsräcke

CI fällde, men på **skriptet**, inte på conf-filen: `check-facit.sh` bar två
äkta shellcheck-strict-fynd (`SC2154`, `SC2312`). Under felsökningen av dem
lästes listan, och luckan blev synlig.

**Hade skriptet varit rent hade conf-filen glidit igenom osedd** — utanför
scopet, utan att någon grind någonsin nämnt den. Fångsten var en bieffekt av ett
orelaterat fel, inte en mekanism.

## Den andra halvan: grind-påståendet var fel om sitt eget läge

Agenten rapporterade `shellcheck 0`. Det var utan `--enable=all` — alltså inte
CI:s läge. CI kör `--severity=style --enable=all`, och de två fynden är
default-disabled optional checks. **Ett grindpåstående måste ange vilket LÄGE
grinden kördes i**, annars är "0" en uppgift om fel sak.

## Regeln

**Lägger du till en fil som en grind SOURCAR eller LÄSER — wira in den i
grindens egen lista i samma andetag som du skapar den.** Konventionen som säger
"värden i conf-filen" är halv tills conf-filen faktiskt granskas.

Och: **kör grinden med CI:s exakta flaggor, inte standardläget.** Skillnaden
mellan `shellcheck` och `shellcheck --severity=style --enable=all` var här två
verkliga fel och en missad lista.

Relaterad felklass: `L440` (exitkod förlorad i pipe) — samma familj, en grind
som ser grön ut utan att ha prövat det den påstår.
