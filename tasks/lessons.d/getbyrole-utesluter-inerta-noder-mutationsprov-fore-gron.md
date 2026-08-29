# `getByRole` utesluter inerta/dolda noder — ett a11y-regressionstest måste mutationsprovas

**[UNIVERSAL] Ett test som ska bevisa att en `role="alert"` INTE monteras
inuti ett `inert`-block passerade mot den buggiga koden: `getByRole('alert')`
gör ARIA-uppslag och ser aldrig inerta noder — alltså exakt de noder buggen
producerar. Assertionen kunde inte skilja "aldrig monterad" från "monterad
men inert".** Mätt 2026-08-29 (S113, `TASK-338.3` r3, `#2094`): fångat enbart
för att agenten körde mutationsprovet (bugg återinförd → testet skulle bli
rött, blev grönt). Fix: DOM-närvaro mäts med `locator('[role="alert"]')`
(CSS-attribut, räknar noden oavsett `inert`), a11y-träds-halvan med
`getByRole` — två olika mätningar med avsikt. Regel: ett test som bevakar
tillgänglighetsträdets FRÅNVARO av något körs alltid mot en mutant innan det
räknas som bevis; Playwrights semantiska lokatorer är blinda för precis den
klass av fel de ska fånga.
