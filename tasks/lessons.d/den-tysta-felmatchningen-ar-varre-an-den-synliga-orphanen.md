# Den tysta felmatchningen är värre än den synliga orphanen — mät alltid båda halvorna av en nyckelfelsklass

**När en matchningsnyckel kan vara fel finns två utfall: nyckeln matchar
INGET (synligt: tom länk, "Utan event", en orphan-räknare) och nyckeln matchar
FEL (osynligt: allt ser kopplat ut). Den som bara mäter orphan-klassen mäter
den lilla halvan. Mät felmatchning genom att korsläsa redundanta fält —
formulärets egna textkopior mot det länkade objektets verkliga värden.**
`[UNIVERSAL]`

Instans (S110, 2026-08-21): orphan-klassen (`{Event} = BLANK()`) bar 1 rad.
Felmatchnings-klassen — anmälans formulärtext `Datum`/`Ort` ≠ det länkade
eventets — bar **64**, varav 52 låg under ett genomfört mars-event och var
obekräftade sedan maj, osynliga i varje kommande-vy. Tre tidigare sveper
(2026-04-26, 2026-08-16, 2026-08-17) hade alla mätt orphan-klassen och
förklarat basen ren.

**Det generella:** A1:s exakta nyckelmatchning var aldrig felet i sig —
felet var att ingen yta jämförde de redundanta fälten som formuläret redan
skickar med. Där redundans finns i datan finns också en gratis
konsistenskontroll; den måste bara köras. Svepet som fann de 64 tog en agent
åtta minuter.
