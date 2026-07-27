# Ett glob-mönster i en blockkommentar kan stänga kommentaren

**`*/` inuti en `/* … */`-kommentar avslutar kommentaren där — även när tecknen
är en del av ett citerat glob-mönster. Citattecken, backticks och kodstil i
JSDoc skyddar ingenting; parsern ser bara teckenparet.** `[UNIVERSAL]`

Fångat 2026-07-27 i `task-54.2`: en JSDoc-rad dokumenterade formen på MSW:s
`info.header` genom att citera ett handler-mönster som börjar med `*/`. Filen
såg korrekt ut i editorn — syntaxfärgningen visade en obruten kommentar — men
Playwright avvisade den med `SyntaxError: Unterminated string constant (53:35)`,
alltså med en position långt efter den verkliga orsaken och med en felklass som
pekar på strängar snarare än kommentarer.

Klassen är bredare än JSDoc: **exempel som citerar syntax kan kollidera med
syntaxen de bor i.** Samma form finns i regex i kommentarer, i `-->` inuti
HTML-kommentarer, och i ` ``` ` inuti markdown-kodblock.

Motmedlet är inte att undvika exempel — de bär förklaringen. Det är att
formulera exemplet så att teckenparet inte uppstår: beskriv mönstret i ord
(*"metod plus handlerns path-mönster"*), eller bryt paret. Att en fil parsas är
dessutom billigare att verifiera än att läsa: kör den, lita inte på färgningen.
