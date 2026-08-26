# En brytpunkt satt mot ett elements EGEN renderade bredd är inte samma sak som viewportens bredd

**En "desktop"-viewport (1280 px) ger inte en "desktop"-bred `<ul>`. Sidolayout
(sidnav, kortpadding, max-width-kolumner) smalnar av innehållet långt under
viewportens siffra — ett breakpoint-villkor som antar `elementBredd ≈
viewportBredd` väljer fel gren utan att fela synligt förrän någon läser talet.**

Mätt i TASK-309.24 (runda 2, 2026-08-26): en fallback-konstant skulle välja
mellan ett "desktop"- och ett "mobil"-värde baserat på `<ul>`s egen
`getBoundingClientRect().width`, med en gissad brytpunkt på 640 px (husets
`sm:`-tröskel). Den föll skarpt i ett acceptance-test: vid `acceptance`-
projektets 1280×720-viewport var `<ul>`s FAKTISKA renderade bredd bara
**502 px** — under 640 — så koden valde MOBIL-konstanten (155) på ett
skrivbordsfönster (622 px i stället för väntade ~400). Vid en riktig 375 px-
viewport var `<ul>`-bredden **277 px**. Brytpunkten flyttades till 400 (mitt
emellan de två UPPMÄTTA värdena) efter att båda faktiskt lästs av — inte
efter en ny gissning på ett "rimligare" tal.

**[UNIVERSAL]** Ett CSS-breakpoint-villkor i JS/TS som läser ett ELEMENTS
egen bredd (`getBoundingClientRect().width`, `clientWidth`) ska ALDRIG
jämföras mot ett Tailwind-/media-query-tal (`sm:`, `md:` …) rakt av — de två
talen mäter olika saker (elementets innehållsyta vs. hela viewporten). Mät
elementets FAKTISKA bredd i de verkliga scenarier villkoret ska skilja åt,
innan brytpunkten sätts — en gissning som "låter rimlig" (640 för `sm:`) är
precis den typ av antagande som ser korrekt ut tills ett test kör det.
