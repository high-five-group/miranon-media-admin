# Facit-manifestets kallor ompekas i FLIP-skivan — efter stämpeln är manifestet agent-fruset

S106 (2026-08-15), miranon-media-admin · ADR-103/ADR-104-mekaniken

**Mätt:** s106-manifestets `kallor` pekade på prototypfilen (korrekt vid
låsningen — den VAR källan då). Efter Marcus `godkand`-stämpel river
promoveringsordningen prototypfilen → `check-facit.sh` fällde ("källan finns
inte") → och ADR-104-hooken nekar VARJE agent-skrivning mot ett manifest vars
`godkand` är satt (prövat: Edit av kallor-raden OCH Edit av not-fältet, båda
nekade). Rättelsen krävde en Marcus-`!`-rad (sed) — en extra rundresa för
något som var känt redan vid flippen.

**Regeln:** flip-skivan (ADR-103 B2a) ompekar manifestets `kallor` från
prototypfilen till den promoverade skarpa filen I SAMMA landning som flippen —
medan manifestet ännu är agent-skrivbart (`godkand: null`). Vid stämpel-
ögonblicket ska manifestet redan beskriva världen EFTER rivningen.

**Samma frysning träffar amenderingar av ANDRA stämplade manifest:**
s55-hem-amenderingen (TASK-225.3) kunde inte bakas in agent-vägen; kanoniska
vägen är Marcus omstämpling `facit:godkann --ersatt` med SAMTLIGA undantag
återgivna (befintliga poster försvinner annars — --ersatt byter hela
godkand-objektet). Sidofil i bilage-katalogen är den durabla bäraren tills
Marcus-momentet är gjort.
