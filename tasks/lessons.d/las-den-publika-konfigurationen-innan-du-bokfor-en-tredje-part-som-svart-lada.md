# Läs den publika konfigurationen innan du bokför en tredje part som svart låda — widgetar som renderas i webbläsaren är läsbara utan inloggning

**En embed-widget (Elfsight, Typeform, Calendly, …) måste leverera hela sin
konfiguration till besökarens webbläsare för att kunna renderas. Den är därför
läsbar med ett `curl` mot widgetens boot-endpoint — utan konto, utan
HAR-export, utan att be ägaren om en skärmdump. Prova den vägen FÖRE du
klassar roten som "utanför vår räckvidd".** `[UNIVERSAL]`

Instans (S110, 2026-08-21): fälla F.2 hade stått öppen i fyra månader med
formuleringen "granskning av formulärets källa krävs", och S107 bokförde
roten som "Elfsight-url-parametrar — Rogers spår". Tre `curl`-anrop mot
`core.service.elfsight.com/p/boot/?w=<widget-id>` (widget-ID:n lästa ur
sidans HTML-klasser `elfsight-app-<id>`) gav hela kalenderkonfigurationen
som JSON: 39 poster med sina handskrivna anmälnings-URL:er, varav sex bar fel
`EventKey`. Rotorsaken var lokaliserad på under tio minuter, post för post,
med exakt vad som skulle rättas.

**Det generella:** samma familj som Airtable-MCP-lärdomen om automationer
(hub-CLAUDE.md § Verktygsfakta): HAR-export och skärmdumpar är sista utvägen,
inte första. Det som renderas publikt är publikt läsbart — och en
konfiguration man kan läsa är en konfiguration man kan diffa, vilket är
grunden för en driftdetektor. Caveat: endpointen är oofficiell och kan ändras;
ett schemalagt beroende av den kräver research-pass mot leverantörens villkor.
