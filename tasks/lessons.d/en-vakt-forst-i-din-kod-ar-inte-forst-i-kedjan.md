# En vakt som ligger först i din egen kod är inte först i kedjan

**[UNIVERSAL]** Ett ordnings-krav mellan två vakter gäller bara det lager du
äger. Ligger en plattforms-grind framför din kod svarar den först — och ett
smoke-utfall som mäter hela kedjan kan då aldrig bekräfta ordningen du kodat.
Namnge lagret innan du formulerar kravet.

Datum: 2026-07-31 (TASK-38) | Källa: kravet löd "avvisar fel metod med 405 före
auth-kontrollen" för tretton Edge Functions — men `supabase/config.toml` sätter
`verify_jwt = true` på var och en, så Supabase-gatewayen svarar 401 på en
anropare utan giltig JWT innan funktionens kod körs över huvud taget.

Konsekvensen är smal men avgörande för hur kravet får läsas. Efter ändringen
gäller: *för varje anropare som når funktionen* avgörs metoden före
`requireUser`. En anonym begäran med fel metod får fortfarande 401 — från
plattformen, inte från oss. Discriminatorn som faktiskt mäter vår ordning är en
anropare som passerar gatewayen men faller i `requireUser`: anon-nyckeln är ett
giltigt JWT och är därför den enda proben som skiljer 405-före-auth från
auth-först. Det var precis den proben S84:s deny-smoke använde när den fann
asymmetrin (L331).

Två regler följer:

1. Skriv ut vilket lager som äger varje vakt när ordningen är ett krav. "Före
   auth" är otillräckligt när auth finns i två lager.
2. Välj proben efter vilket lager kravet gäller. En probe som fälls av det yttre
   lagret mäter aldrig det inre — den ser grönt eller rött av fel skäl.

Tredje ordningsledet är lätt att missa åt andra hållet: CORS-preflighten måste
fångas FÖRE metod-vakten, annars svarar funktionen 405 på varje `OPTIONS` och
browsern blockerar appen. Ordningen är alltså `handleCors` → metod → auth, och
bara mittenledet är nytt. Den invarianten är mekaniserad i
`tests/api/ef-metod-vakt.test.ts` — inte nedskriven som förhoppning.
