# Granskningsytan har TVÅ axlar — vilket träd den serverar och vilken backend den pratar med

**En granskningsyta kan servera exakt rätt commit och ändå vara oanvändbar,
därför att den pratar med fel miljö. Verifiera båda axlarna innan en människa
skickas dit: gren och SHA för koden, och den faktiska bakänds-URL ytan
anropar. Ett fel i granskningsVÄGEN är oskiljbart från ett fel i det
granskade — recensenten rapporterar din väg som en defekt i ditt arbete.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, Del 19 § B): Marcus skickades till fel yta två
gånger i rad. (1) Till prod-appen för att leta efter knappar som satt i en PR
som inte landat — prod körde gamla klienten, så svaret kunde bara bli nej.
(2) Till Vercel-previewen, som svarade *"Kunde inte hämta gemensamma dokument
— Failed to fetch"*: rätt träd, fel bakände. Samma fel var dessutom förutsagt
ett pass tidigare (Del 18 § H punkt 2) och ändå upprepat. Rätt väg blev
dev-servern på promoveringsgrenens EGET arbetsträd, som läser
`.env.development` mot staging — verifierad med `200` innan överlämningen.

**Det generella:** träd-axeln är redan bokförd (`[[L490]]`: en granskningsyta
mot fel träd ger falsk oro; dessutom fragmentet om att dev-servern serverar
huvudkatalogens utcheckade gren). Bakänds-axeln är osynligare, eftersom den
bestäms av byggläge och miljöfiler i stället för av något du checkar ut — den
syns inte alls förrän ett anrop faktiskt går, och då som ett fel i UI:t.
Verifieringen är billig och ska ske i den ordningen: läs vilken bakänds-URL
ytan faktiskt använder, gör ett anrop som når applikationslagret, och lämna
över först därefter. Kostnaden av att hoppa över den betalas av recensenten,
som felsöker något som inte är trasigt.
