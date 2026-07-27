# En nedskriven lärdom utan mekanisk grind tillämpas inkonsekvent — och glappet syns först när det tänder

**`L264` var skriven, förstådd och tillämpad på SEX av sviten sju
tidsformaterande platser. Den sjunde saknade den, och ingenting sa ifrån förrän
felet tände i ett tvåtimmarsfönster ett halvår senare.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** `events-list.staging.test.ts` föll 3/3 i två
oberoende CI-körningar (`30308783847` 22:05Z, `30309427472` 22:13Z). Testet
byggde sin förväntade datumsträng med `Intl.DateTimeFormat` **utan** `timeZone`,
alltså i runnerns zon (UTC), medan sidan renderar i Playwright-configens
`timezoneId: Europe/Stockholm`. Mellan 22:00 och 24:00 UTC ligger runnern ett
dygn efter — sidan skrev *"28 juli"*, testet letade efter *"27 juli"*.

Felet är **deterministiskt inom fönstret och grönt alla andra timmar**. Den
schemalagda natten går 03:00 UTC och träffar det aldrig; bara sena
PR-körningar gör det.

**Det intressanta är inte buggen utan att lärdomen redan fanns.** `L264` säger
ordagrant att tidsformaterande tester ska byggas i SUT:ens tidszon, inte i
runnerns. `hem.staging.test.ts` bär till och med en kommentar som namnger
22–24Z-fönstret och de run-ID:n som avslöjade det. En inventering gav sju
platser: **sex hade `timeZone`, en hade det inte** — den som lades till senare,
av ett annat arbete, av någon som inte råkade läsa just den lärdomen.

**Slutsatsen:** en lärdom i prosa skyddar bara den som läser den vid rätt
tillfälle. Den skalar inte till nästa fil, nästa vecka eller nästa agent. Det
enda som skalar är en grind — en lint-regel, ett self-test, en CI-kontroll —
som gör avvikelsen omöjlig att landa i stället för olämplig att skriva.

**Diagnostiskt värde:** när ett fel visar sig vara en känd klass, räkna
förekomsterna innan du lagar instansen. Hittar du sex korrekta och en felaktig
har du inte hittat en bugg — du har hittat att lärdomen saknar mekanisering.
Frågan blir då om instansen ska lagas eller om klassen ska grindas.

**Vad som INTE gjordes här, öppet noterat:** instansen lagades, klassen
grindades inte. En sådan grind (lint-regel mot `Intl.DateTimeFormat` utan
`timeZone` i `tests/`) är billig men är sitt eget arbete, och den hörde inte
till skivan som blockerades. Registrerad som iakttagelse hellre än tyst
förbigången — se [[verifiera-med-cis-exakta-kommando-inte-svagare-lokal-variant]]
för samma tema: det som inte körs mekaniskt är i praktiken frånvarande.
