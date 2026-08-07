# En parkerad PR utan draft-flagga är oskiljbar från en glömd

**Parkerar du en PR med avsikt — under iteration, i väntan på granskning — sätt
den till draft i samma andetag. Annars ser varje bevakningsmekanism en färdig,
oarmerad PR och larmar korrekt, om och om igen.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93). När iterations-kadensen lades om (lokal commit, ingen
push) disarmerades `#838` för att den inte skulle landa mitt i Marcus granskning.
`scripts/heartbeat-svep.sh` larmade omedelbart:

> ARMERINGS-KANDIDAT — PR #838 är CLEAN utan aktiv auto-merge-begäran. Kan vara
> ALDRIG ARMERAD eller UTSPARKAD med konsumerad armering.

Larmet var **rätt**. Svepet kan inte ur ett statiskt API-svar skilja "medvetet
parkerad" från "glömd" — och eftersom det är level-triggered (`L443`) upprepas
larmet var 90:e sekund så länge tillståndet håller.

**Fel väg ut:** undantagslistan i `.heartbeat-svep-policy.conf`. Den är
FÖRFATTAR-baserad, så det enda sättet att tysta en egen PR där hade varit att
undanta den egna identiteten — vilket tystar varje framtida PR från samma
avsändare. Policyn säger uttryckligen att en glömd PR från en människa måste
fortsätta larma; att riva den regeln för ett tillfälligt tillstånd vore att byta
ett brus-problem mot ett `T108`-tillstånd (ett tillstånd utan bevakare).

**Rätt väg ut, och den fanns redan:** `gh pr ready <nr> --undo`. Svepet filtrerar
`isDraft` i själva kandidat-villkoret (`scripts/heartbeat-svep.sh:395`) — ingen
config behövde röras. Draft är dessutom en sann utsaga om PR:en, inte en
tystning: den ÄR inte klar att landa.

**Det generella:** när en bevakningsmekanism larmar på ditt eget avsiktliga
tillstånd, fråga först om tillståndet är korrekt UTTRYCKT innan du dämpar
mekanismen. Ett larm på ett feluttryckt tillstånd är mekanismen som gör sitt
jobb. Den billigaste fixen är nästan alltid att göra tillståndet ärligt, inte att
lära vakten att blunda.

**Kvarstår som prosa:** ingenting tvingar den som parkerar att sätta flaggan.
Regeln lever därmed i exakt den form som tråden `T126` handlar om — en
arbetsform-regel utan mekanism, som bara gäller för den som råkar läsa den.
Den bör tas med när `T126`:s mekanism väljs.

**Andra instansen, mätt 2026-08-07 (S93 femte resumen) — av den som skrivit
lärdomen.** `#862` (`TASK-145.1`) lämnades medvetet oarmerad i väntan på
Marcus beslut i två scope-frågor. Svepet larmade inom ett svep-intervall med
ordagrant samma text som ovan, nu med `#862`. Draft sattes i efterhand.

Det stärker fragmentets sista stycke i stället för att motsäga det: regeln var
**läst i samma session** — den citeras till och med i resumens egen
rapportering av svepets kända egenskap — och efterlevdes ändå inte i
parkerings-ögonblicket. En regel som misslyckas för sin egen författare, en dag
efter att den skrevs, är inte ett läsnings-problem. Det är belägg för att
`T126`:s mekanism ska bära den, inte prosan.
