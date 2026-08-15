# Kanalseparationen håller även mot "rätt innehåll, fel skribent" — och det är precis det den ska

**ADR-104:s spärr prövar VEM som skriver, inte VAD som skrivs. Ett godkännande
med korrekt citat, korrekt pass-namn och ärligt uppsåt nekas ändå när det går
genom agentens verktygsloop — och båda gångerna det hänt var nekandet
korrekt.**

Två mätta instanser i S103: (1) 2026-08-14 (Del 13) — agenten försökte skriva
`godkand`-fältet med Marcus eget citat; hooken fällde. (2) 2026-08-14 (Del 15)
— Marcus klistrade själva `facit:godkann`-kommandot som CHATT-text; hade
orkestreraren kört det via Bash hade samma innehåll nått basen genom fel
kanal. Rätt drag var att be Marcus skriva raden med `!`-prefixet — kommandot
kördes då i HANS kanal och stämpeln blev hans handling.

**Det generella:** en integritets-mekanism som prövar innehåll kan alltid
matas med rätt innehåll av fel aktör — bara aktörs-/kanalprövning stänger
den vägen (CIBA-principen). Operativt: när något fastnar i en kanalspärr är
lösningen att FLYTTA HANDLINGEN till rätt kanal, aldrig att hitta en väg
runt spärren. Avgränsning: TASK-194 (hooken nekar i dag även icke-godkand-
fält i stämplade manifest) är en TRÄFFYTE-bugg i implementationen — den
falsifierar inte principen, och rättas i kortet, inte genom kringgående.
